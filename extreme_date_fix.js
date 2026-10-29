// 蝴蝶忍主題 - 極端日期白色修復
function extremeDateFix() {
    try {
        // 檢查當前主題是否為蝴蝶忍
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme !== 'shinobu') return;
        
        console.log('開始極端日期白色修復...');
        
        // 1. 直接注入CSS樣式
        const style = document.createElement('style');
        style.id = 'extreme-date-fix';
        style.textContent = `
            :root[data-theme="shinobu"] * {
                color: inherit !important;
            }
            
            :root[data-theme="shinobu"] .chart-date,
            :root[data-theme="shinobu"] .chart-month,
            :root[data-theme="shinobu"] .chart-year,
            :root[data-theme="shinobu"] .chart-day,
            :root[data-theme="shinobu"] .chart-time,
            :root[data-theme="shinobu"] .date-text,
            :root[data-theme="shinobu"] .month-text,
            :root[data-theme="shinobu"] .year-text,
            :root[data-theme="shinobu"] .day-text,
            :root[data-theme="shinobu"] .time-text,
            :root[data-theme="shinobu"] *[data-date],
            :root[data-theme="shinobu"] *[data-month],
            :root[data-theme="shinobu"] *[data-year],
            :root[data-theme="shinobu"] *[data-day],
            :root[data-theme="shinobu"] *[data-time],
            :root[data-theme="shinobu"] .trend-chart *,
            :root[data-theme="shinobu"] .line-chart *,
            :root[data-theme="shinobu"] .chart-container *,
            :root[data-theme="shinobu"] canvas *,
            :root[data-theme="shinobu"] svg *,
            :root[data-theme="shinobu"] .x-axis *,
            :root[data-theme="shinobu"] .y-axis *,
            :root[data-theme="shinobu"] .axis *,
            :root[data-theme="shinobu"] .tick *,
            :root[data-theme="shinobu"] .label * {
                color: rgba(255, 255, 255, 1.0) !important;
                fill: rgba(255, 255, 255, 1.0) !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9) !important;
            }
            
            :root[data-theme="shinobu"] .chart-value,
            :root[data-theme="shinobu"] .chart-amount,
            :root[data-theme="shinobu"] .chart-money,
            :root[data-theme="shinobu"] .chart-currency {
                color: rgba(255, 210, 100, 1.0) !important;
                fill: rgba(255, 210, 100, 1.0) !important;
            }
            
            :root[data-theme="shinobu"] .chart-legend,
            :root[data-theme="shinobu"] .chart-title {
                color: rgba(255, 210, 100, 1.0) !important;
                fill: rgba(255, 210, 100, 1.0) !important;
            }
        `;
        
        // 移除舊的樣式
        const oldStyle = document.getElementById('extreme-date-fix');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // 添加新樣式
        document.head.appendChild(style);
        
        // 2. 直接修改Chart.js配置
        try {
            if (typeof Chart !== 'undefined') {
                Chart.defaults.color = 'rgba(255, 255, 255, 1.0)';
                Chart.defaults.font.color = 'rgba(255, 255, 255, 1.0)';
                Chart.defaults.font.weight = '600';
                
                // 修改圖表默認配置
                Chart.defaults.scale.ticks.color = 'rgba(255, 255, 255, 1.0)';
                Chart.defaults.scale.title.color = 'rgba(255, 255, 255, 1.0)';
                Chart.defaults.legend.labels.color = 'rgba(255, 255, 255, 1.0)';
            }
        } catch (error) {
            console.log('Chart.js配置修改失敗:', error);
        }
        
        // 3. 強制修改所有文字元素
        try {
            const allTextElements = document.querySelectorAll('text, tspan, .tick, .label, .axis-label, .date, .month, .year, .day');
            
            allTextElements.forEach(element => {
                const text = element.textContent || '';
                
                // 檢查是否包含日期
                const datePatterns = [
                    /\d{1,2}月/, /\d{4}年/, /\d{1,2}\/\d{1,2}/, /\d{4}-\d{1,2}/,
                    /一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/,
                    /1月|2月|3月|4月|5月|6月|7月|8月|9月|10月|11月|12月/
                ];
                
                const isDateText = datePatterns.some(pattern => pattern.test(text));
                
                if (isDateText || element.className.includes('date') || element.className.includes('month') || 
                    element.className.includes('year') || element.className.includes('axis') || 
                    element.className.includes('tick') || element.className.includes('label')) {
                    
                    // 設置多種屬性確保白色
                    element.style.color = 'rgba(255, 255, 255, 1.0)';
                    element.style.fill = 'rgba(255, 255, 255, 1.0)';
                    element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
                    element.style.setProperty('fill', 'rgba(255, 255, 255, 1.0)', 'important');
                    
                    // 設置陰影
                    element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.9)';
                    element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.9)', 'important');
                    
                    console.log('極端修復日期文字:', text.substring(0, 20));
                }
            });
        } catch (error) {
            console.log('文字元素修改失敗:', error);
        }
        
        // 4. 處理Canvas圖表
        try {
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // 設置默認文字樣式
                    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
                    ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
                    ctx.font = '600 12px Arial';
                }
            });
        } catch (error) {
            console.log('Canvas處理失敗:', error);
        }
        
        // 5. 攔截圖表更新
        try {
            if (typeof window.updateAllCharts === 'function') {
                const originalUpdate = window.updateAllCharts;
                window.updateAllCharts = function() {
                    const result = originalUpdate.apply(this, arguments);
                    setTimeout(extremeDateFix, 1000);
                    return result;
                };
            }
        } catch (error) {
            console.log('圖表更新攔截失敗:', error);
        }
        
        console.log('極端日期白色修復完成');
    } catch (error) {
        console.log('極端修復執行失敗:', error);
    }
}

// 立即執行
extremeDateFix();

// 監聽主題變化
const extremeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(extremeDateFix, 300);
        }
    });
});

extremeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// 高頻檢查
setInterval(extremeDateFix, 1000);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', extremeDateFix);
document.addEventListener('load', extremeDateFix);

console.log('極端日期修復腳本已載入');
