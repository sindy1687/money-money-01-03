// ========== 主題系統主入口文件 ==========

// 確保所有模組都已載入
(function() {
    'use strict';

    // 等待DOM載入完成
    function initializeThemeSystem() {
        // 檢查所有模組是否已載入
        if (!window.ThemeData || !window.ThemeIcons || !window.ThemeCore || !window.ThemeUI) {
            console.warn('主題模組未完全載入，請檢查檔案引用順序');
            return;
        }

        // 將 videoController 設置為全局變數以保持兼容性
        if (window.ThemeUI && window.ThemeUI.themeVideoController) {
            window.themeVideoController = window.ThemeUI.themeVideoController;
        }

        // 初始化主題
        if (window.ThemeCore && window.ThemeCore.initTheme) {
            window.ThemeCore.initTheme();
        }

        // 綁定全局函數以保持兼容性
        window.getCurrentTheme = window.ThemeCore.getCurrentTheme;
        window.applyTheme = window.ThemeCore.applyTheme;
        window.applyThemeBackgroundImage = window.ThemeCore.applyThemeBackgroundImage;
        window.updateThemeButtons = window.ThemeCore.updateThemeButtons;
        window.restoreButtonIcons = window.ThemeCore.restoreButtonIcons;
        window.getCustomTheme = window.ThemeCore.getCustomTheme;
        window.saveCustomTheme = window.ThemeCore.saveCustomTheme;
        window.applyCustomTheme = window.ThemeCore.applyCustomTheme;
        window.showThemeSelector = window.ThemeUI.showThemeSelector;

        console.log('✅ 主題系統初始化完成');
    }

    // 如果DOM已經載入，立即初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeThemeSystem);
    } else {
        initializeThemeSystem();
    }

})();
