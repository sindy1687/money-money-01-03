// 直接在主應用程式中運行的調試腳本
// 在主應用程式的控制台中運行此腳本

function debugInvestmentCards() {
    console.log('=== 投資卡片調試開始 ===');
    
    // 1. 檢查當前主題
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    console.log('當前主題:', currentTheme);
    
    // 2. 檢查投資卡片是否存在
    const investmentCards = document.querySelectorAll('.summary-card');
    console.log('找到的投資卡片數量:', investmentCards.length);
    
    if (investmentCards.length === 0) {
        console.log('❌ 沒有找到投資卡片，可能不在投資頁面');
        return;
    }
    
    // 3. 檢查每個卡片的樣式
    investmentCards.forEach((card, index) => {
        const style = getComputedStyle(card);
        console.log(`卡片 ${index + 1}:`, {
            backgroundImage: style.backgroundImage.substring(0, 80) + '...',
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            hasBackgroundImage: style.backgroundImage !== 'none',
            hasFestiveColor: style.backgroundColor.includes('230, 57, 70')
        });
    });
    
    // 4. 強制設置節日慶典主題
    console.log('強制設置節日慶典主題...');
    root.setAttribute('data-theme', 'festive');
    
    // 5. 檢查CSS規則
    const styleSheets = document.styleSheets;
    let festiveRules = 0;
    
    for (let i = 0; i < styleSheets.length; i++) {
        try {
            const sheet = styleSheets[i];
            const rules = sheet.cssRules || sheet.rules;
            
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule.selectorText && rule.selectorText.includes('festive') && rule.selectorText.includes('summary-card')) {
                    console.log('找到節日慶典summary-card規則:', rule.selectorText);
                    festiveRules++;
                }
            }
        } catch (e) {
            console.warn('無法讀取樣式表:', e);
        }
    }
    
    console.log('節日慶典summary-card規則數量:', festiveRules);
    
    // 6. 強制應用樣式
    console.log('強制應用節日慶典樣式...');
    investmentCards.forEach((card, index) => {
        card.style.setProperty('background-image', 'url("https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg")', 'important');
        card.style.setProperty('background-size', 'cover', 'important');
        card.style.setProperty('background-position', 'center', 'important');
        card.style.setProperty('background-color', 'rgba(230, 57, 70, 0.3)', 'important');
        card.style.setProperty('background-blend-mode', 'overlay', 'important');
        card.style.setProperty('border', '2px solid rgba(252, 163, 17, 0.72)', 'important');
        card.style.setProperty('border-radius', '20px', 'important');
        card.style.setProperty('backdrop-filter', 'blur(15px)', 'important');
        
        console.log(`卡片 ${index + 1} 強制樣式已應用`);
    });
    
    // 7. 最終檢查
    setTimeout(() => {
        console.log('=== 最終檢查 ===');
        investmentCards.forEach((card, index) => {
            const style = getComputedStyle(card);
            console.log(`卡片 ${index + 1} 最終狀態:`, {
                backgroundImage: style.backgroundImage.substring(0, 80) + '...',
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor
            });
        });
        console.log('=== 調試完成 ===');
    }, 100);
}

// 運行調試
debugInvestmentCards();
