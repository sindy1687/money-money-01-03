// 強制蝴蝶忍主題卡費文字為白色
function forceShinobuFeeTextWhite() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    // 強制設置所有包含fee的元素為白色
    const feeElements = document.querySelectorAll('[class*="fee"], [id*="fee"]');
    feeElements.forEach(element => {
        element.style.color = 'rgba(255, 255, 255, 1.0)';
        element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        
        // 設置所有子元素
        const children = element.querySelectorAll('*');
        children.forEach(child => {
            child.style.color = 'rgba(255, 255, 255, 1.0)';
            child.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        });
    });
    
    // 特定類名的元素
    const specificElements = document.querySelectorAll(
        '.diary-card-fee, .fee-label, .fee-amount, .fee-text, .card-fee-text, .transaction-fee, .payment-fee'
    );
    specificElements.forEach(element => {
        element.style.color = 'rgba(255, 255, 255, 1.0)';
        element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        
        // 設置所有子元素
        const children = element.querySelectorAll('*');
        children.forEach(child => {
            child.style.color = 'rgba(255, 255, 255, 1.0)';
            child.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        });
    });
}

// 監聽主題變化
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(forceShinobuFeeTextWhite, 100);
        }
    });
});

// 開始監聽
observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// 定期檢查並強制應用
setInterval(forceShinobuFeeTextWhite, 1000);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', forceShinobuFeeTextWhite);
document.addEventListener('load', forceShinobuFeeTextWhite);

// 監聽DOM變化
const domObserver = new MutationObserver(() => {
    forceShinobuFeeTextWhite();
});

domObserver.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('蝴蝶忍主題卡費文字強制白色腳本已載入');
