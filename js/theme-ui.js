// ========== 主題UI模組 ==========

// 主題動畫控制器
const themeVideoController = (() => {
    let moneyVideoEl = null;
    let spaceVideoEl = null;
    let containerEl = null;

    const ensureElements = () => {
        if (!moneyVideoEl) {
            moneyVideoEl = document.getElementById('moneyThemeVideo');
        }
        if (!spaceVideoEl) {
            spaceVideoEl = document.getElementById('spaceThemeVideo');
        }
        if (!containerEl) {
            containerEl = document.querySelector('.theme-video-background');
        }
        return moneyVideoEl && spaceVideoEl && containerEl;
    };

    const setActive = (themeId) => {
        if (!ensureElements()) return;
        moneyVideoEl.pause();
        spaceVideoEl.pause();

        const isActive = themeId === 'money' || themeId === 'space';
        containerEl.classList.toggle('active', isActive);

        if (isActive) {
            let activeVideo = null;
            if (themeId === 'money') {
                activeVideo = moneyVideoEl;
                moneyVideoEl.style.display = 'block';
                spaceVideoEl.style.display = 'none';
            } else if (themeId === 'space') {
                activeVideo = spaceVideoEl;
                spaceVideoEl.style.display = 'block';
                moneyVideoEl.style.display = 'none';
            }

            if (activeVideo) {
                activeVideo.currentTime = 0;
                const playPromise = activeVideo.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            }
        } else {
            moneyVideoEl.style.display = 'none';
            spaceVideoEl.style.display = 'none';
        }
    };

    return { setActive };
})();

// 創建主題卡片
function createThemeCard(theme) {
    const isSelected = theme.id === (window.ThemeCore ? window.ThemeCore.getCurrentTheme() : 'blue');
    const hasBackgroundImage = theme.backgroundImage;
    const previewStyle = hasBackgroundImage
        ? `background-image: url('${theme.backgroundImage}')`
        : (theme.preview && theme.preview.includes(':') ? theme.preview : `background: ${theme.preview};`);
    
    return `
        <div class="theme-item ${isSelected ? 'active' : ''}" data-theme-id="${theme.id}">
            <div class="theme-card">
                <div class="theme-preview" style="${previewStyle}"></div>
                <div class="theme-info">
                    <div class="theme-icon">${theme.icon}</div>
                    <div class="theme-name">${theme.name}</div>
                </div>
                ${isSelected ? '<div class="theme-selected-badge">✓</div>' : ''}
            </div>
        </div>
    `;
}

// 創建主題模態框
function createThemeModal() {
    const container = document.createElement('div');
    container.className = 'theme-modal-overlay';
    container.innerHTML = `
        <div class="theme-modal-content">
            <div class="theme-modal-header">
                <h2>🎨 選擇主題</h2>
                <button class="theme-modal-close-v2">×</button>
            </div>
            <div class="theme-modal-body">
                <div class="theme-section">
                    <div class="theme-section-title">主題分類</div>
                    <div class="theme-toolbar">
                        <input id="themeSearchInput" class="theme-search-input" type="text" placeholder="搜尋主題..." autocomplete="off" />
                        <div id="categoryTabs" class="theme-category-tabs"></div>
                    </div>
                    <div id="themeGrid" class="theme-grid theme-grid--categorized"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    return container;
}

// 初始化分類標籤
function initCategoryTabs() {
    const themeCategories = window.ThemeData ? window.ThemeData.themeCategories : {};
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    let tabsHTML = '<button class="category-tab active" data-category="all">全部</button>';
    
    // 添加各個分類
    Object.entries(themeCategories).forEach(([categoryId, categoryInfo]) => {
        const themes = window.ThemeData ? window.ThemeData.themes.filter(t => t.category === categoryId) : [];
        if (themes.length > 0) {
            tabsHTML += `
                <button class="category-tab" data-category="${categoryId}">
                    ${categoryInfo.icon} ${categoryInfo.name}
                </button>
            `;
        }
    });

    tabsContainer.innerHTML = tabsHTML;

    // 添加點擊事件
    tabsContainer.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active類
            tabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            // 添加active類到當前標籤
            tab.classList.add('active');
            
            const selectedCategory = tab.dataset.category;
            const searchValue = document.getElementById('themeSearchInput').value;
            renderThemeGrid(searchValue, selectedCategory);
        });
    });
}

// 渲染主題網格
function renderThemeGrid(searchQuery = '', selectedCategory = 'all') {
    const grid = document.getElementById('themeGrid');
    if (!grid) return;

    const themes = window.ThemeData ? window.ThemeData.themes : [];
    let list = themes.filter(t => {
        if (!searchQuery) return true;
        return (t.name || '').toLowerCase().includes(searchQuery) || (t.id || '').toLowerCase().includes(searchQuery);
    });

    // 按分類過濾
    if (selectedCategory !== 'all') {
        list = list.filter(t => t.category === selectedCategory);
    }

    // 按分類分組
    const groupedThemes = {};
    list.forEach(theme => {
        const category = theme.category || 'basic';
        if (!groupedThemes[category]) {
            groupedThemes[category] = [];
        }
        groupedThemes[category].push(theme);
    });

    let gridHTML = '';
    
    Object.entries(groupedThemes).forEach(([categoryId, categoryThemes]) => {
        const themeCategories = window.ThemeData ? window.ThemeData.themeCategories : {};
        const categoryInfo = themeCategories[categoryId] || { name: '其他', icon: '📁', description: '' };
        
        gridHTML += `
            <div class="theme-category-section">
                <div class="theme-category-header">
                    <span class="theme-category-icon">${categoryInfo.icon}</span>
                    <span class="theme-category-name">${categoryInfo.name}</span>
                    <span class="theme-category-description">${categoryInfo.description}</span>
                </div>
                <div class="theme-category-grid">
                    ${categoryThemes.map(theme => {
                        const isSelected = theme.id === (window.ThemeCore ? window.ThemeCore.getCurrentTheme() : 'blue');
                        const hasBackgroundImage = theme.backgroundImage;
                        return `
                            <div class="theme-item ${isSelected ? 'active' : ''}" data-theme-id="${theme.id}">
                                <div class="theme-card">
                                    <div class="theme-preview" style="${hasBackgroundImage ? `background-image: url('${theme.backgroundImage}')` : (theme.preview && theme.preview.includes(':') ? theme.preview : `background: ${theme.preview};`)}"></div>
                                    <div class="theme-info">
                                        <div class="theme-icon">${theme.icon}</div>
                                        <div class="theme-name">${theme.name}</div>
                                    </div>
                                    ${isSelected ? '<div class="theme-selected-badge">✓</div>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    grid.innerHTML = gridHTML;

    // 添加主題選擇事件
    grid.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', () => {
            const themeId = item.dataset.themeId;
            const themes = window.ThemeData ? window.ThemeData.themes : [];
            const theme = themes.find(t => t.id === themeId);
            
            // 清除自訂主題設定，應用預設主題
            if (window.ThemeCore) {
                window.ThemeCore.saveCustomTheme({});
            }
            
            // 應用主題
            if (window.ThemeCore) {
                window.ThemeCore.applyTheme(themeId);
            }
            
            // 更新UI
            grid.querySelectorAll('.theme-item').forEach(card => card.classList.remove('active'));
            item.classList.add('active');
            
            // 關閉模態框
            setTimeout(() => {
                const modal = document.querySelector('.theme-modal-overlay');
                if (modal) {
                    closeModal(modal);
                }
            }, 300);
        });
    });
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

// 設置模態框事件
function setupModalEvents(modal) {
    // 關閉按鈕
    const closeBtn = modal.querySelector('.theme-modal-close-v2');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // 背景點擊關閉
    const overlay = modal.querySelector('.theme-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => closeModal(modal));
    }
    
    // ESC鍵關閉
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 顯示主題選擇器
function showThemeSelector() {
    const modal = createThemeModal();
    
    // 初始化
    initCategoryTabs();
    renderThemeGrid('');
    
    // 設置事件
    setupModalEvents(modal);
    
    // 搜索功能
    const themeSearchInput = document.getElementById('themeSearchInput');
    if (themeSearchInput) {
        themeSearchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.category-tab.active');
            const selectedCategory = activeTab ? activeTab.dataset.category : 'all';
            renderThemeGrid(e.target.value, selectedCategory);
        });
    }
    
    // 顯示模態框
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        themeVideoController, 
        createThemeCard, 
        createThemeModal, 
        initCategoryTabs, 
        renderThemeGrid, 
        closeModal, 
        setupModalEvents, 
        showThemeSelector 
    };
} else {
    window.ThemeUI = { 
        themeVideoController, 
        createThemeCard, 
        createThemeModal, 
        initCategoryTabs, 
        renderThemeGrid, 
        closeModal, 
        setupModalEvents, 
        showThemeSelector 
    };
}
