console.log("POPUP script start");

setTimeout(function() { 
    document.getElementById('popup-loading').innerHTML = ``
    chrome.runtime.sendMessage({
        message: "get_product",
        size: "All"
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `Retail: ~ $${response.payload.retail}`
            document.getElementById('product-highbid').innerHTML = `Highest Bid: $${response.payload.highest_bid} (US ${response.payload.highest_bid_size})`
            document.getElementById('product-lowask').innerHTML = `Lowest Ask: $${response.payload.lowest_ask} (US ${response.payload.lowest_ask_size})`
            document.getElementById('product-lastsale').innerHTML = `Last Sale: $${response.payload.last_sale} (US ${response.payload.last_sale_size})`
            document.getElementById('product-size').innerHTML = `
            
                <form>
                    <input type="text" id="sizeselect" name="sizeselect" placeholder="Enter a size">
                </form>
            `
            document.getElementById('product-size-buttons').innerHTML = `<input type="submit" id="sizesubmit" class="sizebutton" value="Submit">
            <input type="submit" id="sizereset" class="sizebutton" value="Reset">`
            document.getElementById('product-error').innerHTML = ``
        } else {
            document.getElementById('product-title').innerHTML = `Could not find this product on StockX. <br><br> This page might not be supported. <br><br> If this is a mistake try refreshing product page.`
        }

    })
}, 1200)

function findSize() {
    chrome.tabs.executeScript({
        file: './scripts/find_size_script.js'
    });
}

document.getElementById('sizesubmit').addEventListener('click', findSize)

