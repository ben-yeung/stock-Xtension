chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        // Stores variables in local storage
        // Manifest v3 may cut background.js after a certain amount of  time
        // To access: chrome.storage.local.get('name', data => {});
        name : "Ben"
    });
});

console.log("I am the background script")