chrome.runtime.sendMessage({
    message: "is_champs"
}, response => {
    console.log(response.message);
    if (response.message === 'true') {
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

    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text && (message.text == "get_snkrsID")) {
        setTimeout(function () {
            const details = document.querySelector('.description-text').innerHTML;
            let style_id = details.slice(details.indexOf("SKU:") + 5, details.indexOf('</p>'));
            console.log(`SNKRS ID: ${style_id}`);
            chrome.runtime.sendMessage({
                message: "set_style_id",
                style_id: style_id
            })
        }, 800)
        return true;
    }
})