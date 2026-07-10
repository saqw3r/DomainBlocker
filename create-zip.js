const fs = require('fs');
const path = require('path');

// Files and directories to exclude from the zip
const excludeList = [
    '.git',
    '.gitignore',
    'node_modules',
    'tests',
    'coverage',
    'mocks',
    'jest.config.js',
    'package.json',
    'pnpm-lock.yaml',
    'package-lock.json',
    'create-zip.js',
    'no-pass.zip'
];

const outputName = 'no-pass.zip';

// Delete existing zip if it exists
if (fs.existsSync(outputName)) {
    fs.unlinkSync(outputName);
    console.log(`Deleted existing ${outputName}`);
}

// Use PowerShell on Windows
const { execSync } = require('child_process');

// Create temp directory list
const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'no-pass-'));

console.log('📦 Creating No Pass extension zip archive...\n');

// Copy files excluding unwanted directories
function copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Skip excluded items
        if (excludeList.includes(entry.name)) {
            console.log(`  ⏭️  Skipping: ${entry.name}`);
            continue;
        }
        
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    // Copy files to temp directory
    copyDir('.', tempDir);
    console.log(`\n📋 Files copied to temp directory`);
    
    // Create zip using PowerShell
    const command = `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${path.resolve(outputName)}' -Force"`;
    execSync(command, { stdio: 'inherit' });
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`\n✅ Successfully created ${outputName}`);
    console.log(`📦 Ready for Chrome Web Store upload!`);
    
    // Show file size
    const stats = fs.statSync(outputName);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 Archive size: ${sizeKB} KB`);
    
} catch (error) {
    console.error('\n❌ Error creating zip:', error.message);
    // Clean up temp directory on error
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(1);
}
