// 修復圖示問題的腳本
// 在主應用程式控制台中運行

function fixInvestmentCardIcons() {
    console.log('=== 修復投資卡片圖示 ===');
    
    // 1. 確保在節日慶典主題
    const root = document.documentElement;
    root.setAttribute('data-theme', 'festive');
    
    // 2. 找到所有投資卡片
    const cards = document.querySelectorAll('.summary-card');
    console.log('找到投資卡片:', cards.length);
    
    // 3. 修復每個卡片的圖示
    cards.forEach((card, index) => {
        // 應用背景圖片但保持圖示可見
        card.style.setProperty('background-image', 'url("https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg")', 'important');
        card.style.setProperty('background-size', 'cover', 'important');
        card.style.setProperty('background-position', 'center', 'important');
        card.style.setProperty('background-color', 'rgba(230, 57, 70, 0.3)', 'important');
        card.style.setProperty('background-blend-mode', 'overlay', 'important');
        card.style.setProperty('border', '2px solid rgba(252, 163, 17, 0.72)', 'important');
        card.style.setProperty('border-radius', '20px', 'important');
        card.style.setProperty('backdrop-filter', 'blur(15px)', 'important');
        
        // 確保圖示可見
        const icon = card.querySelector('.summary-icon');
        if (icon) {
            icon.style.setProperty('color', 'white', 'important');
            icon.style.setProperty('font-size', '24px', 'important');
            icon.style.setProperty('margin-bottom', '10px', 'important');
            icon.style.setProperty('text-shadow', '0 2px 4px rgba(0,0,0,0.5)', 'important');
            icon.style.setProperty('z-index', '10', 'important');
            icon.style.setProperty('position', 'relative', 'important');
        }
        
        // 確保文字可見
        const content = card.querySelector('.summary-content');
        if (content) {
            content.style.setProperty('color', 'white', 'important');
            content.style.setProperty('text-shadow', '0 2px 4px rgba(0,0,0,0.5)', 'important');
            content.style.setProperty('z-index', '10', 'important');
            content.style.setProperty('position', 'relative', 'important');
        }
        
        const label = card.querySelector('.summary-label');
        if (label) {
            label.style.setProperty('color', 'white', 'important');
            label.style.setProperty('font-size', '14px', 'important');
            label.style.setProperty('opacity', '0.9', 'important');
            label.style.setProperty('text-shadow', '0 2px 4px rgba(0,0,0,0.5)', 'important');
        }
        
        const value = card.querySelector('.summary-value');
        if (value) {
            value.style.setProperty('color', 'white', 'important');
            value.style.setProperty('font-size', '18px', 'important');
            value.style.setProperty('font-weight', 'bold', 'important');
            value.style.setProperty('text-shadow', '0 2px 4px rgba(0,0,0,0.5)', 'important');
        }
        
        console.log(`卡片 ${index + 1} 圖示已修復`);
    });
    
    console.log('=== 圖示修復完成 ===');
}

// 運行修復
fixInvestmentCardIcons();
