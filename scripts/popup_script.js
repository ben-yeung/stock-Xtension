console.log("POPUP script start");

var preferred_size = "All"

setTimeout(function() { 
    document.getElementById('popup-loading').innerHTML = ``
    chrome.runtime.sendMessage({
        message: "get_product",
        size: preferred_size
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `Retail: ~ $${response.payload.retail}`
            document.getElementById('product-highbid').innerHTML = `Highest Bid: $${response.payload.highest_bid} (US ${response.payload.highest_bid_size})`
            document.getElementById('product-lowask').innerHTML = `Lowest Ask: $${response.payload.lowest_ask} (US ${response.payload.lowest_ask_size})`
            document.getElementById('product-size').innerHTML = `
            
                <form>
                    <input type="text" id="sizeselect" name="sizeselect" placeholder="Enter a size">
                </form>
            `
            document.getElementById('product-size-button').innerHTML = `<input type="submit" style="" value="Submit">`
        } else {
            document.getElementById('product-title').innerHTML = `Could not find this product on StockX. <br><br> This page might not be supported. <br><br> If this is a mistake try refreshing product page.`
        }
    })
}, 1200)


