// 主題檢查腳本
console.log('=== 開始檢查節日慶典主題 ===');

// 1. 檢查當前主題
function checkCurrentTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    console.log('當前主題:', currentTheme);
    
    // 如果不是節日慶典主題，切換過去
    if (currentTheme !== 'festive') {
        console.log('切換到節日慶典主題...');
        document.documentElement.setAttribute('data-theme', 'festive');
    }
    
    return currentTheme;
}

// 2. 檢查CSS變數
function checkCSSVariables() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    console.log('=== CSS變數檢查 ===');
    console.log('--color-primary:', style.getPropertyValue('--color-primary'));
    console.log('--bg-card:', style.getPropertyValue('--bg-card'));
    console.log('--border-primary:', style.getPropertyValue('--border-primary'));
    console.log('--color-primary-rgba-25:', style.getPropertyValue('--color-primary-rgba-25'));
}

// 3. 檢查預算頁面樣式
function checkBudgetPageStyles() {
    const pageBudget = document.querySelector('.page-budget');
    if (!pageBudget) {
        console.error('❌ 找不到 .page-budget 元素');
        return;
    }
    
    const computedStyle = getComputedStyle(pageBudget);
    
    console.log('=== 預算頁面樣式檢查 ===');
    console.log('background:', computedStyle.background);
    console.log('background-image:', computedStyle.backgroundImage);
    console.log('background-color:', computedStyle.backgroundColor);
    console.log('background-blend-mode:', computedStyle.backgroundBlendMode);
    console.log('position:', computedStyle.position);
    console.log('border:', computedStyle.border);
    console.log('border-color:', computedStyle.borderColor);
    
    // 檢查是否有背景圖片
    const hasBackgroundImage = computedStyle.backgroundImage !== 'none';
    console.log('是否有背景圖片:', hasBackgroundImage ? '✅' : '❌');
    
    if (hasBackgroundImage) {
        console.log('背景圖片URL:', computedStyle.backgroundImage);
    }
}

// 4. 檢查偽元素
function checkPseudoElements() {
    const pageBudget = document.querySelector('.page-budget');
    if (!pageBudget) return;
    
    console.log('=== 偽元素檢查 ===');
    
    // 檢查 ::before 偽元素
    const beforeStyle = getComputedStyle(pageBudget, '::before');
    console.log('::before content:', beforeStyle.content);
    console.log('::before background:', beforeStyle.background);
    console.log('::before z-index:', beforeStyle.zIndex);
}

// 5. 檢查CSS規則優先級
function checkCSSRules() {
    console.log('=== CSS規則檢查 ===');
    
    // 獲取所有CSS規則
    const styleSheets = document.styleSheets;
    let festiveRules = [];
    
    for (let i = 0; i < styleSheets.length; i++) {
        try {
            const rules = styleSheets[i].cssRules || styleSheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule.selectorText && rule.selectorText.includes('festive') && rule.selectorText.includes('.page-budget')) {
                    festiveRules.push({
                        selector: rule.selectorText,
                        style: rule.style.cssText
                    });
                }
            }
        } catch (e) {
            console.warn('無法讀取樣式表', i, e);
        }
    }
    
    console.log('找到的節日慶典主題預算頁面規則:', festiveRules.length);
    festiveRules.forEach((rule, index) => {
        console.log(`規則 ${index + 1}:`, rule.selector);
        console.log('樣式:', rule.style);
    });
}

// 6. 手動應用樣式測試
function manualStyleTest() {
    console.log('=== 手動樣式測試 ===');
    
    const pageBudget = document.querySelector('.page-budget');
    if (!pageBudget) {
        console.error('❌ 找不到 .page-budget 元素');
        return;
    }
    
    // 直接設置內聯樣式
    pageBudget.style.cssText = `
        background: url("https://i.pinimg.com/736x/6f/49/9a/6f499af434927a2eff91221a60393ae5.jpg") center/cover !important;
        background-blend-mode: overlay !important;
        background-color: rgba(230, 57, 70, 0.2) !important;
        position: relative !important;
        border: 3px solid #E63946 !important;
        border-radius: 20px !important;
    `;
    
    console.log('✅ 已應用內聯樣式');
    
    // 檢查結果
    setTimeout(() => {
        const computedStyle = getComputedStyle(pageBudget);
        console.log('應用後的背景圖片:', computedStyle.backgroundImage);
        console.log('應用後的背景顏色:', computedStyle.backgroundColor);
    }, 100);
}

// 7. 檢查圖片載入
function checkImageLoad() {
    console.log('=== 圖片載入檢查 ===');
    
    const imageUrl = 'https://i.pinimg.com/736x/6f/49/9a/6f499af434927a2eff91221a60393ae5.jpg';
    
    const img = new Image();
    img.onload = function() {
        console.log('✅ 圖片載入成功');
        console.log('圖片尺寸:', this.naturalWidth, 'x', this.naturalHeight);
        console.log('圖片URL:', this.src);
    };
    
    img.onerror = function() {
        console.error('❌ 圖片載入失敗');
        console.error('圖片URL:', imageUrl);
    };
    
    img.src = imageUrl;
}

// 8. 完整檢查流程
function fullCheck() {
    console.log('開始完整檢查...');
    
    checkCurrentTheme();
    checkCSSVariables();
    checkBudgetPageStyles();
    checkPseudoElements();
    checkCSSRules();
    checkImageLoad();
    
    // 延遲執行手動測試
    setTimeout(() => {
        manualStyleTest();
    }, 1000);
}

// 如果在瀏覽器中運行
if (typeof window !== 'undefined') {
    // 添加到全局作用域
    window.checkCurrentTheme = checkCurrentTheme;
    window.checkCSSVariables = checkCSSVariables;
    window.checkBudgetPageStyles = checkBudgetPageStyles;
    window.checkPseudoElements = checkPseudoElements;
    window.checkCSSRules = checkCSSRules;
    window.manualStyleTest = manualStyleTest;
    window.checkImageLoad = checkImageLoad;
    window.fullCheck = fullCheck;
    
    console.log('🔧 主題檢查工具已載入');
    console.log('可用的命令:');
    console.log('  fullCheck() - 執行完整檢查');
    console.log('  checkCurrentTheme() - 檢查當前主題');
    console.log('  checkBudgetPageStyles() - 檢查預算頁面樣式');
    console.log('  manualStyleTest() - 手動應用樣式測試');
    
    // 自動執行檢查
    setTimeout(fullCheck, 1000);
}
