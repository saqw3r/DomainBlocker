document.getElementById('onButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOnBlocker' });
});

document.getElementById('offButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOffBlocker' });
});
  