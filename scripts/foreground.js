chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text && (message.text == "get_champsID")) {
        sendResponse(document.getElementById('ProductDetails-tabs-details-panel').innerText)
    }
});

const productSummary = document.querySelector('#ProductDetails-tabs-details-panel');
console.log(`PRODUCT DETAILS: ${productSummary}`)
if (productSummary) {
    const observer = new MutationObserver(mutations => {
        console.log(mutations);
        let changed_id = mutations[0].target.textContent.split(" ")[2];
        console.log(changed_id)
        chrome.runtime.sendMessage({
            message: "set_style_id",
            style_id: changed_id
        })
    });
    
    observer.observe(productSummary, {
        subtree: true,
        childList: true,
        characterData: true
    
    });
}
