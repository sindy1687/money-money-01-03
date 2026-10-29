// 蝴蝶忍主題 - 強制所有日期數字白色
function forceAllDateWhite() {
    // 檢查當前主題是否為蝴蝶忍
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'shinobu') return;
    
    console.log('開始強制設置日期文字為白色...');
    
    // 1. 查找所有可能的日期相關元素
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
        // 跳過腳本和樣式標籤
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
        
        const text = element.textContent || element.innerText || '';
        
        // 檢查是否包含日期模式
        const datePatterns = [
            /\d{1,2}月/,      // 1月, 12月
            /\d{4}年/,        // 2024年
            /\d{1,2}\/\d{1,2}/, // 1/15, 12/30
            /\d{4}-\d{1,2}/,   // 2024-1, 2024-12
            /\d{1,2}-\d{1,2}/,  // 1-15, 12-30
            /一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/,
            /1月|2月|3月|4月|5月|6月|7月|8月|9月|10月|11月|12月/
        ];
        
        const isDateText = datePatterns.some(pattern => pattern.test(text));
        
        // 檢查是否為日期相關的類名或ID
        const hasDateClass = element.className && (
            element.className.includes('date') ||
            element.className.includes('month') ||
            element.className.includes('year') ||
            element.className.includes('day') ||
            element.className.includes('time') ||
            element.className.includes('axis') ||
            element.className.includes('tick') ||
            element.className.includes('label')
        );
        
        const hasDateId = element.id && (
            element.id.includes('date') ||
            element.id.includes('month') ||
            element.id.includes('year') ||
            element.id.includes('day') ||
            element.id.includes('time') ||
            element.id.includes('axis') ||
            element.id.includes('tick') ||
            element.id.includes('label')
        );
        
        const hasDateData = (
            element.getAttribute('data-date') ||
            element.getAttribute('data-month') ||
            element.getAttribute('data-year') ||
            element.getAttribute('data-day') ||
            element.getAttribute('data-time') ||
            element.getAttribute('data-axis') ||
            element.getAttribute('data-label')
        );
        
        // 如果匹配任何條件，設置為白色
        if (isDateText || hasDateClass || hasDateId || hasDateData) {
            // 強制設置為白色
            element.style.color = 'rgba(255, 255, 255, 1.0)';
            element.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
            
            // 添加深色陰影
            element.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.9)';
            element.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.9)', 'important');
            
            // 設置粗體
            element.style.fontWeight = '600';
            element.style.setProperty('font-weight', '600', 'important');
            
            console.log('已設置日期文字為白色:', text.substring(0, 20));
        }
    });
    
    // 2. 專門處理圖表中的日期元素
    const chartElements = document.querySelectorAll('canvas, .chart-container, .chart-wrapper, .trend-chart, .line-chart');
    
    chartElements.forEach(chart => {
        // 查找圖表內的所有子元素
        const chartChildren = chart.querySelectorAll('*');
        chartChildren.forEach(child => {
            const childText = child.textContent || child.innerText || '';
            
            // 檢查是否包含日期
            const datePatterns = [
                /\d{1,2}月/, /\d{4}年/, /\d{1,2}\/\d{1,2}/, /\d{4}-\d{1,2}/,
                /一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/,
                /1月|2月|3月|4月|5月|6月|7月|8月|9月|10月|11月|12月/
            ];
            
            const isDateText = datePatterns.some(pattern => pattern.test(childText));
            
            if (isDateText || child.className.includes('date') || child.className.includes('month') || 
                child.className.includes('year') || child.className.includes('axis') || 
                child.className.includes('tick') || child.className.includes('label')) {
                
                child.style.color = 'rgba(255, 255, 255, 1.0)';
                child.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
                child.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.9)';
                child.style.setProperty('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.9)', 'important');
                child.style.fontWeight = '600';
                child.style.setProperty('font-weight', '600', 'important');
                
                console.log('已設置圖表日期文字為白色:', childText.substring(0, 20));
            }
        });
    });
    
    // 3. 處理SVG圖表中的文字元素
    const svgTexts = document.querySelectorAll('svg text, svg tspan');
    svgTexts.forEach(text => {
        const textContent = text.textContent || '';
        const datePatterns = [
            /\d{1,2}月/, /\d{4}年/, /\d{1,2}\/\d{1,2}/, /\d{4}-\d{1,2}/,
            /一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/,
            /1月|2月|3月|4月|5月|6月|7月|8月|9月|10月|11月|12月/
        ];
        
        const isDateText = datePatterns.some(pattern => pattern.test(textContent));
        
        if (isDateText) {
            text.style.fill = 'rgba(255, 255, 255, 1.0)';
            text.style.setProperty('fill', 'rgba(255, 255, 255, 1.0)', 'important');
            text.style.color = 'rgba(255, 255, 255, 1.0)';
            text.style.setProperty('color', 'rgba(255, 255, 255, 1.0)', 'important');
            
            console.log('已設置SVG日期文字為白色:', textContent);
        }
    });
    
    console.log('強制設置日期文字為白色完成');
}

// 強力監聽器
const forceDateObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(forceAllDateWhite, 200);
        }
    });
});

forceDateObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// DOM變化監聽
const forceDomObserver = new MutationObserver(() => {
    forceAllDateWhite();
});

forceDomObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 更頻繁的檢查
setInterval(forceAllDateWhite, 1500);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', forceAllDateWhite);
document.addEventListener('load', forceAllDateWhite);

// 監聽圖表更新
if (typeof window.updateAllCharts === 'function') {
    const originalUpdateAllCharts = window.updateAllCharts;
    window.updateAllCharts = function() {
        originalUpdateAllCharts.apply(this, arguments);
        setTimeout(forceAllDateWhite, 800);
    };
}

console.log('強制日期白色腳本已載入');
