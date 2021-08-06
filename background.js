chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        // Stores variables in local storage
        // Manifest v3 may cut background.js after a certain amount of  time
        // To access: chrome.storage.local.get('name', data => {});
        activeTabId: '',
        styles: {}
    });
});

// When a page loads check if it's a valid footsite product page, store style id under active tab id
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {

        chrome.scripting.executeScript({
                target: {
                    tabId: tabId
                },
                files: ["./scripts/foreground.js"]
            })
            .then(() => {
                console.log("foreground.js injected")
                let style_id = ''

                // Different logic for handling style codes for certain footsites
                if (tab.url.match('(http|https):\/\/www.nike.com\/t\/.*')) {
                    console.log('NIKE PAGE FOUND');
                    style_id = tab.url.split(/([^\/]*)$/)[1].substring(0, 10);
                    console.log(style_id)
                } else if (tab.url.match('(http|https):\/\/www.adidas.com\/*\/.*')) {
                    console.log('ADIDAS PAGE FOUND');
                    style_id = tab.url.split(/([^\/]*)$/)[1].substring(0, 6);
                    console.log(style_id)
                } else if (tab.url.match('(http|https):\/\/www.champssports.com\/product\/.*')) {
                    console.log('CHAMPS PAGE FOUND');
                    chrome.tabs.sendMessage(tab.id, {
                        text: "get_champsID"
                    }, response => {
                        if (chrome.runtime.lastError) {
                            console.log("ERROR GETTING CHAMPS ID")
                            return;
                        }
                        console.log(response.substring(0, 17).split(" ")[2])
                    })
                } else {
                    console.log("Site Not Supported")
                    return;
                }
                // Style ids are stored per active tab id
                // An active tab can have at most 1 id at a time
                // The idea is that we store {"activetabid":"styleid"} to allow multiple tabs each with their own product
                // Then when get_product is called we pull the activetabid then fetch the appropriate styleid
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
            })
            .catch(err => console.log(err))

        return true;
    }
});

// This lets us set the active tab the user is looking at to ensure the correct product is queried
chrome.tabs.onActivated.addListener((info) => {
    chrome.storage.local.set({
        activeTabId: info.tabId
    }, () => {
        if (chrome.runtime.lastError) {
            console.log("ERROR OCCURRED SETTING ACTIVE TAB ID")
            return;
        }
    });
})

// When tabs are closed remove their tab ids from the style codes object
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
        });
    })
})

// Listen for popup messages to get a product
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.message === "get_product") {
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
                        // console.log(`STOCKX STYLE ID RETURNED: ${stockxID}`)
                        // console.log(`LOCAL ID RETURNED: ${data.styles[tabId]}`)

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
                        let url = `https://stockx.com/${res.urlKey}`
                        sendResponse({
                            message: "success",
                            payload: {
                                title: productTitle,
                                retail: retail,
                                highest_bid: highest_bid,
                                highest_bid_size: highest_bid_size,
                                lowest_ask: lowest_ask,
                                lowest_ask_size: lowest_ask_size,
                                last_sale: last_sale,
                                last_sale_size: last_sale_size,
                                url: url
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