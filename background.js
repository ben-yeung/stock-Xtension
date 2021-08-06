chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        // Stores variables in local storage
        // Manifest v3 may cut background.js after a certain amount of  time
        // To access: chrome.storage.local.get('name', data => {});
        styles: new Map(),
        activeTabId: ''
    });
});

console.log("BACKGROUND script start")

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        let style_id = ''

        if (tab.url.match('(http|https):\/\/www.nike.com\/t\/.*')) {
            console.log('NIKE PAGE FOUND');
            style_id = tab.url.split(/([^\/]*)$/)[1].substring(0, 10);
            console.log(style_id)
        }

        chrome.storage.local.get('styles', styles_data => {
            if (chrome.runtime.lastError) {
                console.log("Failure getting styles dict");
                return;
            }
            styles_data.set(tabId, style_id);
            chrome.storage.local.set({
                styles: styles_data,
                activeTabId: tabId
            }, () => {
                if (chrome.runtime.lastError) {
                    console.log("ERROR OCCURRED")
                    return;
                }
                console.log('successfully saved new style id')
                console.log(styles_data)
            });
        });        

        return true;

    }
});

chrome.tabs.onActivated.addListener((tabId) => {
    chrome.storage.local.set({
        activeTabId: tabId
    }, () => {
        if (chrome.runtime.lastError) {
            console.log("ERROR OCCURRED")
            return;
        }
        console.log('successfully saved active tabId')
    });
})

//runtime from background sends to foreground, popup, or options (whichever one cathces first)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // if (request.message === "get_name") {
    //     chrome.storage.local.get('name', data => {
    //         if (chrome.runtime.lastError) {
    //             sendResponse({
    //                 message: "fail"
    //             });
    //             return;
    //         }
    //         sendResponse({
    //             message: "success",
    //             payload: data.name
    //         });
    //     });

    //     return true; // needed for asynchronous functions to let chrome know to keep line open
    // } else if (request.message === "change_name") {
    //     console.log("change name received on backend");
    //     chrome.storage.local.set({
    //         name: request.payload
    //     }, () => {
    //         if (chrome.runtime.lastError) {
    //             sendResponse({
    //                 message: "fail"
    //             });
    //             return;
    //         }

    //         sendResponse({
    //             message: "success"
    //         });
    //     });

    //     return true;
    // } 
    if (request.message === "get_product") {
        console.log("get_product received on backend");
        chrome.storage.local.get('style_id', data => {
            if (chrome.runtime.lastError) {
                console.log("ERROR OCCURRED GETTING STYLE_ID")
                return;
            }
            let api_call = `https://stockx.com/api/browse?_search=${data.style_id}`;
            console.log(api_call);

            fetch(api_call).then(function (res) {
                if (res.status !== 200) {
                    console.log("Error")
                    sendResponse({
                        message: "fail"
                    });
                    return
                }
                console.log("Success")

                res.json().then(function (dataStockX) {
                    console.log(dataStockX)

                    if (dataStockX.Products.length == 0) {
                        console.log("Product array empty")
                        sendResponse({
                            message: "failed"
                        })
                        return;
                    }

                    let stockxID = dataStockX.Products[0].styleId;
                    console.log(`STOCKX STYLE ID RETURNED: ${stockxID}`)
                    console.log(`LOCAL ID RETURNED: ${data.style_id}`)

                    if (!stockxID.includes(data.style_id)) {
                        sendResponse({
                            message: "failed"
                        })
                        return;
                    }

                    let productTitle = dataStockX.Products[0].title
                    console.log(dataStockX.Products[0].title)
                    sendResponse({
                        message: "success",
                        payload: {
                            title: productTitle
                        }
                    })
                })

            }).catch(function (err) {
                sendResponse({
                    message: "fail"
                });
            })
        });

        return true;
    }
});