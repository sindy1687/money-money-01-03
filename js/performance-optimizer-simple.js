// 性能優化器
class PerformanceOptimizer {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.backgroundSyncInterval = null;
        this.performanceMetrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            memoryUsage: 0
        };
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 初始化性能優化器...');
        
        this.initBackgroundSync();
        this.observePerformanceMetrics();
        this.optimizeImageLoading();
        this.enableLazyLoading();
        
        this.isInitialized = true;
        console.log('✅ 性能優化器初始化完成');
    }

    initBackgroundSync() {
        this.backgroundSyncInterval = setInterval(() => {
            this.performBackgroundSync();
        }, 5 * 60 * 1000);
        
        console.log('🔄 背景同步已啟動');
    }

    performBackgroundSync() {
        this.syncLocalData();
        this.cleanupCache();
        this.optimizeStorage();
        console.log('🔄 背景同步完成');
    }

    observePerformanceMetrics() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                this.performanceMetrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
                this.performanceMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
                console.log('📊 性能指標:', this.performanceMetrics);
            });
        }
    }

    optimizeImageLoading() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }

    enableLazyLoading() {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }

    syncLocalData() {
        try {
            const keys = ['accountingRecords', 'investmentRecords', 'categories', 'settings'];
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        JSON.parse(data);
                    } catch (e) {
                        console.warn(`⚠️ 數據 ${key} 損壞，正在清理...`);
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error('❌ 數據同步失敗:', error);
        }
    }

    cleanupCache() {
        try {
            const cacheKeys = Object.keys(localStorage);
            const now = Date.now();
            
            cacheKeys.forEach(key => {
                if (key.startsWith('cache_')) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const data = JSON.parse(item);
                        if (data.expiry && data.expiry < now) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('❌ 快取清理失敗:', error);
        }
    }

    optimizeStorage() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    const usage = estimate.usage || 0;
                    const quota = estimate.quota || 0;
                    const usagePercentage = (usage / quota) * 100;
                    
                    this.performanceMetrics.memoryUsage = usagePercentage;
                    
                    if (usagePercentage > 80) {
                        console.warn('⚠️ 存儲空間使用率超過80%，建議清理');
                        this.performStorageCleanup();
                    }
                });
            }
        } catch (error) {
            console.error('❌ 存儲優化失敗:', error);
        }
    }

    performStorageCleanup() {
        try {
            const logs = JSON.parse(localStorage.getItem('logs') || '[]');
            const filteredLogs = logs.filter(log => 
                Date.now() - new Date(log.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
            );
            localStorage.setItem('logs', JSON.stringify(filteredLogs));
            this.cleanupCache();
            console.log('🧹 存儲清理完成');
        } catch (error) {
            console.error('❌ 存儲清理失敗:', error);
        }
    }

    getPerformanceReport() {
        return {
            metrics: this.performanceMetrics,
            isOptimized: this.isInitialized,
            version: this.version,
            timestamp: new Date().toISOString()
        };
    }

    stop() {
        if (this.backgroundSyncInterval) {
            clearInterval(this.backgroundSyncInterval);
            this.backgroundSyncInterval = null;
        }
        
        this.isInitialized = false;
        console.log('⏹️ 性能優化器已停止');
    }
}

const performanceOptimizer = new PerformanceOptimizer();

document.addEventListener('DOMContentLoaded', function() {
    performanceOptimizer.init();
});

window.PerformanceOptimizer = performanceOptimizer;
