不ㄧ// ========== 主題選擇器 - 簡潔版 ==========

// 主題定義
const themes = [
    // 基礎主題
    { id: 'pink', name: '粉色主題', icon: '💖', preview: 'linear-gradient(135deg, #ffeef5 0%, #fff5f9 100%)', color: '#ff69b4', category: 'basic' },
    { id: 'blue', name: '藍色主題', icon: '💙', preview: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)', color: '#4a90e2', category: 'basic' },
    { id: 'green', name: '綠色主題', icon: '💚', preview: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', color: '#4caf50', category: 'basic' },
    { id: 'purple', name: '紫色主題', icon: '💜', preview: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)', color: '#9c27b0', category: 'basic' },
    { id: 'orange', name: '橙色主題', icon: '🧡', preview: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', color: '#ff9800', category: 'basic' },
    { id: 'cyan', name: '青色主題', icon: '🩵', preview: 'linear-gradient(135deg, #e0f7fa 0%, #f0fdfe 100%)', color: '#00bcd4', category: 'basic' },
    
    // 特殊主題
    { 
        id: 'shinobu', 
        name: '蝴蝶忍', 
        icon: '🦋', 
        preview: 'url("https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg") center/cover', 
        color: '#9B59B6', 
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg' 
    }
];

// 主題分類
const themeCategories = {
    basic: { name: '經典色彩', icon: '🎨', description: '純色經典主題' },
    anime: { name: '動漫風格', icon: '🎌', description: '吉卜力、鬼滅等動漫主題' }
};

// 按鈕圖標
const buttonIcons = {
    pink: { fab: '💖', navLedger: '💗', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    blue: { fab: '💙', navLedger: '📘', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    green: { fab: '💚', navLedger: '📘', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    purple: { fab: '💜', navLedger: '📘', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    orange: { fab: '🧡', navLedger: '📘', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    cyan: { fab: '🩵', navLedger: '📘', navWallet: '💳', navInvestment: '📈', navChart: '📊', navSettings: '⚙️' },
    shinobu: { fab: '🦋', navLedger: '🗡️', navWallet: '💜', navInvestment: '🌸', navChart: '🦋', navSettings: '⚡' }
};

// ========== 核心功能 ==========

// 獲取當前主題
function getCurrentTheme() {
    return localStorage.getItem('selectedTheme') || 'blue';
}

// 應用主題
function applyTheme(themeId) {
    const root = document.documentElement;
    const theme = themes.find(t => t.id === themeId);
    
    if (!theme) return;
    
    // 設置主題屬性
    root.setAttribute('data-theme', themeId);
    localStorage.setItem('selectedTheme', themeId);
    
    // 清除背景樣式
    root.style.removeProperty('--bg-white');
    
    // 應用背景圖片
    if (theme && theme.backgroundImage) {
        applyThemeBackgroundImage(theme.backgroundImage);
    } else {
        // 清除背景
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
    }
    
    // 更新UI
    updateThemeButtons(themeId);
    
    // 更新圖表
    const pageChart = document.getElementById('pageChart');
    if (pageChart && pageChart.style.display !== 'none') {
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
    }
}

// 應用主題背景圖片
function applyThemeBackgroundImage(imageUrl) {
    if (!imageUrl) return;
    
    const img = new Image();
    img.onload = function() {
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        console.log(`✅ 主題背景圖片載入成功: ${imageUrl}`);
    };
    
    img.onerror = function() {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        console.warn(`⚠️ 主題背景圖片載入失敗: ${imageUrl}`);
    };
    
    img.src = imageUrl;
}

// 更新主題按鈕
function updateThemeButtons(themeId) {
    const icons = buttonIcons[themeId] || buttonIcons.blue;
    
    // 更新FAB按鈕
    const fabBtn = document.querySelector('.fab-btn');
    if (fabBtn) {
        fabBtn.textContent = icons.fab;
    }
    
    // 更新導航按鈕
    const navButtons = {
        '.nav-ledger': icons.navLedger,
        '.nav-wallet': icons.navWallet,
        '.nav-investment': icons.navInvestment,
        '.nav-chart': icons.navChart,
        '.nav-settings': icons.navSettings
    };
    
    Object.entries(navButtons).forEach(([selector, icon]) => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.textContent = icon;
        }
    });
}

// ========== 主題選擇器 ==========

// 顯示主題選擇器
function showThemeSelector() {
    // 創建模態框
    const modal = createThemeModal();
    document.body.appendChild(modal);
    
    // 添加事件監聽器
    setupModalEventListeners(modal);
    
    // 顯示動畫
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// 創建主題模態框
function createThemeModal() {
    const modal = document.createElement('div');
    modal.className = 'theme-modal';
    modal.innerHTML = `
        <div class="theme-modal-content">
            <div class="theme-modal-header">
                <h2>選擇主題</h2>
                <button class="theme-close-btn">×</button>
            </div>
            <div class="theme-modal-body">
                ${createThemeGrid()}
            </div>
        </div>
    `;
    return modal;
}

// 創建主題網格
function createThemeGrid() {
    let html = '';
    
    // 按分類組織主題
    const themesByCategory = {};
    themes.forEach(theme => {
        if (!themesByCategory[theme.category]) {
            themesByCategory[theme.category] = [];
        }
        themesByCategory[theme.category].push(theme);
    });
    
    // 生成HTML
    Object.entries(themesByCategory).forEach(([category, categoryThemes]) => {
        const categoryInfo = themeCategories[category];
        html += `
            <div class="theme-category">
                <h3>${categoryInfo.icon} ${categoryInfo.name}</h3>
                <p>${categoryInfo.description}</p>
                <div class="theme-grid">
                    ${categoryThemes.map(theme => createThemeCard(theme)).join('')}
                </div>
            </div>
        `;
    });
    
    return html;
}

// 創建主題卡片
function createThemeCard(theme) {
    const currentTheme = getCurrentTheme();
    const isActive = theme.id === currentTheme;
    
    return `
        <div class="theme-card ${isActive ? 'active' : ''}" data-theme="${theme.id}">
            <div class="theme-preview" style="background: ${theme.preview}"></div>
            <div class="theme-info">
                <span class="theme-icon">${theme.icon}</span>
                <span class="theme-name">${theme.name}</span>
            </div>
        </div>
    `;
}

// 設置模態框事件監聽器
function setupModalEventListeners(modal) {
    // 主題卡片點擊事件
    modal.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const themeId = card.dataset.theme;
            applyTheme(themeId);
            closeModal(modal);
        });
    });
    
    // 關閉按鈕事件
    const closeBtn = modal.querySelector('.theme-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(modal);
        });
    }
    
    // 背景點擊關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // ESC鍵關閉
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 關閉模態框
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 300);
}

// ========== 初始化 ==========

function initTheme() {
    const savedTheme = getCurrentTheme();
    applyTheme(savedTheme);
    
    // 延遲更新按鈕以確保DOM已準備好
    setTimeout(() => {
        updateThemeButtons(savedTheme);
    }, 100);
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', initTheme);

// ========== 導出 ==========

// 導出主要函數供其他腳本使用
window.ThemeManager = {
    getCurrentTheme,
    applyTheme,
    showThemeSelector,
    themes,
    themeCategories
};
