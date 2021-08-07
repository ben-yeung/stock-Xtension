chrome.runtime.sendMessage({
    message: "is_valid_url"
}, response => {
    if (response.message === 'true') {
        setTimeout(function () {
            chrome.runtime.sendMessage({
                message: "get_product",
                size: "All"
            }, response => {
                if (response.message === 'success') {
                    document.getElementById('popup-loading').style = `display: none`
                    document.getElementById('product-title').innerHTML = `${response.payload.title}`
                    document.getElementById('product-retail').innerHTML = `Retail: ~ ${response.payload.retail}`
                    document.getElementById('product-highbid').innerHTML = `Highest Bid: ${response.payload.highest_bid} ${response.payload.highest_bid_size}`
                    document.getElementById('product-lowask').innerHTML = `Lowest Ask: ${response.payload.lowest_ask} ${response.payload.lowest_ask_size}`
                    document.getElementById('product-lastsale').innerHTML = `Last Sale: ${response.payload.last_sale} ${response.payload.last_sale_size}`
                    document.getElementById('product-72hr').innerHTML = `${response.payload.last_72hr} Sales in Last 72 hours`

                    document.getElementById('product-size').style = 'display: block'
                    document.getElementById('product-size-buttons').style = 'display: block'
                    document.getElementById('product-url').style = 'display: block'
                    document.getElementById('product-url').innerHTML = `<a href="${response.payload.url}" target="_blank" style="color:white">View On StockX</a>`
                    document.getElementById('product-error').style = 'display: none'
                } else {
                    document.getElementById('popup-loading').style = `display: block`
                    document.getElementById('popup-loading').innerHTML = `Could not find this product on StockX. <br><br> Check Style Code! Not all Women's Versions of shoes are on StockX. <br><br> This page also might not be supported  yet. <br><br> If this is a mistake try refreshing product page.`
                }

            })
        }, 1500)

        document.getElementById('sizesubmit').addEventListener('click', () => {

            var size = document.getElementById('sizeselect').value
            chrome.runtime.sendMessage({
                message: "get_product",
                size: size
            }, response => {
                if (response.message === 'success') {
                    document.getElementById('popup-loading').style = `display: none`
                    document.getElementById('product-title').innerHTML = `${response.payload.title}`
                    document.getElementById('product-retail').innerHTML = `Retail: ~ ${response.payload.retail}`
                    document.getElementById('product-highbid').innerHTML = `Highest Bid: ${response.payload.highest_bid} (US ${size.toUpperCase()})`
                    document.getElementById('product-lowask').innerHTML = `Lowest Ask: ${response.payload.lowest_ask} (US ${size.toUpperCase()})`
                    document.getElementById('product-lastsale').innerHTML = `Last Sale: ${response.payload.last_sale} (US ${size.toUpperCase()})`
                    document.getElementById('product-72hr').innerHTML = `${response.payload.last_72hr} Sales in Last 72 hours`

                    document.getElementById('product-size').style = 'display: block'
                    document.getElementById('product-size-buttons').style = 'display: block'
                    document.getElementById('product-url').style = 'display: block'
                    document.getElementById('product-error').style = 'display: none'
                } else {
                    document.getElementById('product-error').style = 'display: block'
                    document.getElementById('product-url').style = 'display: none'
                }
            })
        })

        document.getElementById('sizereset').addEventListener('click', () => {
            document.getElementById('sizeselect').value = ""
            chrome.runtime.sendMessage({
                message: "get_product",
                size: "All"
            }, response => {
                if (response.message === 'success') {
                    document.getElementById('popup-loading').style = `display: none`
                    document.getElementById('product-title').innerHTML = `${response.payload.title}`
                    document.getElementById('product-retail').innerHTML = `Retail: ~ ${response.payload.retail}`
                    document.getElementById('product-highbid').innerHTML = `Highest Bid: ${response.payload.highest_bid} ${response.payload.highest_bid_size}`
                    document.getElementById('product-lowask').innerHTML = `Lowest Ask: ${response.payload.lowest_ask} ${response.payload.lowest_ask_size}`
                    document.getElementById('product-lastsale').innerHTML = `Last Sale: ${response.payload.last_sale} ${response.payload.last_sale_size}`
                    document.getElementById('product-72hr').innerHTML = `${response.payload.last_72hr} Sales in Last 72 hours`

                    document.getElementById('product-size').style = 'display: block'
                    document.getElementById('product-size-buttons').style = 'display: block'
                    document.getElementById('product-url').style = 'display: block'
                    document.getElementById('product-error').style = 'display: none'
                } else {
                    document.getElementById('popup-loading').style = `display: block`
                    document.getElementById('popup-loading').innerHTML = `Could not find this product on StockX. <br><br> Check Style Code! Not all Women's Versions of shoes are on StockX. <br><br> If this is a mistake try refreshing product page.`
                }

            })
        })

    } else {
        document.getElementById('popup-loading').style = `display: block`
        document.getElementById('popup-loading').innerHTML = `This extension only works on valid product pages. <br><br> This page also might not be supported yet. See the GitHub page for list of supported sites. <br><br> If this is a mistake try refreshing product page.`
    }
})