// 可愛粉彩主題 - 日期顯示修復
function cutePastelDateFix() {
    try {
        // 檢查當前主題是否為可愛粉彩
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme !== 'cutePastel') return;
        
        console.log('開始可愛粉彩主題日期修復...');
        
        // 1. 修復日期輸入框
        const dateInputs = document.querySelectorAll('input[type="date"], #dateInput');
        dateInputs.forEach(input => {
            input.style.setProperty('color', '#404040', 'important');
            input.style.setProperty('background', 'rgba(255, 255, 255, 0.85)', 'important');
            input.style.setProperty('font-weight', '600', 'important');
            input.style.setProperty('border', '1px solid rgba(255, 105, 180, 0.65)', 'important');
        });
        
        // 2. 修復日期文字顯示
        const dateTexts = document.querySelectorAll('.date-text, .time-text, .datetime, .record-date, .record-card-date');
        dateTexts.forEach(text => {
            text.style.setProperty('color', '#404040', 'important');
            text.style.setProperty('font-weight', '600', 'important');
        });
        
        // 3. 修復交易項目日期
        const transactionDates = document.querySelectorAll('.transaction-item .date, .transaction-item .time, .group-header');
        transactionDates.forEach(date => {
            date.style.setProperty('color', '#404040', 'important');
            date.style.setProperty('font-weight', '600', 'important');
        });
        
        // 4. 修復圖表日期
        const chartTexts = document.querySelectorAll('svg text, .chart-date, .chart-month, .chart-year');
        chartTexts.forEach(text => {
            const content = text.textContent || '';
            // 檢查是否包含日期模式
            if (/\d{1,2}月|\d{4}年|\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}/.test(content)) {
                text.style.setProperty('fill', '#404040', 'important');
                text.style.setProperty('color', '#404040', 'important');
                text.style.setProperty('font-weight', '600', 'important');
            }
        });
        
        // 5. 修復所有可能的日期元素
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            const text = element.textContent || '';
            const className = element.className || '';
            const id = element.id || '';
            
            // 檢查是否為日期相關元素
            const isDateElement = (
                className.includes('date') || 
                id.includes('date') || 
                className.includes('month') || 
                id.includes('month') ||
                className.includes('year') || 
                id.includes('year')
            );
            
            // 檢查是否包含日期文字
            const hasDateText = /\d{1,2}月|\d{4}年|\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/.test(text);
            
            if (isDateElement || hasDateText) {
                // 跳過按鈕和鏈接
                if (element.tagName === 'BUTTON' || element.tagName === 'A') return;
                
                element.style.setProperty('color', '#404040', 'important');
                element.style.setProperty('font-weight', '600', 'important');
                
                // 如果是SVG元素
                if (element.tagName === 'text' || element.tagName === 'tspan') {
                    element.style.setProperty('fill', '#404040', 'important');
                }
            }
        });
        
        console.log('可愛粉彩主題日期修復完成');
    } catch (error) {
        console.log('可愛粉彩主題日期修復失敗:', error);
    }
}

// 監聽主題變化
const cutePastelObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            setTimeout(cutePastelDateFix, 300);
        }
    });
});

cutePastelObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// DOM變化監聽
const cutePastelDomObserver = new MutationObserver(() => {
    cutePastelDateFix();
});

cutePastelDomObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 定期檢查
setInterval(cutePastelDateFix, 2000);

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', cutePastelDateFix);
document.addEventListener('load', cutePastelDateFix);

// 監聽圖表更新
if (typeof window.updateAllCharts === 'function') {
    const originalUpdateAllCharts = window.updateAllCharts;
    window.updateAllCharts = function() {
        originalUpdateAllCharts.apply(this, arguments);
        setTimeout(cutePastelDateFix, 1000);
    };
}

console.log('可愛粉彩主題日期修復腳本已載入');
