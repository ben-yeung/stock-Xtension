console.log("POPUP script start");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_style_id") {
        //document.querySelector('div').innerHTML = `Style ID: ${request.payload}`
        console.log("Message received in POPUP script")
        return; // Even with no response to sendResponse() you still need to return
    }
});

chrome.runtime.sendMessage({
    message: "get_product"
}, response => {
    if (response.message === 'success') {
        document.querySelector('div').innerHTML = `${response.payload.title}`
    } else {
        document.querySelector('div').innerHTML = `Could not find the product on StockX`
    }
})

