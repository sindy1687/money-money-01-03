// ========== 主題系統載入器 ==========

// 載入所有主題模組
(function() {
    'use strict';

    // 自動檢測當前腳本的路徑
    function getCurrentScriptPath() {
        const script = document.currentScript || (function() {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        
        if (script && script.src) {
            const path = script.src.substring(0, script.src.lastIndexOf('/') + 1);
            return path;
        }
        
        // 如果無法檢測，使用默認路徑
        return './js/';
    }

    const basePath = getCurrentScriptPath();

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
            script.src = basePath + src;
            script.async = false; // 保持載入順序
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load module: ${basePath + src}`));
            document.head.appendChild(script);
        });
    }

    // 載入所有模組
    async function loadAllModules() {
        try {
            console.log('🔄 開始載入主題模組，基礎路徑:', basePath);
            
            for (const module of modules) {
                console.log(`📦 載入模組: ${module}`);
                await loadModule(module);
            }
            console.log('✅ 所有主題模組載入完成');
        } catch (error) {
            console.error('❌ 主題模組載入失敗:', error);
            
            // 嘗試備用載入方式
            console.log('🔄 嘗試備用載入方式...');
            tryFallbackLoading();
        }
    }

    // 備用載入方式
    function tryFallbackLoading() {
        const fallbackPaths = [
            './js/',           // 相對路徑
            'js/',             // 當前目錄
            '../js/',          // 上級目錄
            '/js/'             // 絕對路徑
        ];

        let currentPathIndex = 0;

        function tryLoadWithFallback() {
            if (currentPathIndex >= fallbackPaths.length) {
                console.error('❌ 所有載入方式都失敗了');
                return;
            }

            const currentPath = fallbackPaths[currentPathIndex];
            console.log(`🔄 嘗試路徑: ${currentPath}`);

            // 重置模組載入
            const modules = [
                'theme-data.js',
                'theme-icons.js', 
                'theme-core.js',
                'theme-ui.js',
                'theme-main.js'
            ];

            let loadCount = 0;
            
            modules.forEach(module => {
                const script = document.createElement('script');
                script.src = currentPath + module;
                script.onload = () => {
                    loadCount++;
                    if (loadCount === modules.length) {
                        console.log(`✅ 使用路徑 ${currentPath} 載入成功`);
                    }
                };
                script.onerror = () => {
                    console.error(`❌ 路徑 ${currentPath + module} 載入失敗`);
                    currentPathIndex++;
                    if (currentPathIndex < fallbackPaths.length) {
                        setTimeout(tryLoadWithFallback, 100);
                    }
                };
                document.head.appendChild(script);
            });
        }

        tryLoadWithFallback();
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
