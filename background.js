chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        // Stores variables in local storage
        // Manifest v3 may cut background.js after a certain amount of  time
        // To access: chrome.storage.local.get('name', data => {});
        name: "Ben"
    });
});

console.log("BACKGROUND script start")

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.scripting.insertCSS({ //injecting css
                target: {
                    tabId: tabId
                },
                files: ["./styles/foreground_styles.css"]
            })

            .then(() => {
                console.log("INJECTED FOREGROUND STYLES")
                chrome.scripting.executeScript({ //injecting js
                        target: {
                            tabId: tabId
                        },
                        files: ["./foreground.js"]

                    })
                    .then(() => {
                        console.log("INJECTED FOREGROUND SCRIPT")

                        //tabs lets you send message from backend to a specific tab
                        chrome.tabs.sendMessage(tabId, {
                            message: "change_name",
                            payload: "John"
                        })
                    })
            }).catch(err => console.log(err))
    }
});

//runtime from background sends to foreground, popup, or options (whichever one cathces first)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_name") {
        chrome.storage.local.get('name', data => {
            if (chrome.runtime.lastError) {
                sendResponse({
                    message: "fail"
                });
                return;
            }
            sendResponse({
                message: "success",
                payload: data.name
            });
        });

        return true; // needed for asynchronous functions to let chrome know to keep line open
    } else if (request.message === "change_name") {
        console.log("change name received on backend")
        chrome.storage.local.set({
            name: request.payload
        }, () => {
            if (chrome.runtime.lastError) {
                sendResponse({
                    message: "fail"
                });
                return;
            }

            sendResponse({
                message: "success"
            });
        });

        return true;
    }
});