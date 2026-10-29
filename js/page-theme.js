// 主題與主題選擇器相關（從 script.js 拆出）

// 主題選擇器顯示（如果 script.js 中有相關邏輯，放這裡）
function showThemeSelector() {
    // 假設主題選擇器邏輯已經在 theme.js，這裡只放 script.js 內的依賴
    if (typeof window.showThemeSelectorFromTheme === 'function') {
        window.showThemeSelectorFromTheme();
    } else {
        console.warn('showThemeSelector not available');
    }
}

// 字體大小選擇器
function showFontSizeSelector() {
    const modal = createModal({
        title: '📝 字體大小設定',
        content: `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="fontSize" value="small" ${getCurrentFontSize() === 'small' ? 'checked' : ''}>
                    <span>小字體</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="fontSize" value="medium" ${getCurrentFontSize() === 'medium' ? 'checked' : ''}>
                    <span>中字體（預設）</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="fontSize" value="large" ${getCurrentFontSize() === 'large' ? 'checked' : ''}>
                    <span>大字體</span>
                </label>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn btn-secondary" data-action="cancel">取消</button>
                <button class="btn btn-primary" data-action="save">儲存</button>
            </div>
        `
    });

    modal.element.querySelector('[data-action="save"]').addEventListener('click', () => {
        const selected = modal.element.querySelector('input[name="fontSize"]:checked');
        if (selected) {
            setFontSize(selected.value);
            showNotification('字體大小已更新', 'success');
        }
        modal.close();
    });

    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

function getCurrentFontSize() {
    return localStorage.getItem('fontSize') || 'medium';
}

function setFontSize(size) {
    localStorage.setItem('fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
    // 可以在這裡加入更多字體大小應用邏輯
}

// 主題相關輔助函數
function applyThemeSettings(themeId) {
    if (typeof window.applyTheme === 'function') {
        window.applyTheme(themeId);
    } else {
        console.warn('applyTheme not available');
    }
}

// 初始化主題設定
function initThemeSettings() {
    const fontSize = getCurrentFontSize();
    if (fontSize && fontSize !== 'medium') {
        setFontSize(fontSize);
    }
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSettings);
} else {
    initThemeSettings();
}
