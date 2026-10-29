// 蝴蝶忍主題 - 圖表文字深黃色高對比度修復
function fixChartTextColor() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    // 查找所有圖表相關元素
    const chartElements = document.querySelectorAll(`
        .chart-container, .chart-wrapper, .chart-canvas, canvas,
        .chart-legend, .chart-label, .chart-title, .chart-axis, .chart-grid,
        .chart-tooltip, .chart-data-label, .chart-segment, .chart-value,
        .chart-percentage, .pie-chart, .bar-chart, .line-chart, .doughnut-chart,
        .page-chart, #pageChart, .chart-section,
        *[data-chart], *[data-legend], *[data-label], *[data-value], *[data-percentage],
        .chart-text, .chart-number, .chart-amount, .chart-money, .chart-currency
    `);
    
    chartElements.forEach(element => {
        // 設置為更深的黃色
        element.style.color = 'rgba(255, 210, 100, 1.0)';
        element.style.setProperty('color', 'rgba(255, 210, 100, 1.0)', 'important');
        
        // 添加更強的深色陰影提高對比度
        element.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)';
        element.style.setProperty('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)', 'important');
        
        // 設置更粗的字體
        element.style.fontWeight = '700';
        element.style.setProperty('font-weight', '700', 'important');
    });
    
    // 特殊處理：圖表數據和金額用更深的黃色
    const chartDataElements = document.querySelectorAll(`
        .chart-value, .chart-amount, .chart-money, .chart-currency,
        .chart-number, *[data-value], *[data-amount]
    `);
    
    chartDataElements.forEach(element => {
        element.style.color = 'rgba(255, 200, 80, 1.0)';
        element.style.setProperty('color', 'rgba(255, 200, 80, 1.0)', 'important');
        element.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)';
        element.style.setProperty('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)', 'important');
        element.style.fontWeight = '700';
        element.style.setProperty('font-weight', '700', 'important');
    });
    
    // 特殊處理：每月總支出趨勢的日期數字白色
    const trendDateElements = document.querySelectorAll(`
        .chart-date, .chart-datetime, .chart-month, .chart-year, .chart-day, .chart-time,
        .date-text, .time-text, .datetime-text, .month-text, .year-text, .day-text,
        *[data-date], *[data-time], *[data-datetime], *[data-month], *[data-year], *[data-day],
        .trend-chart .chart-date, .trend-chart .chart-month, .trend-chart .chart-year,
        .trend-chart .date-text, .trend-chart .month-text, .trend-chart .year-text,
        .monthly-expense-trend, .monthly-expense-trend *,
        .expense-trend-chart, .expense-trend-chart *,
        *[id*="expense-trend"], *[id*="monthly-expense"],
        *[class*="expense-trend"], *[class*="monthly-expense"],
        .trend-chart .x-axis .tick, .trend-chart .x-axis .label,
        .line-chart .x-axis .tick, .line-chart .x-axis .label
    `);
    
    trendDateElements.forEach(element => {
        element.style.color = 'rgba(255, 255, 255, 1.0)';
        element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
        element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)', 'important');
        element.style.fontWeight = '600';
        element.style.setProperty('font-weight', '600', 'important');
    });
    
    // 特殊處理：圖表按鈕保持白色
    const chartButtons = document.querySelectorAll(`
        .chart-button, .chart-control, .chart-nav, .chart-tab, .chart-filter
    `);
    
    chartButtons.forEach(element => {
        element.style.color = 'rgba(255, 255, 255, 1.0)';
        element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
        element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
        element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.8)', 'important');
    });
    
    // 處理Canvas圖表（Chart.js等）
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach(canvas => {
        // 檢查是否為圖表canvas
        if (canvas.id && (canvas.id.includes('chart') || canvas.id.includes('Chart'))) {
            // 設置canvas容器樣式
            const container = canvas.parentElement;
            if (container) {
                container.style.color = 'rgba(255, 210, 100, 1.0)';
                container.style.setProperty('color', 'rgba(255, 210, 100, 1.0)', 'important');
            }
        }
    });
    
    console.log('已修復圖表文字顏色（深黃色高對比度）');
}

// 圖表專用監聽器
const chartThemeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(fixChartTextColor, 100);
        }
    });
});

chartThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// 圖表專用DOM監聽器
const chartDomObserver = new MutationObserver(() => {
    fixChartTextColor();
});

chartDomObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 定期檢查圖表更新
setInterval(fixChartTextColor, 2500);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', fixChartTextColor);
document.addEventListener('load', fixChartTextColor);

// 監聽圖表更新事件（如果存在）
if (typeof window.updateAllCharts === 'function') {
    const originalUpdateAllCharts = window.updateAllCharts;
    window.updateAllCharts = function() {
        originalUpdateAllCharts.apply(this, arguments);
        setTimeout(fixChartTextColor, 500);
    };
}

console.log('圖表文字顏色修復腳本已載入（深黃色高對比度版本）');