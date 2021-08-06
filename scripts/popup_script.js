console.log("POPUP script start");

setTimeout(function() { 
    document.getElementById('popup-loading').innerHTML = ``
    chrome.runtime.sendMessage({
        message: "get_product"
    }, response => {
        if (response.message === 'success') {
            document.getElementById('product-title').innerHTML = `${response.payload.title}`
            document.getElementById('product-retail').innerHTML = `$${response.payload.retail}`
        } else {
            document.getElementById('product-title').innerHTML = `Could not find the product on StockX. If this is a mistake try refreshing product page.`
            document.getElementById('product-retail').innerHTML = ``
        }
    })
}, 1000)


