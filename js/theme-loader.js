// ========== 主題系統載入器 ==========

// 載入所有主題模組
(function() {
    'use strict';

    // 模組載入順序很重要
    const modules = [
        'theme-data.js',      // 主題數據定義
        'theme-icons.js',     // 按鈕圖標配置
        'theme-core.js',     // 核心功能
        'theme-ui.js',       // UI組件
        'theme-main.js'      // 主入口文件
    ];

    // 動態載入模組
    function loadModule(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // 保持載入順序
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load module: ${src}`));
            document.head.appendChild(script);
        });
    }

    // 載入所有模組
    async function loadAllModules() {
        try {
            for (const module of modules) {
                await loadModule(module);
            }
            console.log('✅ 所有主題模組載入完成');
        } catch (error) {
            console.error('❌ 主題模組載入失敗:', error);
        }
    }

    // 開始載入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllModules);
    } else {
        loadAllModules();
    }
})();

// 向後兼容：保持原有的全局變數
window.AppThemes = window.AppThemes || [];
window.themes = window.themes || window.AppThemes;
