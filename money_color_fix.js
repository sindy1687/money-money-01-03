// 蝴蝶忍主題 - 錢相關文字淺黃色修復
function fixMoneyTextColor() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    // 錢相關的關鍵字和符號
    const moneyKeywords = [
        'NT$', '$', '¥', '€', '£', '元', '塊', '錢', '金額', '餘額', '總額', '費用', '價格', '成本'
    ];
    
    // 查找所有文字元素
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
        // 跳過腳本和樣式標籤
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
        
        const text = element.textContent || element.innerText || '';
        
        // 檢查是否包含錢相關關鍵字
        const hasMoneyKeyword = moneyKeywords.some(keyword => text.includes(keyword));
        
        // 檢查是否為錢相關的類名
        const hasMoneyClass = element.className && (
            element.className.includes('amount') ||
            element.className.includes('money') ||
            element.className.includes('price') ||
            element.className.includes('currency') ||
            element.className.includes('balance') ||
            element.className.includes('wallet') ||
            element.className.includes('fee') ||
            element.className.includes('cost')
        );
        
        // 檢查是否為錢相關的data屬性
        const hasMoneyData = (
            element.getAttribute('data-currency') ||
            element.getAttribute('data-amount') ||
            element.getAttribute('data-money') ||
            element.getAttribute('data-price')
        );
        
        if (hasMoneyKeyword || hasMoneyClass || hasMoneyData) {
            // 設置為淺黃色
            element.style.color = 'rgba(255, 255, 224, 1.0)';
            element.style.setProperty('color', 'rgba(255, 255, 224, 1.0)', 'important');
            
            // 添加深色陰影提高可讀性
            element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
            element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)', 'important');
            
            // 設置粗體
            element.style.fontWeight = '700';
            element.style.setProperty('font-weight', '700', 'important');
            
            console.log('已修復錢文字顏色:', text.substring(0, 30));
        }
    });
}

// 蝴蝶忍主題 - 編輯記帳模態框錢文字專門修復
function fixEditModalMoneyColor() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    // 專門處理編輯記帳相關的模態框
    const modals = document.querySelectorAll('.modal-content, .modal-content-standard, .category-modal-content, .account-modal-content');
    
    modals.forEach(modal => {
        // 查找模態框中的所有錢相關元素
        const moneyElements = modal.querySelectorAll(`
            .amount, .money, .price, .currency, .balance, .wallet, .fee, .cost,
            .transaction-amount, .budget-amount, .account-balance, .total-amount, .remaining-amount,
            [class*="amount"], [class*="money"], [class*="price"], [class*="currency"], [class*="balance"],
            [data-currency], [data-amount], [data-money], [data-price],
            input[type="number"], input[data-amount], .form-input, .form-control
        `);
        
        moneyElements.forEach(element => {
            // 設置為淺黃色
            element.style.color = 'rgba(255, 255, 224, 1.0)';
            element.style.setProperty('color', 'rgba(255, 255, 224, 1.0)', 'important');
            
            // 添加深色陰影提高可讀性
            element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
            element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)', 'important');
            
            // 設置粗體
            element.style.fontWeight = '700';
            element.style.setProperty('font-weight', '700', 'important');
        });
        
        // 查找模態框中包含錢符號的文字
        const allTextElements = modal.querySelectorAll('*');
        const moneyKeywords = ['NT$', '$', '¥', '€', '£', '元', '塊', '錢', '金額', '餘額', '總額', '費用', '價格', '成本'];
        
        allTextElements.forEach(element => {
            if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
            
            const text = element.textContent || element.innerText || '';
            const hasMoneyKeyword = moneyKeywords.some(keyword => text.includes(keyword));
            
            if (hasMoneyKeyword) {
                element.style.color = 'rgba(255, 255, 224, 1.0)';
                element.style.setProperty('color', 'rgba(255, 255, 224, 1.0)', 'important');
                element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
                element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)', 'important');
                element.style.fontWeight = '700';
                element.style.setProperty('font-weight', '700', 'important');
            }
        });
    });
}

// 錢文字專用監聽器
const moneyThemeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(() => {
                fixMoneyTextColor();
                fixEditModalMoneyColor();
            }, 100);
        }
    });
});

moneyThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// 錢文字專用DOM監聽器
const moneyDomObserver = new MutationObserver(() => {
    fixMoneyTextColor();
    fixEditModalMoneyColor();
});

moneyDomObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 定期檢查
setInterval(() => {
    fixMoneyTextColor();
    fixEditModalMoneyColor();
}, 2000);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    fixMoneyTextColor();
    fixEditModalMoneyColor();
});

document.addEventListener('load', () => {
    fixMoneyTextColor();
    fixEditModalMoneyColor();
});

console.log('錢文字顏色修復腳本已載入（包含編輯記帳模態框專門修復）');
