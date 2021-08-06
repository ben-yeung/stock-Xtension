chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        // Stores variables in local storage
        // Manifest v3 may cut background.js after a certain amount of  time
        // To access: chrome.storage.local.get('name', data => {});
        activeTabId: '',
        styles: {}
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
        } else {
            return;
        }

        chrome.storage.local.get('styles', (result) => {
            result.styles[tabId] = style_id
            chrome.storage.local.set({
                styles: result.styles
            }, () => {
                if (chrome.runtime.lastError) {
                    console.log("ERROR SAVING STYLE ID TO STYLES")
                    return;
                }
                console.log("Successfully saved style id")
            });
            chrome.storage.local.get('styles', (result) => {
                console.log(result.styles)
            })
        })

        return true;
    }
});

chrome.tabs.onActivated.addListener((info) => {
    chrome.storage.local.set({
        activeTabId: info.tabId
    }, () => {
        if (chrome.runtime.lastError) {
            console.log("ERROR OCCURRED")
            return;
        }
        console.log('successfully saved active tabId')
    });
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.storage.local.get('styles', (result) => {
        delete result.styles[tabId]
        chrome.storage.local.set({
            styles: result.styles
        }, () => {
            if (chrome.runtime.lastError) {
                console.log("ERROR DELETING STYLE ID")
                return;
            }
            console.log("Successfully deleted")
        });
    })
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
        chrome.storage.local.get('activeTabId', data => {
            if (chrome.runtime.lastError) {
                console.log("ERROR OCCURRED GETTING ACTIVE TAB ID")
                return;
            }
            let tabId = data.activeTabId
            chrome.storage.local.get('styles', data => {
                if (chrome.runtime.lastError) {
                    console.log("ERROR OCCURRED GETTING STYLES")
                    return;
                }
                var api_call;
                if (request.size == "All") {
                    api_call = `https://stockx.com/api/browse?_search=${data.styles[tabId]}`;
                } else {
                    api_call = `https://stockx.com/api/browse?_search=${data.styles[tabId]}&shoeSize=${request.size}`;
                }
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

                        if (dataStockX.Products.length == 0) {
                            console.log("Product array empty")
                            sendResponse({
                                message: "failed"
                            })
                            return;
                        }

                        console.log(dataStockX)
                        let stockxID = dataStockX.Products[0].styleId;
                        console.log(`STOCKX STYLE ID RETURNED: ${stockxID}`)
                        console.log(`LOCAL ID RETURNED: ${data.styles[tabId]}`)

                        if (!stockxID.includes(data.styles[tabId])) {
                            sendResponse({
                                message: "failed"
                            })
                            return;
                        }
                        let res = dataStockX.Products[0];
                        let productTitle = res.title;
                        console.log(res.title);
                        let retail = `$${res.retailPrice}`;
                        let highest_bid = `$${res.market.highestBid}`;
                        let highest_bid_size = `(US ${res.market.highestBidSize})`;
                        let lowest_ask = `$${res.market.lowestAsk}`;
                        let lowest_ask_size = `(US ${res.market.lowestAskSize})`;
                        let last_sale = res.market.lastSale == 0 ? 'N/A' : `$${res.market.lastSale}`;
                        let last_sale_size = res.market.lastSaleSize == '' ? '' : `(US ${res.market.lastSaleSize})`;
                        sendResponse({
                            message: "success",
                            payload: {
                                title: productTitle,
                                retail: retail,
                                highest_bid: highest_bid,
                                highest_bid_size: highest_bid_size,
                                lowest_ask:  lowest_ask,
                                lowest_ask_size: lowest_ask_size,
                                last_sale: last_sale,
                                last_sale_size: last_sale_size
                            }
                        })
                    })

                }).catch(function (err) {
                    sendResponse({
                        message: "fail"
                    });
                })
            });
        });

        return true;
    } 
});