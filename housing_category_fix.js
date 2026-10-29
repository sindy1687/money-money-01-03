// 蝴蝶忍主題 - 住房物業分類名稱黑色修復
function fixHousingCategoryColor() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    // 查找所有分類名稱
    const categoryNames = document.querySelectorAll('.category-name');
    
    categoryNames.forEach(element => {
        const text = element.textContent.trim();
        
        // 檢查是否包含"住房物業"、"住房"或"物業"
        if (text.includes('住房物業') || text.includes('住房') || text.includes('物業')) {
            // 設置為黑色
            element.style.color = 'rgba(0, 0, 0, 1.0)';
            element.style.setProperty('color', 'rgba(0, 0, 0, 1.0)', 'important');
            
            // 添加白色陰影以提高可讀性
            element.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.8)';
            element.style.setProperty('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.8)', 'important');
            
            // 設置粗體
            element.style.fontWeight = '700';
            element.style.setProperty('font-weight', '700', 'important');
            
            console.log('已修復住房物業分類顏色:', text);
        }
    });
    
    // 同時檢查分類項目
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        const categoryName = item.querySelector('.category-name');
        if (categoryName) {
            const text = categoryName.textContent.trim();
            
            if (text.includes('住房物業') || text.includes('住房') || text.includes('物業')) {
                // 設置整個項目的相關文字為黑色
                const allTextElements = item.querySelectorAll('*');
                allTextElements.forEach(textElement => {
                    if (textElement.textContent.includes('住房物業') || 
                        textElement.textContent.includes('住房') || 
                        textElement.textContent.includes('物業')) {
                        textElement.style.color = 'rgba(0, 0, 0, 1.0)';
                        textElement.style.setProperty('color', 'rgba(0, 0, 0, 1.0)', 'important');
                        textElement.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.8)';
                        textElement.style.setProperty('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.8)', 'important');
                        textElement.style.fontWeight = '700';
                        textElement.style.setProperty('font-weight', '700', 'important');
                    }
                });
            }
        }
    });
}

// 住房物業分類專用監聽器
const housingThemeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(fixHousingCategoryColor, 100);
        }
    });
});

housingThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// 住房物業分類專用DOM監聽器
const housingDomObserver = new MutationObserver(() => {
    fixHousingCategoryColor();
});

housingDomObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 定期檢查
setInterval(fixHousingCategoryColor, 2000);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', fixHousingCategoryColor);
document.addEventListener('load', fixHousingCategoryColor);

console.log('住房物業分類顏色修復腳本已載入');
