# User Flow Diagram

```mermaid
graph TD
    %% Initial State Loading
    A[User Opens Popup] --> B[Load Domain List & Blocker State]
    
    %% Blocker Toggling
    B --> C{Current State}
    C -- ON --> D[Blocker Active]
    C -- OFF --> E[Blocker Inactive]
    
    D --> F[Click 'OFF']
    F --> G[Message: turnOffBlocker]
    G --> H[Background: disableBlocker]
    H --> I[Clear Rules]
    
    E --> J[Click 'ON']
    J --> K[Message: turnOnBlocker]
    K --> L[Background: enableBlocker]
    L --> M[Fetch Domain List & Apply Rules]
    
    %% Editing Flow (Fixed)
    N[User Edits Domains] --> O[Click 'Save']
    O --> P[Save to Chrome Storage]
    P --> Q{Blocker State?}
    Q -- ON --> R[Message: updateRules]
    R --> S[Background: updateBlockerRules]
    Q -- OFF --> T[Done]
    
    %% System Wake-up Flow (Fixed - verifies active rules)
    U[System Wakes/Active] --> V[Background: onStateChanged]
    V --> W[Background: restoreBlockerState]
    W --> X{Storage ON + Active Rules?}
    X -- YES --> Y[State Consistent - Skip]
    X -- NO --> Z[Sync State - Enable/Disable]
    
    %% Blocking Flow (Fixed - proper urlFilter + TLD suffix support)
    AA[User Navigates to sub.example.suffix] --> AB{Blocker Active?}
    AB -- YES --> AC{Domain in List?}
    AC -- YES (exact) --> AD[declarativeNetRequest Redirect]
    AC -- YES (TLD suffix) --> AD
    AD --> AE[blocked.html?blockedUrl=sub.example.suffix]
    AC -- NO --> AF[Allow Navigation]
    AB -- NO --> AF
    
    %% Domain Input Processing
    AG[User Enters .suffix] --> AH{Input Starts with .?}
    AH -- YES --> AI[Store as TLD suffix pattern]
    AH -- NO --> AJ[Store as exact domain]
    AI --> AK[Rule: urlFilter = *.suffix]
    AJ --> AL[Rule: urlFilter = ||domain^]
```

### 2. **Race Condition: Blocker Auto-Disables**
- **Root Cause**: `applyRules()` read stale `blockerState: 'off'` from storage after `enableBlocker()` set it to `'on'`
- **Fix**: Use in-memory `isBlockerOn` flag instead of storage reads in `applyRules()`
- **Files**: `background.js` -> `applyRules()`, `enableBlocker()`, `disableBlocker()`

### 3. **updateRules Clearing All Rules**
- **Root Cause**: `updateRules` handler called `clearExistingRules()` -> removed ALL rules -> `updateBlockerRules()` added new ones, but race window caused disable
- **Fix**: `updateRules` handler now only calls `updateBlockerRules()` which does atomic remove+add
- **Files**: `background.js` -> `chrome.runtime.onMessage` handler for `updateRules`

### 4. **System Wake Restoring Wrong State**
- **Root Cause**: `restoreBlockerState()` only checked storage, not actual active rules
- **Fix**: Query `getDynamicRules()` first, only toggle if reality != storage
- **Files**: `background.js` -> `restoreBlockerState()`

### 5. **getBlockerState Reporting Wrong State**
- **Root Cause**: Only checked storage + memory, not actual active rules
- **Fix**: Query `getDynamicRules()` and sync all three sources
- **Files**: `background.js` -> `getBlockerState` handler

### 6. **Backup Restore Error**
- **Root Cause**: `showOpenFilePicker()` throws `AbortError`/`SecurityError` on cancel/deny
- **Fix**: Catch and ignore expected errors, only alert on real failures
- **Files**: `popup.js` -> `restoreFromBackup()`

### 7. **TLD Suffix Wildcard Blocking Support**
- **Root Cause**: Extension only supported exact domain matching (`||domain^`), couldn't block entire TLD suffixes
- **Fix**: Detect TLD suffix patterns (input starting with `.`) and generate `*.suffix` filter which matches all subdomains of that suffix
- **Files**: `background.js` -> `createRules()`, `popup.js` -> input validation

## Verification Logs (Working State)
```
Created rule: {"urlFilter": "||restricted.com^", ...}
Created rule: {"urlFilter": "*.suffix", ...}
Blocker enabled with rules: [...]
Active dynamic rules after enable: [{"id":1,"filter":"||restricted.com^"},{"id":2,"filter":"*.suffix"},...]
getBlockerState: stored:on memory:on activeRules:3 effective:on
restoreBlockerState: state consistent, skipping
```