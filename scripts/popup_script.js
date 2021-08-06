console.log("POPUP script start");

setTimeout(function() { 
    document.getElementById('popup-loading').innerHTML = ``
    chrome.runtime.sendMessage({
        message: "get_product"
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `Retail: ~ $${response.payload.retail}`
            document.getElementById('product-highbid').innerHTML = `Highest Bid: $${response.payload.highest_bid} (US ${response.payload.highest_bid_size})`
            document.getElementById('product-lowask').innerHTML = `Lowest Ask: $${response.payload.lowest_ask} (US ${response.payload.lowest_ask_size})`
        } else {
            document.getElementById('product-title').innerHTML = `Could not find the product on StockX. If this is a mistake try refreshing product page.`
            document.getElementById('product-retail').innerHTML = ``
        }
    })
}, 1200)


