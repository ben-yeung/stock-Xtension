console.log("POPUP script start");

setTimeout(function() { 
    document.getElementById('popup-loading').innerHTML = ``
    chrome.runtime.sendMessage({
        message: "get_product",
        size: "All"
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `Retail: ~ ${response.payload.retail}`
            document.getElementById('product-highbid').innerHTML = `Highest Bid: ${response.payload.highest_bid} ${response.payload.highest_bid_size}`
            document.getElementById('product-lowask').innerHTML = `Lowest Ask: ${response.payload.lowest_ask} ${response.payload.lowest_ask_size}`
            document.getElementById('product-lastsale').innerHTML = `Last Sale: ${response.payload.last_sale} ${response.payload.last_sale_size}`
            
            document.getElementById('product-size').style = 'display: block'
            document.getElementById('product-size-buttons').style = 'display: block'
            document.getElementById('product-error').style =  'display: none'
        } else {
            document.getElementById('product-title').innerHTML = `Could not find this product on StockX. <br><br> This page might not be supported. <br><br> If this is a mistake try refreshing product page.`
        }

    })
}, 1200)

document.getElementById('sizesubmit').addEventListener('click', () => {
            
    var size = document.getElementById('sizeselect').value
    console.log(`SIZE ENTERED: ${size}`)
    
    chrome.runtime.sendMessage({
        message: "get_product",
        size: size
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `Retail: ~ ${response.payload.retail}`
            document.getElementById('product-highbid').innerHTML = `Highest Bid: ${response.payload.highest_bid} ${response.payload.highest_bid_size}`
            document.getElementById('product-lowask').innerHTML = `Lowest Ask: ${response.payload.lowest_ask} ${response.payload.lowest_ask_size}`
            document.getElementById('product-lastsale').innerHTML = `Last Sale: ${response.payload.last_sale} ${response.payload.last_sale_size}`
            
            document.getElementById('product-size').style = 'display: block'
            document.getElementById('product-size-buttons').style = 'display: block'
            document.getElementById('product-error').style = 'display: none'
        } else {
            document.getElementById('product-error').style = 'display: block'
        }
    })
})

