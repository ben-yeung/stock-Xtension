chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.text && (message.text == "get_champsID")) {
        sendResponse(document.getElementById('ProductDetails-tabs-details-panel').innerText)
    }
})
