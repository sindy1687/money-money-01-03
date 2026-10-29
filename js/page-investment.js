// 投資頁面與圖表（由 script.js 拆出）

// 圖表實例變數（全域）
let stockTradeChartSellInstance = null;
let stockTradeChartDivInstance = null;
let stockPnlChartInstance = null;
let stockAllocationChartInstance = null;

// 主題調色板
function getThemeChartPalette() {
    const root = document.documentElement;
    const getVar = (name, fallback) => {
        const value = getComputedStyle(root).getPropertyValue(name).trim();
        return value || fallback;
    };

    return {
        primary: getVar('--color-primary', '#4a90e2'),
        primaryLight: getVar('--color-primary-light', '#7bb3f0'),
        primaryLighter: getVar('--color-primary-lighter', '#5da3ed'),
        primaryDark: getVar('--color-primary-dark', '#2e7bd6'),
        accent: getVar('--color-secondary', '#7c3aed'),
        background: getVar('--bg-card', 'rgba(255,255,255,0.92)'),
        border: getVar('--border-light', '#e5e7eb'),
        textPrimary: getVar('--text-primary', '#1f2937'),
        textSecondary: getVar('--text-secondary', '#6b7280'),
        success: getVar('--color-success', '#22c55e') || '#22c55e',
        danger: getVar('--color-danger', '#ef4444') || '#ef4444'
    };
}

// 股票交易分析（買入 / 賣出 / 股利）
function updateStockTradeChart() {
    const palette = getThemeChartPalette();
    const sellCanvas = document.getElementById('stockTradeChartSell');
    const divCanvas = document.getElementById('stockTradeChartDiv');
    if (!sellCanvas || !divCanvas) return;
    const sellSubtitle = sellCanvas.previousElementSibling; // 「賣出（收入）」文字
    const divSubtitle = divCanvas.previousElementSibling;  // 「股利（收入）」文字
    const insightEl = document.getElementById('stockTradeInsight');
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');

    // 取近12個月
    const monthly = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { buy: 0, sell: 0, dividend: 0 };
    }

    records.forEach(r => {
        const date = new Date(r.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) return;
        if (r.type === 'buy') {
            const fee = r.fee || 0;
            monthly[key].buy -= ((r.price || 0) * (r.shares || 0) + fee);
        } else if (r.type === 'sell') {
            const fee = r.fee || 0;
            const tax = r.tax || 0;
            monthly[key].sell += ((r.price || 0) * (r.shares || 0)) - fee - tax;
        } else if (r.type === 'dividend') {
            monthly[key].dividend += (r.amount || 0);
        }
    });

    const labels = Object.keys(monthly);
    const buyData = labels.map(k => monthly[k].buy);
    const sellData = labels.map(k => monthly[k].sell);
    const divData = labels.map(k => monthly[k].dividend);

    const destroyChart = (instanceSetter) => {
        if (instanceSetter && instanceSetter.chart) {
            instanceSetter.chart.destroy();
            instanceSetter.chart = null;
        }
    };

    const divHasData = divData.some(v => v !== 0);
    const sellHasData = sellData.some(v => v !== 0);
    const buyHasData = buyData.some(v => v !== 0);

    // 如果全為 0，清空並提示
    if (![buyHasData, sellHasData, divHasData].some(Boolean)) {
        destroyChart(stockTradeChartSellInstance);
        destroyChart(stockTradeChartDivInstance);
        if (sellSubtitle) sellSubtitle.style.display = 'none';
        sellCanvas.style.display = 'none';
        if (divSubtitle) divSubtitle.style.display = 'none';
        divCanvas.style.display = 'none';
        if (insightEl) insightEl.textContent = '近12月尚無交易';
        return;
    }

    // 清理舊圖表
    destroyChart(stockTradeChartSellInstance);
    destroyChart(stockTradeChartDivInstance);

    // 顯示/隱藏賣出圖表
    if (sellHasData) {
        sellCanvas.style.display = '';
        if (sellSubtitle) sellSubtitle.style.display = '';
    } else {
        destroyChart(stockTradeChartSellInstance);
        sellCanvas.style.display = 'none';
        if (sellSubtitle) sellSubtitle.style.display = 'none';
    }

    // 顯示/隱藏股利圖表
    if (divHasData) {
        divCanvas.style.display = '';
        if (divSubtitle) divSubtitle.style.display = '';
    } else {
        destroyChart(stockTradeChartDivInstance);
        divCanvas.style.display = 'none';
        if (divSubtitle) divSubtitle.style.display = 'none';
    }

    const primary = palette.primary;
    const success = palette.success;
    const danger = palette.danger;
    const primaryLight = palette.primaryLight;
    const borderLight = palette.border;
    const textSecondary = palette.textSecondary;

    const commonOptions = {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return `NT$${ctx.parsed.y.toLocaleString('zh-TW')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return 'NT$' + value.toLocaleString('zh-TW');
                        },
                        color: textSecondary
                    },
                    grid: { color: borderLight }
                },
                x: {
                    ticks: { color: textSecondary, maxRotation: 45 },
                    grid: { display: false }
                }
            }
        }
    };

    if (sellHasData) {
        stockTradeChartSellInstance = {
            chart: new Chart(sellCanvas, {
                ...commonOptions,
                data: {
                    labels,
                    datasets: [{
                        label: '💜 賣出（收入）',
                        data: sellData,
                        backgroundColor: primary,
                        borderColor: primary,
                        borderWidth: 1,
                        borderRadius: 6,
                        barThickness: Math.max(8, Math.min(14, 200 / labels.length)),
                    }]
                }
            })
        };
    }

    if (divHasData) {
        stockTradeChartDivInstance = {
            chart: new Chart(divCanvas, {
                ...commonOptions,
                data: {
                    labels,
                    datasets: [{
                        label: '💰 股利（收入）',
                        data: divData,
                        backgroundColor: primaryLight || success,
                        borderColor: primaryLight || success,
                        borderWidth: 1,
                        borderRadius: 6,
                        barThickness: Math.max(8, Math.min(14, 200 / labels.length)),
                    }]
                }
            })
        };
    }

    if (insightEl) {
        const totalBuy = buyData.reduce((a, b) => a + b, 0);
        const totalSell = sellData.reduce((a, b) => a + b, 0);
        const totalDiv = divData.reduce((a, b) => a + b, 0);
        const net = totalBuy + totalSell + totalDiv;
        insightEl.textContent = `近12月淨流 ${net >= 0 ? '入' : '出'} NT$${Math.abs(net).toLocaleString('zh-TW')}（買入：NT$${Math.abs(totalBuy).toLocaleString('zh-TW')}、賣出：NT$${totalSell.toLocaleString('zh-TW')}、股利：NT$${totalDiv.toLocaleString('zh-TW')}）`;
    }
}

// 股票持倉盈虧
function updateStockPnlChart() {
    const palette = getThemeChartPalette();
    const canvas = document.getElementById('stockPnlChart');
    if (!canvas) return;
    const insightEl = document.getElementById('stockPnlInsight');
    const portfolio = getPortfolio();

    if (!portfolio || portfolio.length === 0) {
        if (stockPnlChartInstance) {
            stockPnlChartInstance.destroy();
            stockPnlChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '尚無持股';
        return;
    }

    const items = portfolio.map(stock => {
        const price = getStockCurrentPrice(stock.stockCode) || stock.avgCost || 0;
        const shares = stock.shares || 0;
        const cost = (stock.avgCost || 0) * shares;
        const value = price * shares;
        const pnl = value - cost;
        return {
            label: stock.stockName || stock.stockCode,
            pnl,
            cost,
            value
        };
    });

    // 防呆：若持股過多，僅顯示前 12 檔（按絕對盈虧排序），其餘合併為「其他」
    items.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
    const MAX_ITEMS = 12;
    const mainItems = items.slice(0, MAX_ITEMS);
    const rest = items.slice(MAX_ITEMS);
    if (rest.length > 0) {
        const restPnl = rest.reduce((s, i) => s + i.pnl, 0);
        const restCost = rest.reduce((s, i) => s + i.cost, 0);
        const restValue = rest.reduce((s, i) => s + i.value, 0);
        mainItems.push({ label: `其他（${rest.length} 檔）`, pnl: restPnl, cost: restCost, value: restValue });
    }

    const labels = mainItems.map(i => i.label);
    const gains = mainItems.map(i => i.pnl);
    const costs = mainItems.map(i => i.cost);
    const totalCost = mainItems.reduce((s, i) => s + i.cost, 0);
    const totalValue = mainItems.reduce((s, i) => s + i.value, 0);

    if (gains.every(g => g === 0)) {
        if (stockPnlChartInstance) {
            stockPnlChartInstance.destroy();
            stockPnlChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '尚無盈虧資料';
        return;
    }

    if (stockPnlChartInstance) {
        stockPnlChartInstance.destroy();
    }

    const primary = palette.primary;
    const danger = palette.danger;
    const borderLight = palette.border;
    const textSecondary = palette.textSecondary;

    const colors = gains.map(g => g >= 0 ? primary : danger);

    stockPnlChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: '盈虧',
                data: gains,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 8,
                barThickness: Math.max(10, Math.min(16, 240 / labels.length))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return `NT$${ctx.parsed.y.toLocaleString('zh-TW')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return 'NT$' + value.toLocaleString('zh-TW');
                        },
                        color: textSecondary
                    },
                    grid: { color: borderLight }
                },
                x: {
                    ticks: { color: textSecondary, maxRotation: 45 },
                    grid: { display: false }
                }
            }
        }
    });

    if (insightEl) {
        const bestIdx = gains.indexOf(Math.max(...gains));
        const worstIdx = gains.indexOf(Math.min(...gains));
        const totalPnl = totalValue - totalCost;
        insightEl.textContent = `總盈虧 NT$${totalPnl.toLocaleString('zh-TW')}，最佳 ${labels[bestIdx]}，最弱 ${labels[worstIdx]}`;
    }
}

// 股票持倉分佈（以市值計算權重）
function updateStockAllocationChart() {
    const palette = getThemeChartPalette();
    const canvas = document.getElementById('stockAllocationChart');
    if (!canvas) return;

    const insightEl = document.getElementById('stockAllocationInsight');
    const portfolio = getPortfolio();

    if (!portfolio || portfolio.length === 0) {
        if (stockAllocationChartInstance) {
            stockAllocationChartInstance.destroy();
            stockAllocationChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '尚無持股';
        return;
    }

    const labels = [];
    const values = [];
    let totalValue = 0;
    portfolio.forEach(stock => {
        const price = getStockCurrentPrice(stock.stockCode) || stock.avgCost || 0;
        const value = price * (stock.shares || 0);
        labels.push(stock.stockName || stock.stockCode);
        values.push(value);
        totalValue += value;
    });

    if (values.every(v => v === 0)) {
        if (stockAllocationChartInstance) {
            stockAllocationChartInstance.destroy();
            stockAllocationChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '尚無價格資料';
        return;
    }

    const colors = generateColors(labels.length, palette);

    if (stockAllocationChartInstance) {
        stockAllocationChartInstance.destroy();
    }

    stockAllocationChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors.backgrounds,
                borderColor: colors.borders,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: palette.textSecondary,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const value = ctx.parsed;
                            const percentage = ((value / totalValue) * 100).toFixed(1);
                            return `${ctx.label}: NT$${value.toLocaleString('zh-TW')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    if (insightEl) {
        const maxIdx = values.indexOf(Math.max(...values));
        const maxStock = labels[maxIdx];
        const maxPct = ((values[maxIdx] / totalValue) * 100).toFixed(1);
        insightEl.textContent = `最大持股 ${maxStock}，佔比 ${maxPct}%`;
    }
}

// 生成圖表顏色
function generateColors(count, palette) {
    const baseColors = [
        palette.primary,
        palette.accent,
        palette.success,
        palette.danger,
        '#FF9800',
        '#9C27B0',
        '#00BCD4',
        '#8BC34A',
        '#FFC107',
        '#795548',
        '#607D8B',
        '#E91E63'
    ];

    const backgrounds = [];
    const borders = [];

    for (let i = 0; i < count; i++) {
        const color = baseColors[i % baseColors.length];
        backgrounds.push(color + '99'); // 添加透明度
        borders.push(color);
    }

    return { backgrounds, borders };
}

// 獲取投資組合
function getPortfolio() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const portfolio = {};

    records.forEach(record => {
        if (record.type === 'buy') {
            const code = record.stockCode;
            const name = record.stockName || code;
            const shares = record.shares || 0;
            const price = record.price || 0;
            const fee = record.fee || 0;
            const totalCost = price * shares + fee;

            if (!portfolio[code]) {
                portfolio[code] = {
                    stockCode: code,
                    stockName: name,
                    shares: 0,
                    totalCost: 0,
                    avgCost: 0
                };
            }

            portfolio[code].shares += shares;
            portfolio[code].totalCost += totalCost;
            portfolio[code].avgCost = portfolio[code].totalCost / portfolio[code].shares;
        } else if (record.type === 'sell') {
            const code = record.stockCode;
            if (portfolio[code]) {
                const shares = record.shares || 0;
                portfolio[code].shares -= shares;
                if (portfolio[code].shares <= 0) {
                    delete portfolio[code];
                }
            }
        }
    });

    return Object.values(portfolio);
}

// 獲取股票當前價格
function getStockCurrentPrice(stockCode) {
    const prices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    return prices[stockCode] || null;
}

// 更新投資圖表（統一入口）
function updateInvestmentCharts() {
    updateStockTradeChart();
    updateStockPnlChart();
    updateStockAllocationChart();
}

// 初始化投資頁面
function initInvestmentPage() {
    // 等待 Chart.js 載入
    if (typeof Chart === 'undefined') {
        setTimeout(initInvestmentPage, 100);
        return;
    }

    updateInvestmentCharts();

    // 監聽投資記錄變化
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);
        if (key === 'investmentRecords' || key === 'stockCurrentPrices') {
            setTimeout(updateInvestmentCharts, 100);
        }
    };
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInvestmentPage);
} else {
    initInvestmentPage();
}
