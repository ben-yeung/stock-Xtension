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
                        console.log(response.substring(0, 17).split(" ")[2]);
                        style_id = response.substring(0, 17).split(" ")[2];
                    })
                } else if (tab.url.match('(http|https):\/\/www.finishline.com\/store\/product\/.*') || tab.url.match('(http|https):\/\/www.jdsports.com\/store\/product\/.*')) {
                    console.log('FINISHLINE/JDSPORTS PAGE FOUND');
                    style_id = tab.url.slice(tab.url.indexOf('styleId=')+8, tab.url.indexOf('&'));
                    if (!tab.url.includes('adidas')) {
                        style_id += tab.url.slice(tab.url.indexOf('colorId=') + 8, tab.url.indexOf('colorId=') + 11)
                    }
                    
                } else {
                    console.log("Site Not Supported")
                    return;
                }
                // Style ids are stored per active tab id
                // An active tab can have at most 1 id at a time
                // The idea is that we store {"activetabid":"styleid"} to allow multiple tabs each with their own product
                // Then when get_product is called we pull the activetabid then fetch the appropriate styleid
                setTimeout(() => {
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
                            console.log(result.styles)
                        });
                    })
                }, 500)

            })
            .catch(err => {
                //console.log(err)
                chrome.storage.local.get('styles', (result) => {
                    if (result.styles[tabId]) {
                        delete result.styles[tabId]
                        chrome.storage.local.set({
                            styles: result.styles
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.log("ERROR DELETING STYLE ID")
                                return;
                            }
                        });
                        console.log("Deleted outdated style id for current tab found")
                    }
                })
            })

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
        console.log(`Active Tab Set: ${info.tabId}`)
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

    if (request.message === 'get_product') {
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

                        //console.log(dataStockX)
                        let stockxID = dataStockX.Products[0].styleId;
                        let altstockxID = stockxID.replaceAll('-', '')
                        console.log(`STOCKX STYLE ID RETURNED: ${stockxID}`)
                        console.log(`ALT STOCKX STYLE ID RETURNED: ${altstockxID}`)
                        console.log(`LOCAL ID RETURNED: ${data.styles[tabId]}`)

                        if (!stockxID.includes(data.styles[tabId]) && !altstockxID.includes(data.styles[tabId])) {
                            sendResponse({
                                message: "failed"
                            })
                            return;
                        }
                        let res = dataStockX.Products[0];
                        let productTitle = res.title;
                        console.log(res.title);
                        let retail = res.retailPrice == 0 ? 'Not Found 😢' : `$${res.retailPrice}`;
                        let highest_bid = res.market.highestBid == 0? 'No Bids Yet 🙈' : `$${res.market.highestBid}`;
                        let highest_bid_size =  res.market.highestBid == 0? '' : `(US ${res.market.highestBidSize})`;
                        let lowest_ask =  res.market.lowestAsk == 0? 'No Asks Yet 🙊' : `$${res.market.lowestAsk}`;
                        let lowest_ask_size = res.market.lowestAsk == 0? '' : `(US ${res.market.lowestAskSize})`;
                        let last_sale = res.market.lastSale == 0 ? 'N/A' : `$${res.market.lastSale}`;
                        let last_sale_size = res.market.lastSale == 0 ? '' : `(US ${res.market.lastSaleSize})`;
                        let last_72hr = res.market.salesLast72Hours;
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
                                last_72hr: last_72hr,
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
    } else if (request.message === 'set_style_id') {
        chrome.storage.local.get('activeTabId', tabData => {
            chrome.storage.local.get('styles', styleData => {
                styleData.styles[tabData.activeTabId] = request.style_id
                chrome.storage.local.set({
                    styles: styleData.styles
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
        return true;
    } else if (request.message === 'is_champs') {
        chrome.tabs.query({
                'active': true,
                'windowId': chrome.windows.WINDOW_ID_CURRENT
            },
            function (tabs) {
                if (chrome.runtime.lastError) {
                    console.log("ERROR GETTING ACTIVE URL")
                    return;
                }
                if (tabs[0] && tabs[0].url.match('(http|https):\/\/www.champssports.com\/product\/.*')) {
                    sendResponse({
                        message: "true"
                    })
                } else {
                    sendResponse({
                        message: "false"
                    })
                }
            }
        );
        return true;
    } else if (request.message === 'is_valid_url') {
        chrome.tabs.query({
                'active': true,
                'windowId': chrome.windows.WINDOW_ID_CURRENT
            },
            function (tabs) {
                if (chrome.runtime.lastError) {
                    console.log("ERROR GETTING ACTIVE URL")
                    return;
                }
                if (tabs[0] && (tabs[0].url.match('(http|https):\/\/www.champssports.com\/product\/.*') || tabs[0].url.match('(http|https):\/\/www.nike.com\/t\/.*') 
                    || tabs[0].url.match('(http|https):\/\/www.adidas.com\/*\/.*') || tabs[0].url.match('(http|https):\/\/www.finishline.com\/store\/product\/.*') || tabs[0].url.match('(http|https):\/\/www.jdsports.com\/store\/product\/.*'))) {
                    sendResponse({
                        message: "true"
                    })
                } else {
                    sendResponse({
                        message: "false"
                    })
                }
            }
        );
        return true;
    }
});