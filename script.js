// ========== 音效功能 ==========

// 音頻文件緩存，避免重複創建
let clickAudio = null;
let incomeAudio = null;
let audioFailed = { click: false, income: false }; // 記錄失敗狀態，避免重複嘗試

if (typeof window !== 'undefined' && typeof window.applyAutoWidth !== 'function') {
    window.applyAutoWidth = function () {};
}

function expandInputSection() {
    const inputSection = document.getElementById('inputSection');
    if (inputSection && inputSection.classList.contains('collapsed')) {
        inputSection.classList.remove('collapsed');
        const collapseBtn = document.getElementById('collapseBtn');
        const collapseIcon = collapseBtn?.querySelector('.collapse-icon');
        if (collapseIcon) {
            collapseIcon.textContent = '▼';
        }
    }
}

// 股票交易分析（買入 / 賣出 / 股利）
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
            cutout: '52%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const val = context.parsed || 0;
                            const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0';
                            return `${label}: NT$${val.toLocaleString('zh-TW')}（${pct}%）`;
                        }
                    }
                }
            }
        }
    });

    if (insightEl) {
        const maxIdx = values.indexOf(Math.max(...values));
        const topLabel = labels[maxIdx];
        const topVal = values[maxIdx] || 0;
        const pct = totalValue > 0 ? ((topVal / totalValue) * 100).toFixed(1) : '0';
        insightEl.textContent = `最大持倉「${topLabel}」佔約 ${pct}%（NT$${topVal.toLocaleString('zh-TW')}）`;
    }
}


async function applyBackupDataPayload(data) {
    // 還原資料（包含所有資料）
    if (data.accountingRecords) {
        localStorage.setItem('accountingRecords', JSON.stringify(data.accountingRecords));
    }
    if (data.categoryBudgets) {
        localStorage.setItem('categoryBudgets', JSON.stringify(data.categoryBudgets));
    }
    if (data.categoryEnabledState) {
        localStorage.setItem('categoryEnabledState', JSON.stringify(data.categoryEnabledState));
    }
    if (data.dailyBudgetTracking) {
        localStorage.setItem('dailyBudgetTracking', JSON.stringify(data.dailyBudgetTracking));
    }
    if (data.customCategories) {
        localStorage.setItem('customCategories', JSON.stringify(data.customCategories));
    }
    if (data.categoryCustomIcons) {
        // 壓縮所有導入的圖標
        console.log('開始壓縮導入的圖標...');
        const compressedIcons = await compressAllIcons(data.categoryCustomIcons);
        const saved = safeSetItem('categoryCustomIcons', compressedIcons);
        if (!saved) {
            alert('還原失敗：圖標數據太大，無法保存。');
            return;
        }
        console.log('✓ 圖標已壓縮並保存');
    }
    if (data.investmentRecords) {
        localStorage.setItem('investmentRecords', JSON.stringify(data.investmentRecords));
    }
    if (data.dcaPlans) {
        localStorage.setItem('dcaPlans', JSON.stringify(data.dcaPlans));
    }
    if (data.installmentRules) {
        localStorage.setItem('installmentRules', JSON.stringify(data.installmentRules));
    }
    if (data.stockCurrentPrices) {
        localStorage.setItem('stockCurrentPrices', JSON.stringify(data.stockCurrentPrices));
    }
    if (data.accounts) {
        localStorage.setItem('accounts', JSON.stringify(data.accounts));
    }
    if (data.imageEmojis) {
        localStorage.setItem('imageEmojis', JSON.stringify(data.imageEmojis));
    }
    if (data.members) {
        localStorage.setItem('members', JSON.stringify(data.members));
    }
    if (data.theme) {
        localStorage.setItem('theme', data.theme);
    }
    if (data.fontSize) {
        localStorage.setItem('fontSize', data.fontSize);
    }
    if (data.customTheme) {
        localStorage.setItem('customTheme', JSON.stringify(data.customTheme));
    }

    alert('資料還原成功！\n頁面將重新載入以顯示最新資料。');
    location.reload();
}

// 數字格式化（含千分位，預設兩位小數）
function formatNumber(value, decimals = 2) {
    if (value === '' || value == null || isNaN(Number(value))) return '--';
    const num = Number(value);
    const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    try {
        return num.toLocaleString('zh-TW', opts);
    } catch (_) {
        return num.toFixed(decimals);
    }
}

// 全域常數
const ENABLE_MULTIPLE_PROXY = true;
const REBALANCE_LOG_KEY = 'rebalanceLogs';
const SCHEDULED_BUY_STORAGE_KEY = 'scheduledBuyOrders';

function showAppModal({ title, bodyEl, footerEl, maxWidth = 520 }) {
    let close;
    const promise = new Promise((resolve) => {
        const root = document.createElement('div');
        root.className = 'app-modal-root';

        const overlay = document.createElement('div');
        overlay.className = 'app-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'app-modal';
        modal.style.maxWidth = `${maxWidth}px`;

        const header = document.createElement('div');
        header.className = 'app-modal-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'app-modal-title';
        titleEl.textContent = title || '';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'app-modal-close';
        closeBtn.textContent = '✕';

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'app-modal-body';
        if (bodyEl) body.appendChild(bodyEl);

        const footer = document.createElement('div');
        footer.className = 'app-modal-footer';
        if (footerEl) footer.appendChild(footerEl);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        close = (v) => {
            try { document.body.removeChild(root); } catch (_) {}
            resolve(v);
        };

        overlay.addEventListener('click', () => close(null));
        closeBtn.addEventListener('click', () => close(null));

        root.appendChild(overlay);
        root.appendChild(modal);
        document.body.appendChild(root);

        setTimeout(() => {
            try { closeBtn.focus(); } catch (_) {}
        }, 0);
    });

    promise.close = (v) => {
        if (typeof close === 'function') close(v);
    };
    return promise;
}

function showAppAlert({ title, message, okText = '確定' }) {
    const pre = document.createElement('pre');
    pre.className = 'app-modal-pre';
    pre.textContent = message || '';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'app-modal-btn app-modal-btn--primary';
    okBtn.textContent = okText;

    const footer = document.createElement('div');
    footer.className = 'app-modal-footer-inner';
    footer.appendChild(okBtn);

    const modalPromise = showAppModal({
        title,
        bodyEl: pre,
        footerEl: footer,
        maxWidth: 640
    });
    okBtn.addEventListener('click', () => modalPromise.close(true));
    return modalPromise.then(() => true);
}

function showAssetAllocationModal() {
    const settings = getAssetAllocationSettings();

    const wrap = document.createElement('div');
    wrap.className = 'app-modal-form';

    const mkLabel = (t) => {
        const el = document.createElement('div');
        el.className = 'app-modal-label';
        el.textContent = t;
        return el;
    };

    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 1fr';
    row.style.gap = '10px';

    const stockInput = document.createElement('input');
    stockInput.type = 'number';
    stockInput.inputMode = 'numeric';
    stockInput.step = '1';
    stockInput.min = '0';
    stockInput.max = '100';
    stockInput.className = 'app-modal-input';
    stockInput.value = String(settings.targetStockRatio ?? 80);

    const bondInput = document.createElement('input');
    bondInput.type = 'number';
    bondInput.inputMode = 'numeric';
    bondInput.step = '1';
    bondInput.min = '0';
    bondInput.max = '100';
    bondInput.className = 'app-modal-input';
    bondInput.value = String(settings.targetBondRatio ?? 20);

    row.appendChild(stockInput);
    row.appendChild(bondInput);

    wrap.appendChild(mkLabel('目標股債比（%）：股 / 債'));
    wrap.appendChild(row);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'app-modal-btn';
    cancelBtn.textContent = '取消';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'app-modal-btn app-modal-btn--primary';
    okBtn.textContent = '儲存';

    const footer = document.createElement('div');
    footer.className = 'app-modal-footer-inner';
    footer.appendChild(cancelBtn);
    footer.appendChild(okBtn);

    const modalPromise = showAppModal({
        title: '股債配置',
        bodyEl: wrap,
        footerEl: footer,
        maxWidth: 560
    });

    cancelBtn.addEventListener('click', () => modalPromise.close(false));
    okBtn.addEventListener('click', () => {
        const stock = Math.max(0, Math.min(100, parseFloat(stockInput.value) || 0));
        const bond = Math.max(0, Math.min(100, parseFloat(bondInput.value) || 0));
        saveAssetAllocationSettings({
            ...settings,
            targetStockRatio: stock,
            targetBondRatio: bond
        });
        try {
            fillAllocationInputsFromSettings(getAssetAllocationSettings());
            updateAssetAllocationStatusText();
        } catch (_) {}
        modalPromise.close(true);
    });
}

function showAnnualRebalanceModal() {
    const settings = getAssetAllocationSettings();

    const wrap = document.createElement('div');
    wrap.className = 'app-modal-form';

    const mkLabel = (t) => {
        const el = document.createElement('div');
        el.className = 'app-modal-label';
        el.textContent = t;
        return el;
    };

    const currentRatioEl = document.createElement('div');
    currentRatioEl.className = 'app-modal-label';
    currentRatioEl.style.marginTop = '-4px';
    currentRatioEl.style.fontSize = '12px';
    currentRatioEl.style.fontWeight = '700';
    currentRatioEl.style.opacity = '0.85';
    try {
        const values = computeStockBondMarketValues();
        const T = values.totalValue;
        if (T && T > 0) {
            const stockPct = values.stockValue / T;
            const bondPct = values.bondValue / T;
            currentRatioEl.textContent = `目前股債比：股 ${formatPct(stockPct)} / 債 ${formatPct(bondPct)}`;
        } else {
            currentRatioEl.textContent = '目前股債比：尚無市值資料';
        }
    } catch (_) {
        currentRatioEl.textContent = '目前股債比：--';
    }

    const twoCol = document.createElement('div');
    twoCol.style.display = 'grid';
    twoCol.style.gridTemplateColumns = '1fr auto 1fr';
    twoCol.style.alignItems = 'center';
    twoCol.style.gap = '10px';

    const ratioRow = document.createElement('div');
    ratioRow.style.display = 'grid';
    ratioRow.style.gridTemplateColumns = '1fr auto 1fr';
    ratioRow.style.alignItems = 'center';
    ratioRow.style.gap = '10px';

    const targetStockRatio = document.createElement('input');
    targetStockRatio.type = 'number';
    targetStockRatio.step = '1';
    targetStockRatio.min = '0';
    targetStockRatio.max = '100';
    targetStockRatio.className = 'app-modal-input';
    targetStockRatio.value = String(settings.targetStockRatio ?? 80);

    const ratioSep = document.createElement('div');
    ratioSep.style.opacity = '0.65';
    ratioSep.style.fontWeight = '800';
    ratioSep.textContent = ':';

    const targetBondRatio = document.createElement('input');
    targetBondRatio.type = 'number';
    targetBondRatio.step = '1';
    targetBondRatio.min = '0';
    targetBondRatio.max = '100';
    targetBondRatio.className = 'app-modal-input';
    targetBondRatio.value = String(settings.targetBondRatio ?? 20);

    const monthInput = document.createElement('input');
    monthInput.type = 'number';
    monthInput.step = '1';
    monthInput.min = '1';
    monthInput.max = '12';
    monthInput.className = 'app-modal-input';
    monthInput.value = String(settings.rebalanceMonth ?? 1);

    const dayInput = document.createElement('input');
    dayInput.type = 'number';
    dayInput.step = '1';
    dayInput.min = '1';
    dayInput.max = '28';
    dayInput.className = 'app-modal-input';
    dayInput.value = String(settings.rebalanceDay ?? 1);

    const dateSep = document.createElement('div');
    dateSep.style.opacity = '0.65';
    dateSep.style.fontWeight = '900';
    dateSep.textContent = '/';

    twoCol.appendChild(monthInput);
    twoCol.appendChild(dateSep);
    twoCol.appendChild(dayInput);

    const stockTicker = document.createElement('input');
    stockTicker.type = 'text';
    stockTicker.className = 'app-modal-input';
    stockTicker.value = String(settings.rebalanceStockTicker ?? '0050');

    const bondTicker = document.createElement('input');
    bondTicker.type = 'text';
    bondTicker.className = 'app-modal-input';
    bondTicker.value = String(settings.rebalanceBondTicker ?? '00751B');

    const horizon = document.createElement('input');
    horizon.type = 'number';
    horizon.step = '1';
    horizon.min = '1';
    horizon.max = '60';
    horizon.className = 'app-modal-input';
    horizon.value = String(settings.rebalanceHorizonMonths ?? 12);

    const budget = document.createElement('input');
    budget.type = 'number';
    budget.step = '1';
    budget.min = '0';
    budget.className = 'app-modal-input';
    budget.value = '';
    budget.placeholder = '例如 50000';

    const adviceBox = document.createElement('pre');
    adviceBox.className = 'app-modal-pre';
    adviceBox.style.marginTop = '10px';
    adviceBox.style.whiteSpace = 'pre-wrap';
    adviceBox.textContent = '';

    const persistFromModal = () => {
        const stock = Math.max(0, Math.min(100, parseFloat(targetStockRatio.value) || 0));
        const bond = Math.max(0, Math.min(100, parseFloat(targetBondRatio.value) || 0));
        const month = Math.max(1, Math.min(12, parseInt(monthInput.value, 10) || 1));
        const day = Math.max(1, Math.min(28, parseInt(dayInput.value, 10) || 1));
        const cleanedStock = String(stockTicker.value || '').trim() || settings.rebalanceStockTicker;
        const cleanedBond = String(bondTicker.value || '').trim() || settings.rebalanceBondTicker;
        const cleanedHorizon = Math.max(1, Math.min(60, parseInt(horizon.value, 10) || 12));

        const next = {
            ...settings,
            targetStockRatio: stock,
            targetBondRatio: bond,
            rebalanceMonth: month,
            rebalanceDay: day,
            rebalanceStockTicker: cleanedStock,
            rebalanceBondTicker: cleanedBond,
            rebalanceHorizonMonths: cleanedHorizon
        };
        saveAssetAllocationSettings(next);
        return {
            settings: next,
            budget: Math.max(0, parseFloat(budget.value) || 0)
        };
    };

    ratioRow.appendChild(targetStockRatio);
    ratioRow.appendChild(ratioSep);
    ratioRow.appendChild(targetBondRatio);

    wrap.appendChild(mkLabel('目標股債比（%）'));
    wrap.appendChild(currentRatioEl);
    wrap.appendChild(ratioRow);

    wrap.appendChild(mkLabel('每年檢視日期（月 / 日）'));
    wrap.appendChild(twoCol);
    wrap.appendChild(mkLabel('股票加碼標的（代碼）'));
    wrap.appendChild(stockTicker);
    wrap.appendChild(mkLabel('債券加碼標的（代碼）'));
    wrap.appendChild(bondTicker);
    wrap.appendChild(mkLabel('本次加碼預算（NT$）'));
    wrap.appendChild(budget);

    wrap.appendChild(mkLabel('用幾個月拉回目標'));
    wrap.appendChild(horizon);
    wrap.appendChild(adviceBox);

    const suggestBtn = document.createElement('button');
    suggestBtn.type = 'button';
    suggestBtn.className = 'app-modal-btn app-modal-btn--primary';
    suggestBtn.textContent = '生成建議';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'app-modal-btn';
    applyBtn.textContent = '套用到定期定額';

    const footer = document.createElement('div');
    footer.className = 'app-modal-footer-inner app-modal-footer-inner--grid';
    footer.appendChild(suggestBtn);
    footer.appendChild(applyBtn);

    const modalPromise = showAppModal({
        title: '年度再平衡',
        bodyEl: wrap,
        footerEl: footer,
        maxWidth: 560
    });

    suggestBtn.addEventListener('click', () => {
        const persisted = persistFromModal();
        const nextSettings = persisted.settings;
        const budgetValue = persisted.budget;
        const advice = calculateRebalanceAdvice({
            budget: budgetValue,
            horizonMonths: nextSettings.rebalanceHorizonMonths,
            targetStockRatio: nextSettings.targetStockRatio,
            targetBondRatio: nextSettings.targetBondRatio
        });

        const stockTicker = nextSettings.rebalanceStockTicker;
        const bondTicker = nextSettings.rebalanceBondTicker;

        const lumpStockLine = advice.lumpSum.total > 0
            ? buildBuySuggestionLine({ label: '買股', ticker: stockTicker, amount: advice.lumpSum.stock })
            : '未輸入預算';
        const lumpBondLine = advice.lumpSum.total > 0
            ? buildBuySuggestionLine({ label: '買債', ticker: bondTicker, amount: advice.lumpSum.bond })
            : '未輸入預算';

        const monthlyStockLine = advice.dca.monthlyTotal > 0
            ? buildBuySuggestionLine({ label: '每月買股', ticker: stockTicker, amount: advice.dca.monthlyStock })
            : '目前沒有啟用的定期定額';
        const monthlyBondLine = advice.dca.monthlyTotal > 0
            ? buildBuySuggestionLine({ label: '每月買債', ticker: bondTicker, amount: advice.dca.monthlyBond })
            : '目前沒有啟用的定期定額';

        adviceBox.textContent = [
            `目前市值：股票 ${formatNtd(advice.values.stockValue)}／債券 ${formatNtd(advice.values.bondValue)}／合計 ${formatNtd(advice.values.totalValue)}`,
            `目前比例：股 ${formatPct(advice.ratios.currentStockPct)}／債 ${formatPct(advice.ratios.currentBondPct)}`,
            `目標比例：股 ${formatPct(advice.ratios.stockPct)}／債 ${formatPct(advice.ratios.bondPct)}`,
            '',
            `一次性加碼（只買不賣；預算 ${formatNtd(advice.lumpSum.total)}）：`,
            pickDominantAction(advice.lumpSum),
            lumpStockLine,
            lumpBondLine,
            `買完後比例：股 ${formatPct(advice.projections.afterLump.stockPct)}／債 ${formatPct(advice.projections.afterLump.bondPct)}`,
            '',
            `定期定額建議（${advice.dca.months} 個月拉回；以目前啟用總額 ${formatNtd(advice.dca.monthlyTotal)}/月）：`,
            monthlyStockLine,
            monthlyBondLine,
            `跑完 ${advice.dca.months} 個月後比例：股 ${formatPct(advice.projections.afterHorizon.stockPct)}／債 ${formatPct(advice.projections.afterHorizon.bondPct)}`
        ].join('\n');
    });

    applyBtn.addEventListener('click', () => {
        const persisted = persistFromModal();
        const nextSettings = persisted.settings;
        const budgetValue = persisted.budget;

        const advice = calculateRebalanceAdvice({
            budget: budgetValue,
            horizonMonths: nextSettings.rebalanceHorizonMonths,
            targetStockRatio: nextSettings.targetStockRatio,
            targetBondRatio: nextSettings.targetBondRatio
        });

        applyRebalanceToDcaPlans({
            monthlyStock: advice.dca.monthlyStock,
            monthlyBond: advice.dca.monthlyBond,
            stockTicker: nextSettings.rebalanceStockTicker,
            bondTicker: nextSettings.rebalanceBondTicker
        });

        modalPromise.close(true);
    });

    modalPromise.then(() => {
        try {
            fillAllocationInputsFromSettings(getAssetAllocationSettings());
            updateAssetAllocationStatusText();
        } catch (_) {}
    });
}

function showAppPromptNumber({ title, label, defaultValue = 0, placeholder = '0', okText = '確定', cancelText = '取消' }) {
    const wrap = document.createElement('div');
    wrap.className = 'app-modal-form';

    const lab = document.createElement('div');
    lab.className = 'app-modal-label';
    lab.textContent = label || '';

    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.step = '1';
    input.min = '0';
    input.placeholder = placeholder;
    input.className = 'app-modal-input';
    input.value = (defaultValue != null && defaultValue !== '') ? String(defaultValue) : '';

    wrap.appendChild(lab);
    wrap.appendChild(input);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'app-modal-btn';
    cancelBtn.textContent = cancelText;

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'app-modal-btn app-modal-btn--primary';
    okBtn.textContent = okText;

    const footer = document.createElement('div');
    footer.className = 'app-modal-footer-inner';
    footer.appendChild(cancelBtn);
    footer.appendChild(okBtn);

    const modalPromise = showAppModal({ title, bodyEl: wrap, footerEl: footer, maxWidth: 520 });

    const submit = () => {
        const v = parseFloat(String(input.value || '').replace(/,/g, ''));
        modalPromise.close(!isNaN(v) && v >= 0 ? v : null);
    };

    cancelBtn.addEventListener('click', () => modalPromise.close(null));
    okBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submit();
        }
    });

    setTimeout(() => {
        try {
            input.focus();
            if (input.value) input.select();
        } catch (_) {}
    }, 0);

    return modalPromise;
}

// 預設雲端備份服務（若使用者尚未設定 Sheet 網址）
if (!localStorage.getItem('googleSheetUploadUrl')) {
    localStorage.setItem('googleSheetUploadUrl', 'https://script.google.com/macros/s/AKfycbw_0TfMTZvO3_qxXTFS5LxqiNEB6k5R3lZhlr9L6fZaiVl3KN2VDD4aX7m-QiMMhBm1/exec');
}

const DEFAULT_CATEGORY_IMAGES = {
    '飲食': './image/13.png',
    '外食 / 飲料': './image/14.png',
    '交通': './image/15.png',
    '住房物業': './image/16.png',
    '水電瓦斯': './image/17.png',
    '網路 / 電信': './image/18.png',
    '購物': './image/19.png',
    '投資理財': './image/19.png',
    '醫療': './image/20.png',
    '薪資': './image/21.png',
    '投資收益': './image/21.png',
    '轉帳': './image/6.png',
    '銀行轉帳': './image/7.png',
    '跨行轉帳': './image/8.png',
    '電子支付轉帳': './image/9.png',
    '帳戶間轉帳': './image/10.png',
    '現金轉帳': './image/11.png',
    '信用卡轉帳': './image/12.png'
};

function getDefaultCategoryImage(categoryName) {
    return DEFAULT_CATEGORY_IMAGES[categoryName] || null;
}

function firstGrapheme(str) {
    if (!str) return '';
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const it = seg.segment(str)[Symbol.iterator]();
        const first = it.next().value;
        return first ? first.segment : '';
    }
    return str.trim().slice(0, 2);
}

function formatMonthKey(dateObj) {
    const d = new Date(dateObj);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(monthKey) {
    if (!monthKey || typeof monthKey !== 'string') return null;
    const m = monthKey.match(/^(\d{4})-(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1;
    const d = new Date(year, monthIndex, 1);
    return Number.isNaN(d.getTime()) ? null : d;
}

function getSelectedMonthKey() {
    const stored = localStorage.getItem('selectedMonthKey');
    if (stored && parseMonthKey(stored)) return stored;
    return formatMonthKey(new Date());
}

function setSelectedMonthKey(monthKey) {
    if (!parseMonthKey(monthKey)) return;
    localStorage.setItem('selectedMonthKey', monthKey);
    window.selectedMonthKey = monthKey;
}

function addMonthsToKey(monthKey, delta) {
    const base = parseMonthKey(monthKey) || new Date();
    const d = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    return formatMonthKey(d);
}

function getMonthRangeByKey(monthKey) {
    const base = parseMonthKey(monthKey);
    if (!base) return null;
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
        startDateStr: toISO(start),
        endDateStr: toISO(end)
    };
}

function renderSelectedMonthText() {
    const monthKey = getSelectedMonthKey();
    const summaryMonth = document.getElementById('summaryMonth');
    if (summaryMonth) summaryMonth.textContent = monthKey;
    const chartMonthText = document.getElementById('chartMonthText');
    if (chartMonthText) chartMonthText.textContent = monthKey;
}

function applySelectedMonthToLedgerDateFilters(force = false) {
    if (!force) return;

    const range = getMonthRangeByKey(getSelectedMonthKey());
    if (!range) return;

    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');

    if (filterDateFrom) filterDateFrom.value = range.startDateStr;
    if (filterDateTo) filterDateTo.value = range.endDateStr;
}

function refreshAllForSelectedMonth(forceLedgerDate = false) {
    renderSelectedMonthText();

    const pageLedger = document.getElementById('pageLedger');
    if (pageLedger && pageLedger.style.display !== 'none') {
        applySelectedMonthToLedgerDateFilters(forceLedgerDate);
        if (typeof initLedger === 'function') {
            initLedger();
        }
    }
    const stockBondSummaryEl = document.getElementById('stockBondSummaryValue');
    if (stockBondSummaryEl) {
        const values = computeStockBondMarketValues();
        const totalValue = values.totalValue || 0;
        if (totalValue > 0) {
            const stockPct = values.stockValue / totalValue;
            const bondPct = values.bondValue / totalValue;
            stockBondSummaryEl.textContent = `股 ${formatPct(stockPct)} / 債 ${formatPct(bondPct)}`;
        } else {
            stockBondSummaryEl.textContent = '尚無資料';
        }
    }

    const pageChart = document.getElementById('pageChart');
    if (pageChart && pageChart.style.display !== 'none') {
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
    }
}

let quoteProxyAvailability = {
    reachable: null,
    lastFailedAt: 0,
    alertedAt: 0
};

// 用於補抓昨收價時的去重集合，避免重複呼叫
const pendingPrevCloseFetch = new Set();

// 用於抓取現價時的去重集合，避免同一檔同時重複呼叫
const pendingCurrentPriceFetch = new Map();

// 簡易代理冷卻：若 429/403 過載，暫停使用該代理一段時間
const proxyCooldowns = {};
const PROXY_COOLDOWN_MS = 5 * 60 * 1000;
// 每檔昨收拉取冷卻，避免短時間重複打同一檔造成風險：5 分鐘
const prevCloseAttemptAt = {};
const PREV_CLOSE_COOLDOWN_MS = 5 * 60 * 1000;

const publicQuoteProxies = [
    // 新的可用代理服務
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://corsproxy.io/?',
    // cors-anywhere.herokuapp.com 已經不可用，完全移除
    // 暫時移除 r.jina.ai (503 錯誤)
    // 'https://r.jina.ai/http://',
];

function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryAfterMs(resp) {
    try {
        if (!resp || !resp.headers) return 0;
        const ra = resp.headers.get('Retry-After');
        if (!ra) return 0;
        const sec = Number(ra);
        if (!isNaN(sec) && sec > 0) return sec * 1000;
        const dt = Date.parse(ra);
        if (!isNaN(dt)) return Math.max(0, dt - Date.now());
    } catch (_) {}
    return 0;
}

function isProxyInCooldown(proxyBase) {
    if (!proxyCooldowns[proxyBase]) return false;
    return Date.now() - proxyCooldowns[proxyBase] < PROXY_COOLDOWN_MS;
}

function markProxyRateLimited(proxyBase) {
    proxyCooldowns[proxyBase] = Date.now();
}

function shuffleProxies() {
    return [...publicQuoteProxies].sort(() => Math.random() - 0.5);
}

// 嘗試直接從臺灣交易所/櫃買中心 MIS 取昨收（y），降低對 Yahoo 依賴
async function fetchPrevCloseFromTwseOtc(stockCode) {
    try {
        const isOtc = (stockCode.endsWith('B') || stockCode.endsWith('L') || stockCode.endsWith('R') || stockCode.endsWith('U') || stockCode.endsWith('K'));
        const exchange = isOtc ? 'otc' : 'tse';
        const exCh = `${exchange}_${stockCode.toUpperCase()}.tw`;
        const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}`;
        const shuffledProxies = shuffleProxies();
        for (const proxyBase of shuffledProxies) {
            if (isProxyInCooldown(proxyBase)) continue;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                let finalUrl;
                if (proxyBase.includes('corsproxy.io')) {
                    finalUrl = `${proxyBase}${encodeURIComponent(url)}`;
                } else {
                    // codetabs.com 和其他代理
                    finalUrl = `${proxyBase}${encodeURIComponent(url)}`;
                }
                const resp = await fetch(finalUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (!resp) continue;
                if (resp.status === 429 || resp.status === 403) {
                    markProxyRateLimited(proxyBase);
                    continue;
                }
                if (!resp.ok) continue;
                const text = await resp.text();
                let raw = text;
                try {
                    const wrapped = JSON.parse(text);
                    if (wrapped && typeof wrapped === 'object' && typeof wrapped.contents === 'string') {
                        raw = wrapped.contents;
                    }
                } catch (_) {}
                const data = JSON.parse(raw);
                const yVal = data?.msgArray?.[0]?.y ? Number(data.msgArray[0].y) : null;
                if (yVal && yVal > 0) {
                    return yVal;
                }
            } catch (_) {
                continue;
            }
        }
    } catch (_) {
        return null;
    }
    return null;
}

// 補抓昨收價：僅抓 previousClose，避免畫面顯示 --。具備簡單去重。
async function fetchPreviousCloseOnly(stockCode) {
    if (!stockCode || pendingPrevCloseFetch.has(stockCode)) return null;
    const lastAttempt = prevCloseAttemptAt[stockCode];
    if (lastAttempt && Date.now() - lastAttempt < PREV_CLOSE_COOLDOWN_MS) return null;
    prevCloseAttemptAt[stockCode] = Date.now();
    pendingPrevCloseFetch.add(stockCode);
    try {
        // 先嘗試 TWSE/OTC 來源（不依賴 Yahoo）
        const twPrev = await fetchPrevCloseFromTwseOtc(stockCode);
        if (twPrev && twPrev > 0) {
            saveStockPreviousClosePrice(stockCode, twPrev);
            return twPrev;
        }

        let yahooSymbol;
        if (stockCode.endsWith('B') || stockCode.endsWith('L') || stockCode.endsWith('R') || stockCode.endsWith('U') || stockCode.endsWith('K')) {
            yahooSymbol = `${stockCode}.TWO`;
        } else if (stockCode.startsWith('A0')) {
            return null;
        } else {
            yahooSymbol = `${stockCode}.TW`;
        }

        const symbolCandidates = (stockCode.endsWith('B') || stockCode.endsWith('L') || stockCode.endsWith('R') || stockCode.endsWith('U') || stockCode.endsWith('K'))
            ? [`${stockCode}.TWO`, `${stockCode}.TW`]
            : [yahooSymbol];

        // 隨機化代理順序，分散同一來源的速率限制
        const shuffledProxies = shuffleProxies();

        for (const candidateSymbol of symbolCandidates) {
            // 1) chart API（優先）
            const yahooChartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${candidateSymbol}?interval=1d&range=1d`;
            for (const proxyBase of shuffledProxies) {
                if (isProxyInCooldown(proxyBase)) continue;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    let finalUrl;
                    if (proxyBase.includes('corsproxy.io')) {
                        finalUrl = `${proxyBase}${encodeURIComponent(yahooChartUrl)}`;
                    } else {
                        // codetabs.com 和其他代理
                        finalUrl = `${proxyBase}${encodeURIComponent(yahooChartUrl)}`;
                    }
                    const resp = await fetch(finalUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (!resp) continue;
                    if (resp.status === 429 || resp.status === 403) {
                        markProxyRateLimited(proxyBase);
                        continue;
                    }
                    if (!resp.ok) continue;
                    const text = await resp.text();
                    let raw = text;
                    try {
                        const wrapped = JSON.parse(text);
                        if (wrapped && typeof wrapped === 'object' && typeof wrapped.contents === 'string') {
                            raw = wrapped.contents;
                        }
                    } catch (_) {}
                    const firstBrace = raw.indexOf('{');
                    if (firstBrace > 0) raw = raw.slice(firstBrace);
                    const data = JSON.parse(raw);
                    const result = data?.chart?.result?.[0];
                    const prev = result?.meta?.previousClose || result?.meta?.regularMarketPreviousClose || null;
                    if (prev && prev > 0) {
                        saveStockPreviousClosePrice(stockCode, prev);
                        return prev;
                    }
                } catch (_) {
                    continue;
                }
            }

            // 2) quote API 作為備援：regularMarketPreviousClose
            const yahooQuoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${candidateSymbol}`;
            for (const proxyBase of shuffledProxies) {
                if (isProxyInCooldown(proxyBase)) continue;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    let finalUrl;
                    if (proxyBase.includes('corsproxy.io')) {
                        finalUrl = `${proxyBase}${encodeURIComponent(yahooQuoteUrl)}`;
                    } else {
                        // codetabs.com 和其他代理
                        finalUrl = `${proxyBase}${encodeURIComponent(yahooQuoteUrl)}`;
                    }
                    const resp = await fetch(finalUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (!resp) continue;
                    if (resp.status === 429 || resp.status === 403) {
                        markProxyRateLimited(proxyBase);
                        continue;
                    }
                    if (!resp.ok) continue;
                    const text = await resp.text();
                    let raw = text;
                    try {
                        const wrapped = JSON.parse(text);
                        if (wrapped && typeof wrapped === 'object' && typeof wrapped.contents === 'string') {
                            raw = wrapped.contents;
                        }
                    } catch (_) {}
                    const data = JSON.parse(raw);
                    const prev = data?.quoteResponse?.result?.[0]?.regularMarketPreviousClose || null;
                    if (prev && prev > 0) {
                        saveStockPreviousClosePrice(stockCode, prev);
                        return prev;
                    }
                } catch (_) {
                    continue;
                }
            }
        }
        return null;
    } finally {
        pendingPrevCloseFetch.delete(stockCode);
    }
}

function isLocalQuoteProxyInCooldown() {
    if (quoteProxyAvailability.reachable !== false) return false;
    const now = Date.now();
    return now - (quoteProxyAvailability.lastFailedAt || 0) < 5 * 60 * 1000;
}

function markQuoteProxyFailed() {
    quoteProxyAvailability.reachable = false;
    quoteProxyAvailability.lastFailedAt = Date.now();
}

function maybeAlertQuoteProxyDown() {
    const now = Date.now();
    if (now - (quoteProxyAvailability.alertedAt || 0) < 5 * 60 * 1000) return;
    quoteProxyAvailability.alertedAt = now;

    alert('目前無法連線到本機股價代理（localhost:5000）。\n\n系統將改用公開 CORS 代理抓取 Yahoo Finance（可能較慢或偶爾失敗）。');
}

async function fetchYahooChartViaPublicProxies(yahooUrl, stockCode) {
    const shuffledProxies = shuffleProxies();
    let backoffMs = 250;
    for (const proxyBase of shuffledProxies) {
        if (isProxyInCooldown(proxyBase)) continue;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                let finalUrl;
                if (proxyBase.includes('corsproxy.io')) {
                    finalUrl = `${proxyBase}${encodeURIComponent(yahooUrl)}`;
                } else {
                    // codetabs.com 和其他代理
                    finalUrl = `${proxyBase}${encodeURIComponent(yahooUrl)}`;
                }

                const resp = await fetch(finalUrl, { signal: controller.signal });
                if (!resp) continue;

                if (resp.status === 429 || resp.status === 403) {
                    markProxyRateLimited(proxyBase);
                    const retryAfter = getRetryAfterMs(resp);
                    const waitMs = Math.min(30_000, Math.max(retryAfter || 0, backoffMs) + Math.floor(Math.random() * 250));
                    backoffMs = Math.min(30_000, Math.floor(backoffMs * 2));
                    await sleepMs(waitMs);
                    continue;
                }

                if (!resp.ok) {
                    await sleepMs(120);
                    continue;
                }

                const text = await resp.text();
                let raw = text;

                // Some proxies return JSON wrapper
                try {
                    const wrapped = JSON.parse(text);
                    if (wrapped && typeof wrapped === 'object' && typeof wrapped.contents === 'string') {
                        raw = wrapped.contents;
                    }
                } catch (_) {}

                // 
                const firstBrace = raw.indexOf('{');
                if (firstBrace > 0) raw = raw.slice(firstBrace);

                const data = JSON.parse(raw);
                if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                    const result = data.chart.result[0];
                    if (result && result.meta) {
                        const previousClose = result.meta.previousClose || result.meta.regularMarketPreviousClose || null;
                        if (stockCode && previousClose && previousClose > 0) {
                            saveStockPreviousClosePrice(stockCode, previousClose);
                        }

                        const currentPrice = result.meta.regularMarketPrice || previousClose || null;
                        if (currentPrice && currentPrice > 0) return currentPrice;
                    }
                }
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (_) {
            continue;
        }
    }
    return null;
}

function getStockPreviousClosePrice(stockCode) {
    const previousCloses = JSON.parse(localStorage.getItem('stockPreviousClosePrices') || '{}');
    const prevData = previousCloses[stockCode];

    if (!prevData) return null;

    if (typeof prevData === 'number') return prevData;
    if (prevData && typeof prevData === 'object' && typeof prevData.price === 'number') {
        return prevData.price;
    }
    return null;
}

function initMonthSwitchers() {
    const ledgerPrev = document.getElementById('ledgerPrevMonthBtn');
    const ledgerNext = document.getElementById('ledgerNextMonthBtn');
    const chartPrev = document.getElementById('chartPrevMonthBtn');
    const chartNext = document.getElementById('chartNextMonthBtn');

    const bind = (btn, delta) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            const nextKey = addMonthsToKey(getSelectedMonthKey(), delta);
            setSelectedMonthKey(nextKey);
            refreshAllForSelectedMonth(true);
        });
    };

    bind(ledgerPrev, -1);
    bind(ledgerNext, 1);
    bind(chartPrev, -1);
    bind(chartNext, 1);

    renderSelectedMonthText();
}

// 播放點擊音效（完全延遲加載，只在需要時創建）
function playClickSound() {
    // 如果之前加載失敗，直接返回（完全禁用音效）
    if (audioFailed.click) {
        return;
    }
    
    // 如果音頻未創建，現在創建（延遲加載）
    if (!clickAudio) {
        try {
            // 使用相對路徑
            const audio = new Audio('./music/mouse-click-7-411633.mp3');
            audio.volume = 0.3;
            audio.preload = 'none'; // 不預加載
            
            // 設置錯誤處理，一旦失敗就永久禁用
            const errorHandler = (e) => {
                e.stopPropagation(); // 阻止錯誤冒泡
                e.preventDefault(); // 阻止默認行為
                audioFailed.click = true; // 永久標記為失敗
                clickAudio = null;
            };
            audio.addEventListener('error', errorHandler, { once: true, capture: true });
            
            clickAudio = audio;
        } catch (error) {
            // 靜默處理初始化錯誤，永久禁用
            audioFailed.click = true;
            clickAudio = null;
            return;
        }
    }
    
    // 嘗試播放
    try {
        if (!clickAudio || audioFailed.click) return;
        
        // 如果音頻已加載，重置播放位置
        if (clickAudio.readyState >= 2) {
            clickAudio.currentTime = 0;
        }
        
        const playPromise = clickAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                // 播放失敗時，標記為永久失敗
                audioFailed.click = true;
                clickAudio = null;
            });
        }
    } catch (error) {
        // 靜默處理錯誤，永久禁用
        audioFailed.click = true;
        clickAudio = null;
    }
}

// 播放入帳音效（收入、股息）（完全延遲加載，只在需要時創建）
function playIncomeSound() {
    // 如果之前加載失敗，直接返回（完全禁用音效）
    if (audioFailed.income) {
        return;
    }
    
    // 如果音頻未創建，現在創建（延遲加載）
    if (!incomeAudio) {
        try {
            // 使用相對路徑
            const audio = new Audio('./music/coin-collision-sound-342335.mp3');
            audio.volume = 0.4;
            audio.preload = 'none'; // 不預加載
            
            // 設置錯誤處理，一旦失敗就永久禁用
            const errorHandler = (e) => {
                e.stopPropagation(); // 阻止錯誤冒泡
                e.preventDefault(); // 阻止默認行為
                audioFailed.income = true; // 永久標記為失敗
                incomeAudio = null;
            };
            audio.addEventListener('error', errorHandler, { once: true, capture: true });
            
            incomeAudio = audio;
        } catch (error) {
            // 靜默處理初始化錯誤，永久禁用
            audioFailed.income = true;
            incomeAudio = null;
            return;
        }
    }
    
    // 嘗試播放
    try {
        if (!incomeAudio || audioFailed.income) return;
        
        // 如果音頻已加載，重置播放位置
        if (incomeAudio.readyState >= 2) {
            incomeAudio.currentTime = 0;
        }
        
        const playPromise = incomeAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                // 播放失敗時，標記為永久失敗
                audioFailed.income = true;
                incomeAudio = null;
            });
        }
    } catch (error) {
        // 靜默處理錯誤，永久禁用
        audioFailed.income = true;
        incomeAudio = null;
    }
}

// ========== 記帳分類功能 ==========
// 注意：分類數據和基本函數已移至 js/categories.js 模組
// 以下函數依賴於模組中的 allCategories, recommendedCategories 等變數

// 檢查模組是否正確載入
if (typeof allCategories === 'undefined') {
    console.error('錯誤：allCategories 未定義！請確保 js/categories.js 模組已正確載入。');
}
if (typeof recommendedCategories === 'undefined') {
    console.error('錯誤：recommendedCategories 未定義！請確保 js/categories.js 模組已正確載入。');
}
if (typeof loadCustomCategories === 'undefined') {
    console.error('錯誤：loadCustomCategories 函數未定義！請確保 js/categories.js 模組已正確載入。');
}

// 為自訂分類添加長按和右鍵刪除功能
function addCustomCategoryDeleteEvents(categoryItem, categoryName, categoryType) {
    let longPressTimer = null;
    let isLongPress = false;
    
    // 手機長按刪除
    categoryItem.addEventListener('touchstart', (e) => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            // 震動反饋（如果設備支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            // 視覺反饋
            const originalTransform = categoryItem.style.transform;
            const originalBackground = categoryItem.style.background;
            categoryItem.style.transform = 'scale(0.95)';
            categoryItem.style.background = 'var(--bg-danger)';
            
            // 確認刪除
            if (confirm(`確定要刪除自訂分類「${categoryName}」嗎？\n\n此操作無法復原。`)) {
                deleteCustomCategory(categoryName, categoryType);
            } else {
                // 恢復樣式
                setTimeout(() => {
                    categoryItem.style.transform = originalTransform;
                    categoryItem.style.background = originalBackground;
                }, 200);
            }
        }, 500); // 500ms 長按觸發
    });
    
    categoryItem.addEventListener('touchend', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
        // 如果是長按，阻止點擊事件
        if (isLongPress) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    categoryItem.addEventListener('touchmove', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    // 滑鼠右鍵刪除
    categoryItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 視覺反饋
        const originalTransform = categoryItem.style.transform;
        const originalBackground = categoryItem.style.background;
        categoryItem.style.transform = 'scale(0.95)';
        categoryItem.style.background = '#ffebee';
        
        // 確認刪除
        if (confirm(`確定要刪除自訂分類「${categoryName}」嗎？\n\n此操作無法復原。`)) {
            deleteCustomCategory(categoryName, categoryType);
        } else {
            // 恢復樣式
            setTimeout(() => {
                categoryItem.style.transform = originalTransform;
                categoryItem.style.background = originalBackground;
            }, 200);
        }
    });
}

// 初始化分類網格（顯示所有分類，不分類型）
function initCategoryGrid(tabType = 'recommended', recordType = null) {
    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) {
        console.error('找不到 categoryGrid 元素');
        return;
    }
    
    // 載入自定義分類
    loadCustomCategories();
    
    console.log('總分類數量:', allCategories.length);
    console.log('支出分類:', allCategories.filter(c => c.type === 'expense').length);
    console.log('收入分類:', allCategories.filter(c => c.type === 'income').length);
    console.log('轉帳分類:', allCategories.filter(c => c.type === 'transfer').length);
    
    // 獲取所有啟用的分類（不分類型）
    const enabledCategories = getEnabledCategories(null); // 傳入 null 表示不過濾類型
    
    console.log('啟用的分類數量:', enabledCategories.length);
    
    let categoriesToShow = [];
    
    if (tabType === 'recommended') {
        // 推薦：按類型分組顯示（支出、收入、轉帳），自定義分類歸類在一起
        // 這裡不設置 categoriesToShow，而是直接渲染分組
        categoryGrid.innerHTML = '';
        
        // 獲取自定義分類
        const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        
        // 按類型分組：支出、收入、轉帳
        const typeGroups = {
            'expense': { label: '📤 支出', icon: '📤', color: '#ff6b6b' },
            'income': { label: '💰 收入', icon: '💰', color: '#51cf66' },
            'transfer': { label: '🔄 轉帳', icon: '🔄', color: '#4dabf7' }
        };
        
        ['expense', 'income', 'transfer'].forEach(type => {
            // 獲取該類型的自定義分類（只顯示啟用的）- 優先顯示
            const customCats = savedCustomCategories.filter(cat => {
                if (cat.type !== type) return false;
                const enabledCat = enabledCategories.find(ec => ec.name === cat.name && ec.type === cat.type);
                return enabledCat !== undefined;
            });
            
            // 獲取該類型的推薦分類（只顯示啟用的）
            const recommended = (recommendedCategories[type] || []).filter(cat => {
            const enabledCat = enabledCategories.find(ec => ec.name === cat.name && ec.type === cat.type);
            return enabledCat !== undefined;
        });
        
            // 合併分類：自定義分類優先，然後是推薦分類
            const typeCategories = [...customCats, ...recommended];
            
            // 如果該類型分類不足，補充其他啟用的同類型分類（排除已顯示的自定義和推薦分類）
            if (typeCategories.length < 8) {
            const remaining = enabledCategories.filter(cat => 
                    cat.type === type && 
                    !typeCategories.some(tc => tc.name === cat.name && tc.type === cat.type)
                );
                typeCategories.push(...remaining.slice(0, 8 - typeCategories.length));
            }
            
            // 如果該類型有分類，顯示類型標題和分類
            if (typeCategories.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'category-group-header recommended-group-header';
                groupHeader.setAttribute('data-type', type);
                groupHeader.innerHTML = `
                    <div class="group-header-icon">${typeGroups[type].icon}</div>
                    <div class="group-header-label">${typeGroups[type].label}</div>
                    <div class="group-header-count">${typeCategories.length}</div>
                `;
                categoryGrid.appendChild(groupHeader);
                
                // 獲取自定義圖標
                const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
                const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
                
                // 渲染該類型的分類
                typeCategories.forEach((category, index) => {
                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'category-item recommended-category-item';
                    categoryItem.dataset.category = category.name;
                    categoryItem.dataset.index = index;
                    categoryItem.setAttribute('data-category-type', type);
                    
                    // 檢查是否有自定義圖片圖標
                    const customIconValue = customIcons[category.name]?.value;
                    const hasCustomIcon = customIcons[category.name] && customIcons[category.name].type === 'image' && isLikelyImageSrc(customIconValue);
                    
                    // 檢查是否為自定義分類
                    const isCustomCategory = savedCustomCategories.some(cat => cat.name === category.name && cat.type === category.type);
                    
                    // 類型標籤圖標（小圖標）
                    const typeIcon = category.type === 'expense' ? '📤' : category.type === 'income' ? '💰' : '🔄';
                    const typeColor = category.type === 'expense' ? '#ff6b6b' : category.type === 'income' ? '#51cf66' : '#4dabf7';
                    
                    // 建立圖標 HTML
                    let iconHtml;
                    if (hasCustomIcon) {
                        iconHtml = `
                            <div class="category-icon-wrapper custom-icon-wrapper">
                                <img src="${customIconValue}" alt="${category.name}" class="category-icon-image" onerror="this.outerHTML='<span class=&quot;category-icon&quot;>' + (this.getAttribute(&quot;data-fallback&quot;) || '📦') + '</span>'" data-fallback="${category.icon || '📦'}">
                                <span class="custom-icon-badge">✨</span>
                            </div>
                        `;
                    } else {
                        iconHtml = `<span class="category-icon">${category.icon || '📦'}</span>`;
                    }
                    
                    categoryItem.innerHTML = `
                        ${iconHtml}
                        <span class="category-name">${category.name}</span>
                        <span class="category-type-badge" style="position: absolute; top: 4px; right: 4px; font-size: 10px; padding: 2px 4px; background: ${typeColor}20; border: 1px solid ${typeColor}50; border-radius: 6px; color: ${typeColor}; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <span style="font-size: 10px;">${typeIcon}</span>
                        </span>
                    `;
                    
                    // 設置自訂分類的提示屬性
                    if (isCustomCategory) {
                        categoryItem.setAttribute('title', '長按或右鍵刪除');
                        categoryItem.style.position = 'relative';
                    }
                    
                    // 綁定點擊事件
                    categoryItem.addEventListener('click', () => {
                        // 移除其他選中狀態
                        document.querySelectorAll('.category-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // 添加選中狀態
                        categoryItem.classList.add('selected');
                        
                        // 保存選中的分類
                        window.selectedCategory = category.name;
                        
                        // 根據選中的分類類型，自動更新 accountingType
                        window.accountingType = category.type;
                        
                        // 更新 header 標籤的 active 狀態
                        document.querySelectorAll('.header-tab').forEach(tab => {
                            if (tab.dataset.type === category.type) {
                                tab.classList.add('active');
                            } else {
                                tab.classList.remove('active');
                            }
                        });
                    });
                    
                    // 為自訂分類添加長按和右鍵刪除
                    if (isCustomCategory) {
                        addCustomCategoryDeleteEvents(categoryItem, category.name, category.type);
                    }
                    
                    categoryGrid.appendChild(categoryItem);
                });
            }
        });
        
        return; // 提前返回，不執行後續的統一渲染邏輯
    } else if (tabType === 'ungrouped') {
        // 全部：按類型分組顯示所有啟用的分類
        categoryGrid.innerHTML = '';
        
        // 獲取自定義分類
        const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        
        // 按類型分組：支出、收入、轉帳
        const typeGroups = {
            'expense': { label: '📤 支出', icon: '📤', color: '#ff6b6b' },
            'income': { label: '💰 收入', icon: '💰', color: '#51cf66' },
            'transfer': { label: '🔄 轉帳', icon: '🔄', color: '#4dabf7' }
        };
        
        ['expense', 'income', 'transfer'].forEach(type => {
            // 獲取該類型的所有啟用分類（按名稱排序）
            const typeCategories = enabledCategories
                .filter(cat => cat.type === type)
                .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
            
            // 如果該類型有分類，顯示類型標題和分類
            if (typeCategories.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'category-group-header recommended-group-header';
                groupHeader.setAttribute('data-type', type);
                groupHeader.innerHTML = `
                    <div class="group-header-icon">${typeGroups[type].icon}</div>
                    <div class="group-header-label">${typeGroups[type].label}</div>
                    <div class="group-header-count">${typeCategories.length}</div>
                `;
                categoryGrid.appendChild(groupHeader);
                
                // 獲取自定義圖標
                const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
                
                // 渲染該類型的所有分類
                typeCategories.forEach((category, index) => {
                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'category-item recommended-category-item';
                    categoryItem.dataset.category = category.name;
                    categoryItem.dataset.index = index;
                    categoryItem.setAttribute('data-category-type', type);
                    
                    // 檢查是否有自定義圖片圖標
                    const hasCustomIcon = customIcons[category.name] && customIcons[category.name].type === 'image';
                    
                    // 檢查是否為自定義分類
                    const isCustomCategory = savedCustomCategories.some(cat => cat.name === category.name && cat.type === category.type);
                    
                    // 類型標籤圖標（小圖標）
                    const typeIcon = category.type === 'expense' ? '📤' : category.type === 'income' ? '💰' : '🔄';
                    const typeColor = category.type === 'expense' ? '#ff6b6b' : category.type === 'income' ? '#51cf66' : '#4dabf7';
                    
                    // 建立圖標 HTML
                    let iconHtml;
                    iconHtml = `<span class="category-icon">${category.icon || '📦'}</span>`;
                    
                    categoryItem.innerHTML = `
                        ${iconHtml}
                        <span class="category-name">${category.name}</span>
                        <span class="category-type-badge" style="position: absolute; top: 4px; right: 4px; font-size: 10px; padding: 2px 4px; background: ${typeColor}20; border: 1px solid ${typeColor}50; border-radius: 6px; color: ${typeColor}; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <span style="font-size: 10px;">${typeIcon}</span>
                        </span>
                    `;
                    
                    // 設置自訂分類的提示屬性
                    if (isCustomCategory) {
                        categoryItem.setAttribute('title', '長按或右鍵刪除');
                        categoryItem.style.position = 'relative';
                    }
                    
                    // 綁定點擊事件
                    categoryItem.addEventListener('click', () => {
                        // 移除其他選中狀態
                        document.querySelectorAll('.category-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // 添加選中狀態
                        categoryItem.classList.add('selected');
                        
                        // 保存選中的分類
                        window.selectedCategory = category.name;
                        
                        // 根據選中的分類類型，自動更新 accountingType
                        window.accountingType = category.type;
                        
                        // 更新 header 標籤的 active 狀態
                        document.querySelectorAll('.header-tab').forEach(tab => {
                            if (tab.dataset.type === category.type) {
                                tab.classList.add('active');
                            } else {
                                tab.classList.remove('active');
                            }
                        });
                    });
                    
                    // 為自訂分類添加長按和右鍵刪除
                    if (isCustomCategory) {
                        addCustomCategoryDeleteEvents(categoryItem, category.name, category.type);
                    }
                    
                    categoryGrid.appendChild(categoryItem);
                });
            }
        });
        
        return; // 提前返回，不執行後續的統一渲染邏輯
    } else if (tabType === 'more') {
        // 更多：按類型分組顯示所有分類，並添加新增分類按鈕
    categoryGrid.innerHTML = '';
    
        // 先添加新增分類按鈕
        const addCategoryItem = document.createElement('div');
        addCategoryItem.className = 'category-item add-category-item';
        addCategoryItem.style.cssText = 'background: var(--bg-light-gradient); border: 2px dashed var(--color-primary); cursor: pointer;';
        
        addCategoryItem.innerHTML = `
            <span class="category-icon" style="font-size: 32px;">➕</span>
            <span class="category-name" style="color: var(--color-primary); font-weight: 600;">新增分類</span>
        `;
        
        addCategoryItem.addEventListener('click', () => {
            // 顯示新增分類對話框，默認類型為當前的 accountingType
            const currentType = window.accountingType || 'expense';
            showAddCategoryDialog(currentType);
        });
        
        categoryGrid.appendChild(addCategoryItem);
        
        // 獲取自定義分類
        const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        
        // 按類型分組：支出、收入、轉帳
        const typeGroups = {
            'expense': { label: '📤 支出', icon: '📤', color: '#ff6b6b' },
            'income': { label: '💰 收入', icon: '💰', color: '#51cf66' },
            'transfer': { label: '🔄 轉帳', icon: '🔄', color: '#4dabf7' }
        };
        
        ['expense', 'income', 'transfer'].forEach(type => {
            // 獲取該類型的所有啟用分類（按名稱排序）
            const typeCategories = enabledCategories
                .filter(cat => cat.type === type)
                .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
            
            // 如果該類型有分類，顯示類型標題和分類
            if (typeCategories.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'category-group-header recommended-group-header';
                groupHeader.setAttribute('data-type', type);
                groupHeader.innerHTML = `
                    <div class="group-header-icon">${typeGroups[type].icon}</div>
                    <div class="group-header-label">${typeGroups[type].label}</div>
                    <div class="group-header-count">${typeCategories.length}</div>
                `;
                categoryGrid.appendChild(groupHeader);
                
                // 獲取自定義圖標
                const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
                
                // 渲染該類型的所有分類
                typeCategories.forEach((category, index) => {
                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'category-item recommended-category-item';
                    categoryItem.dataset.category = category.name;
                    categoryItem.dataset.index = index;
                    categoryItem.setAttribute('data-category-type', type);
                    
                    // 檢查是否有自定義圖片圖標
                    const hasCustomIcon = customIcons[category.name] && customIcons[category.name].type === 'image';
                    
                    // 檢查是否為自定義分類
                    const isCustomCategory = savedCustomCategories.some(cat => cat.name === category.name && cat.type === category.type);
                    
                    // 類型標籤圖標（小圖標）
                    const typeIcon = category.type === 'expense' ? '📤' : category.type === 'income' ? '💰' : '🔄';
                    const typeColor = category.type === 'expense' ? '#ff6b6b' : category.type === 'income' ? '#51cf66' : '#4dabf7';
                    
                    // 建立圖標 HTML
                    let iconHtml;
                    iconHtml = `<span class="category-icon">${category.icon || '📦'}</span>`;
                    
                    categoryItem.innerHTML = `
                        ${iconHtml}
                        <span class="category-name">${category.name}</span>
                        <span class="category-type-badge" style="position: absolute; top: 4px; right: 4px; font-size: 10px; padding: 2px 4px; background: ${typeColor}20; border: 1px solid ${typeColor}50; border-radius: 6px; color: ${typeColor}; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <span style="font-size: 10px;">${typeIcon}</span>
                        </span>
                    `;
                    
                    // 設置自訂分類的提示屬性
                    if (isCustomCategory) {
                        categoryItem.setAttribute('title', '長按或右鍵刪除');
                        categoryItem.style.position = 'relative';
                    }
                    
                    // 綁定點擊事件
                    categoryItem.addEventListener('click', () => {
                        // 移除其他選中狀態
                        document.querySelectorAll('.category-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // 添加選中狀態
                        categoryItem.classList.add('selected');
                        
                        // 保存選中的分類
                        window.selectedCategory = category.name;
                        
                        // 根據選中的分類類型，自動更新 accountingType
                        window.accountingType = category.type;
                        
                        // 更新 header 標籤的 active 狀態
                        document.querySelectorAll('.header-tab').forEach(tab => {
                            if (tab.dataset.type === category.type) {
                                tab.classList.add('active');
                            } else {
                                tab.classList.remove('active');
                            }
                        });
                    });
                    
                    // 為自訂分類添加長按和右鍵刪除
                    if (isCustomCategory) {
                        addCustomCategoryDeleteEvents(categoryItem, category.name, category.type);
                    }
                    
                    categoryGrid.appendChild(categoryItem);
                });
            }
        });
        
        return; // 提前返回，不執行後續的統一渲染邏輯
    }
    
    console.log('要顯示的分類數量:', categoriesToShow.length);
    console.log('要顯示的分類:', categoriesToShow.map(c => `${c.name}(${c.type})`).join(', '));
    
    categoryGrid.innerHTML = '';
    
    // 獲取自定義圖標（只獲取一次，避免每次迴圈都解析）
    const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
    console.log('📷 自定義圖標數量:', Object.keys(customIcons).length);
    console.log('📷 自定義圖標列表:', Object.keys(customIcons));
    
    categoriesToShow.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category.name;
        categoryItem.dataset.index = index;
        
        // 檢查是否有自定義圖片圖標
        const customIconValue = customIcons[category.name]?.value;
        const hasCustomIcon = customIcons[category.name] && customIcons[category.name].type === 'image' && isLikelyImageSrc(customIconValue);

        if (hasCustomIcon) {
            console.log('✓ 分類「' + category.name + '」有自定義圖片圖示，但輸入頁已統一使用 Emoji 顯示');
        } else {
            console.log('  分類「' + category.name + '」使用 Emoji:', category.icon);
        }
        
        // ...
        
        // 類型標籤圖標（小圖標）
        const typeIcon = category.type === 'expense' ? '📤' : category.type === 'income' ? '💰' : '🔄';
        const typeColor = category.type === 'expense' ? '#ff6b6b' : category.type === 'income' ? '#51cf66' : '#4dabf7';
        
        // 建立圖標 HTML
        let iconHtml;
        if (hasCustomIcon) {
            iconHtml = `
                <div class="category-icon-wrapper custom-icon-wrapper">
                    <img src="${customIconValue}" alt="${category.name}" class="category-icon-image" onerror="this.outerHTML='<span class=&quot;category-icon&quot;>' + (this.getAttribute(&quot;data-fallback&quot;) || '📦') + '</span>'" data-fallback="${category.icon || '📦'}">
                    <span class="custom-icon-badge">✨</span>
                </div>
            `;
        } else {
            iconHtml = `<span class="category-icon">${category.icon || '📦'}</span>`;
        }
        
        categoryItem.innerHTML = `
            ${iconHtml}
            <span class="category-name">${category.name}</span>
            <span class="category-type-badge" style="position: absolute; top: 4px; right: 4px; font-size: 10px; padding: 2px 4px; background: ${typeColor}20; border: 1px solid ${typeColor}50; border-radius: 6px; color: ${typeColor}; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <span style="font-size: 10px;">${typeIcon}</span>
            </span>
        `;
        
        // 設置自訂分類的提示屬性
        if (isCustomCategory) {
            categoryItem.setAttribute('title', '長按或右鍵刪除');
            categoryItem.style.position = 'relative';
        }
        
        // 綁定點擊事件
        categoryItem.addEventListener('click', () => {
            // 移除其他選中狀態
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // 添加選中狀態
            categoryItem.classList.add('selected');
            
            // 保存選中的分類
            window.selectedCategory = category.name;
            
            // 根據選中的分類類型，自動更新 accountingType
            window.accountingType = category.type;
            
            // 更新 header 標籤的 active 狀態
            document.querySelectorAll('.header-tab').forEach(tab => {
                if (tab.dataset.type === category.type) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // 應用預設金額（如果有的話）
            applyDefaultAmount(category.name);
        });
        
        // 為自訂分類綁定長按和右鍵刪除事件
        if (isCustomCategory) {
            let longPressTimer = null;
            let isLongPress = false;
            
            // 手機長按刪除
            categoryItem.addEventListener('touchstart', (e) => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    // 震動反饋（如果設備支持）
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    // 視覺反饋
                    const originalTransform = categoryItem.style.transform;
                    categoryItem.style.transform = 'scale(0.95)';
                    categoryItem.style.background = 'var(--bg-danger)';
                    
                    // 確認刪除
                    if (confirm(`確定要刪除自訂分類「${category.name}」嗎？\n\n此操作無法復原。`)) {
                        deleteCustomCategory(category.name, category.type);
                    } else {
                        // 恢復樣式
                        setTimeout(() => {
                            categoryItem.style.transform = originalTransform;
                            categoryItem.style.background = '';
                        }, 200);
                    }
                }, 500); // 500ms 長按觸發
            });
            
            categoryItem.addEventListener('touchend', (e) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
                // 如果是長按，阻止點擊事件
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            
            categoryItem.addEventListener('touchmove', () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });
            
            // 滑鼠右鍵刪除
            categoryItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // 視覺反饋
                const originalTransform = categoryItem.style.transform;
                categoryItem.style.transform = 'scale(0.95)';
                categoryItem.style.background = 'var(--bg-danger)';
                
                // 確認刪除
                if (confirm(`確定要刪除自訂分類「${category.name}」嗎？\n\n此操作無法復原。`)) {
                    deleteCustomCategory(category.name, category.type);
                } else {
                    // 恢復樣式
                    setTimeout(() => {
                        categoryItem.style.transform = originalTransform;
                        categoryItem.style.background = '';
                    }, 200);
                }
            });
        }
        
        categoryGrid.appendChild(categoryItem);
    });
}

// 編輯自定義分類
function editCustomCategory(categoryName, categoryType) {
    const savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
    const category = savedCategories.find(cat => cat.name === categoryName && cat.type === categoryType);
    
    if (!category) {
        alert('找不到該分類');
        return;
    }
    
    // 創建編輯對話框
    const modal = document.createElement('div');
    modal.className = 'category-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10005; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;';
    
    modal.innerHTML = `
        <div class="category-modal-content" style="background: white; border-radius: 16px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #333;">編輯分類</h3>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">✕</button>
            </div>
            
            <div class="category-modal-field" style="margin-bottom: 20px;">
                <label class="category-modal-label" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">分類類型</label>
                <div class="category-modal-type-select" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="category-modal-type-option ${categoryType === 'expense' ? 'active' : ''}" data-type="expense" style="flex: 1; padding: 12px; border: 2px solid ${categoryType === 'expense' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${categoryType === 'expense' ? '#fff5f9' : '#ffffff'}; color: ${categoryType === 'expense' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        👤 支出
                    </button>
                    <button class="category-modal-type-option ${categoryType === 'income' ? 'active' : ''}" data-type="income" style="flex: 1; padding: 12px; border: 2px solid ${categoryType === 'income' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${categoryType === 'income' ? '#fff5f9' : '#ffffff'}; color: ${categoryType === 'income' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        💰 收入
                    </button>
                    <button class="category-modal-type-option ${categoryType === 'transfer' ? 'active' : ''}" data-type="transfer" style="flex: 1; padding: 12px; border: 2px solid ${categoryType === 'transfer' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${categoryType === 'transfer' ? '#fff5f9' : '#ffffff'}; color: ${categoryType === 'transfer' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        💳 轉帳
                    </button>
                </div>
            </div>
            
            <div class="category-modal-field" style="margin-bottom: 20px;">
                <label class="category-modal-label" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">分類名稱</label>
                <input type="text" id="editCategoryNameInput" class="category-modal-input" value="${categoryName}" placeholder="請輸入分類名稱" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 14px; transition: border-color 0.2s;" onfocus="this.style.borderColor='#ffb6d9'" onblur="this.style.borderColor='#e0e0e0'">
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button id="saveEditCategoryBtn" style="flex: 1; padding: 12px; border: none; border-radius: 12px; background: linear-gradient(135deg, #ffb6d9 0%, #ff9ec7 100%); color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    儲存
                </button>
                <button id="cancelEditCategoryBtn" style="flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 12px; background: #ffffff; color: #666; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='#ffffff'">
                    取消
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let selectedType = categoryType;
    
    // 類型選擇
    const typeOptions = modal.querySelectorAll('.category-modal-type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', () => {
            typeOptions.forEach(opt => {
                opt.style.borderColor = '#e0e0e0';
                opt.style.background = '#ffffff';
                opt.style.color = '#666';
            });
            option.style.borderColor = '#ffb6d9';
            option.style.background = '#fff5f9';
            option.style.color = '#ff69b4';
            selectedType = option.dataset.type;
        });
    });
    
    // 儲存按鈕
    const saveBtn = modal.querySelector('#saveEditCategoryBtn');
    saveBtn.addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const newName = modal.querySelector('#editCategoryNameInput').value.trim();
        
        if (!newName) {
            alert('請輸入分類名稱');
            return;
        }
        
        // 檢查新名稱是否與其他分類重複（排除自己）
        const allCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        const duplicate = allCategories.find(cat => 
            cat.name === newName && 
            cat.type === selectedType && 
            !(cat.name === categoryName && cat.type === categoryType)
        );
        
        if (duplicate) {
            alert('該分類名稱已存在');
            return;
        }
        
        // 更新分類
        const updatedCategories = allCategories.map(cat => {
            if (cat.name === categoryName && cat.type === categoryType) {
                return { ...cat, name: newName, type: selectedType };
            }
            return cat;
        });
        localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
        
        // 如果名稱改變，需要更新相關數據
        if (newName !== categoryName) {
            // 更新 allCategories
            const allCatsIndex = window.allCategories.findIndex(cat => cat.name === categoryName && cat.type === categoryType);
            if (allCatsIndex !== -1) {
                window.allCategories[allCatsIndex].name = newName;
                window.allCategories[allCatsIndex].type = selectedType;
            }
            
            // 更新自定義圖標的鍵名
            const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
            if (customIcons[categoryName]) {
                customIcons[newName] = customIcons[categoryName];
                delete customIcons[categoryName];
                localStorage.setItem('categoryCustomIcons', JSON.stringify(customIcons));
            }
            
            // 更新啟用狀態的鍵名
            const enabledState = getCategoryEnabledState();
            if (enabledState[categoryName] !== undefined) {
                enabledState[newName] = enabledState[categoryName];
                delete enabledState[categoryName];
                saveCategoryEnabledState(enabledState);
            }
        } else if (selectedType !== categoryType) {
            // 只更新類型
            const allCatsIndex = window.allCategories.findIndex(cat => cat.name === categoryName && cat.type === categoryType);
            if (allCatsIndex !== -1) {
                window.allCategories[allCatsIndex].type = selectedType;
            }
        }
        
        // 重新渲染
        if (typeof renderCategoryManageList === 'function') {
            renderCategoryManageList();
        }
        
        const pageInput = document.getElementById('pageInput');
        if (pageInput && pageInput.style.display !== 'none') {
            const activeTab = document.querySelector('.tab-btn.active');
            const tabType = activeTab ? activeTab.dataset.tab : 'more';
            initCategoryGrid(tabType, null);
        }
        
        // 關閉對話框
        document.body.removeChild(modal);
        
        // 顯示成功提示
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">✓ 分類已更新</div>
            <div style="font-size: 13px; opacity: 0.9;">${newName}</div>
        `;
        successMsg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 16px 24px; border-radius: 12px; z-index: 10006; text-align: center; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);';
        document.body.appendChild(successMsg);
        setTimeout(() => {
            if (document.body.contains(successMsg)) {
                document.body.removeChild(successMsg);
            }
        }, 2000);
    });
    
    // 取消按鈕
    const cancelBtn = modal.querySelector('#cancelEditCategoryBtn');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 關閉按鈕
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 自動聚焦輸入框
    setTimeout(() => {
        modal.querySelector('#editCategoryNameInput').focus();
        modal.querySelector('#editCategoryNameInput').select();
    }, 100);
}

// 刪除自定義分類
function deleteCustomCategory(categoryName, categoryType) {
    if (!confirm(`確定要刪除「${categoryName}」分類嗎？\n\n刪除後相關的記帳記錄不會被刪除。`)) {
        return;
    }
    
    console.log('刪除自定義分類:', categoryName, categoryType);
    
    // 1. 從 localStorage 刪除
    let savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
    savedCategories = savedCategories.filter(cat => !(cat.name === categoryName && cat.type === categoryType));
    localStorage.setItem('customCategories', JSON.stringify(savedCategories));
    console.log('✓ 從 localStorage 刪除');
    
    // 2. 從 allCategories 刪除
    const index = allCategories.findIndex(cat => cat.name === categoryName && cat.type === categoryType);
    if (index !== -1) {
        allCategories.splice(index, 1);
        console.log('✓ 從 allCategories 刪除');
    }
    
    // 3. 刪除自定義圖標
    const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
    if (customIcons[categoryName]) {
        delete customIcons[categoryName];
        safeSetItem('categoryCustomIcons', customIcons);
        console.log('✓ 刪除自定義圖標');
    }
    
    // 4. 從啟用狀態中刪除
    const enabledState = getCategoryEnabledState();
    if (enabledState[categoryName]) {
        delete enabledState[categoryName];
        saveCategoryEnabledState(enabledState);
        console.log('✓ 刪除啟用狀態');
    }
    
    // 5. 重新渲染分類管理列表
    if (typeof renderCategoryManageList === 'function') {
        renderCategoryManageList();
    }
    
    // 6. 重新初始化分類網格
    const pageInput = document.getElementById('pageInput');
    if (pageInput && pageInput.style.display !== 'none') {
        const activeTab = document.querySelector('.tab-btn.active');
        const tabType = activeTab ? activeTab.dataset.tab : 'more';
        initCategoryGrid(tabType, null);
        console.log('✓ 分類網格已更新');
    }
    
    // 7. 顯示成功提示
    const successMsg = document.createElement('div');
    successMsg.innerHTML = `
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">✓ 分類已刪除</div>
        <div style="font-size: 13px; opacity: 0.9;">${categoryName}</div>
    `;
    successMsg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 16px 24px; border-radius: 12px; z-index: 10006; text-align: center; box-shadow: 0 4px 16px rgba(238, 90, 111, 0.3);';
    document.body.appendChild(successMsg);
    setTimeout(() => {
        if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
        }
    }, 2000);
}

// 初始化標籤切換
function initTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        // 移除舊的事件監聽器（避免重複綁定）
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // 只綁定click事件，不綁定長按功能
        newBtn.addEventListener('click', () => {
            const tabType = newBtn.dataset.tab;
            console.log('點擊 tab 按鈕:', tabType);
            
            // 移除所有活動狀態
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            // 添加活動狀態到當前按鈕
            newBtn.classList.add('active');
            
            // 根據標籤類型更新分類顯示（顯示所有分類）
            console.log('重新初始化分類網格');
            initCategoryGrid(tabType, null); // 傳入 null 表示顯示所有分類
        });
        
        // 明確阻止長按功能（防止未來添加）
        newBtn.addEventListener('touchstart', (e) => {
            // 不處理長按，只允許點擊
        }, { passive: true });
    });
}

// 初始化 Header 標籤（支出/收入/轉帳）
function initHeaderTabs() {
    // 優先使用記帳輸入頁面的標籤，如果沒有則使用 Header 標籤
    const recordTabs = document.querySelectorAll('.record-type-tab');
    const headerTabs = document.querySelectorAll('.header-tab');
    const tabs = recordTabs.length > 0 ? recordTabs : headerTabs;
    
    // 初始化默認類型
    if (!window.accountingType) {
        window.accountingType = 'expense';
    }
    
    // 根據當前的 accountingType 設置正確的 active 狀態
    tabs.forEach(tab => {
        if (tab.dataset.type === window.accountingType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    tabs.forEach(tab => {
        // 移除舊的事件監聽器（避免重複綁定）
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        // 恢復 active 狀態（如果原本是 active）
        if (tab.dataset.type === window.accountingType) {
            newTab.classList.add('active');
        }
        
        newTab.addEventListener('click', () => {
            const recordType = newTab.dataset.type;
            
            // 移除所有活動狀態
            tabs.forEach(t => t.classList.remove('active'));
            
            // 添加活動狀態到當前按鈕
            newTab.classList.add('active');
            
            // 保存記錄類型
            window.accountingType = recordType;
            
            // 顯示或隱藏轉帳帳戶選擇區域
            const transferSection = document.getElementById('transferAccountsSection');
            if (transferSection) {
                if (recordType === 'transfer') {
                    transferSection.style.display = 'flex';
                    // 初始化帳戶選項
                    initTransferAccountSelects();
                    // 重新初始化鍵盤，確保轉帳模式下可以正常輸入金額
                    initKeyboard();
                    expandInputSection();
                } else {
                    transferSection.style.display = 'none';
                }
            }
            
            // 重新初始化分類網格（顯示所有分類，不分類型）
            const activeTabBtn = document.querySelector('.tab-btn.active');
            const tabType = activeTabBtn ? activeTabBtn.dataset.tab : 'recommended';
            initCategoryGrid(tabType, null); // 傳入 null 表示顯示所有分類
            
            // 清除選中的分類
            window.selectedCategory = null;
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('selected');
            });
        });
    });
}

// 初始化轉帳帳戶選擇器
function initTransferAccountSelects() {
    const fromSelect = document.getElementById('transferFromAccount');
    const toSelect = document.getElementById('transferToAccount');

    console.log('開始初始化轉帳帳戶選擇器');
    console.log('fromSelect:', fromSelect);
    console.log('toSelect:', toSelect);
    
    if (!fromSelect || !toSelect) {
        console.log('轉帳帳戶選擇器元素不存在');
        return;
    }
    
    // 獲取所有帳戶
    const accounts = typeof getAccounts === 'function' ? getAccounts() : [];
    console.log('轉帳功能 - 找到帳戶數量:', accounts.length);
    console.log('轉帳功能 - 帳戶列表:', accounts);
    
    // 清空選項
    fromSelect.innerHTML = '<option value="">選擇帳戶</option>';
    toSelect.innerHTML = '<option value="">選擇帳戶</option>';
    
    if (accounts.length === 0) {
        // 沒有帳戶時顯示提示
        fromSelect.innerHTML = '<option value="">請先建立帳戶</option>';
        toSelect.innerHTML = '<option value="">請先建立帳戶</option>';
        
        // 顯示提示訊息
        const transferSection = document.getElementById('transferAccountsSection');
        if (transferSection) {
            const existingHint = transferSection.querySelector('.transfer-account-hint');
            if (!existingHint) {
                const hint = document.createElement('div');
                hint.className = 'transfer-account-hint';
                hint.innerHTML = `
                    <div style="text-align: center; padding: 8px; background: rgba(255, 107, 107, 0.1); border-radius: 8px; margin-top: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #ff6b6b;">📝 還沒有帳戶</p>
                        <button onclick="showAccountManageModal()" style="margin-top: 4px; padding: 4px 12px; background: #ff6b6b; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">立即建立帳戶</button>
                    </div>
                `;
                transferSection.appendChild(hint);
            }
        }
        return;
    }
    
    // 移除提示訊息（如果存在）
    const transferSection = document.getElementById('transferAccountsSection');
    if (transferSection) {
        const hint = transferSection.querySelector('.transfer-account-hint');
        if (hint) hint.remove();
    }
    
    const bindExpandEvents = (element) => {
        if (!element) return;
        ['focus', 'click', 'change'].forEach(evt => {
            element.addEventListener(evt, () => {
                expandInputSection();
            });
        });
    };

    // 添加帳戶選項
    accounts.forEach(account => {
        const option = `<option value="${account.id}">${account.name} (${account.currency || 'TWD'})</option>`;
        fromSelect.innerHTML += option;
        toSelect.innerHTML += option;
        console.log('添加帳戶選項:', account.name);
    });

    bindExpandEvents(fromSelect);
    bindExpandEvents(toSelect);

    // 設置預設選擇
    const defaultAccount = getDefaultAccount();
    if (defaultAccount) {
        fromSelect.value = defaultAccount.id;
        console.log('設置預設轉出帳戶:', defaultAccount.name);
    }
    
    // 檢查最終結果
    console.log('fromSelect options count:', fromSelect.options.length);
    console.log('toSelect options count:', toSelect.options.length);
    console.log('fromSelect HTML:', fromSelect.innerHTML);
    console.log('toSelect HTML:', toSelect.innerHTML);
    
    console.log('轉帳帳戶選擇器初始化完成');
}

// 初始化鍵盤輸入
function initKeyboard() {
    const keyboard = document.getElementById('keyboard');
    const amountDisplay = document.getElementById('amountDisplay');
    if (!keyboard || !amountDisplay) return;
    
    let displayValue = '0';
    let previousValue = null;
    let operator = null;
    let waitingForOperand = false;
    
    // 更新顯示
    const updateDisplay = () => {
        // 更新全局狀態
        if (window.keyboardState) {
            window.keyboardState.displayValue = displayValue;
        }
        // 格式化顯示（添加千分位）
        const numericValue = parseFloat(displayValue) || 0;
        amountDisplay.textContent = numericValue.toLocaleString('zh-TW');
    };
    
    // 將鍵盤狀態保存到全局變數，以便 quickRecord 可以訪問
    window.keyboardState = {
        displayValue: displayValue,
        previousValue: previousValue,
        operator: operator,
        waitingForOperand: waitingForOperand,
        setDisplayValue: (value) => {
            displayValue = value;
            previousValue = null;
            operator = null;
            waitingForOperand = false;
            if (window.keyboardState) {
                window.keyboardState.displayValue = value;
                window.keyboardState.previousValue = null;
                window.keyboardState.operator = null;
                window.keyboardState.waitingForOperand = false;
            }
            updateDisplay();
        },
        getDisplayValue: () => displayValue
    };
    
    // 安全計算表達式
    const calculate = (firstValue, secondValue, operation) => {
        const first = parseFloat(firstValue);
        const second = parseFloat(secondValue);
        
        if (isNaN(first) || isNaN(second)) {
            return null;
        }
        
        let result;
        switch (operation) {
            case '+':
                result = first + second;
                break;
            case '-':
                result = first - second;
                break;
            case '×':
                result = first * second;
                break;
            case '÷':
                if (second === 0) {
                    return null; // 除零錯誤
                }
                result = first / second;
                break;
            default:
                return null;
        }
        
        // 保留最多2位小數，去除多餘的0
        result = Math.round(result * 100) / 100;
        return result.toString();
    };
    
    // 處理按鍵點擊
    keyboard.addEventListener('click', (e) => {
        // 獲取被點擊的按鈕（可能是按鈕本身或按鈕內的子元素）
        const keyBtn = e.target.closest('.key-btn');
        if (!keyBtn) return;
        
        const key = keyBtn.dataset.key;
        if (!key) return;
        
        if (key === 'clear') {
            // 清除所有
            displayValue = '0';
            previousValue = null;
            operator = null;
            waitingForOperand = false;
            // 更新全局狀態
            if (window.keyboardState) {
                window.keyboardState.displayValue = displayValue;
                window.keyboardState.previousValue = null;
                window.keyboardState.operator = null;
                window.keyboardState.waitingForOperand = false;
            }
            updateDisplay();
        } else if (key === 'delete') {
            // 刪除最後一個字符
            if (waitingForOperand) {
                displayValue = '0';
                waitingForOperand = false;
            } else if (displayValue.length > 1) {
                displayValue = displayValue.slice(0, -1);
            } else {
                displayValue = '0';
            }
            updateDisplay();
        } else if (key === '=') {
            // 計算結果
            if (operator && previousValue !== null && !waitingForOperand) {
                const result = calculate(previousValue, displayValue, operator);
                if (result !== null) {
                    displayValue = result;
                    previousValue = null;
                    operator = null;
                    waitingForOperand = true;
                } else {
                    // 計算失敗（如除零）
                    const original = displayValue;
                    displayValue = '錯誤';
                    updateDisplay();
                    setTimeout(() => {
                        displayValue = original;
                        previousValue = null;
                        operator = null;
                        waitingForOperand = false;
                        updateDisplay();
                    }, 1500);
                    return;
                }
                updateDisplay();
            }
        } else if (key === '×' || key === '÷' || key === '+' || key === '-') {
            // 運算符處理
            const inputValue = parseFloat(displayValue);
            
            if (previousValue === null) {
                previousValue = displayValue;
            } else if (operator && !waitingForOperand) {
                // 連續運算：先計算前一個運算
                const result = calculate(previousValue, displayValue, operator);
                if (result !== null) {
                    displayValue = result;
                    previousValue = result;
                } else {
                    // 計算失敗
                    const original = displayValue;
                    displayValue = '錯誤';
                    updateDisplay();
                    setTimeout(() => {
                        displayValue = original;
                        previousValue = null;
                        operator = null;
                        waitingForOperand = false;
                        updateDisplay();
                    }, 1500);
                    return;
                }
                updateDisplay();
            }
            
            waitingForOperand = true;
            operator = key;
        } else if (key === '.') {
            // 小數點
            if (waitingForOperand) {
                displayValue = '0.';
                waitingForOperand = false;
            } else if (!displayValue.includes('.')) {
                displayValue += '.';
            }
            updateDisplay();
        } else {
            // 數字
            if (waitingForOperand) {
                displayValue = key;
                waitingForOperand = false;
            } else {
                if (displayValue === '0') {
                    displayValue = key;
                } else {
                    displayValue += key;
                }
            }
            updateDisplay();
        }
    });
}

// 初始化日期輸入欄位
function initDateButton() {
    const dateInput = document.getElementById('dateInput');
    if (!dateInput) return;
    
    // 初始化：設置今天日期（使用本地時區避免凌晨12點問題）
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dateInput.value = today;
    
    // 防止日期輸入框focus時自動滾動（手機適配）
    dateInput.addEventListener('focus', (e) => {
        // 使用nearest選項，避免自動滾動
        setTimeout(() => {
            if (dateInput.scrollIntoView) {
                dateInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }, 100);
    });
    
    dateInput.addEventListener('touchstart', (e) => {
        // 阻止默認行為，防止自動滾動
    }, { passive: true });
}

// 初始化常用備註按鈕
function initQuickNotes() {
    const quickNotesContainer = document.getElementById('quickNotesContainer');
    const quickNotesButtons = document.getElementById('quickNotesButtons');
    const noteInput = document.getElementById('noteInput');
    const inputSection = document.getElementById('inputSection');
    
    if (!quickNotesContainer || !quickNotesButtons || !noteInput) return;
    
    // 載入上一次的備註
    const lastNote = localStorage.getItem('lastQuickNote');
    if (lastNote && !noteInput.value.trim()) {
        noteInput.value = lastNote;
        // 觸發input事件，確保其他監聽器能收到
        noteInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 當輸入區域顯示時，顯示常用備註按鈕
    const observer = new MutationObserver(() => {
        if (inputSection && inputSection.style.display !== 'none') {
            quickNotesContainer.classList.add('show');
        }
    });
    
    if (inputSection) {
        observer.observe(inputSection, { attributes: true, attributeFilter: ['style'] });
        // 初始檢查
        if (inputSection.style.display !== 'none') {
            quickNotesContainer.classList.add('show');
        }
    }
    
    // 綁定常用備註按鈕點擊事件
    quickNotesButtons.querySelectorAll('.quick-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const note = btn.dataset.note;
            if (noteInput) {
                const currentValue = noteInput.value.trim();
                // 檢查輸入框是否已經包含該備註，避免重複
                if (currentValue.includes(note)) {
                    // 如果已包含，不重複添加
                    return;
                }
                // 如果輸入框已有內容，在後面追加；否則直接填入
                let newValue;
                if (currentValue) {
                    newValue = currentValue + ' ' + note;
                } else {
                    newValue = note;
                }
                noteInput.value = newValue;
                
                // 儲存這次使用的備註作為「上一次的備註」
                localStorage.setItem('lastQuickNote', newValue);
                
                // 觸發input事件，確保其他監聽器能收到
                noteInput.dispatchEvent(new Event('input', { bubbles: true }));
                // 聚焦到輸入框
                noteInput.focus();
            }
        });
    });
    
    // 當備註輸入框獲得焦點時，確保常用備註按鈕顯示
    noteInput.addEventListener('focus', (e) => {
        quickNotesContainer.classList.add('show');
        // 防止手機鍵盤彈出時視口移位
        e.preventDefault();
        setTimeout(() => {
            // 使用nearest選項，避免自動滾動
            if (noteInput.scrollIntoView) {
                noteInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }, 100);
    });
    
    // 監聽備註輸入框的變化，如果用戶手動輸入或修改，也更新記憶
    noteInput.addEventListener('input', () => {
        const currentValue = noteInput.value.trim();
        if (currentValue) {
            localStorage.setItem('lastQuickNote', currentValue);
        }
    });
    
    // 防止輸入框focus時自動滾動（手機適配）
    noteInput.addEventListener('touchstart', (e) => {
        // 阻止默認行為，防止自動滾動
    }, { passive: true });
}

// ========== 常用項目、上一筆複製、預設金額功能 ==========

// 獲取常用項目列表
function getQuickActions() {
    return JSON.parse(localStorage.getItem('quickActions') || '[]');
}

// 保存常用項目列表
function saveQuickActions(actions) {
    localStorage.setItem('quickActions', JSON.stringify(actions));
}

// 初始化常用項目顯示
function initQuickActions() {
    const quickActionsSection = document.getElementById('quickActionsSection');
    const quickActionsGrid = document.getElementById('quickActionsGrid');
    if (!quickActionsSection || !quickActionsGrid) return;
    
    const actions = getQuickActions();
    
    if (actions.length === 0) {
        quickActionsSection.style.display = 'none';
        return;
    }
    
    quickActionsSection.style.display = 'block';
    quickActionsGrid.innerHTML = '';
    
    actions.forEach((action, index) => {
        const actionItem = document.createElement('div');
        actionItem.className = 'quick-action-item';
        
        // 格式化顯示：分類名稱 + 金額
        const displayName = action.note || action.category;
        const displayAmount = action.amount ? `NT$${action.amount.toLocaleString('zh-TW')}` : '';
        
        actionItem.innerHTML = `
            <div class="quick-action-icon">${action.icon || '💰'}</div>
            <div class="quick-action-name">${displayName}</div>
            ${displayAmount ? `<div class="quick-action-amount">${displayAmount}</div>` : ''}
        `;
        
        actionItem.addEventListener('click', () => {
            quickRecord(action);
        });
        
        quickActionsGrid.appendChild(actionItem);
    });
    
    // 綁定編輯按鈕
    const editBtn = document.getElementById('editQuickActionsBtn');
    if (editBtn) {
        editBtn.onclick = (e) => {
            e.stopPropagation();
            showEditQuickActionsModal();
        };
    }
}

// 一鍵記錄
function quickRecord(action) {
    // 設置分類
    window.selectedCategory = action.category;
    window.accountingType = action.type || 'expense';
    
    // 更新分類選擇狀態
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.category === action.category) {
            item.classList.add('selected');
        }
    });
    
    // 設置金額（如果有預設金額）
    if (action.amount) {
        setAmountValue(action.amount);
    }
    
    // 設置備註（如果有）
    const noteInput = document.getElementById('noteInput');
    if (noteInput && action.note) {
        noteInput.value = action.note;
    }
    
    // 展開輸入區域（如果已收起）
    const inputSection = document.getElementById('inputSection');
    if (inputSection && inputSection.classList.contains('collapsed')) {
        inputSection.classList.remove('collapsed');
    }
    
    // 如果有預設金額且啟用自動保存，自動保存
    if (action.amount && action.autoSave !== false) {
        // 延遲一點時間，確保金額已設置
        setTimeout(() => {
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.click();
            }
        }, 200);
    }
}

// 設置金額值（更新鍵盤內部狀態和顯示）
function setAmountValue(amount) {
    const amountDisplay = document.getElementById('amountDisplay');
    if (!amountDisplay) return;
    
    // 格式化金額（去除千分位符號，只保留數字）
    const numericValue = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, ''));
    if (isNaN(numericValue) || numericValue < 0) return;
    
    // 使用鍵盤狀態的設置方法（如果存在）
    if (window.keyboardState && typeof window.keyboardState.setDisplayValue === 'function') {
        window.keyboardState.setDisplayValue(numericValue.toString());
    } else {
        // 如果鍵盤狀態不存在，直接更新顯示
        amountDisplay.textContent = numericValue.toLocaleString('zh-TW');
    }
    
    // 觸發視覺反饋
    amountDisplay.style.transform = 'scale(1.05)';
    amountDisplay.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
        if (amountDisplay) {
            amountDisplay.style.transform = 'scale(1)';
        }
    }, 200);
}

// 顯示編輯常用項目對話框
function showEditQuickActionsModal() {
    const actions = getQuickActions();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    let actionsHtml = actions.map((action, index) => `
        <div class="quick-action-edit-item" data-index="${index}">
            <div class="quick-action-edit-icon">${action.icon || '💰'}</div>
            <div class="quick-action-edit-info">
                <div class="quick-action-edit-category">${action.category}</div>
                ${action.amount ? `<div class="quick-action-edit-amount">NT$${action.amount.toLocaleString('zh-TW')}</div>` : ''}
            </div>
            <button class="quick-action-delete-btn" data-index="${index}">✕</button>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 16px; padding: 24px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 600;">編輯常用項目</h3>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>
            <div class="modal-body" id="quickActionsEditList" style="margin-bottom: 20px;">
                ${actionsHtml || '<div style="text-align: center; color: #999; padding: 20px;">暫無常用項目</div>'}
            </div>
            <div class="modal-footer" style="display: flex; gap: 12px;">
                <button id="addQuickActionBtn" style="flex: 1; padding: 12px; background: #ff69b4; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">新增項目</button>
                <button id="saveQuickActionsBtn" style="flex: 1; padding: 12px; background: #51cf66; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">完成</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    modal.querySelector('.modal-close-btn').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // 綁定刪除按鈕
    modal.querySelectorAll('.quick-action-delete-btn').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            actions.splice(index, 1);
            saveQuickActions(actions);
            document.body.removeChild(modal);
            initQuickActions();
            showEditQuickActionsModal();
        };
    });
    
    // 綁定新增按鈕
    modal.querySelector('#addQuickActionBtn').onclick = () => {
        playClickSound(); // 播放點擊音效
        showAddQuickActionModal(actions);
        document.body.removeChild(modal);
    };
    
    // 綁定完成按鈕
    modal.querySelector('#saveQuickActionsBtn').onclick = () => {
        document.body.removeChild(modal);
    };
}

// 顯示新增常用項目對話框
function showAddQuickActionModal(existingActions) {
    const categories = getEnabledCategories('expense').concat(getEnabledCategories('income'));
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 16px; padding: 24px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 600;">新增常用項目</h3>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">分類</label>
                    <select id="quickActionCategory" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px;">
                        ${categories.map(cat => `<option value="${cat.name}" data-type="${cat.type}" data-icon="${cat.icon}">${cat.icon} ${cat.name}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">預設金額（選填）</label>
                    <input type="number" id="quickActionAmount" placeholder="例如：60、120、55" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px;">
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">常用範例：早餐 $60、午餐 $120、咖啡 $55</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">預設備註（選填）</label>
                    <input type="text" id="quickActionNote" placeholder="例如：早餐" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="quickActionAutoSave" checked>
                        <span>一鍵記錄時自動保存（有預設金額時）</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 12px; margin-top: 24px;">
                <button id="cancelAddQuickActionBtn" style="flex: 1; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">取消</button>
                <button id="confirmAddQuickActionBtn" style="flex: 1; padding: 12px; background: #ff69b4; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">新增</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    modal.querySelector('.modal-close-btn').onclick = () => {
        document.body.removeChild(modal);
        showEditQuickActionsModal();
    };
    
    // 綁定取消按鈕
    modal.querySelector('#cancelAddQuickActionBtn').onclick = () => {
        document.body.removeChild(modal);
        showEditQuickActionsModal();
    };
    
    // 綁定確認按鈕
    modal.querySelector('#confirmAddQuickActionBtn').onclick = () => {
        playClickSound(); // 播放點擊音效
        const categorySelect = modal.querySelector('#quickActionCategory');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        const category = categorySelect.value;
        const type = selectedOption.dataset.type;
        const icon = selectedOption.dataset.icon;
        const amount = parseFloat(modal.querySelector('#quickActionAmount').value) || null;
        const note = modal.querySelector('#quickActionNote').value.trim() || null;
        const autoSave = modal.querySelector('#quickActionAutoSave').checked;
        
        if (!category) {
            alert('請選擇分類');
            return;
        }
        
        const newAction = {
            category: category,
            type: type,
            icon: icon,
            amount: amount,
            note: note,
            autoSave: autoSave
        };
        
        existingActions.push(newAction);
        saveQuickActions(existingActions);
        
        document.body.removeChild(modal);
        initQuickActions();
        showEditQuickActionsModal();
    };
}

// 上一筆複製功能
function initCopyLastButton() {
    const copyLastBtn = document.getElementById('copyLastBtn');
    if (!copyLastBtn) return;
    
    copyLastBtn.addEventListener('click', () => {
        copyLastRecord();
    });
}

// 複製上一筆記錄
function copyLastRecord() {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    if (records.length === 0) {
        alert('尚無記錄');
        return;
    }
    
    // 獲取最後一筆記錄
    const lastRecord = records[records.length - 1];
    
    // 設置分類
    window.selectedCategory = lastRecord.category;
    window.accountingType = lastRecord.type || 'expense';
    
    // 更新分類選擇狀態
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.category === lastRecord.category) {
            item.classList.add('selected');
        }
    });
    
    // 設置金額
    const amountDisplay = document.getElementById('amountDisplay');
    if (amountDisplay) {
        amountDisplay.textContent = (lastRecord.amount || 0).toLocaleString('zh-TW');
    }
    
    // 設置備註
    const noteInput = document.getElementById('noteInput');
    if (noteInput && lastRecord.note) {
        noteInput.value = lastRecord.note;
    }
    
    // 設置日期
    const dateInput = document.getElementById('dateInput');
    if (dateInput && lastRecord.date) {
        dateInput.value = lastRecord.date;
    }
    
    // 設置表情
    if (lastRecord.emoji) {
        window.selectedEmoji = lastRecord.emoji;
        const emojiBtn = document.querySelector('.emoji-btn');
        if (emojiBtn) {
            emojiBtn.textContent = lastRecord.emoji;
        }
    }
    
    // 設置成員
    if (lastRecord.member) {
        window.selectedMember = lastRecord.member;
        const memberDisplay = document.getElementById('memberDisplay');
        const memberInfo = document.getElementById('memberInfo');
        if (memberDisplay) memberDisplay.style.display = 'block';
        if (memberInfo) memberInfo.textContent = lastRecord.member;
    }
    
    // 設置帳戶
    if (lastRecord.account) {
        window.selectedAccount = { id: lastRecord.account };
        if (typeof updateAccountDisplay === 'function') {
            updateAccountDisplay();
        }
    }
    
    // 設置圖片（收據）- 支援多張圖片
    if (lastRecord.receiptImages && lastRecord.receiptImages.length > 0) {
        window.selectedReceiptImages = [...lastRecord.receiptImages];
        // 更新圖片預覽 UI（顯示第一張圖片作為預覽）
        const imagePreview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        if (previewImage && lastRecord.receiptImages[0]) {
            previewImage.src = lastRecord.receiptImages[0];
        }
        if (imagePreview) {
            imagePreview.style.display = 'block';
        }
    }
    
    alert('已複製上一筆記錄');
}

// 獲取分類的預設金額
function getDefaultAmount(categoryName) {
    const defaultAmounts = JSON.parse(localStorage.getItem('categoryDefaultAmounts') || '{}');
    return defaultAmounts[categoryName] || null;
}

// 保存分類的預設金額
function saveDefaultAmount(categoryName, amount) {
    const defaultAmounts = JSON.parse(localStorage.getItem('categoryDefaultAmounts') || '{}');
    if (amount && amount > 0) {
        defaultAmounts[categoryName] = amount;
    } else {
        delete defaultAmounts[categoryName];
    }
    localStorage.setItem('categoryDefaultAmounts', JSON.stringify(defaultAmounts));
}

// 應用預設金額
function applyDefaultAmount(categoryName) {
    const defaultAmount = getDefaultAmount(categoryName);
    if (defaultAmount) {
        const amountDisplay = document.getElementById('amountDisplay');
        if (amountDisplay && amountDisplay.textContent === '0') {
            amountDisplay.textContent = defaultAmount.toLocaleString('zh-TW');
        }
    }
}

// 初始化下月計入選項
function initNextMonthOption() {
    const nextMonthOption = document.getElementById('nextMonthOption');
    const nextMonthCheckbox = document.getElementById('nextMonthCheckbox');
    const customDateBtn = document.getElementById('customDateBtn');
    const inputSection = document.querySelector('.input-section');
    
    if (!nextMonthOption || !nextMonthCheckbox || !customDateBtn) return;
    
    // 預設隱藏選項（等待數字鍵盤展開）
    nextMonthOption.style.display = 'none';
    
    // 預設隱藏自訂日期按鈕
    customDateBtn.style.display = 'none';
    window.customNextMonthDate = null;
    
    // 根據數字鍵盤展開/收起狀態控制選項顯示
    const updateNextMonthOptionVisibility = () => {
        if (inputSection && inputSection.classList.contains('collapsed')) {
            // 數字鍵盤收起時，隱藏選項
            nextMonthOption.style.display = 'none';
        } else {
            // 數字鍵盤展開時，顯示選項
            nextMonthOption.style.display = 'flex';
        }
    };
    
    // 初始化時檢查狀態
    updateNextMonthOptionVisibility();
    
    // 使用 MutationObserver 監聽 input-section 的 class 變化
    if (inputSection) {
        const observer = new MutationObserver(updateNextMonthOptionVisibility);
        observer.observe(inputSection, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
    
    // 監聽複選框變化
    nextMonthCheckbox.addEventListener('change', () => {
        if (nextMonthCheckbox.checked) {
            // 顯示自訂日期按鈕
            customDateBtn.style.display = 'block';
            
            // 預設為下個月的今天
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            window.customNextMonthDate = nextMonth;
            
            // 重置按鈕文字和樣式
            customDateBtn.textContent = '設定日期';
            customDateBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        } else {
            // 隱藏自訂日期按鈕
            customDateBtn.style.display = 'none';
            window.customNextMonthDate = null;
        }
    });
    
    // 自訂日期按鈕
    customDateBtn.addEventListener('click', () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
        const nextMonthYear = nextMonthDate.getFullYear();
        const nextMonthNum = nextMonthDate.getMonth() + 1;
        
        // 詢問日期
        const dayInput = prompt(
            `設定下個月的扣款日期\n\n月份：${nextMonthYear}年${nextMonthNum}月\n\n請輸入日期（1-31）：`,
            today.getDate()
        );
        
        if (dayInput === null) return;
        
        const day = parseInt(dayInput);
        if (isNaN(day) || day < 1 || day > 31) {
            alert('請輸入有效的日期（1-31）');
            return;
        }
        
        // 檢查日期是否有效
        const testDate = new Date(nextMonthYear, nextMonthNum - 1, day);
        if (testDate.getMonth() !== nextMonthNum - 1) {
            alert(`${nextMonthYear}年${nextMonthNum}月沒有${day}號，請重新輸入`);
            return;
        }
        
        // 設定自訂日期
        window.customNextMonthDate = testDate;
        
        // 更新按鈕文字提示
        customDateBtn.textContent = `${nextMonthNum}/${day}`;
        customDateBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        
        alert(`已設定為 ${nextMonthYear}年${nextMonthNum}月${day}日`);
    });
}

// 初始化保存按鈕
function initSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const amountDisplay = document.getElementById('amountDisplay');
        const noteInput = document.getElementById('noteInput');
        const dateInputEl = document.getElementById('dateInput');
        
        if (!amountDisplay) return;
        
        const amount = parseFloat(amountDisplay.textContent.replace(/[^0-9.]/g, '')) || 0;
        
        if (amount <= 0) {
            alert('請輸入金額');
            return;
        }
        
        if (!window.selectedCategory) {
            alert('請選擇分類');
            return;
        }
        
        // 檢查是否計入下個月
        const nextMonthCheckbox = document.getElementById('nextMonthCheckbox');
        const isNextMonth = nextMonthCheckbox && nextMonthCheckbox.checked;
        
        // 獲取日期（使用本地時區避免凌晨12點問題）
        const now = new Date();
        let date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (dateInputEl && dateInputEl.value) {
            date = dateInputEl.value;
        }
        
        // 如果選擇計入下個月，調整日期
        if (isNextMonth) {
            const currentDate = new Date(date);
            // 使用自訂日期（如果有設定）或預設下個月同一天
            const nextMonthDate = window.customNextMonthDate || new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
            date = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`;
        }
        
        // 獲取記錄類型（默認為收入）
        const recordType = window.accountingType || 'income';
        
        // 如果是轉帳類型，需要驗證帳戶選擇
        if (recordType === 'transfer') {
            const fromAccount = document.getElementById('transferFromAccount')?.value;
            const toAccount = document.getElementById('transferToAccount')?.value;
            
            if (!fromAccount || !toAccount) {
                alert('請選擇轉出和轉入帳戶');
                return;
            }
            
            if (fromAccount === toAccount) {
                alert('轉出和轉入帳戶不能相同');
                return;
            }
        } else {
            // 非轉帳類型需要檢查帳戶
            // 獲取選中的帳戶（如果沒有選中，自動使用默認帳戶）
            let selectedAccount = getSelectedAccount();
            
            // 如果沒有選中帳戶，嘗試獲取默認帳戶
            if (!selectedAccount) {
                selectedAccount = getDefaultAccount();
            }
            
            // 如果還是沒有帳戶，提示創建帳戶
            if (!selectedAccount) {
                if (confirm('您還沒有創建帳戶。\n\n是否現在創建帳戶？\n\n點擊「確定」創建帳戶，點擊「取消」稍後再說。')) {
                    showAccountManageModal();
                }
                return;
            }
            
            // 如果之前沒有選中帳戶，現在自動選中默認帳戶
            if (!window.selectedAccount && selectedAccount) {
                window.selectedAccount = selectedAccount;
                // 更新帳戶顯示
                if (typeof updateAccountDisplay === 'function') {
                    updateAccountDisplay();
                }
            }
        }
        
        // 獲取選中的表情
        const selectedEmoji = window.selectedEmoji || null;
        
        // 獲取選中的成員
        const selectedMember = window.selectedMember || null;
        
        // 獲取選中的圖片（收據）- 支援多張圖片
        const receiptImages = window.selectedReceiptImages || [];
        
        // 創建記錄
        const record = {
            type: recordType,
            category: window.selectedCategory,
            amount: amount,
            note: noteInput ? noteInput.value.trim() : '',
            date: date,
            emoji: selectedEmoji,
            member: selectedMember,
            receiptImages: receiptImages, // 保存收據圖片陣列
            isNextMonthBill: isNextMonth, // 標記是否為下月帳單
            timestamp: new Date().toISOString()
        };
        
        // 根據記錄類型設定帳戶欄位
        if (recordType === 'transfer') {
            record.fromAccount = document.getElementById('transferFromAccount')?.value || '';
            record.toAccount = document.getElementById('transferToAccount')?.value || '';
            // 轉帳記錄不需要 account 欄位
        } else {
            // 獲取選中的帳戶（非轉帳類型）
            let selectedAccount = getSelectedAccount();
            if (!selectedAccount) {
                selectedAccount = getDefaultAccount();
            }
            record.account = selectedAccount?.id || '';
        }
        
        // 保存到 localStorage
        try {
            let records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
            records.push(record);
            
            // 檢查記錄大小（特別是包含圖片時）
            const recordSize = JSON.stringify(record).length;
            const totalSize = JSON.stringify(records).length;
            
            console.log(`記錄大小: ${recordSize} 字符, 總大小: ${totalSize} 字符`);
            
            // 如果單筆記錄太大，給出警告
            if (recordSize > 1000000) { // 1MB
                console.warn('單筆記錄過大，可能包含大型圖片');
                if (!confirm('這筆記錄包含的圖片較大，可能影響儲存效能。\n\n是否繼續儲存？')) {
                    return;
                }
            }
            
            localStorage.setItem('accountingRecords', JSON.stringify(records));
        } catch (error) {
            console.error('保存記帳記錄失敗:', error);
            
            // 檢查是否是localStorage空間不足
            if (error.name === 'QuotaExceededError') {
                const receiptImagesCount = receiptImages.length;
                let message = '儲存空間不足！\n\n可能原因：\n';
                
                if (receiptImagesCount > 0) {
                    message += `1. 照片檔案太大（${receiptImagesCount}張）\n`;
                    message += '2. 記錄數量過多\n\n';
                    message += '建議：\n';
                    message += '• 減少照片數量或壓縮照片\n';
                    message += '• 刪除一些舊的記錄\n';
                    message += '• 清除瀏覽器快取\n\n';
                    message += '提示：您可以先不選擇照片，完成記帳後再編輯添加照片。';
                } else {
                    message += '1. 記錄數量過多\n\n';
                    message += '建議：\n';
                    message += '• 刪除一些舊的記錄\n';
                    message += '• 清除瀏覽器快取';
                }
                
                alert(message);
            } else {
                alert('保存記帳記錄失敗，請重試。\n\n錯誤：' + error.message);
            }
            return;
        }
        
        // 如果是收入記錄，播放入帳音效
        if (recordType === 'income') {
            playIncomeSound(); // 播放入帳音效
        }

        // 觸發小森對話系統（不搭配音效）
        if (typeof checkAndTriggerMoriDialog === 'function') {
            checkAndTriggerMoriDialog(record);
        }

        // 檢查連續記帳鼓勵
        if (typeof checkStreakEncouragementDialog === 'function') {
            checkStreakEncouragementDialog();
        }

        // 檢查超支原因提示
        if (typeof checkOverspendReasonDialog === 'function') {
            checkOverspendReasonDialog();
        }

        // 更新帳戶顯示
        if (typeof updateAccountDisplay === 'function') {
            updateAccountDisplay();
        }
        
        // 重置表單（保留備註以便繼續使用）
        amountDisplay.textContent = '0';
        // 備註欄位不清除，讓用戶可以繼續使用上一次的備註
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('selected');
        });
        window.selectedCategory = null;
        window.selectedEmoji = null;
        window.selectedMember = null;
        window.selectedReceiptImages = [];
        
        // 重置成員顯示
        const memberDisplay = document.getElementById('memberDisplay');
        const memberInfo = document.getElementById('memberInfo');
        if (memberDisplay) memberDisplay.style.display = 'none';
        if (memberInfo) memberInfo.textContent = '未選擇成員';
        
        // 重置表情按鈕
        const emojiBtn = document.querySelector('.emoji-btn');
        if (emojiBtn) {
            emojiBtn.textContent = '😊';
            emojiBtn.innerHTML = '😊';
        }
        
        // 重置圖片預覽
        const imagePreviewReset = document.getElementById('imagePreview');
        const previewImageReset = document.getElementById('previewImage');
        if (imagePreviewReset) imagePreviewReset.style.display = 'none';
        if (previewImageReset) previewImageReset.src = '';
        
        // 重置日期為今天（使用本地時區避免凌晨12點問題）
        const dateInputReset = document.getElementById('dateInput');
        if (dateInputReset) {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            dateInputReset.value = today;
        }
        
        // 重置下月選項
        const nextMonthCheckboxReset = document.getElementById('nextMonthCheckbox');
        const customDateBtnReset = document.getElementById('customDateBtn');
        if (nextMonthCheckboxReset) {
            nextMonthCheckboxReset.checked = false;
        }
        if (customDateBtnReset) {
            customDateBtnReset.style.display = 'none';
            customDateBtnReset.textContent = '設定日期';
            customDateBtnReset.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        window.customNextMonthDate = null;
        
        // 記帳成功後自動收起輸入區域
        const inputSection = document.getElementById('inputSection');
        const collapseBtn = document.getElementById('collapseBtn');
        if (inputSection && collapseBtn) {
            if (!inputSection.classList.contains('collapsed')) {
                inputSection.classList.add('collapsed');
                const collapseIcon = collapseBtn.querySelector('.collapse-icon');
                if (collapseIcon) {
                    collapseIcon.textContent = '▲';
                }
            }
        }
        
        // 顯示成功訊息
        alert('記帳成功！');
        
        // 跳回首頁（記帳本頁面）
        goBackToLedger();
    });
}

// 投資記錄數據結構
// buy: { stockCode, stockName, date, price, shares, fee, isDCA, note, timestamp }
// sell: { stockCode, stockName, date, price, shares, fee, tax, note, timestamp, realizedPnl }
// dividend: { stockCode, stockName, date, exDividendDate, dividendType, perShare, historicalPerShare, shares, amount, reinvest, note, timestamp }

// 常見投資標的映射表（股票、ETF、債券）- 全局變數
// 從 JSON 文件載入
window.commonStocks = {};

// 載入股票名稱映射表
async function loadStockNames() {
    try {
        const response = await fetch('stocks.json');
        if (response.ok) {
            const data = await response.json();
            window.stockNameData = data;
            // 合併所有類型的標的
            window.commonStocks = {
                ...data.stocks,
                ...data.etfs,
                ...data.bonds
            };
            try {
                updateRebalanceDatalists();
            } catch (_) {}
        } else {
            // 如果載入失敗，使用預設值
            console.warn('無法載入 stocks.json，使用預設值');
            setDefaultStockNames();
            try {
                updateRebalanceDatalists();
            } catch (_) {}
        }
    } catch (error) {
        console.error('載入股票名稱失敗:', error);
        // 如果載入失敗，使用預設值
        setDefaultStockNames();
        try {
            updateRebalanceDatalists();
        } catch (_) {}
    }
}

// 設定預設股票名稱（作為備用）
function setDefaultStockNames() {
    window.commonStocks = {
        // 股票
        '2330': '台積電',
        '2317': '鴻海',
        '2454': '聯發科',
        '2308': '台達電',
        '2303': '聯電',
        '2412': '中華電',
        '1301': '台塑',
        '1303': '南亞',
        '1326': '台化',
        '2882': '國泰金',
        '2881': '富邦金',
        '2891': '中信金',
        '2886': '兆豐金',
        '2884': '玉山金',
        '2382': '廣達',
        '2357': '華碩',
        '2379': '瑞昱',
        '2301': '光寶科',
        '2324': '仁寶',
        // ETF
        '0050': '元大台灣50',
        '0056': '元大高股息',
        '00878': '國泰永續高股息',
        '00881': '國泰台灣5G+',
        '006208': '富邦台50',
        '00692': '富邦公司治理',
        '00713': '元大台灣高息低波',
        '00850': '元大台灣ESG永續',
        '00919': '群益台灣精選高息',
        '00929': '復華台灣科技優息',
        '00939': '統一台灣高息動能',
        '00940': '元大台灣價值高息',
        // 債券ETF
        '00720B': '元大投資級公司債',
        '00725B': '元大AAA至A公司債',
        '00751B': '元大20年期以上AAA至A級美元公司債',
        '00795B': '中信高評級公司債',
        '00834B': '第一金金融債10+',
        '00840B': '富邦全球投等債',
        // 政府債券
        'A04109': '10年期公債',
        'A04110': '20年期公債',
        'A04111': '30年期公債'
    };
}

function updateRebalanceDatalists() {
    const stockListEl = document.getElementById('rebalanceStockDatalist');
    const bondListEl = document.getElementById('rebalanceBondDatalist');
    if (!stockListEl && !bondListEl) return;

    const data = window.stockNameData || null;
    const stocks = data && data.stocks ? data.stocks : null;
    const etfs = data && data.etfs ? data.etfs : null;
    const bonds = data && data.bonds ? data.bonds : null;

    const addOptions = (datalist, entries) => {
        if (!datalist || !entries) return;
        const html = Object.entries(entries).map(([code, name]) => {
            const label = name ? `${code} ${name}` : code;
            return `<option value="${code}" label="${label}"></option>`;
        }).join('');
        datalist.innerHTML = html;
    };

    if (stockListEl) {
        if (stocks || etfs) {
            addOptions(stockListEl, { ...(stocks || {}), ...(etfs || {}) });
        } else {
            addOptions(stockListEl, window.commonStocks || {});
        }
    }

    if (bondListEl) {
        if (bonds) {
            addOptions(bondListEl, bonds);
        } else {
            const onlyBonds = {};
            Object.entries(window.commonStocks || {}).forEach(([code, name]) => {
                if (isBondInstrumentByCode(code)) {
                    onlyBonds[code] = name;
                }
            });
            addOptions(bondListEl, onlyBonds);
        }
    }
}

// 從投資記錄中查找股票名稱的全局函數
window.findStockName = function(code) {
    if (!code) return null;
    
    // 1. 先從常見股票映射表中查找
    if (window.commonStocks && window.commonStocks[code]) {
        return window.commonStocks[code];
    }
    
    // 2. 從持股中查找
    if (typeof getPortfolio === 'function') {
        const portfolio = getPortfolio();
        const portfolioStock = portfolio.find(s => s.stockCode === code);
        if (portfolioStock && portfolioStock.stockName) {
            return portfolioStock.stockName;
        }
    }
    
    // 3. 從所有投資記錄中查找
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const recordStock = records.find(r => r.stockCode === code);
    if (recordStock && recordStock.stockName) {
        return recordStock.stockName;
    }
    
    // 4. 如果都沒找到，返回null（讓用戶手動輸入）
    return null;
};

// 摘要按鈕切換（投資總覽）
function initSummaryToggle() {
    const toggleBtn = document.getElementById('summaryToggleBtn');
    const overviewGrid = document.getElementById('overviewSummaryGrid');
    if (!toggleBtn || !overviewGrid) return;
    toggleBtn.addEventListener('click', () => {
        const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        const next = !isOpen;
        toggleBtn.setAttribute('aria-expanded', String(next));
        overviewGrid.style.display = next ? 'grid' : 'none';
    });
}

// 檢查並執行到期的預約買入
function checkScheduledBuys() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let scheduled = JSON.parse(localStorage.getItem(SCHEDULED_BUY_STORAGE_KEY) || '[]');
    if (!Array.isArray(scheduled) || scheduled.length === 0) return;
    
    const due = [];
    const pending = [];
    scheduled.forEach(item => {
        const dateStr = item.date;
        if (dateStr && dateStr <= todayStr) {
            due.push(item);
        } else {
            pending.push(item);
        }
    });
    
    if (due.length === 0) return;
    
    let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const nowIso = new Date().toISOString();
    due.forEach(item => {
        records.push({
            type: 'buy',
            stockCode: item.stockCode,
            stockName: item.stockName || item.stockCode,
            date: item.date,
            price: item.price,
            shares: item.shares,
            fee: item.fee || 0,
            isDCA: item.isDCA || false,
            note: item.note || '預約買入自動執行',
            timestamp: nowIso,
            scheduledId: item.id || null
        });
    });
    
    localStorage.setItem('investmentRecords', JSON.stringify(records));
    localStorage.setItem(SCHEDULED_BUY_STORAGE_KEY, JSON.stringify(pending));
    
    // 更新顯示
    updateInvestmentSummary();
    updatePortfolioList();
    updateInvestmentRecords();
    updateStockSelects();
}

// 初始化投資專區頁面
function initInvestmentPage() {
    // 顯示投資總覽頁面
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const inputPage = document.getElementById('investmentInputPage');
    const dividendPage = document.getElementById('dividendPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    // 隱藏舊的表單
    const buyForm = document.getElementById('buyForm');
    const sellForm = document.getElementById('sellForm');
    const dividendForm = document.getElementById('dividendForm');
    const portfolioList = document.getElementById('portfolioList');
    const investmentRecords = document.getElementById('investmentRecords');
    
    if (overview) overview.style.display = 'block';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) inputPage.style.display = 'none';
    if (dividendPage) dividendPage.style.display = 'none';
    
    // 隱藏舊的表單和列表
    if (buyForm) buyForm.style.display = 'none';
    if (sellForm) sellForm.style.display = 'none';
    if (dividendForm) dividendForm.style.display = 'none';
    if (portfolioList) portfolioList.style.display = 'none';
    if (investmentRecords) investmentRecords.style.display = 'none';
    
    // 顯示底部導航欄（操作按鈕已隱藏）
    if (bottomNav) bottomNav.style.display = 'flex';
    if (investmentActions) investmentActions.style.display = 'none'; // 隱藏操作按鈕
    
    // 初始化操作按鈕（已隱藏，但保留功能以防需要）
    // initInvestmentActions();
    
    // 載入按鈕順序
    setTimeout(() => {
        loadButtonOrder();
    }, 100);
    
    // 初始化表單（用於舊版表單，如果需要的話）
    initBuyForm();
    initSellForm();
    initDividendForm();
    
    // 初始化日期欄位
    const buyDate = document.getElementById('buyDate');
    const sellDate = document.getElementById('sellDate');
    const dividendDate = document.getElementById('dividendDate');
    
    if (buyDate && !buyDate.value) {
        const now = new Date();
        buyDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (sellDate && !sellDate.value) {
        const now = new Date();
        sellDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (dividendDate && !dividendDate.value) {
        const now = new Date();
        dividendDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    // 摘要按鈕切換
    initSummaryToggle();
    // 檢查預約買入
    checkScheduledBuys();
    
    // 載入投資紀錄
    updateInvestmentRecords();
    
    // 更新投資總覽
    updateInvestmentOverview();
    
    // 初始化買入按鈕
    const buyBtn = document.getElementById('investmentBuyBtn');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            showInvestmentInputPage('buy');
        });
    }

    // 初始化定期定額按鈕
    const dcaBtn = document.getElementById('investmentDCABtn');
    if (dcaBtn) {
        dcaBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            showDCAManagementPage();
        });
    }

    const allocationBtn = document.getElementById('investmentAllocationBtn');
    if (allocationBtn) {
        allocationBtn.addEventListener('click', () => {
            playClickSound();
            showAssetAllocationModal();
        });
    }

    const rebalanceBtn = document.getElementById('investmentRebalanceBtn');
    if (rebalanceBtn) {
        rebalanceBtn.addEventListener('click', () => {
            playClickSound();
            showAnnualRebalanceModal();
        });
    }
    
    // 初始化強制重新抓價按鈕
    const forceRefreshBtn = document.getElementById('forceRefreshBtn');
    if (forceRefreshBtn) {
        forceRefreshBtn.addEventListener('click', async () => {
            playClickSound();
            forceRefreshBtn.disabled = true;
            forceRefreshBtn.textContent = '⏳';
            try {
                await forceRefreshAllPrices();
            } finally {
                forceRefreshBtn.disabled = false;
                forceRefreshBtn.textContent = '🔄';
            }
        });
    }
    
    // 初始化定時自動更新按鈕
    const autoRefreshBtn = document.getElementById('autoRefreshToggleBtn');
    if (autoRefreshBtn) {
        autoRefreshBtn.addEventListener('click', () => {
            playClickSound();
            toggleAutoRefreshPrices();
        });
    }
    
    // 初始化定時更新狀態
    initAutoRefreshPrices();
    updateAutoRefreshButton();

    // 初始化搜尋功能
    initStockSearch();

    // 初始化股債配置 / 年度再平衡
    initAssetAllocationCard();
    
    // 先使用已保存的價格更新顯示
    updateInvestmentOverview();
    
    // 然後自動載入所有持股的現價（在背景執行）
    // 使用 setTimeout 確保頁面先顯示，再開始獲取價格
    setTimeout(() => {
        autoLoadStockPrices();
    }, 500);
}

function getAssetAllocationSettings() {
    try {
        const raw = localStorage.getItem('assetAllocationSettings');
        const parsed = raw ? JSON.parse(raw) : {};
        const targetStock = parseFloat(parsed.targetStockRatio);
        const targetBond = parseFloat(parsed.targetBondRatio);
        const month = parseInt(parsed.rebalanceMonth, 10);
        const day = parseInt(parsed.rebalanceDay, 10);
        const horizon = parseInt(parsed.rebalanceHorizonMonths, 10);

        return {
            targetStockRatio: Number.isFinite(targetStock) ? targetStock : 80,
            targetBondRatio: Number.isFinite(targetBond) ? targetBond : 20,
            rebalanceMonth: Number.isFinite(month) ? month : 1,
            rebalanceDay: Number.isFinite(day) ? day : 1,
            rebalanceStockTicker: (parsed.rebalanceStockTicker || '0050').toString().trim(),
            rebalanceBondTicker: (parsed.rebalanceBondTicker || '00751B').toString().trim(),
            rebalanceHorizonMonths: Number.isFinite(horizon) ? horizon : 12
        };
    } catch (_) {
        return {
            targetStockRatio: 80,
            targetBondRatio: 20,
            rebalanceMonth: 1,
            rebalanceDay: 1,
            rebalanceStockTicker: '0050',
            rebalanceBondTicker: '00751B',
            rebalanceHorizonMonths: 12
        };
    }
}

function saveAssetAllocationSettings(settings) {
    try {
        localStorage.setItem('assetAllocationSettings', JSON.stringify(settings || {}));
    } catch (error) {
        console.error('保存股債配置設定失敗:', error);
    }
}

function normalizeRatioPair(stockRatio, bondRatio) {
    const s = Math.max(0, parseFloat(stockRatio) || 0);
    const b = Math.max(0, parseFloat(bondRatio) || 0);
    const sum = s + b;
    if (sum <= 0) return { stockPct: 0.8, bondPct: 0.2 };
    return { stockPct: s / sum, bondPct: b / sum };
}

function isBondInstrumentByCode(stockCode) {
    const code = String(stockCode || '').trim();
    if (!code) return false;
    if (code.startsWith('A0')) return true;
    if (code.endsWith('B')) return true;
    return false;
}

function computeStockBondMarketValues() {
    const portfolio = getPortfolio();
    let stockValue = 0;
    let bondValue = 0;

    portfolio.forEach(item => {
        const code = item.stockCode;
        const currentPrice = getStockCurrentPrice(code) || item.avgCost || 0;
        const value = (currentPrice || 0) * (item.shares || 0);
        if (isBondInstrumentByCode(code)) {
            bondValue += value;
        } else {
            stockValue += value;
        }
    });

    return {
        stockValue,
        bondValue,
        totalValue: stockValue + bondValue
    };
}

function sumEnabledDcaAmount() {
    const plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    return plans.filter(p => p && p.enabled).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
}

function formatPct(value) {
    if (value == null || !isFinite(value)) return '--';
    return `${(value * 100).toFixed(1)}%`;
}

function formatNtd(value) {
    const n = Math.round(parseFloat(value) || 0);
    return `NT$${n.toLocaleString('zh-TW')}`;
}

function calculateRebalanceAdvice({ budget, horizonMonths, targetStockRatio, targetBondRatio }) {
    const { stockPct, bondPct } = normalizeRatioPair(targetStockRatio, targetBondRatio);
    const values = computeStockBondMarketValues();

    const T = values.totalValue;
    const S = values.stockValue;
    const B = values.bondValue;

    const X = Math.max(0, parseFloat(budget) || 0);
    const N = Math.max(1, parseInt(horizonMonths, 10) || 12);
    const M = sumEnabledDcaAmount();

    const desiredStockAfterLump = stockPct * (T + X);
    const lumpStock = Math.max(0, Math.min(X, desiredStockAfterLump - S));
    const lumpBond = Math.max(0, X - lumpStock);

    const afterLumpStockValue = S + lumpStock;
    const afterLumpBondValue = B + lumpBond;
    const afterLumpTotal = afterLumpStockValue + afterLumpBondValue;
    const afterLumpStockPct = afterLumpTotal > 0 ? afterLumpStockValue / afterLumpTotal : 0;
    const afterLumpBondPct = afterLumpTotal > 0 ? afterLumpBondValue / afterLumpTotal : 0;

    const totalDcaHorizon = M * N;
    const desiredStockAfterHorizon = stockPct * (T + totalDcaHorizon);
    const neededStockOverHorizon = Math.max(0, Math.min(totalDcaHorizon, desiredStockAfterHorizon - S));
    const monthlyStock = neededStockOverHorizon / N;
    const monthlyBond = Math.max(0, M - monthlyStock);

    const afterHorizonStockValue = S + neededStockOverHorizon;
    const afterHorizonBondValue = B + (totalDcaHorizon - neededStockOverHorizon);
    const afterHorizonTotal = afterHorizonStockValue + afterHorizonBondValue;
    const afterHorizonStockPct = afterHorizonTotal > 0 ? afterHorizonStockValue / afterHorizonTotal : 0;
    const afterHorizonBondPct = afterHorizonTotal > 0 ? afterHorizonBondValue / afterHorizonTotal : 0;

    const currentStockPct = T > 0 ? S / T : 0;
    const currentBondPct = T > 0 ? B / T : 0;

    return {
        values,
        ratios: { stockPct, bondPct, currentStockPct, currentBondPct },
        lumpSum: { total: X, stock: lumpStock, bond: lumpBond },
        dca: { monthlyTotal: M, months: N, monthlyStock, monthlyBond },
        projections: {
            afterLump: { stockValue: afterLumpStockValue, bondValue: afterLumpBondValue, stockPct: afterLumpStockPct, bondPct: afterLumpBondPct },
            afterHorizon: { stockValue: afterHorizonStockValue, bondValue: afterHorizonBondValue, stockPct: afterHorizonStockPct, bondPct: afterHorizonBondPct }
        }
    };
}

function getTickerApproxShares(ticker, amountNtd) {
    const code = String(ticker || '').trim();
    if (!code) return null;
    const price = getStockCurrentPrice(code);
    if (!price || price <= 0) return null;
    const shares = Math.floor((parseFloat(amountNtd) || 0) / price);
    return shares > 0 ? { shares, price } : { shares: 0, price };
}

function buildBuySuggestionLine({ label, ticker, amount }) {
    const amt = Math.max(0, parseFloat(amount) || 0);
    if (!ticker) return `${label}：${formatNtd(amt)}（未指定標的）`;
    const shareInfo = getTickerApproxShares(ticker, amt);
    if (!shareInfo) {
        return `${label}：${formatNtd(amt)}（${ticker}；尚無現價，請先重新抓價或到個股詳情手動輸入現價）`;
    }
    return `${label}：${formatNtd(amt)}（${ticker} 約 ${shareInfo.shares.toLocaleString('zh-TW')} 股 @ ${shareInfo.price.toFixed(2)}）`;
}

function pickDominantAction(lumpSum) {
    if (!lumpSum || !lumpSum.total || lumpSum.total <= 0) return '未輸入預算';
    if (lumpSum.stock > lumpSum.bond) return '建議偏向買股';
    if (lumpSum.bond > lumpSum.stock) return '建議偏向買債';
    return '建議股債平均買入';
}

function updateAssetAllocationStatusText() {
    const statusEl = document.getElementById('assetAllocationStatus');
    if (!statusEl) return;
    const values = computeStockBondMarketValues();
    const T = values.totalValue;
    if (!T || T <= 0) {
        statusEl.textContent = '尚無市值資料';
        return;
    }
    const stockPct = values.stockValue / T;
    const bondPct = values.bondValue / T;
    statusEl.textContent = `目前：股 ${formatPct(stockPct)} / 債 ${formatPct(bondPct)}`;
}

function maybePromptAnnualRebalance(settings) {
    try {
        const month = parseInt(settings.rebalanceMonth, 10);
        const day = parseInt(settings.rebalanceDay, 10);
        if (!month || !day) return;

        const now = new Date();
        const isMatch = (now.getMonth() + 1) === month && now.getDate() === day;
        if (!isMatch) return;

        const yearKey = String(now.getFullYear());
        const lastYear = localStorage.getItem('assetAllocationLastPromptYear') || '';
        if (lastYear === yearKey) return;

        localStorage.setItem('assetAllocationLastPromptYear', yearKey);
        alert('提醒：今天是你設定的年度檢視日，可以進行股債再平衡（生成建議/調整定期定額）。');
    } catch (_) {}
}

function readAllocationInputs() {
    const stockRatio = document.getElementById('targetStockRatio');
    const bondRatio = document.getElementById('targetBondRatio');
    const month = document.getElementById('rebalanceMonth');
    const day = document.getElementById('rebalanceDay');
    const stockTicker = document.getElementById('rebalanceStockTicker');
    const bondTicker = document.getElementById('rebalanceBondTicker');
    const budget = document.getElementById('rebalanceLumpSumBudget');
    const horizon = document.getElementById('rebalanceHorizonMonths');

    return {
        targetStockRatio: parseFloat(stockRatio?.value) || 0,
        targetBondRatio: parseFloat(bondRatio?.value) || 0,
        rebalanceMonth: parseInt(month?.value, 10) || 1,
        rebalanceDay: parseInt(day?.value, 10) || 1,
        rebalanceStockTicker: (stockTicker?.value || '').toString().trim(),
        rebalanceBondTicker: (bondTicker?.value || '').toString().trim(),
        budget: parseFloat(budget?.value) || 0,
        rebalanceHorizonMonths: parseInt(horizon?.value, 10) || 12
    };
}

function fillAllocationInputsFromSettings(settings) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
    };

    setVal('targetStockRatio', settings.targetStockRatio);
    setVal('targetBondRatio', settings.targetBondRatio);
    setVal('rebalanceMonth', settings.rebalanceMonth);
    setVal('rebalanceDay', settings.rebalanceDay);
    setVal('rebalanceStockTicker', settings.rebalanceStockTicker);
    setVal('rebalanceBondTicker', settings.rebalanceBondTicker);
    setVal('rebalanceHorizonMonths', settings.rebalanceHorizonMonths);
}

function initAssetAllocationCard() {
    const card = document.getElementById('assetAllocationCard');
    if (!card) return;

    const settings = getAssetAllocationSettings();
    fillAllocationInputsFromSettings(settings);
    updateAssetAllocationStatusText();
    maybePromptAnnualRebalance(settings);

    const persist = () => {
        const input = readAllocationInputs();
        const cleaned = {
            targetStockRatio: input.targetStockRatio,
            targetBondRatio: input.targetBondRatio,
            rebalanceMonth: input.rebalanceMonth,
            rebalanceDay: input.rebalanceDay,
            rebalanceStockTicker: input.rebalanceStockTicker || settings.rebalanceStockTicker,
            rebalanceBondTicker: input.rebalanceBondTicker || settings.rebalanceBondTicker,
            rebalanceHorizonMonths: input.rebalanceHorizonMonths
        };
        saveAssetAllocationSettings(cleaned);
        updateAssetAllocationStatusText();
    };

    ['targetStockRatio','targetBondRatio','rebalanceMonth','rebalanceDay','rebalanceStockTicker','rebalanceBondTicker','rebalanceHorizonMonths']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', persist);
        });

    const generateBtn = document.getElementById('rebalanceGenerateBtn');
    if (generateBtn) {
        generateBtn.onclick = async () => {
            playClickSound();
            const input = readAllocationInputs();
            if (!input.budget || input.budget <= 0) {
                const v = await showAppPromptNumber({
                    title: '一次性加碼預算',
                    label: '請輸入本次一次性加碼預算（NT$）',
                    defaultValue: 0,
                    placeholder: '例如 50000'
                });
                if (v === null) return;
                input.budget = v;
                const budgetEl = document.getElementById('rebalanceLumpSumBudget');
                if (budgetEl) {
                    budgetEl.value = input.budget;
                }
            }
            persist();

            const advice = calculateRebalanceAdvice({
                budget: input.budget,
                horizonMonths: input.rebalanceHorizonMonths,
                targetStockRatio: input.targetStockRatio,
                targetBondRatio: input.targetBondRatio
            });

            const stockTicker = input.rebalanceStockTicker;
            const bondTicker = input.rebalanceBondTicker;

            const lumpStockLine = advice.lumpSum.total > 0
                ? buildBuySuggestionLine({ label: '買股', ticker: stockTicker, amount: advice.lumpSum.stock })
                : '未輸入預算';
            const lumpBondLine = advice.lumpSum.total > 0
                ? buildBuySuggestionLine({ label: '買債', ticker: bondTicker, amount: advice.lumpSum.bond })
                : '未輸入預算';

            const monthlyStockLine = advice.dca.monthlyTotal > 0
                ? buildBuySuggestionLine({ label: '每月買股', ticker: stockTicker, amount: advice.dca.monthlyStock })
                : '目前沒有啟用的定期定額';
            const monthlyBondLine = advice.dca.monthlyTotal > 0
                ? buildBuySuggestionLine({ label: '每月買債', ticker: bondTicker, amount: advice.dca.monthlyBond })
                : '目前沒有啟用的定期定額';

            const msg = [
                `目前市值：股票 ${formatNtd(advice.values.stockValue)}／債券 ${formatNtd(advice.values.bondValue)}／合計 ${formatNtd(advice.values.totalValue)}`,
                `目前比例：股 ${formatPct(advice.ratios.currentStockPct)}／債 ${formatPct(advice.ratios.currentBondPct)}`,
                `目標比例：股 ${formatPct(advice.ratios.stockPct)}／債 ${formatPct(advice.ratios.bondPct)}`,
                '',
                `一次性加碼（只買不賣）：`,
                pickDominantAction(advice.lumpSum),
                lumpStockLine,
                lumpBondLine,
                `買完後比例：股 ${formatPct(advice.projections.afterLump.stockPct)}／債 ${formatPct(advice.projections.afterLump.bondPct)}`,
                '',
                `定期定額建議（${advice.dca.months} 個月拉回；以目前啟用總額 ${formatNtd(advice.dca.monthlyTotal)}/月）：`,
                monthlyStockLine,
                monthlyBondLine,
                `跑完 ${advice.dca.months} 個月後比例：股 ${formatPct(advice.projections.afterHorizon.stockPct)}／債 ${formatPct(advice.projections.afterHorizon.bondPct)}`
            ].join('\n');

            localStorage.setItem('assetAllocationLastAdvice', JSON.stringify({
                at: Date.now(),
                input,
                advice
            }));

            await showAppAlert({ title: '再平衡建議', message: msg });
        };
    }

    const applyBtn = document.getElementById('rebalanceApplyDcaBtn');
    if (applyBtn) {
        applyBtn.onclick = () => {
            playClickSound();
            persist();
            const input = readAllocationInputs();
            const advice = calculateRebalanceAdvice({
                budget: input.budget,
                horizonMonths: input.rebalanceHorizonMonths,
                targetStockRatio: input.targetStockRatio,
                targetBondRatio: input.targetBondRatio
            });
            applyRebalanceToDcaPlans({
                monthlyStock: advice.dca.monthlyStock,
                monthlyBond: advice.dca.monthlyBond,
                stockTicker: input.rebalanceStockTicker,
                bondTicker: input.rebalanceBondTicker
            });
        };
    }
}

function applyRebalanceToDcaPlans({ monthlyStock, monthlyBond, stockTicker, bondTicker }) {
    let plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    const enabledPlans = plans.filter(p => p && p.enabled);

    const classifyPlan = (plan) => {
        const code = String(plan.stockCode || '').trim();
        return isBondInstrumentByCode(code) ? 'bond' : 'stock';
    };

    const stockPlans = enabledPlans.filter(p => classifyPlan(p) === 'stock');
    const bondPlans = enabledPlans.filter(p => classifyPlan(p) === 'bond');

    const pickTemplate = () => {
        const base = enabledPlans[0] || plans[0];
        return base ? {
            day: base.day || 1,
            autoFee: !!base.autoFee,
            customFee: parseFloat(base.customFee) || 0,
            fromAccountId: base.fromAccountId || '',
            settlementAccountId: base.settlementAccountId || (base.fromAccountId || '')
        } : {
            day: 1,
            autoFee: false,
            customFee: 0,
            fromAccountId: '',
            settlementAccountId: ''
        };
    };

    const ensurePlanExists = (group, ticker) => {
        const code = String(ticker || '').trim();
        if (!code) return null;
        const existing = enabledPlans.find(p => String(p.stockCode || '').trim() === code);
        if (existing) return existing;

        const tpl = pickTemplate();
        const newPlan = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            stockCode: code,
            stockName: (window.findStockName ? (window.findStockName(code) || code) : code),
            amount: 0,
            day: tpl.day,
            customFee: tpl.customFee,
            autoFee: tpl.autoFee,
            enabled: true,
            fromAccountId: tpl.fromAccountId,
            settlementAccountId: tpl.settlementAccountId,
            createdAt: new Date().toISOString(),
            lastExecuted: null,
            executedCount: 0
        };
        plans.push(newPlan);
        enabledPlans.push(newPlan);
        if (group === 'stock') stockPlans.push(newPlan);
        if (group === 'bond') bondPlans.push(newPlan);
        return newPlan;
    };

    if (stockPlans.length === 0) {
        ensurePlanExists('stock', stockTicker);
    }
    if (bondPlans.length === 0) {
        ensurePlanExists('bond', bondTicker);
    }

    const scaleGroup = (groupPlans, targetTotal) => {
        if (!groupPlans || groupPlans.length === 0) return;
        const total = groupPlans.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        if (total <= 0) {
            const each = targetTotal / groupPlans.length;
            groupPlans.forEach(p => {
                p.amount = Math.max(0, Math.round(each));
            });
            return;
        }

        let remaining = Math.max(0, Math.round(targetTotal));
        groupPlans.forEach((p, idx) => {
            const weight = (parseFloat(p.amount) || 0) / total;
            const next = idx === groupPlans.length - 1 ? remaining : Math.max(0, Math.round(targetTotal * weight));
            p.amount = next;
            remaining -= next;
        });
    };

    scaleGroup(stockPlans, monthlyStock);
    scaleGroup(bondPlans, monthlyBond);

    localStorage.setItem('dcaPlans', JSON.stringify(plans));
    if (typeof updateDCAList === 'function') {
        updateDCAList();
    }
    alert(`已套用定期定額配置：\n每月股票約 ${formatNtd(monthlyStock)}\n每月債券約 ${formatNtd(monthlyBond)}\n\n（已按現有啟用計畫比例調整；若某邊原本沒有計畫，已用你選的加碼標的新增一筆）`);
}

// 初始化股票搜尋功能
function initStockSearch() {
    const searchInput = document.getElementById('stockSearchInput');
    const searchClearBtn = document.getElementById('stockSearchClearBtn');
    
    if (searchInput) {
        // 輸入時即時搜尋
        searchInput.addEventListener('input', () => {
            updateStockList();
        });
        
        // 按 Enter 鍵時也觸發搜尋
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateStockList();
            }
        });
        
        // 觸摸設備的輸入反饋
        searchInput.addEventListener('touchstart', () => {
            searchInput.style.transform = 'scale(0.98)';
        });
        searchInput.addEventListener('touchend', () => {
            searchInput.style.transform = 'scale(1)';
        });
    }
    
    if (searchClearBtn) {
        // 清除搜尋
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                updateStockList();
            }
        });
        
        // 觸摸反饋
        searchClearBtn.addEventListener('touchstart', () => {
            searchClearBtn.style.transform = 'scale(0.9)';
        });
        searchClearBtn.addEventListener('touchend', () => {
            searchClearBtn.style.transform = 'scale(1)';
        });
    }
}

// 清除所有手動輸入的價格標記，讓系統重新抓價
function clearManualPriceMarks() {
    const stockPrices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    let clearedCount = 0;
    
    for (const stockCode in stockPrices) {
        const priceData = stockPrices[stockCode];
        if (priceData && typeof priceData === 'object' && priceData.isManual) {
            // 保留價格，但清除手動標記
            stockPrices[stockCode] = {
                price: priceData.price,
                timestamp: priceData.timestamp,
                isManual: false
            };
            clearedCount++;
        }
    }
    
    localStorage.setItem('stockCurrentPrices', JSON.stringify(stockPrices));
    console.log(`✅ 已清除 ${clearedCount} 個手動輸入標記`);
    return clearedCount;
}

// 強制重新抓取所有股價（忽略手動標記）
async function forceRefreshAllPrices() {
    // 先清除所有手動標記
    const clearedCount = clearManualPriceMarks();
    
    // 然後重新抓取所有股價
    await autoLoadStockPrices();
    
    if (clearedCount > 0) {
        console.log(`🔄 已清除 ${clearedCount} 個手動標記並重新抓取股價`);
    }
}

// 定時自動更新股價的 interval ID
let autoRefreshIntervalId = null;
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 分鐘

// 啟動定時自動更新股價
function startAutoRefreshPrices() {
    if (autoRefreshIntervalId) {
        console.log('⏰ 定時更新已在運行中');
        return;
    }
    
    autoRefreshIntervalId = setInterval(async () => {
        console.log('⏰ 定時自動更新股價...');
        // 定時更新時清除手動標記，確保能抓到最新價格
        clearManualPriceMarks();
        await autoLoadStockPrices();
    }, AUTO_REFRESH_INTERVAL);
    
    // 保存設定到 localStorage
    localStorage.setItem('autoRefreshPrices', 'true');
    console.log('⏰ 已啟動定時自動更新股價（每 5 分鐘）');
    
    // 更新按鈕狀態
    updateAutoRefreshButton();
}

// 停止定時自動更新股價
function stopAutoRefreshPrices() {
    if (autoRefreshIntervalId) {
        clearInterval(autoRefreshIntervalId);
        autoRefreshIntervalId = null;
        console.log('⏹️ 已停止定時自動更新股價');
    }
    
    // 保存設定到 localStorage
    localStorage.setItem('autoRefreshPrices', 'false');
    
    // 更新按鈕狀態
    updateAutoRefreshButton();
}

// 切換定時自動更新狀態
function toggleAutoRefreshPrices() {
    if (autoRefreshIntervalId) {
        stopAutoRefreshPrices();
    } else {
        startAutoRefreshPrices();
    }
}

// 更新自動更新按鈕狀態
function updateAutoRefreshButton() {
    const btn = document.getElementById('autoRefreshToggleBtn');
    if (btn) {
        const isRunning = !!autoRefreshIntervalId;
        btn.textContent = isRunning ? '⏹️' : '⏰';
        btn.title = isRunning ? '停止定時更新（每5分鐘）' : '啟動定時更新（每5分鐘）';
        btn.classList.toggle('is-running', isRunning);
    }
}

// 初始化時啟動自動更新：每次刷新立即抓價，並開啟定時更新
function initAutoRefreshPrices() {
    // 先做一次即時抓價（尊重手動價格，函式內會跳過）
    autoLoadStockPrices();

    // 預設開啟定時更新
    startAutoRefreshPrices();

    // 記錄設定，方便之後需要關閉時仍有狀態可循
    localStorage.setItem('autoRefreshPrices', 'true');
}

// 自動載入所有持股的現價
async function autoLoadStockPrices() {
    const portfolio = getPortfolio();
    if (portfolio.length === 0) return;
    
    // 獲取所有股票代碼
    const stockCodes = portfolio.map(stock => stock.stockCode);
    
    // 顯示載入提示
    const refreshBtn = document.getElementById('refreshInvestmentBtn');
    if (refreshBtn) {
        refreshBtn.textContent = '載入中...';
        refreshBtn.disabled = true;
    }
    
    try {
        // 批量獲取價格（逐個獲取，避免並發過多）
        let successCount = 0;
        let skippedCount = 0;
        for (const code of stockCodes) {
            try {
                const price = await fetchStockPrice(code, { allowPrompt: false });
                if (price) {
                    successCount++;
                    console.log(`成功獲取 ${code} 價格: ${price}`);
                } else {
                    console.log(`無法獲取 ${code} 價格，使用已保存的價格`);
                }

                // 每獲取一個價格就更新一次顯示，讓用戶看到即時更新
                updateInvestmentSummary();
                updateStockList();
            }
            catch (err) {
                console.error(`獲取 ${code} 股價失敗:`, err);
            }
        }
        
        console.log(`價格更新完成: ${successCount}/${stockCodes.length} 成功`);
        
        // 最後再更新一次，確保所有數據都是最新的
        updateInvestmentSummary();
        updateStockList();
    } catch (error) {
        console.error('自動載入股價失敗:', error);
        // 即使失敗也要更新顯示，使用已保存的價格
        updateInvestmentSummary();
        updateStockList();
    } finally {
        // 恢復按鈕
        if (refreshBtn) {
            refreshBtn.textContent = '🔄';
            refreshBtn.disabled = false;
        }
    }
}

// 初始化投資類型切換
function initInvestmentTypeTabs() {
    document.querySelectorAll('.investment-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新按鈕狀態
            document.querySelectorAll('.investment-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.dataset.type;
            
            // 顯示對應的表單
            document.getElementById('buyForm').style.display = type === 'buy' ? 'block' : 'none';
            document.getElementById('sellForm').style.display = type === 'sell' ? 'block' : 'none';
            document.getElementById('dividendForm').style.display = type === 'dividend' ? 'block' : 'none';
            document.getElementById('portfolioList').style.display = type === 'portfolio' ? 'block' : 'none';
            document.getElementById('investmentRecords').style.display = type === 'portfolio' ? 'none' : 'block';
            
            // 更新持股選擇列表
            if (type === 'sell' || type === 'dividend') {
                updateStockSelects();
            }
        });
    });
}

function exportExpenseCategorySummaryCsv() {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const expenses = records.filter(r => r && (r.type === 'expense' || !r.type));

    if (!expenses.length) {
        alert('沒有找到支出記錄');
        return;
    }

    const sums = new Map();
    const counts = new Map();

    expenses.forEach(r => {
        const category = (r.category || '未分類').toString();
        const amount = Number(String(r.amount ?? 0).replace(/,/g, '')) || 0;
        sums.set(category, (sums.get(category) || 0) + amount);
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    const rows = Array.from(sums.entries())
        .map(([category, total]) => ({ category, total, count: counts.get(category) || 0 }))
        .sort((a, b) => b.total - a.total);

    const escapeCsv = (v) => {
        const s = (v ?? '').toString();
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };

    const header = ['分類', '總金額', '筆數'];
    const lines = [header.map(escapeCsv).join(',')]
        .concat(rows.map(r => [r.category, Math.round(r.total), r.count].map(escapeCsv).join(',')));

    const csv = lines.join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const filename = `expense_category_summary_${y}-${m}-${d}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

function getGoogleSheetUploadUrl() {
    return (localStorage.getItem('googleSheetUploadUrl') || '').trim();
}

function getGoogleCloudBackupKey() {
    return (localStorage.getItem('googleCloudBackupKey') || '').trim();
}

function setGoogleCloudBackupKey() {
    const current = getGoogleCloudBackupKey();
    const next = prompt('請輸入雲端備份碼（換裝置時用同一組即可還原）\n\n建議：使用長一點、難猜的字串', current);
    if (next == null) return;
    const v = String(next).trim();
    if (!v) {
        localStorage.removeItem('googleCloudBackupKey');
        alert('已清除雲端備份碼');
        return;
    }
    localStorage.setItem('googleCloudBackupKey', v);
    alert('已儲存雲端備份碼');
}

function collectFullBackupPayload() {
    return {
        // 記帳相關
        accountingRecords: JSON.parse(localStorage.getItem('accountingRecords') || '[]'),
        categoryBudgets: JSON.parse(localStorage.getItem('categoryBudgets') || '{}'),
        categoryEnabledState: JSON.parse(localStorage.getItem('categoryEnabledState') || '{}'),
        dailyBudgetTracking: JSON.parse(localStorage.getItem('dailyBudgetTracking') || '{}'),
        customCategories: JSON.parse(localStorage.getItem('customCategories') || '[]'),
        categoryCustomIcons: JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}'),

        // 投資相關
        investmentRecords: JSON.parse(localStorage.getItem('investmentRecords') || '[]'),
        dcaPlans: JSON.parse(localStorage.getItem('dcaPlans') || '[]'),
        stockCurrentPrices: JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}'),

        // 分期
        installmentRules: JSON.parse(localStorage.getItem('installmentRules') || '[]'),

        // 帳戶相關
        accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),

        // 表情和圖標
        imageEmojis: JSON.parse(localStorage.getItem('imageEmojis') || '[]'),

        // 成員
        members: JSON.parse(localStorage.getItem('members') || '[]'),

        // 設定
        theme: localStorage.getItem('theme') || 'default',
        fontSize: localStorage.getItem('fontSize') || 'medium',
        customTheme: JSON.parse(localStorage.getItem('customTheme') || '{}'),

        // 備份資訊
        backupDate: new Date().toISOString(),
        backupVersion: 'cloud-1.0',
        appName: '記帳本'
    };
}

function cloudBackupToGoogleSheet() {
    const url = getGoogleSheetUploadUrl();
    if (!url) {
        alert('尚未設定 Web App URL');
        setGoogleSheetUploadUrl();
        return;
    }

    const backupKey = getGoogleCloudBackupKey();
    if (!backupKey) {
        alert('尚未設定雲端備份碼');
        setGoogleCloudBackupKey();
        return;
    }

    const payloadData = collectFullBackupPayload();
    const snapshot = JSON.stringify(payloadData);

    const payload = {
        action: 'save_snapshot',
        backupKey,
        snapshot
    };

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(() => {
        alert('已送出雲端備份（同一份 Google Sheet）\n\n請到 Google Sheet 確認是否有成功寫入。\n\n換裝置時，設定相同 Web App URL + 雲端備份碼，即可雲端還原。');
    }).catch((e) => {
        alert('雲端備份失敗：' + (e && e.message ? e.message : e));
    });
}

function cloudRestoreFromGoogleSheet() {
    const url = getGoogleSheetUploadUrl();
    if (!url) {
        alert('尚未設定 Web App URL');
        setGoogleSheetUploadUrl();
        return;
    }

    const backupKey = getGoogleCloudBackupKey();
    if (!backupKey) {
        alert('尚未設定雲端備份碼');
        setGoogleCloudBackupKey();
        return;
    }

    if (!confirm('確定要從雲端還原資料嗎？\n\n這將覆蓋現有的所有資料！')) {
        return;
    }

    // JSONP：用 script tag 取得資料（避免瀏覽器 CORS 限制）
    const cbName = `__cloudRestoreCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const cleanup = () => {
        try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
        if (script && script.parentNode) script.parentNode.removeChild(script);
    };

    window[cbName] = async (res) => {
        try {
            if (!res || !res.ok) {
                const err = (res && res.error) ? String(res.error) : '未知錯誤';
                if (err === 'Backup not found') {
                    const safeKey = backupKey ? `${backupKey.slice(0, 3)}***（長度 ${backupKey.length}）` : '(空)';
                    alert(
                        '雲端還原失敗：Backup not found\n\n' +
                        '代表雲端找不到此備份碼的備份資料。請依序檢查：\n' +
                        '1) 你是否曾在「雲端備份（完整）」成功備份過？（建議先備份一次再還原）\n' +
                        '2) Web App URL 是否正確、是否指到同一份 Google Sheet？\n' +
                        '3) 雲端備份碼是否完全一致（含大小寫/空白）？\n\n' +
                        `目前 Web App URL：${url}\n` +
                        `目前備份碼：${safeKey}`
                    );
                } else {
                    alert('雲端還原失敗：' + err);
                }
                cleanup();
                return;
            }

            const snapshotStr = res.snapshot;
            if (!snapshotStr) {
                alert('雲端還原失敗：找不到備份內容');
                cleanup();
                return;
            }

            const data = JSON.parse(snapshotStr);
            await applyBackupDataPayload(data);
        } catch (e) {
            alert('雲端還原失敗：' + (e && e.message ? e.message : e));
        } finally {
            cleanup();
        }
    };

    const qs = new URLSearchParams({
        action: 'load_snapshot',
        backupKey,
        callback: cbName
    });
    script.src = url + (url.includes('?') ? '&' : '?') + qs.toString();
    script.onerror = () => {
        alert('雲端還原失敗：無法連線到雲端備份服務（請確認 Web App 部署權限/網址）');
        cleanup();
    };
    document.body.appendChild(script);
}

function setGoogleSheetUploadUrl() {
    const current = getGoogleSheetUploadUrl();
    const url = prompt('請輸入 Google Apps Script Web App URL（/exec）', current);
    if (url == null) return;
    const next = String(url).trim();
    if (!next) {
        localStorage.removeItem('googleSheetUploadUrl');
        alert('已清除 Web App URL');
        return;
    }
    localStorage.setItem('googleSheetUploadUrl', next);
    alert('已儲存 Web App URL');
}

function buildAccountingRecordsTable(records) {
    const header = [
        'date',
        'type',
        'category',
        'amount',
        'note',
        'account',
        'member',
        'emoji',
        'isNextMonthBill',
        'timestamp'
    ];

    const rows = records.map(r => {
        const date = r?.date ?? '';
        const type = r?.type ?? '';
        const category = r?.category ?? '';
        const amount = Number(String(r?.amount ?? 0).replace(/,/g, '')) || 0;
        const note = r?.note ?? '';
        const account = r?.account ?? '';
        const member = r?.member ?? '';
        const emoji = r?.emoji ?? '';
        const isNextMonthBill = r?.isNextMonthBill ? 'true' : 'false';
        const timestamp = r?.timestamp ?? '';
        return [date, type, category, amount, note, account, member, emoji, isNextMonthBill, timestamp];
    });

    return [header, ...rows];
}

function uploadAllRecordsToGoogleSheet() {
    uploadAllRecordsDetailsToGoogleSheet();
}

function uploadAllRecordsDetailsToGoogleSheet() {
    const url = getGoogleSheetUploadUrl();
    if (!url) {
        alert('尚未設定 Web App URL');
        setGoogleSheetUploadUrl();
        return;
    }

    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    if (!records.length) {
        alert('沒有找到任何記錄');
        return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const sheetName = `Records-${y}-${m}-${d} ${hh}${mm}`;

    const table = buildAccountingRecordsTable(records);
    const payload = {
        action: 'upload_table',
        sheetName,
        table
    };

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(() => {
        alert(`已送出上傳，請到 Google Sheet 查看分頁：${sheetName}`);
    }).catch((e) => {
        alert('上傳失敗：' + (e && e.message ? e.message : e));
    });
}

function sanitizeGoogleSheetTabName(name) {
    const raw = String(name ?? '').trim() || '未命名';
    // Google Sheet tab name cannot contain: : \ / ? * [ ]
    const cleaned = raw.replace(/[:\\/\?\*\[\]]/g, '_').slice(0, 100);
    return cleaned || '未命名';
}

function buildAccountingRecordsTableForAccount(records, accountId, accountsById) {
    const header = [
        'date',
        'type',
        'category',
        'amount',
        'note',
        'account',
        'direction',
        'counterpartyAccount',
        'member',
        'emoji',
        'isNextMonthBill',
        'timestamp'
    ];

    const accountName = accountsById[accountId]?.name || accountId || '未分類帳戶';

    const rows = records.map(r => {
        const date = r?.date ?? '';
        const type = r?.type ?? '';
        const category = r?.category ?? '';
        const amount = Number(String(r?.amount ?? 0).replace(/,/g, '')) || 0;
        const note = r?.note ?? '';
        const member = r?.member ?? '';
        const emoji = r?.emoji ?? '';
        const isNextMonthBill = r?.isNextMonthBill ? 'true' : 'false';
        const timestamp = r?.timestamp ?? '';

        if (type === 'transfer') {
            const fromId = r?.fromAccount ?? '';
            const toId = r?.toAccount ?? '';
            const direction = fromId === accountId ? 'out' : (toId === accountId ? 'in' : '');
            const counterpartyId = direction === 'out' ? toId : (direction === 'in' ? fromId : '');
            const counterpartyAccount = accountsById[counterpartyId]?.name || counterpartyId;
            return [date, type, category, amount, note, accountName, direction, counterpartyAccount, member, emoji, isNextMonthBill, timestamp];
        }

        return [date, type, category, amount, note, accountName, '', '', member, emoji, isNextMonthBill, timestamp];
    });

    return [header, ...rows];
}

async function uploadRecordsByAccountToGoogleSheet() {
    const url = getGoogleSheetUploadUrl();
    if (!url) {
        alert('尚未設定 Web App URL');
        setGoogleSheetUploadUrl();
        return;
    }

    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    if (!records.length) {
        alert('沒有找到任何記錄');
        return;
    }

    const accounts = getAccounts();
    const accountsById = {};
    accounts.forEach(a => {
        if (a && a.id) accountsById[a.id] = a;
    });

    const uniqueTabNames = new Map();
    const ensureUniqueTabName = (base) => {
        const safe = sanitizeGoogleSheetTabName(base);
        const count = uniqueTabNames.get(safe) || 0;
        uniqueTabNames.set(safe, count + 1);
        return count === 0 ? safe : `${safe} (${count + 1})`;
    };

    const recordsByAccount = new Map();
    const ensureBucket = (id) => {
        const key = id || 'UNASSIGNED';
        if (!recordsByAccount.has(key)) recordsByAccount.set(key, []);
        return recordsByAccount.get(key);
    };

    records.forEach(r => {
        if (!r) return;
        const type = r.type || (r.fromAccount || r.toAccount ? 'transfer' : 'expense');
        if (type === 'transfer') {
            const fromId = r.fromAccount;
            const toId = r.toAccount;
            if (fromId) ensureBucket(fromId).push(r);
            if (toId && toId !== fromId) ensureBucket(toId).push(r);
            return;
        }
        ensureBucket(r.account).push(r);
    });

    const createdTabs = [];
    for (const [accountId, groupRecords] of recordsByAccount.entries()) {
        const accountName = accountId === 'UNASSIGNED'
            ? '未分類帳戶'
            : (accountsById[accountId]?.name || accountId);

        const sheetName = ensureUniqueTabName(accountName);
        const table = buildAccountingRecordsTableForAccount(groupRecords, accountId === 'UNASSIGNED' ? '' : accountId, accountsById);
        const payload = {
            action: 'upload_table',
            sheetName,
            table
        };

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        createdTabs.push(sheetName);
    }

    alert(`已送出按帳戶備份（${createdTabs.length} 個分頁）\n\n請到 Google Sheet 查看分頁：\n${createdTabs.join('\n')}`);
}

function maybeRemindMonthlyUpload() {
    const now = new Date();
    if (now.getDate() !== 20) return;

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${y}-${m}`;
    const storageKey = 'monthlyUploadReminderLastMonth';

    const last = localStorage.getItem(storageKey);
    if (last === monthKey) return;

    localStorage.setItem(storageKey, monthKey);

    const shouldGo = confirm('今天是每月20號，記得上傳本月記帳資料到 Google Sheet！\n\n要現在前往【設定】嗎？');
    if (!shouldGo) return;
    if (typeof showSettingsPage === 'function') {
        showSettingsPage();
        return;
    }
    const settingsNav = document.querySelector('.nav-item[data-page="settings"]');
    if (settingsNav) settingsNav.click();
}

function buildIncomeExpenseCategorySummaryTable(records) {
    const header = ['type', 'category', 'total_amount', 'count'];

    const rowsByKey = new Map();
    records.forEach(r => {
        if (!r) return;
        const type = r.type || 'expense';
        if (type !== 'expense' && type !== 'income') return;
        const category = (r.category || '未分類').toString();
        const amount = Number(String(r.amount ?? 0).replace(/,/g, '')) || 0;
        const key = `${type}__${category}`;
        const cur = rowsByKey.get(key) || { type, category, total: 0, count: 0 };
        cur.total += amount;
        cur.count += 1;
        rowsByKey.set(key, cur);
    });

    const rows = Array.from(rowsByKey.values())
        .sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return b.total - a.total;
        })
        .map(r => [r.type, r.category, Math.round(r.total), r.count]);

    return [header, ...rows];
}

function uploadIncomeExpenseCategorySummaryToGoogleSheet() {
    const url = getGoogleSheetUploadUrl();
    if (!url) {
        alert('尚未設定 Web App URL');
        setGoogleSheetUploadUrl();
        return;
    }

    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    if (!records.length) {
        alert('沒有找到任何記錄');
        return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const sheetName = `Summary-${y}-${m}-${d} ${hh}${mm}`;

    const table = buildIncomeExpenseCategorySummaryTable(records);
    if (table.length <= 1) {
        alert('沒有找到收入/支出可加總的記錄');
        return;
    }

    const payload = {
        action: 'upload_table',
        sheetName,
        table
    };

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(() => {
        alert(`已送出上傳，請到 Google Sheet 查看分頁：${sheetName}`);
    }).catch((e) => {
        alert('上傳失敗：' + (e && e.message ? e.message : e));
    });
}

// 初始化買入表單
function initBuyForm() {
    const submitBtn = document.getElementById('submitBuy');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            const stockCode = document.getElementById('stockCode').value.trim();
            const buyDate = document.getElementById('buyDate').value;
            const buyPrice = parseFloat(document.getElementById('buyPrice').value);
            const buyShares = parseInt(document.getElementById('buyShares').value);
            const buyFee = parseFloat(document.getElementById('buyFee').value) || 0;
            const isDCA = document.getElementById('isDCA').checked;
            const buyNote = document.getElementById('buyNote').value.trim();
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            if (!stockCode || !buyDate || !buyPrice || !buyShares) {
                alert('請填寫所有必填欄位');
        return;
            }
            
            if (buyPrice <= 0 || buyShares <= 0) {
                alert('價格和股數必須大於0');
                    return;
            }
            
            const timestamp = new Date().toISOString();
            // 如果日期在未來，儲存為預約買入，不立即出現在紀錄
            if (buyDate > todayStr) {
                const scheduled = JSON.parse(localStorage.getItem(SCHEDULED_BUY_STORAGE_KEY) || '[]');
                scheduled.push({
                    id: timestamp,
                    type: 'buy',
                    stockCode,
                    stockName: stockCode,
                    date: buyDate,
                    price: buyPrice,
                    shares: buyShares,
                    fee: buyFee,
                    isDCA,
                    note: buyNote || '預約買入'
                });
                localStorage.setItem(SCHEDULED_BUY_STORAGE_KEY, JSON.stringify(scheduled));
            } else {
                const buyRecord = {
                    type: 'buy',
                    stockCode: stockCode,
                    stockName: stockCode, // 可以後續擴展為股票名稱查詢
                    date: buyDate,
                    price: buyPrice,
                    shares: buyShares,
                    fee: buyFee,
                    isDCA: isDCA,
                    note: buyNote,
                    timestamp
                };
                
                // 儲存記錄
                let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
                records.push(buyRecord);
                localStorage.setItem('investmentRecords', JSON.stringify(records));
            }
            
            // 重置表單
            document.getElementById('stockCode').value = '';
            document.getElementById('buyPrice').value = '';
            document.getElementById('buyShares').value = '';
            document.getElementById('buyFee').value = '0';
            document.getElementById('isDCA').checked = false;
            document.getElementById('buyNote').value = '';
            
            // 即時更新只在立即買入時
            if (buyDate <= todayStr) {
                updateInvestmentSummary();
                updatePortfolioList();
                updateInvestmentRecords();
                updateStockSelects();
                // 更新投資總覽
                updateInvestmentOverview();
            }
            
            // 返回投資總覽頁面
            const overview = document.getElementById('investmentOverview');
            const buyForm = document.getElementById('buyForm');
            if (overview) overview.style.display = 'block';
            if (buyForm) buyForm.style.display = 'none';
            
            alert(buyDate > todayStr ? `已預約 ${buyDate} 買入！到期會自動入帳並顯示。` : '買入記錄已儲存！');
        });
    }
}

// 初始化賣出表單
function initSellForm() {
    const submitBtn = document.getElementById('submitSell');
    const sellStockCode = document.getElementById('sellStockCode');
    const sellPrice = document.getElementById('sellPrice');
    const sellShares = document.getElementById('sellShares');
    
    // 計算預估損益
    const calculateEstimatedPnl = () => {
        const stockCode = sellStockCode.value.trim();
        const price = parseFloat(sellPrice.value) || 0;
        const shares = parseInt(sellShares.value) || 0;
        const fee = parseFloat(document.getElementById('sellFee').value) || 0;
        const tax = parseFloat(document.getElementById('sellTax').value) || 0;
        
        if (!stockCode || !price || !shares) {
            document.getElementById('estimatedPnl').textContent = 'NT$0';
            document.getElementById('estimatedPnl').className = 'pnl-value';
            return;
        }
        
        // 計算平均成本
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        
        if (!stock || stock.shares < shares) {
            document.getElementById('estimatedPnl').textContent = '持股不足';
            document.getElementById('estimatedPnl').className = 'pnl-value';
            return;
        }
        
        const avgCost = stock.avgCost;
        const totalCost = avgCost * shares;
        const totalRevenue = price * shares - fee - tax;
        const pnl = totalRevenue - totalCost;
        
        const pnlEl = document.getElementById('estimatedPnl');
        pnlEl.textContent = `NT$${pnl.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        pnlEl.className = `pnl-value ${pnl >= 0 ? 'positive' : 'negative'}`;
    };
    
    if (sellStockCode) {
        sellStockCode.addEventListener('change', calculateEstimatedPnl);
    }
    if (sellPrice) {
        sellPrice.addEventListener('input', calculateEstimatedPnl);
    }
    if (sellShares) {
        sellShares.addEventListener('input', calculateEstimatedPnl);
    }
    
    // 提交賣出記錄的函數（可被按鈕和快捷鍵調用）
    const submitSellRecord = () => {
        playClickSound(); // 播放點擊音效
            const stockCode = sellStockCode.value.trim();
            const sellDate = document.getElementById('sellDate').value;
            const price = parseFloat(sellPrice.value);
            const shares = parseInt(sellShares.value);
            const fee = parseFloat(document.getElementById('sellFee').value) || 0;
            const tax = parseFloat(document.getElementById('sellTax').value) || 0;
            const sellNote = document.getElementById('sellNote').value.trim();
            
            if (!stockCode || !sellDate || !price || !shares) {
                alert('請填寫所有必填欄位');
                return;
            }
            
            if (price <= 0 || shares <= 0) {
                alert('價格和股數必須大於0');
                    return;
                }
                
            // 檢查持股是否足夠
            const portfolio = getPortfolio();
            const stock = portfolio.find(s => s.stockCode === stockCode);
            
            if (!stock || stock.shares < shares) {
                alert('持股不足，無法賣出');
            return;
            }
            
            // 計算實現損益
            const avgCost = stock.avgCost;
            const totalCost = avgCost * shares;
            const totalRevenue = price * shares - fee - tax;
            const realizedPnl = totalRevenue - totalCost;
            
            const sellRecord = {
                type: 'sell',
                stockCode: stockCode,
                stockName: stock.stockName,
                date: sellDate,
                price: price,
                shares: shares,
                fee: fee,
                tax: tax,
                note: sellNote,
                realizedPnl: realizedPnl,
                timestamp: new Date().toISOString()
            };
            
            // 儲存記錄
            let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
            records.push(sellRecord);
            localStorage.setItem('investmentRecords', JSON.stringify(records));
            
            // 重置表單
            sellStockCode.value = '';
            const now = new Date();
            document.getElementById('sellDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            sellPrice.value = '';
            sellShares.value = '';
            document.getElementById('sellFee').value = '0';
            document.getElementById('sellTax').value = '0';
            document.getElementById('sellNote').value = '';
            document.getElementById('estimatedPnl').textContent = 'NT$0';
            document.getElementById('estimatedPnl').className = 'pnl-value';
            
            // 更新顯示
            updateInvestmentSummary();
            updatePortfolioList();
            updateInvestmentRecords();
            updateStockSelects();
            
            alert(`賣出記錄已儲存！實現損益：NT$${realizedPnl.toLocaleString('zh-TW')}`);
    };
    
    if (submitBtn) {
        submitBtn.addEventListener('click', submitSellRecord);
    }
    
}

// 快速打開賣出頁面
function quickOpenSellPage() {
    // 先切換到投資專區（如果不在投資專區）
    const investmentPage = document.getElementById('investmentPage');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // 檢查是否在投資專區
    if (investmentPage && investmentPage.style.display === 'none') {
        // 切換到底部導航的投資專區
        const investmentNavBtn = document.querySelector('.nav-item[data-page="investment"]');
        if (investmentNavBtn) {
            investmentNavBtn.click();
            // 等待頁面切換完成
            setTimeout(() => {
                showInvestmentInputPage('sell');
            }, 100);
            return;
        }
    }
    
    // 如果已經在投資專區，直接顯示賣出輸入頁面
    showInvestmentInputPage('sell');
}


// 初始化股息表單
function initDividendForm() {
    const submitBtn = document.getElementById('submitDividend');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const stockCode = document.getElementById('dividendStockCode').value.trim();
            const dividendDate = document.getElementById('dividendDate').value;
            const dividendType = document.getElementById('dividendType').value;
            const perShareValue = parseFloat(document.getElementById('dividendPerShare').value);
            const sharesValue = parseInt(document.getElementById('dividendShares').value);
            let amount = parseFloat(document.getElementById('dividendAmount').value);
            const reinvest = document.getElementById('dividendReinvest').checked;
            const dividendNote = document.getElementById('dividendNote').value.trim();
            const exDateInput = document.getElementById('dividendExDate') || document.getElementById('dividendExDateInput');
            const historicalPerShareInput = document.getElementById('dividendHistoricalPerShare') || document.getElementById('dividendHistoricalPerShareInput');

            if ((!amount || amount <= 0) && perShareValue > 0 && sharesValue > 0) {
                amount = perShareValue * sharesValue;
                const amountInput = document.getElementById('dividendAmount');
                if (amountInput) amountInput.value = amount.toFixed(2);
            }

            if (!stockCode || !dividendDate || perShareValue <= 0 || sharesValue <= 0 || amount <= 0) {
                alert('請填寫所有必填欄位');
        return;
    }
    
            const dividendRecord = {
                type: 'dividend',
                stockCode: stockCode,
                stockName: stockCode,
                date: dividendDate,
                exDividendDate: exDateInput?.value || '',
                dividendType: dividendType,
                perShare: perShareValue,
                historicalPerShare: parseFloat(historicalPerShareInput?.value) || null,
                shares: sharesValue,
        amount: amount,
                reinvest: reinvest,
                note: dividendNote,
                timestamp: new Date().toISOString()
            };
            
            // 儲存記錄
            let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
            records.push(dividendRecord);
            
            // 如果是現金股利且選擇再投入，自動創建買入記錄
            if (dividendRecord.dividendType === 'cash' && reinvest && amount > 0) {
                // 優先使用現價，如果沒有現價則使用平均成本，都沒有則提示用戶輸入
                const savedPrice = getStockCurrentPrice(stockCode); // 獲取保存的現價
                const portfolio = getPortfolio();
                const stock = portfolio.find(s => s.stockCode === stockCode);
                const avgCost = stock && stock.avgCost > 0 ? stock.avgCost : 0;
                
                // 優先使用現價，其次使用平均成本
                let buyPrice = savedPrice || avgCost || 0;
                
                // 如果都沒有價格，提示用戶輸入
                if (buyPrice <= 0) {
                    const userPrice = prompt(`請輸入 ${stockCode} 的現價（用於計算股利再投入的股數）：`);
                    if (userPrice && parseFloat(userPrice) > 0) {
                        buyPrice = parseFloat(userPrice);
                    } else {
                        // 用戶取消或輸入無效，不創建買入記錄
                        console.log('未輸入價格，跳過股利再投入買入記錄');
                    }
                }
                
                // 如果有有效的買入價格，計算並創建買入記錄
                if (buyPrice > 0) {
                    const reinvestFee = calculateInvestmentFee(amount, Math.floor(amount / buyPrice));
                    const availableAmount = Math.max(amount - reinvestFee, 0);
                    const buyShares = Math.floor(availableAmount / buyPrice); // 向下取整
                    
                    if (buyShares > 0) {
                        const buyRecord = {
                            type: 'buy',
                            stockCode: stockCode,
                            stockName: stockCode,
                            date: dividendDate,
                            price: buyPrice,
                            shares: buyShares,
                            fee: reinvestFee,
                            isDividendReinvest: true, // 標記為股利再投入
                            dividendRecordId: dividendRecord.timestamp, // 關聯的股利記錄ID
                            note: `股利再投入（來自 ${dividendDate} 現金股利，使用${savedPrice ? '現價' : avgCost ? '平均成本' : '手動輸入價格'}）${dividendNote ? ' - ' + dividendNote : ''}`,
                            timestamp: new Date().toISOString()
                        };
                        records.push(buyRecord);
                        
                        // 創建記帳本轉帳記錄（從現金帳戶轉到投資帳戶）
                        try {
                            const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                            const transferRecord = {
                                type: 'transfer',
                                category: '股票再投入',
                                amount: amount, // 股利金額
                                note: `股利再投入：${stockCode} ${buyShares}股 @ NT$${buyPrice.toFixed(2)}`,
                                date: dividendDate,
                                fromAccount: '現金', // 從現金帳戶
                                toAccount: '投資', // 到投資帳戶
                                linkedInvestment: true,
                                investmentRecordId: buyRecord.timestamp,
                                timestamp: new Date().toISOString()
                            };
                            accountingRecords.push(transferRecord);
                            localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                            console.log('已創建股利再投入轉帳記錄');
                        } catch (e) {
                            console.warn('創建股利再投入轉帳記錄失敗:', e);
                        }
                    } else {
                        // 顯示通知：不足以買入至少1股
                        alert(`⚠️ 股利再投入金額不足\n\n股利金額：NT$${amount.toLocaleString('zh-TW')}\n手續費：NT$${reinvestFee.toLocaleString('zh-TW')}\n可用金額：NT$${availableAmount.toLocaleString('zh-TW')}\n股票現價：NT$${buyPrice.toFixed(2)}\n\n可用金額不足以買入至少1股（需要至少 NT$${buyPrice.toLocaleString('zh-TW')}）`);
                    }
                }
            }
            
            localStorage.setItem('investmentRecords', JSON.stringify(records));
    
    // 重置表單
            document.getElementById('dividendStockCode').value = '';
            const now = new Date();
            document.getElementById('dividendDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            document.getElementById('dividendPerShare').value = '';
            document.getElementById('dividendShares').value = '';
            document.getElementById('dividendAmount').value = '';
            document.getElementById('dividendReinvest').checked = false;
            document.getElementById('dividendNote').value = '';
            if (exDateInput) exDateInput.value = '';
            if (historicalPerShareInput) historicalPerShareInput.value = '';
            
            // 更新顯示
            updateInvestmentSummary();
            updatePortfolioList();
            updateInvestmentRecords();
            updateStockSelects();
            
            // 顯示成就感動畫
            const yearDividendEl = document.getElementById('yearDividend');
            if (yearDividendEl) {
                yearDividendEl.style.animation = 'none';
    setTimeout(() => {
                    yearDividendEl.style.animation = 'pulse 0.5s ease';
                }, 10);
            }
            
            alert('股息記錄已儲存！🎉');
        });
    }
}

// 獲取持股列表
function getPortfolio() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const portfolio = {};
    
    records.forEach(record => {
        const stockCode = record.stockCode;
        
        if (!portfolio[stockCode]) {
            portfolio[stockCode] = {
                stockCode: stockCode,
                stockName: record.stockName || stockCode,
                shares: 0,
                totalCost: 0,
                avgCost: 0
            };
        }
        
        if (record.type === 'buy') {
            const cost = record.price * record.shares + (record.fee || 0);
            portfolio[stockCode].shares += record.shares;
            portfolio[stockCode].totalCost += cost;
            portfolio[stockCode].avgCost = portfolio[stockCode].totalCost / portfolio[stockCode].shares;
        } else if (record.type === 'sell') {
            // 使用平均成本法計算剩餘持股
            const avgCost = portfolio[stockCode].avgCost;
            portfolio[stockCode].shares -= record.shares;
            portfolio[stockCode].totalCost -= avgCost * record.shares;
            if (portfolio[stockCode].shares <= 0) {
                portfolio[stockCode].shares = 0;
                portfolio[stockCode].totalCost = 0;
                portfolio[stockCode].avgCost = 0;
            }
        } else if (record.type === 'dividend' && record.dividendType === 'stock' && record.reinvest) {
            // 股票股利再投入
            portfolio[stockCode].shares += record.shares;
        }
    });
    
    // 過濾掉持股為0的股票
    return Object.values(portfolio).filter(stock => stock.shares > 0);
}

// 獲取股票的當前價格（從 localStorage）
function getStockCurrentPrice(stockCode) {
    const stockPrices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    const priceData = stockPrices[stockCode];
    
    if (!priceData) return null;
    
    // 如果是舊格式（直接是數字），返回價格
    if (typeof priceData === 'number') {
        return priceData;
    }
    
    // 新格式：包含 price, timestamp, isManual
    if (priceData.price) {
        return priceData.price;
    }
    
    return null;
}

// 取得完整的價格資料（含 timestamp / isManual）
function getStockPriceData(stockCode) {
    const stockPrices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    const priceData = stockPrices[stockCode];
    if (!priceData) return null;
    if (typeof priceData === 'number') {
        return { price: priceData, timestamp: null, isManual: false };
    }
    return priceData;
}

// 檢查是否有今天手動輸入的價格
function hasManualPriceToday(stockCode) {
    const stockPrices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    const priceData = stockPrices[stockCode];
     
    if (!priceData || typeof priceData === 'number') {
        return false; // 舊格式或不存在
    }
    
    // 檢查是否為手動輸入
    if (!priceData.isManual) {
        return false;
    }
    
    // 檢查是否為同一天（忽略時間）
    const today = new Date();
    const priceDate = new Date(priceData.timestamp);
    
    // 檢查是否為同一天（忽略時間）
    return today.getFullYear() === priceDate.getFullYear() &&
           today.getMonth() === priceDate.getMonth() &&
           today.getDate() === priceDate.getDate();
 }

// 保存股票的當前價格到 localStorage
function saveStockCurrentPrice(stockCode, price, isManual = false) {
    const stockPrices = JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}');
    stockPrices[stockCode] = {
        price: price,
        timestamp: Date.now(),
        isManual: isManual
    };
    localStorage.setItem('stockCurrentPrices', JSON.stringify(stockPrices));
}

function saveStockPreviousClosePrice(stockCode, price) {
    if (price == null || isNaN(price) || price <= 0) return;
    const previousCloses = JSON.parse(localStorage.getItem('stockPreviousClosePrices') || '{}');
    previousCloses[stockCode] = {
        price: price,
        timestamp: Date.now()
    };
    localStorage.setItem('stockPreviousClosePrices', JSON.stringify(previousCloses));
}

function showStockPriceQueryModal({ stockCode, stockName, isBondETF, defaultPrice }) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'price-query-modal';

        const querySites = [
            { label: 'Yahoo 股市', url: 'https://tw.stock.yahoo.com/quote/' + stockCode },
            { label: '鉅亨網', url: 'https://www.cnyes.com/twstock/' + stockCode },
            { label: 'MoneyDJ', url: 'https://www.moneydj.com/kmdj/stock/stock.aspx?stockid=' + stockCode }
        ];

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const header = document.createElement('div');
        header.className = 'price-query-modal__header';
        const title = document.createElement('h3');
        title.textContent = `無法取得 ${stockName || stockCode} 現價`;
        header.appendChild(title);

        const queryBtn = document.createElement('button');
        queryBtn.type = 'button';
        queryBtn.className = 'price-query-modal__action';
        queryBtn.textContent = '🔍 查詢';
        queryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetSite = querySites[0];
            if (targetSite && targetSite.url) {
                window.open(targetSite.url, '_blank', 'noopener,noreferrer');
            }
        });
        header.appendChild(queryBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'price-query-modal__close';
        closeBtn.textContent = '×';
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'modal-body price-query-modal__body';

        const hint = document.createElement('div');
        hint.className = 'price-query-modal__hint';
        hint.textContent = isBondETF
            ? '可能原因：該債券 ETF 不在資料來源中，或代碼格式不同。你可以先到下方網站查價後再回來輸入。'
            : '可能原因：網路連線問題、股票代碼不存在或資料來源暫時無法訪問。你可以先到下方網站查價後再回來輸入。';

        const linksWrap = document.createElement('div');
        linksWrap.className = 'price-query-modal__links';
        querySites.forEach(site => {
            const a = document.createElement('a');
            a.href = site.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `${site.label}：${site.url}`;
            a.className = 'price-query-modal__link';
            a.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            linksWrap.appendChild(a);
        });

        const inputLabel = document.createElement('div');
        inputLabel.className = 'price-query-modal__label';
        inputLabel.textContent = '請輸入現價';

        const input = document.createElement('input');
        input.type = 'number';
        input.inputMode = 'decimal';
        input.step = '0.01';
        input.min = '0';
        input.placeholder = '例如：123.45';
        input.value = (defaultPrice && defaultPrice > 0) ? defaultPrice.toFixed(2) : '';
        input.className = 'price-query-modal__input';

        const footer = document.createElement('div');
        footer.className = 'price-query-modal__footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = '取消';
        cancelBtn.className = 'price-query-modal__btn price-query-modal__btn--cancel';

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.textContent = '保存';
        okBtn.className = 'price-query-modal__btn price-query-modal__btn--ok';

        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);

        body.appendChild(hint);
        body.appendChild(linksWrap);
        body.appendChild(inputLabel);
        body.appendChild(input);
        body.appendChild(footer);

        content.appendChild(header);
        content.appendChild(body);

        const cleanup = (value) => {
            try {
                document.body.removeChild(modal);
            } catch (_) {}
            resolve(value);
        };

        overlay.addEventListener('click', () => cleanup(null));
        closeBtn.addEventListener('click', () => cleanup(null));
        cancelBtn.addEventListener('click', () => cleanup(null));
        content.addEventListener('click', (e) => e.stopPropagation());

        const submit = () => {
            const raw = (input.value || '').trim();
            const v = parseFloat(raw);
            if (!raw) {
                cleanup(null);
                return;
            }
            if (!isNaN(v) && v > 0) {
                cleanup(v);
                return;
            }
            input.focus();
        };

        okBtn.addEventListener('click', submit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submit();
            }
        });

        modal.appendChild(overlay);
        modal.appendChild(content);
        document.body.appendChild(modal);

        setTimeout(() => {
            try {
                input.focus();
                if (input.value) input.select();
            } catch (_) {}
        }, 0);
    });
}

async function fetchStockPrice(stockCode, options = {}) {
    const { allowPrompt = true, maxAgeMs = 6 * 60 * 60 * 1000 } = options;

    if (!stockCode) return null;

    const cached = getStockPriceData(stockCode);
    if (cached && cached.price && cached.price > 0 && cached.timestamp && (Date.now() - cached.timestamp) < maxAgeMs) {
        return cached.price;
    }

    const existing = pendingCurrentPriceFetch.get(stockCode);
    if (existing) return existing;

    const taskPromise = (async () => {
        try {
            // 處理債券 ETF 和特殊格式
            // 台灣股票/ETF 格式：2330.TW 或 00751B.TW
            // 注意：債券 ETF 代碼如 00751B 需要保持 B 後綴
            let yahooSymbol;
            
            // 檢查是否為債券 ETF（以 B 結尾）或其他特殊格式
            if (stockCode.endsWith('B') || stockCode.endsWith('L') || stockCode.endsWith('R') || stockCode.endsWith('U') || stockCode.endsWith('K')) {
                // 債券 ETF 或特殊 ETF，保持原格式
                yahooSymbol = `${stockCode}.TWO`;
            } else if (stockCode.startsWith('A0')) {
                // 政府債券代碼（如 A04109），Yahoo Finance 可能不支持，返回 null
                console.log(`債券代碼 ${stockCode} 無法從 Yahoo Finance 獲取價格`);
                return null;
            } else {
                // 一般股票或 ETF
                yahooSymbol = `${stockCode}.TW`;
            }

            const symbolCandidates = (stockCode.endsWith('B') || stockCode.endsWith('L') || stockCode.endsWith('R') || stockCode.endsWith('U') || stockCode.endsWith('K'))
                ? [`${stockCode}.TWO`, `${stockCode}.TW`]
                : [yahooSymbol];

            // 1) Try local proxy (opt-in)
            const proxyEndpoint = 'http://localhost:5000/api/quote?symbols=';
            const enableLocalQuoteProxy = String(localStorage.getItem('useLocalQuoteProxy') || '').toLowerCase() === 'true';
            if (enableLocalQuoteProxy && !isLocalQuoteProxyInCooldown()) {
                for (const candidateSymbol of symbolCandidates) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    try {
                        const proxyUrl = `${proxyEndpoint}${encodeURIComponent(candidateSymbol)}`;
                        const proxyResponse = await fetch(proxyUrl, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json'
                            },
                            signal: controller.signal
                        });

                        if (!proxyResponse || !proxyResponse.ok) {
                            continue;
                        }

                        const responseText = await proxyResponse.text();
                        let data;
                        try {
                            data = JSON.parse(responseText);
                        } catch (parseError) {
                            continue;
                        }

                        if (data && data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
                            const q = data.quoteResponse.result[0];
                            const previousClose = q.regularMarketPreviousClose || q.regularMarketPreviousClosePrice || q.regularMarketPreviousClose || null;
                            if (previousClose && previousClose > 0) {
                                saveStockPreviousClosePrice(stockCode, previousClose);
                            }

                            const currentPrice = q.regularMarketPrice || q.postMarketPrice || q.preMarketPrice || previousClose || null;
                            if (currentPrice && currentPrice > 0) {
                                saveStockCurrentPrice(stockCode, currentPrice, false);
                                console.log(`✓ 成功獲取 ${stockCode} 價格: ${currentPrice}`);
                                return currentPrice;
                            }
                        }

                        if (data && data.chart && data.chart.result) {
                            if (data.chart.result.length === 0) {
                                continue;
                            }

                            const result = data.chart.result[0];
                            if (result && result.meta && !result.error) {
                                const previousClose = result.meta.previousClose || result.meta.regularMarketPreviousClose || null;
                                if (previousClose && previousClose > 0) {
                                    saveStockPreviousClosePrice(stockCode, previousClose);
                                }

                                const currentPrice = result.meta.regularMarketPrice || previousClose || null;
                                if (currentPrice && currentPrice > 0) {
                                    saveStockCurrentPrice(stockCode, currentPrice, false);
                                    console.log(`✓ 成功獲取 ${stockCode} 價格: ${currentPrice}`);
                                    return currentPrice;
                                }
                            }
                        }
                    } catch (proxyError) {
                        if (proxyError.name === 'AbortError') {
                            continue;
                        }
                        markQuoteProxyFailed();
                        maybeAlertQuoteProxyDown();
                        break;
                    } finally {
                        clearTimeout(timeoutId);
                    }
                }
            }

            // 2) Public proxy fallback for ALL symbols，附加輕量重試
            for (let attempt = 0; attempt < 2; attempt++) {
                for (const candidateSymbol of symbolCandidates) {
                    const yahooChartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${candidateSymbol}?interval=1d&range=1d`;
                    const currentPrice = await fetchYahooChartViaPublicProxies(yahooChartUrl, stockCode);
                    if (currentPrice && currentPrice > 0) {
                        saveStockCurrentPrice(stockCode, currentPrice, false);
                        console.log(`✓ 透過公開代理成功獲取 ${stockCode} 價格: ${currentPrice}`);
                        return currentPrice;
                    }
                }
            }

            // 如果所有代理都失敗，嘗試使用備用方案（僅針對債券 ETF）
            // 注意：瀏覽器控制台可能仍會顯示 404 等錯誤，這是正常的，代碼會正確處理
            if (stockCode.endsWith('B')) {
                console.log(`債券 ETF ${stockCode} 無法從 Yahoo Finance 獲取價格，嘗試備用方法...`);
                
                // 嘗試方案1：使用不同的 Yahoo Finance 格式（移除 .TW 後綴）
                try {
                    const alternativeSymbol = `${stockCode}.TWO`; // 不帶 .TW
                    const testUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${alternativeSymbol}?interval=1d&range=1d`;
                    
                    // 嘗試通過代理訪問
                    for (const proxyUrl of publicQuoteProxies) {
                        try {
                            let proxyResponse;
                            if (proxyUrl.includes('allorigins')) {
                                const yahooUrl = encodeURIComponent(testUrl);
                                proxyResponse = await fetch(proxyUrl + yahooUrl);
                            } else if (proxyUrl.includes('codetabs')) {
                                proxyResponse = await fetch(proxyUrl + encodeURIComponent(testUrl));
                            } else if (proxyUrl.includes('corsproxy.io')) {
                                proxyResponse = await fetch(proxyUrl + encodeURIComponent(testUrl));
                            } else {
                                proxyResponse = await fetch(proxyUrl + testUrl);
                            }
                            
                            // 檢查響應狀態
                            if (!proxyResponse || proxyResponse.status === 404) {
                                continue; // 靜默跳過 404 或無響應
                            }
                            
                            if (proxyResponse.status === 200 && proxyResponse.ok) {
                                const responseText = await proxyResponse.text();
                                try {
                                    const data = JSON.parse(responseText);
                                    
                                    if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                                        const result = data.chart.result[0];
                                        if (result && result.meta) {
                                            const currentPrice = result.meta.regularMarketPrice || result.meta.previousClose || null;
                                            if (currentPrice && currentPrice > 0) {
                                                saveStockCurrentPrice(stockCode, currentPrice, false); // false = 自動獲取
                                                console.log(`✓ 通過備用格式成功獲取 ${stockCode} 價格: ${currentPrice}`);
                                                return currentPrice;
                                            }
                                        }
                                    }
                                } catch (parseError) {
                                    continue; // 解析失敗，嘗試下一個
                                }
                            }
                        } catch (altError) {
                            continue; // 靜默跳過所有錯誤
                        }
                    }
                } catch (backupError) {
                    console.log('備用格式嘗試失敗:', backupError);
                }
                
                // 嘗試方案2：檢查是否有已保存的價格
                const savedPrice = getStockCurrentPrice(stockCode);
                if (savedPrice && savedPrice > 0) {
                    console.log(`使用已保存的 ${stockCode} 價格: ${savedPrice}`);
                    return savedPrice;
                }

                // 如果都沒有，返回 null 交由通用流程處理
            }
            
            // 記錄警告信息
            if (stockCode.endsWith('B')) {
                console.warn(`債券 ETF ${stockCode} 無法自動獲取價格`);
                console.info(`可能原因：該債券 ETF 不在 Yahoo Finance 數據庫中，或代碼格式不同`);
            } else {
                console.warn(`代碼 ${stockCode} 無法獲取價格`);
                console.info(`請在個股詳情頁面手動輸入價格`);
            }
            
            // 如果有已保存的價格，返回它（即使不是今天的）
            const savedPrice = getStockCurrentPrice(stockCode);
            if (savedPrice) {
                return savedPrice;
            }
            
            throw new Error('所有代理服務都無法獲取價格');
        } catch (error) {
            const errorMsg = error.message || '未知錯誤';
            console.error(`獲取 ${stockCode} 股價失敗:`, errorMsg);
            const savedPrice = getStockCurrentPrice(stockCode);

            // 顯示友好的提示框（保持手動輸入管道）
            if (allowPrompt) {
                const stockName = findStockName(stockCode) || stockCode;
                const isBondETF = stockCode.endsWith('B');

                const manualPrice = await showStockPriceQueryModal({
                    stockCode,
                    stockName,
                    isBondETF,
                    defaultPrice: savedPrice
                });

                if (manualPrice && !isNaN(manualPrice) && manualPrice > 0) {
                    saveStockCurrentPrice(stockCode, manualPrice, true);
                    console.log(`✓ 已保存手動輸入的 ${stockCode} 價格: ${manualPrice}`);
                    if (typeof updateInvestmentSummary === 'function') {
                        updateInvestmentSummary();
                    }
                    if (typeof updateStockList === 'function') {
                        updateStockList();
                    }
                    return manualPrice;
                }
            }

            // 如果是債券 ETF 或代碼不存在，給出更友好的提示
            if (stockCode.endsWith('B')) {
                console.info(`💡 提示：債券 ETF ${stockCode} 無法自動獲取價格`);
                console.info(`   請點擊該持股卡片，在「現價」欄位中手動輸入當前價格`);
            } else if (errorMsg.includes('不存在') || errorMsg.includes('404')) {
                console.info(`💡 提示：代碼 ${stockCode} 在 Yahoo Finance 中不存在`);
                console.info(`   請在個股詳情頁面手動輸入價格`);
            }

            // 返回已保存的價格（如果有的話），否則返回 null
            return savedPrice || null;
        }
    })();

    pendingCurrentPriceFetch.set(stockCode, taskPromise);
    try {
        return await taskPromise;
    } finally {
        pendingCurrentPriceFetch.delete(stockCode);
    }
}

// 批量獲取多支股票的現價
async function fetchMultipleStockPrices(stockCodes) {
    const promises = stockCodes.map(code => 
        fetchStockPrice(code).catch(err => {
            console.error(`獲取 ${code} 股價失敗:`, err);
            return null;
        })
    );
    
    const results = await Promise.all(promises);
    return results;
}

function updateStockSelects() {
    const portfolio = getPortfolio();
    const sellSelect = document.getElementById('sellStockSelect');
    const dividendSelect = document.getElementById('dividendStockSelect');
    
    const updateSelect = (select) => {
        if (!select) return;
        select.innerHTML = '<option value="">請選擇持股</option>';
        portfolio.forEach(stock => {
            const option = document.createElement('option');
            option.value = stock.stockCode;
            option.textContent = `${stock.stockCode} (${stock.shares}股)`;
            select.appendChild(option);
        });
    };
    
    updateSelect(sellSelect);
    updateSelect(dividendSelect);
    
    // 綁定選擇事件
    if (sellSelect) {
        sellSelect.addEventListener('change', (e) => {
            document.getElementById('sellStockCode').value = e.target.value;
        });
    }
    
    if (dividendSelect) {
        dividendSelect.addEventListener('change', (e) => {
            document.getElementById('dividendStockCode').value = e.target.value;
            // 自動填入持股數
            const stock = portfolio.find(s => s.stockCode === e.target.value);
            if (stock) {
                document.getElementById('dividendShares').value = stock.shares;
            }
        });
    }
}

// 更新投資摘要
function updateInvestmentSummary() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const portfolio = getPortfolio();
    
    // 計算總投入金額
    let totalInvested = 0;
    records.filter(r => r.type === 'buy').forEach(record => {
        totalInvested += record.price * record.shares + (record.fee || 0);
    });
    
    // 計算總市值（使用保存的當前價格，如果沒有則使用平均成本）
    let totalMarketValue = 0;
    portfolio.forEach(stock => {
        const currentPrice = getStockCurrentPrice(stock.stockCode) || stock.avgCost;
        totalMarketValue += currentPrice * stock.shares;
    });
    
    // 計算未實現損益
    // 需要計算實際的總成本（考慮已賣出的部分）
    let totalCost = 0;
    portfolio.forEach(stock => {
        totalCost += stock.totalCost;
    });
    const unrealizedPnl = totalMarketValue - totalCost;
    
    // 計算今年已領股息
    const currentYear = new Date().getFullYear();
    let yearDividend = 0;
    records.filter(r => r.type === 'dividend' && r.dividendType === 'cash').forEach(record => {
        const recordYear = new Date(record.date).getFullYear();
        if (recordYear === currentYear) {
            yearDividend += record.amount || 0;
        }
    });
    
    // 計算總股息（所有年份）
    let totalDividend = 0;
    records.filter(r => r.type === 'dividend' && r.dividendType === 'cash').forEach(record => {
        totalDividend += record.amount || 0;
    });
    
    // 計算已實現損益
    let realizedPnl = 0;
    records.filter(r => r.type === 'sell').forEach(record => {
        realizedPnl += record.realizedPnl || 0;
    });
    
    // 計算年化報酬率
    const annualReturn = calculateAnnualReturn(totalInvested, totalMarketValue, realizedPnl, totalDividend, records);
    
    // 計算投資 vs 生活支出比例
    updateInvestmentExpenseRatio();
    
    // 更新顯示
    const totalInvestedEl = document.getElementById('totalInvested');
    const totalMarketValueEl = document.getElementById('totalMarketValue');
    const unrealizedPnlEl = document.getElementById('unrealizedPnl');
    const yearDividendEl = document.getElementById('yearDividend');
    const annualReturnEl = document.getElementById('annualReturn');
    const stockBondSummaryEl = document.getElementById('stockBondSummaryValue');
    const summaryToggleInvested = document.getElementById('summaryToggleInvested');
    const summaryTogglePnl = document.getElementById('summaryTogglePnl');
    const summaryToggleReturn = document.getElementById('summaryToggleReturn');
    const summaryToggleDividend = document.getElementById('summaryToggleDividend');
    
    if (totalInvestedEl) {
        const roundedTotalInvested = Math.round(totalInvested);
        totalInvestedEl.textContent = `NT$${roundedTotalInvested.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`;
        if (summaryToggleInvested) {
            summaryToggleInvested.textContent = `NT$${roundedTotalInvested.toLocaleString('zh-TW')}`;
        }
    }
    if (totalMarketValueEl) {
        const roundedTotalMarketValue = Math.round(totalMarketValue);
        totalMarketValueEl.textContent = `NT$${roundedTotalMarketValue.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`;
    }
    if (unrealizedPnlEl) {
        const roundedUnrealizedPnl = Math.round(unrealizedPnl);
        unrealizedPnlEl.textContent = `NT$${roundedUnrealizedPnl.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`;
        unrealizedPnlEl.className = `summary-value auto-size ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`;
        if (summaryTogglePnl) {
            summaryTogglePnl.textContent = `${unrealizedPnl >= 0 ? '+' : ''}${Math.round(unrealizedPnl).toLocaleString('zh-TW')}`;
            summaryTogglePnl.className = `summary-toggle__metric-value ${unrealizedPnl > 0 ? 'positive' : (unrealizedPnl < 0 ? 'negative' : 'neutral')}`;
        }
    }
    if (yearDividendEl) {
        yearDividendEl.textContent = `NT$${yearDividend.toLocaleString('zh-TW')}`;
        if (summaryToggleDividend) {
            summaryToggleDividend.textContent = `NT$${yearDividend.toLocaleString('zh-TW')}`;
        }
    }
    if (annualReturnEl) {
        if (annualReturn !== null && !isNaN(annualReturn) && isFinite(annualReturn)) {
            const returnValue = (annualReturn * 100).toFixed(2);
            annualReturnEl.textContent = `${returnValue >= 0 ? '+' : ''}${returnValue}%`;
            annualReturnEl.className = `summary-value ${annualReturn >= 0 ? 'positive' : 'negative'}`;
            if (summaryToggleReturn) {
                summaryToggleReturn.textContent = `${returnValue >= 0 ? '+' : ''}${returnValue}%`;
                summaryToggleReturn.className = `summary-toggle__metric-value ${annualReturn > 0 ? 'positive' : (annualReturn < 0 ? 'negative' : 'neutral')}`;
            }
        } else {
            // 檢查為什麼無法計算
            const buyRecords = records.filter(r => r.type === 'buy');
            if (buyRecords.length === 0) {
                annualReturnEl.textContent = '--';
            } else {
                // 檢查投資時間
                let earliestDate = null;
                buyRecords.forEach(record => {
                    const dateStr = record.date || record.timestamp;
                    if (dateStr) {
                        const recordDate = new Date(dateStr);
                        if (!isNaN(recordDate.getTime()) && (!earliestDate || recordDate < earliestDate)) {
                            earliestDate = recordDate;
                        }
                    }
                });
                
                if (earliestDate) {
                    const days = (new Date() - earliestDate) / (1000 * 60 * 60 * 24);
                    if (days < 30) {
                        annualReturnEl.textContent = '計算中...';
                    } else {
                        annualReturnEl.textContent = '--';
                    }
                } else {
                    annualReturnEl.textContent = '--';
                }
            }
            annualReturnEl.className = 'summary-value';
            if (summaryToggleReturn) {
                summaryToggleReturn.textContent = '--';
                summaryToggleReturn.className = 'summary-toggle__metric-value neutral';
            }
        }
    }

    if (stockBondSummaryEl) {
        const values = computeStockBondMarketValues();
        const totalValue = values.totalValue || 0;
        if (totalValue > 0) {
            const stockPct = values.stockValue / totalValue;
            const bondPct = values.bondValue / totalValue;
            stockBondSummaryEl.textContent = `股 ${formatPct(stockPct)} / 債 ${formatPct(bondPct)}`;
        } else {
            stockBondSummaryEl.textContent = '尚無資料';
        }
    }
}

// 計算投資 vs 生活支出比例
function updateInvestmentExpenseRatio() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // 獲取記帳記錄
    const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    // 計算本月生活支出（排除投資相關支出）
    const monthExpenses = accountingRecords.filter(record => {
        const recordDate = new Date(record.date);
        const isCurrentMonth = recordDate.getFullYear() === currentYear && 
                              recordDate.getMonth() + 1 === currentMonth;
        const isExpense = record.type === 'expense' || !record.type;
        const isNotInvestment = record.category !== '存股' && 
                               record.category !== '投資' &&
                               !record.linkedInvestment;
        return isCurrentMonth && isExpense && isNotInvestment;
    });
    
    const monthLifeExpense = monthExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 計算本月投資支出（買入記錄）
    const investmentRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const monthInvestments = investmentRecords.filter(record => {
        if (record.type !== 'buy') return false;
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear && 
               recordDate.getMonth() + 1 === currentMonth;
    });
    
    const monthInvestmentExpense = monthInvestments.reduce((sum, record) => {
        const price = record.price || 0;
        const shares = record.shares || 0;
        const fee = record.fee || 0;
        return sum + (price * shares + fee);
    }, 0);
    
    // 更新顯示
    const ratioCard = document.getElementById('investmentExpenseRatioCard');
    const ratioEl = document.getElementById('investmentExpenseRatio');
    const ratioHint = document.getElementById('investmentExpenseRatioHint');
    
    if (ratioCard && ratioEl && ratioHint) {
        const totalExpense = monthLifeExpense + monthInvestmentExpense;
        
        if (totalExpense > 0) {
            const investmentRatio = (monthInvestmentExpense / totalExpense * 100).toFixed(1);
            const lifeRatio = (monthLifeExpense / totalExpense * 100).toFixed(1);
            
            ratioEl.textContent = `投資 ${investmentRatio}% : 生活 ${lifeRatio}%`;
            ratioHint.textContent = `投資：NT$${monthInvestmentExpense.toLocaleString('zh-TW')} | 生活：NT$${monthLifeExpense.toLocaleString('zh-TW')}`;
            ratioCard.style.display = 'flex';
        } else {
            ratioCard.style.display = 'none';
        }
    }
}

// 計算年化報酬率
function calculateAnnualReturn(totalInvested, totalMarketValue, realizedPnl, totalDividend, records) {
    // 如果沒有投入金額，無法計算
    if (totalInvested <= 0) {
        return null;
    }
    
    // 找到第一筆買入記錄的日期
    const buyRecords = records.filter(r => r.type === 'buy');
    if (buyRecords.length === 0) {
        return null;
    }
    
    // 找到最早的買入日期
    let firstBuyDate = null;
    let earliestDate = null;
    
    buyRecords.forEach(record => {
        const dateStr = record.date || record.timestamp;
        if (!dateStr) return;
        
        const recordDate = new Date(dateStr);
        // 檢查日期是否有效
        if (isNaN(recordDate.getTime())) return;
        
        if (!earliestDate || recordDate < earliestDate) {
            earliestDate = recordDate;
            firstBuyDate = record;
        }
    });
    
    if (!firstBuyDate || !earliestDate) {
        return null;
    }
    
    const startDate = earliestDate;
    const endDate = new Date();
    
    // 計算投資年數
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const years = days / 365.25;
    
    // 如果投資時間少於30天，不計算年化報酬率
    if (days < 30) {
        return null;
    }
    
    // 當前總價值 = 總市值 + 已實現損益 + 總股息
    const currentTotalValue = totalMarketValue + realizedPnl + totalDividend;
    
    // 如果當前總價值小於等於0，無法計算
    if (currentTotalValue <= 0) {
        return null;
    }
    
    // 年化報酬率 = ((當前總價值 / 總投入金額) ^ (1 / 投資年數)) - 1
    const ratio = currentTotalValue / totalInvested;
    if (ratio <= 0) {
        return null;
    }
    
    const annualReturn = Math.pow(ratio, 1 / years) - 1;
    
    // 檢查結果是否為有效數字
    if (isNaN(annualReturn) || !isFinite(annualReturn)) {
        return null;
    }
    
    return annualReturn;
}

// 更新持股列表
function updatePortfolioList() {
    const portfolio = getPortfolio();
    const portfolioList = document.getElementById('portfolioList');
    
    if (!portfolioList) return;
    
    if (portfolio.length === 0) {
        portfolioList.innerHTML = '<div class="empty-state">尚無持股</div>';
        return;
    }
    
    let html = '';
    portfolio.forEach(stock => {
        const marketValue = stock.avgCost * stock.shares; // 暫時用平均成本代替市值
        const pnl = marketValue - stock.totalCost;
        
        html += `
            <div class="portfolio-item">
                <div class="portfolio-header">
                    <div>
                        <div class="portfolio-name">${stock.stockCode}</div>
                        <div class="portfolio-shares">${stock.shares} 股</div>
                    </div>
                    </div>
                <div class="portfolio-details">
                    <div class="portfolio-detail-item">
                        <div class="portfolio-detail-label">平均成本</div>
                        <div class="portfolio-detail-value">NT$${stock.avgCost.toFixed(2)}</div>
                    </div>
                    <div class="portfolio-detail-item">
                        <div class="portfolio-detail-label">總成本</div>
                        <div class="portfolio-detail-value">NT$${stock.totalCost.toLocaleString('zh-TW')}</div>
                </div>
                    <div class="portfolio-detail-item">
                        <div class="portfolio-detail-label">市值</div>
                        <div class="portfolio-detail-value">NT$${marketValue.toLocaleString('zh-TW')}</div>
                    </div>
                    <div class="portfolio-detail-item">
                        <div class="portfolio-detail-label">未實現損益</div>
                        <div class="portfolio-detail-value ${pnl >= 0 ? 'positive' : 'negative'}">
                            ${pnl >= 0 ? '+' : ''}NT$${pnl.toLocaleString('zh-TW')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    portfolioList.innerHTML = html;
}

const INVESTMENT_RECORDS_PAGE_SIZE = 6;
let investmentRecordsCurrentPage = 0;

function parseRecordDate(record) {
    if (!record) return 0;
    if (record.date) {
        const parsed = new Date(record.date);
        if (!isNaN(parsed)) return parsed.getTime();
    }
    if (record.timestamp) {
        const parsed = new Date(record.timestamp);
        if (!isNaN(parsed)) return parsed.getTime();
    }
    return 0;
}

function getInvestmentRecordDateKey(record) {
    if (!record) return 'unknown';
    if (record.date) {
        const parsed = new Date(record.date);
        if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
    }
    if (record.timestamp) {
        const parsed = new Date(record.timestamp);
        if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
    }
    return 'unknown';
}

function formatInvestmentRecordDateLabel(key) {
    if (!key || key === 'unknown') return '未設定日期';
    const parsed = new Date(key);
    if (isNaN(parsed)) return key;
    return parsed.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
}

function getAmountLevelClass(amount) {
    const value = Math.abs(amount || 0);
    if (value >= 150000) return 'amount-level-high';
    if (value >= 75000) return 'amount-level-mid';
    if (value >= 30000) return 'amount-level-low';
    return 'amount-level-soft';
}

function bindRecordOverflowMenu(container) {
    if (!container || container.dataset.menuBound) return;
    container.dataset.menuBound = '1';

    container.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.record-action-btn');
        if (!actionBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const action = actionBtn.dataset.action;
        const recordId = actionBtn.dataset.recordId;

        if (!recordId) {
            alert('無法獲取記錄ID');
            return;
        }

        if (action === 'edit') {
            editInvestmentRecord(recordId);
        } else if (action === 'delete') {
            deleteInvestmentRecord(recordId);
        }
    });
}

function renderRecordActionButtons(recordId) {
    if (!recordId) return '';
    return `
        <div class="record-actions" data-record-id="${recordId}">
            <button class="record-action-btn record-action-edit" type="button" aria-label="編輯紀錄" title="編輯" data-action="edit" data-record-id="${recordId}">✏️</button>
            <button class="record-action-btn record-action-delete" type="button" aria-label="刪除紀錄" title="刪除" data-action="delete" data-record-id="${recordId}">🗑️</button>
        </div>
    `;
}

// 更新投資記錄列表
function updateInvestmentRecords() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const recordsList = document.getElementById('investmentRecords');
    
    if (!recordsList) return;
    
    if (records.length === 0) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                <div>尚無投資紀錄</div>
                <div style="font-size: 12px; margin-top: 8px; color: #ccc; margin-bottom: 20px;">點擊下方按鈕開始記錄或匯入檔案</div>
                <button class="budget-edit-btn budget-add-btn-full" onclick="importInvestmentData()" style="max-width: 300px; margin: 0 auto;">
                    📂 匯入投資紀錄
                </button>
            </div>
        `;
        return;
    }

    const sortedRecords = [...records].sort((a, b) => parseRecordDate(b) - parseRecordDate(a));
    const pageRecords = sortedRecords;

    const grouped = {};
    const groupOrder = [];
    pageRecords.forEach(record => {
        const key = getInvestmentRecordDateKey(record);
        if (!grouped[key]) {
            grouped[key] = [];
            groupOrder.push(key);
        }
        grouped[key].push(record);
    });

    let html = `
        <div class="investment-records-header">
            <div>
                <div class="investment-records-title">投資紀錄</div>
                <div class="investment-records-summary">新資料在最上方，共 ${pageRecords.length} 筆</div>
            </div>
        </div>
    `;

    if (pageRecords.length === 0) {
        html += `
            <div class="empty-page">
                <div>本頁暫無買入記錄</div>
                <div class="text-secondary">請新增或切換到其他頁面</div>
            </div>
        `;
    } else {
        groupOrder.forEach(key => {
            html += `
                <div class="investment-record-date">
                    ${formatInvestmentRecordDateLabel(key)}
                </div>
            `;
            grouped[key].forEach(record => {
                const recordId = record.timestamp || record.id || Date.now().toString();
                if (record.type === 'buy') {
                    const price = record.price != null ? record.price : 0;
                    const shares = record.shares || 0;
                    const totalAmount = Math.ceil(price * shares + (record.fee || 0));
                    const amountClass = getAmountLevelClass(totalAmount);
                    let dcaLine = '';
                    if (record.isDCA) {
                        const cycleNo = parseInt(record.dcaCycleNumber, 10);
                        dcaLine = `<div>🔁 定期定額${!isNaN(cycleNo) && cycleNo > 0 ? `・第 ${cycleNo} 期` : ''}</div>`;
                    }
                    html += `
                        <div class="investment-record-item amount-glow ${amountClass}" data-record-id="${recordId}">
                            <div class="record-header">
                                <div class="record-header-info">
                                    <span class="record-type buy" data-stock-code="${record.stockCode || ''}" data-stock-name="${record.stockName || ''}" data-price="${price}" data-shares="${shares}" data-fee="${record.fee || 0}" data-isdca="${record.isDCA ? '1' : '0'}" title="再買一次">買入</span>
                                    <span class="record-date">${record.date}</span>
                                </div>
                                ${renderRecordActionButtons(recordId)}
                            </div>
                            <div class="record-stock">${record.stockCode}</div>
                            <div class="record-details">
                                <div>價格：NT$${price.toFixed(2)}</div>
                                <div>股數：${shares} 股</div>
                                <div>手續費：NT$${(record.fee || 0).toLocaleString('zh-TW')}</div>
                                ${dcaLine}
                            </div>
                            <div class="record-amount ${amountClass}">投入金額：NT$${(totalAmount != null ? totalAmount : 0).toLocaleString('zh-TW')}</div>
                            ${record.note ? `<div class="text-secondary" style="margin-top: 8px; font-size: 12px;">備註：${record.note}</div>` : ''}
                        </div>
                    `;
                } else if (record.type === 'sell') {
                    const price = record.price != null ? record.price : 0;
                    const shares = record.shares || 0;
                    const totalAmount = price * shares - (record.fee || 0) - (record.tax || 0);
                    html += `
                        <div class="investment-record-item" data-record-id="${recordId}">
                            <div class="record-header">
                                <div class="record-header-info">
                                    <span class="record-type sell">賣出</span>
                                    <span class="record-date">${record.date}</span>
                                </div>
                                ${renderRecordActionButtons(recordId)}
                            </div>
                            <div class="record-stock">${record.stockCode}</div>
                            <div class="record-details">
                                <div>價格：NT$${(record.price != null ? record.price : 0).toFixed(2)}</div>
                                <div>股數：${record.shares || 0} 股</div>
                                <div>手續費：NT$${(record.fee || 0).toLocaleString('zh-TW')}</div>
                                <div>證交稅：NT$${(record.tax || 0).toLocaleString('zh-TW')}</div>
                            </div>
                            <div class="record-amount">實收金額：NT$${(totalAmount != null ? totalAmount : 0).toLocaleString('zh-TW')}</div>
                            <div class="record-amount ${(record.realizedPnl || 0) >= 0 ? 'positive' : 'negative'}">
                                實現損益：${(record.realizedPnl || 0) >= 0 ? '+' : ''}NT$${(record.realizedPnl != null ? record.realizedPnl : 0).toLocaleString('zh-TW')}
                            </div>
                            ${record.note ? `<div class="text-secondary" style="margin-top: 8px; font-size: 12px;">備註：${record.note}</div>` : ''}
                        </div>
                    `;
                } else if (record.type === 'dividend') {
                    html += `
                        <div class="investment-record-item" data-record-id="${recordId}">
                            <div class="record-header">
                                <div class="record-header-info">
                                    <span class="record-type dividend">${record.dividendType === 'cash' ? '現金股利' : '股票股利'}</span>
                                    <span class="record-date">${record.date}</span>
                                </div>
                                ${renderRecordActionButtons(recordId)}
                            </div>
                            <div class="record-stock">${record.stockCode}</div>
                            <div class="record-details">
                                <div>每股：NT$${(record.perShare != null ? record.perShare : 0).toFixed(2)}</div>
                                <div>股數：${record.shares || 0} 股</div>
                                ${record.exDividendDate ? `<div>除息日：${record.exDividendDate}</div>` : ''}
                                ${record.historicalPerShare ? `<div>過去每股：NT$${Number(record.historicalPerShare).toFixed(2)}</div>` : ''}
                                ${record.reinvest ? '<div>再投入 ✓</div>' : ''}
                            </div>
                            <div class="record-amount">實收金額：NT$${(record.amount != null ? record.amount : 0).toLocaleString('zh-TW')}</div>
                            ${record.note ? `<div class="text-secondary" style="margin-top: 8px; font-size: 12px;">備註：${record.note}</div>` : ''}
                        </div>
                    `;
                }
            });
        });
    }

    recordsList.innerHTML = html;

    bindRecordOverflowMenu(recordsList);

    // 綁定買入標籤點擊事件：點「買入」直接帶上一筆資料到買入頁
    recordsList.querySelectorAll('.record-type.buy').forEach(badge => {
        const newBadge = badge.cloneNode(true);
        badge.parentNode.replaceChild(newBadge, badge);
        newBadge.style.cursor = 'pointer';
        newBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            playClickSound();
            const stockCode = newBadge.dataset.stockCode || '';
            const stockName = newBadge.dataset.stockName || '';
            const price = parseFloat(newBadge.dataset.price || '0') || 0;
            const shares = parseInt(newBadge.dataset.shares || '0', 10) || 0;
            const fee = parseFloat(newBadge.dataset.fee || '0') || 0;
            const isDCA = (newBadge.dataset.isdca || '') === '1';
            showInvestmentInputPage('buy');
            setTimeout(() => {
                const codeInput = document.getElementById('calcStockCodeInput');
                const nameInput = document.getElementById('calcStockNameInput');
                const priceInput = document.getElementById('calcPriceInput');
                const sharesInput = document.getElementById('calcSharesInput');
                const feeInput = document.getElementById('calcFeeInput');
                const autoFeeCheckbox = document.getElementById('calcAutoFeeCheckbox');
                const isDCAInput = document.getElementById('calcIsDCAInput');
                if (codeInput) {
                    codeInput.value = stockCode;
                    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    codeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (nameInput) {
                    nameInput.value = stockName;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (priceInput) {
                    priceInput.value = price > 0 ? String(price) : '';
                    priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (sharesInput) {
                    sharesInput.value = shares > 0 ? String(shares) : '0';
                    sharesInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (autoFeeCheckbox) {
                    autoFeeCheckbox.checked = false;
                    autoFeeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (feeInput) {
                    feeInput.disabled = false;
                    feeInput.style.opacity = '1';
                    feeInput.value = String(fee || 0);
                    feeInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (isDCAInput) {
                    isDCAInput.checked = isDCA;
                    isDCAInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (typeof updateInvestmentDisplay === 'function') {
                    updateInvestmentDisplay();
                }
            }, 120);
        });
    });
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);

// ========== 底部導航初始化 ==========
function showBottomNav() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
}

function initBottomNav() {
    showBottomNav();
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // 檢查分類管理頁面是否顯示，如果顯示則不執行切換
            const categoryManagePage = document.getElementById('pageCategoryManage');
            if (categoryManagePage && categoryManagePage.style.display !== 'none') {
                return; // 如果分類管理頁面顯示，則不執行底部導航欄的切換
            }
            
            const page = item.dataset.page;
            showBottomNav();
            
            // 更新導航狀態
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 隱藏所有頁面
            const pageInput = document.getElementById('pageInput');
            const pageLedger = document.getElementById('pageLedger');
            const inputSection = document.getElementById('inputSection');
            const pageChart = document.getElementById('pageChart');
            const pageBudget = document.getElementById('pageBudget');
            const pageMonthlyPlanner = document.getElementById('pageMonthlyPlanner');
            const pageSettings = document.getElementById('pageSettings');
            const pageInvestment = document.getElementById('pageInvestment');
            const pageDailyBudget = document.getElementById('pageDailyBudget');
            
            // 隱藏所有頁面
            if (pageInput) pageInput.style.display = 'none';
            if (pageLedger) pageLedger.style.display = 'none';
            if (inputSection) inputSection.style.display = 'none';
            if (pageChart) pageChart.style.display = 'none';
            if (pageBudget) pageBudget.style.display = 'none';
            if (pageMonthlyPlanner) pageMonthlyPlanner.style.display = 'none';
            if (pageSettings) pageSettings.style.display = 'none';
            if (pageInvestment) pageInvestment.style.display = 'none';
            if (pageDailyBudget) pageDailyBudget.style.display = 'none';
            
            // 顯示底部導航（如果從每日預算追蹤頁面返回）
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav && pageDailyBudget && pageDailyBudget.style.display === 'none') {
                bottomNav.style.display = 'flex';
            }
            
            // 顯示對應的頁面
            if (page === 'investment') {
                console.log('切換到投資專區頁面');
                if (pageInvestment) {
                    pageInvestment.style.display = 'block';
                    console.log('投資專區頁面已顯示，開始初始化');
                    try {
                        initInvestmentPage();
                        console.log('投資專區初始化完成');
                        autoLoadStockPrices().catch(() => {});
                    } catch (error) {
                        console.error('投資專區初始化錯誤:', error);
                    }
                } else {
                    console.error('投資專區頁面元素未找到');
                }
            } else if (page === 'chart') {
                if (pageChart) {
                    pageChart.style.display = 'block';
                    // 初始化圖表頁面
                    if (typeof initChart === 'function') {
                        initChart();
                    }
                    renderSelectedMonthText();
                    if (typeof updateAllCharts === 'function') {
                        updateAllCharts();
                    }
                }
            } else if (page === 'wallet') {
                if (pageBudget) {
                    pageBudget.style.display = 'block';
                    // 初始化預算頁面
                    if (typeof initBudget === 'function') {
                        initBudget();
                    }
                }
            } else if (page === 'monthlyPlanner') {
                if (pageMonthlyPlanner) {
                    pageMonthlyPlanner.style.display = 'block';
                    if (typeof initMonthlyPlannerPage === 'function') {
                        initMonthlyPlannerPage();
                    }
                }
            } else if (page === 'settings') {
                if (pageSettings) {
                    pageSettings.style.display = 'block';
                    // 初始化設置頁面
                    if (typeof initSettingsPage === 'function') {
                        initSettingsPage();
                    }
                }
            } else if (page === 'ledger') {
                if (pageLedger) {
                    pageLedger.style.display = 'block';
                    // 隱藏記帳輸入頁面的 header
                    const headerSection = document.querySelector('.header-section');
                    if (headerSection) headerSection.style.display = 'none';
                    renderSelectedMonthText();
                    // 初始化記帳本頁面
                    if (typeof initLedger === 'function') {
                        initLedger();
                    }
                }
            }
            
            // 教學功能已移除
            setTimeout(() => {
                // 教學彈窗功能已禁用
            }, 300);
        });
    });
}

// ========== 其他頁面初始化函數 ==========

// 統一的返回記帳本函數
function goBackToLedger() {
    // 獲取所有頁面元素
    const pageLedger = document.getElementById('pageLedger');
    const pageInput = document.getElementById('pageInput');
    const pageChart = document.getElementById('pageChart');
    const pageBudget = document.getElementById('pageBudget');
    const pageMonthlyPlanner = document.getElementById('pageMonthlyPlanner');
    const pageSettings = document.getElementById('pageSettings');
    const pageCategoryManage = document.getElementById('pageCategoryManage');
    const pageDailyBudget = document.getElementById('pageDailyBudget');
    const pageInvestment = document.getElementById('pageInvestment');
    const investmentOverview = document.getElementById('investmentOverview');
    const stockDetailPage = document.getElementById('stockDetailPage');
    const investmentInputPage = document.getElementById('investmentInputPage');
    const dividendPage = document.getElementById('dividendPage');
    const dividendInputPage = document.getElementById('dividendInputPage');
    const dcaManagementPage = document.getElementById('dcaManagementPage');
    const dcaSetupPage = document.getElementById('dcaSetupPage');
    const installmentManagementPage = document.getElementById('installmentManagementPage');
    const installmentSetupPage = document.getElementById('installmentSetupPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    const inputSection = document.getElementById('inputSection');
    
    // 隱藏所有頁面
    if (pageInput) pageInput.style.display = 'none';
    if (pageChart) pageChart.style.display = 'none';
    if (pageBudget) pageBudget.style.display = 'none';
    if (pageMonthlyPlanner) pageMonthlyPlanner.style.display = 'none';
    if (pageSettings) pageSettings.style.display = 'none';
    if (pageCategoryManage) pageCategoryManage.style.display = 'none';
    if (pageDailyBudget) pageDailyBudget.style.display = 'none';
    if (pageInvestment) pageInvestment.style.display = 'none';
    if (investmentOverview) investmentOverview.style.display = 'none';
    if (stockDetailPage) stockDetailPage.style.display = 'none';
    if (investmentInputPage) investmentInputPage.style.display = 'none';
    if (dividendPage) dividendPage.style.display = 'none';
    if (dividendInputPage) dividendInputPage.style.display = 'none';
    if (dcaManagementPage) dcaManagementPage.style.display = 'none';
    if (dcaSetupPage) dcaSetupPage.style.display = 'none';
    if (installmentManagementPage) installmentManagementPage.style.display = 'none';
    if (installmentSetupPage) installmentSetupPage.style.display = 'none';
    if (inputSection) inputSection.style.display = 'none';
    
    // 顯示記帳本頁面
    if (pageLedger) {
        pageLedger.style.display = 'block';
        // 隱藏記帳輸入頁面的 header
        const headerSection = document.querySelector('.header-section');
        if (headerSection) headerSection.style.display = 'none';
        // 初始化記帳本頁面
        if (typeof initLedger === 'function') {
            initLedger();
        }
    }
    
    // 顯示底部導航欄
    if (bottomNav) bottomNav.style.display = 'flex';
    
    // 隱藏投資操作按鈕
    if (investmentActions) investmentActions.style.display = 'none';
}

function initMonthlyPlannerPage() {
    const monthKey = getSelectedMonthKey();

    const incomeInput = document.getElementById('monthlyIncomeInput');

    const goalNameInput = document.getElementById('savingGoalNameInput');
    const goalTargetInput = document.getElementById('savingGoalTargetInput');
    const goalMonthlyInput = document.getElementById('savingGoalMonthlyInput');
    const goalSavedInput = document.getElementById('savingGoalSavedInput');
    const goalAddBtn = document.getElementById('savingGoalAddBtn');
    const goalListEl = document.getElementById('savingGoalList');

    const fixedListEl = document.getElementById('monthlyPlannerFixedList');
    const savingsListEl = document.getElementById('monthlyPlannerSavingsList');
    const personalListEl = document.getElementById('monthlyPlannerPersonalList');

    const fixedSubtotalEl = document.getElementById('monthlyPlannerFixedSubtotal');
    const savingsSubtotalEl = document.getElementById('monthlyPlannerSavingsSubtotal');
    const personalSubtotalEl = document.getElementById('monthlyPlannerPersonalSubtotal');

    const totalExpenseEl = document.getElementById('monthlyPlannerTotalExpense');
    const balanceEl = document.getElementById('monthlyPlannerBalance');
    const hintEl = document.getElementById('monthlyPlannerHint');

    const addFixedBtn = document.getElementById('monthlyPlannerAddFixedBtn');
    const addSavingsBtn = document.getElementById('monthlyPlannerAddSavingsBtn');
    const addPersonalBtn = document.getElementById('monthlyPlannerAddPersonalBtn');

    const applySampleBtn = document.getElementById('monthlyPlannerApplySampleBtn');
    const saveBtn = document.getElementById('monthlyPlannerSaveBtn');

    if (!incomeInput || !fixedListEl || !savingsListEl || !personalListEl) return;

    const storageKey = `monthlyPlanner:${monthKey}`;

    const formatTwd = (n) => {
        const v = Math.round(Number.isFinite(n) ? n : 0);
        return `NT$${v.toLocaleString('zh-TW')}`;
    };

    const readNumber = (val) => {
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
    };

    const newId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    let state = {
        monthKey,
        income: 0,
        items: {
            fixed: [],
            savings: [],
            personal: []
        },
        currentSavingsFilter: 'all' // 新增儲蓄過濾器狀態
    };

    const savingGoalsKey = 'savingGoals';
    let savingGoals = [];

    const normalizeItem = (item) => {
        const safe = item && typeof item === 'object' ? item : {};
        return {
            id: safe.id || newId(),
            name: safe.name != null ? String(safe.name) : '',
            amount: readNumber(safe.amount),
            note: safe.note != null ? String(safe.note) : '',
            type: safe.type || (safe.name && safe.name.includes('存股') ? 'stock' : 'savings') // 自動識別類型
        };
    };

    const calcTotals = () => {
        const sumGroup = (arr) => (arr || []).reduce((sum, it) => sum + readNumber(it.amount), 0);
        const fixed = sumGroup(state.items.fixed);
        const savings = sumGroup(state.items.savings);
        const personal = sumGroup(state.items.personal);
        const total = fixed + savings + personal;
        const balance = readNumber(state.income) - total;
        return { fixed, savings, personal, total, balance };
    };

    const renderTotals = () => {
        const t = calcTotals();
        if (fixedSubtotalEl) fixedSubtotalEl.textContent = formatTwd(t.fixed);
        if (savingsSubtotalEl) savingsSubtotalEl.textContent = formatTwd(t.savings);
        if (personalSubtotalEl) personalSubtotalEl.textContent = formatTwd(t.personal);
        if (totalExpenseEl) totalExpenseEl.textContent = formatTwd(t.total);
        if (balanceEl) balanceEl.textContent = formatTwd(t.balance);

        if (hintEl) {
            if (readNumber(state.income) <= 0) {
                hintEl.textContent = '請先輸入本月可用收入。';
                hintEl.className = 'monthly-planner-hint';
            } else if (t.balance < 0) {
                hintEl.textContent = '⚠️ 目前規劃會超支，建議調整部分支出或提高收入。';
                hintEl.className = 'monthly-planner-hint monthly-planner-hint--danger';
            } else {
                hintEl.textContent = '✅ 規劃可行；結餘可用於彈性支出/額外存錢/投資。';
                hintEl.className = 'monthly-planner-hint monthly-planner-hint--success';
            }
        }
    };

    const renderGroup = (groupKey, containerEl) => {
        const items = state.items[groupKey] || [];
        if (!containerEl) return;

        // 如果是儲蓄群組，需要根據過濾器篩選
        let filteredItems = items;
        if (groupKey === 'savings' && state.currentSavingsFilter !== 'all') {
            filteredItems = items.filter(item => item.type === state.currentSavingsFilter);
        }

        if (!filteredItems.length) {
            const emptyText = groupKey === 'savings' && state.currentSavingsFilter !== 'all' 
                ? `尚未新增${state.currentSavingsFilter === 'stock' ? '存股' : '儲蓄'}項目` 
                : '尚未新增項目';
            containerEl.innerHTML = `<div class="monthly-planner-empty">${emptyText}</div>`;
            return;
        }

        containerEl.innerHTML = filteredItems.map((it) => {
            const safeName = String(it.name || '').replace(/"/g, '&quot;');
            const safeNote = String(it.note || '').replace(/"/g, '&quot;');
            const safeAmount = Number.isFinite(it.amount) ? it.amount : 0;
            const itemType = it.type || 'savings';
            const itemIcon = itemType === 'stock' ? '📈' : '💰';
            
            return `
                <div class="monthly-planner-item-row savings-item-row" data-group="${groupKey}" data-id="${it.id}" data-type="${itemType}">
                    <span class="savings-item-icon">${itemIcon}</span>
                    <input class="monthly-planner-item-name savings-item-name" type="text" placeholder="項目" value="${safeName}">
                    <input class="monthly-planner-item-amount" type="number" min="0" step="1" placeholder="金額" value="${safeAmount}">
                    <input class="monthly-planner-item-note" type="text" placeholder="說明" value="${safeNote}">
                    <button class="monthly-planner-item-delete" type="button">✕</button>
                </div>
            `;
        }).join('');

        containerEl.querySelectorAll('.monthly-planner-item-row').forEach((row) => {
            const id = row.getAttribute('data-id');
            const nameEl = row.querySelector('.monthly-planner-item-name');
            const amountEl = row.querySelector('.monthly-planner-item-amount');
            const noteEl = row.querySelector('.monthly-planner-item-note');
            const delBtn = row.querySelector('.monthly-planner-item-delete');

            const idx = (state.items[groupKey] || []).findIndex((x) => x.id === id);
            if (idx < 0) return;

            const onUpdate = () => {
                const current = state.items[groupKey][idx];
                state.items[groupKey][idx] = {
                    ...current,
                    name: nameEl ? nameEl.value : current.name,
                    amount: readNumber(amountEl ? amountEl.value : current.amount),
                    note: noteEl ? noteEl.value : current.note,
                    type: current.type || 'savings' // 保持原有類型
                };
                renderTotals();
            };

            if (nameEl) nameEl.addEventListener('input', onUpdate);
            if (amountEl) amountEl.addEventListener('input', onUpdate);
            if (noteEl) noteEl.addEventListener('input', onUpdate);

            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    state.items[groupKey].splice(idx, 1);
                    renderAll();
                });
            }
        });
    };

    const renderAll = () => {
        renderGroup('fixed', fixedListEl);
        renderGroup('savings', savingsListEl);
        renderGroup('personal', personalListEl);
        renderTotals();
    };

    const load = () => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || data.monthKey !== monthKey) return;

            state = {
                monthKey,
                income: readNumber(data.income),
                items: {
                    fixed: Array.isArray(data.items && data.items.fixed) ? data.items.fixed.map(normalizeItem) : [],
                    savings: Array.isArray(data.items && data.items.savings) ? data.items.savings.map(normalizeItem) : [],
                    personal: Array.isArray(data.items && data.items.personal) ? data.items.personal.map(normalizeItem) : []
                },
                currentSavingsFilter: 'all' // 確保過濾器狀態正確初始化
            };

            incomeInput.value = state.income > 0 ? String(state.income) : '';
        } catch (e) {
        }
    };

    const save = () => {
        const payload = {
            monthKey: state.monthKey,
            income: readNumber(state.income),
            items: state.items,
            updatedAt: Date.now()
        };
        const raw = JSON.stringify(payload);

        const ensureExpenseCategoryExists = (categoryName) => {
            const name = String(categoryName || '').trim();
            if (!name) return false;

            try {
                if (Array.isArray(window.allCategories)) {
                    const exists = window.allCategories.some((c) => c && c.name === name && c.type === 'expense');
                    if (exists) return true;
                }
            } catch (e) {
            }

            try {
                const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
                const duplicate = Array.isArray(savedCustomCategories)
                    ? savedCustomCategories.some((c) => c && c.name === name && c.type === 'expense')
                    : false;

                if (!duplicate) {
                    const newCategory = { name, icon: '💰', type: 'expense' };
                    const next = Array.isArray(savedCustomCategories) ? [...savedCustomCategories, newCategory] : [newCategory];
                    localStorage.setItem('customCategories', JSON.stringify(next));

                    if (Array.isArray(window.allCategories)) {
                        window.allCategories.push(newCategory);
                    }

                    if (typeof getCategoryEnabledState === 'function' && typeof saveCategoryEnabledState === 'function') {
                        const enabledState = getCategoryEnabledState();
                        enabledState[name] = true;
                        saveCategoryEnabledState(enabledState);
                    }
                }
                return true;
            } catch (e) {
                return false;
            }
        };

        const syncFixedItemsToBudgets = () => {
            try {
                const budgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
                const nextBudgets = budgets && typeof budgets === 'object' ? { ...budgets } : {};

                const fixedItems = Array.isArray(state.items.fixed) ? state.items.fixed : [];
                const syncedNames = [];

                fixedItems.forEach((it) => {
                    const name = String(it && it.name ? it.name : '').trim();
                    const amount = readNumber(it && it.amount != null ? it.amount : 0);
                    if (!name) return;
                    if (amount <= 0) return;

                    const ok = ensureExpenseCategoryExists(name);
                    if (!ok) return;

                    nextBudgets[name] = amount;
                    syncedNames.push(name);
                });

                localStorage.setItem('categoryBudgets', JSON.stringify(nextBudgets));

                if (syncedNames.length) {
                    localStorage.setItem(`monthlyPlannerBudgetSync:${monthKey}`, JSON.stringify({
                        monthKey,
                        categories: syncedNames,
                        updatedAt: Date.now()
                    }));
                }

                if (typeof initBudget === 'function') {
                    const pageBudget = document.getElementById('pageBudget');
                    if (pageBudget && pageBudget.style.display !== 'none') {
                        initBudget();
                    }
                }

                if (typeof updateLedgerSummary === 'function') {
                    updateLedgerSummary();
                }
            } catch (e) {
            }
        };

        if (typeof safeSetItem === 'function') {
            const ok = safeSetItem(storageKey, payload);
            if (!ok) return;
        } else {
            try {
                localStorage.setItem(storageKey, raw);
            } catch (e) {
                return;
            }
        }

        syncFixedItemsToBudgets();
        alert('已儲存本月規劃。');
    };

    const addItem = (groupKey, preset = {}) => {
        state.items[groupKey] = state.items[groupKey] || [];
        state.items[groupKey].push(normalizeItem(preset));
        renderAll();
    };

    // 新增儲蓄類型選擇對話框
    const showSavingsTypeDialog = (onSelect) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--bg-card);
            border-radius: 16px;
            padding: 24px;
            max-width: 320px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: var(--text-primary);">選擇儲蓄類型</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="savings-type-option" data-type="stock" style="
                    padding: 16px;
                    border: 2px solid var(--color-primary);
                    border-radius: 12px;
                    background: rgba(var(--color-primary-rgb), 0.1);
                    color: var(--color-primary);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">📈 存股</button>
                <button class="savings-type-option" data-type="savings" style="
                    padding: 16px;
                    border: 2px solid var(--color-success);
                    border-radius: 12px;
                    background: rgba(var(--color-success-rgb), 0.1);
                    color: var(--color-success);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">💰 一般儲蓄</button>
            </div>
            <button class="savings-type-cancel" style="
                margin-top: 20px;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: var(--bg-light);
                color: var(--text-secondary);
                font-size: 14px;
                cursor: pointer;
                width: 100%;
            ">取消</button>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // 綁定事件
        dialog.querySelectorAll('.savings-type-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                document.body.removeChild(modal);
                if (onSelect) onSelect(type);
            });
        });

        dialog.querySelector('.savings-type-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    };

    // 儲蓄模板功能
    const savingsTemplates = {
        stock: [
            { name: '定期定額存股', amount: 3000, note: '每月固定購買優質股票' },
            { name: 'ETF投資', amount: 5000, note: '追蹤大盤指數ETF' },
            { name: '股利再投入', amount: 2000, note: '將股利自動再投資' },
            { name: '成長股投資', amount: 4000, note: '專注高成長潛力股票' }
        ],
        savings: [
            { name: '緊急預備金', amount: 2000, note: '3-6個月生活費' },
            { name: '退休儲蓄', amount: 5000, note: '長期退休規劃' },
            { name: '教育基金', amount: 3000, note: '子女教育費用' },
            { name: '旅遊基金', amount: 1500, note: '年度旅遊計畫' },
            { name: '購屋基金', amount: 8000, note: '房屋頭期款準備' },
            { name: '投資理財', amount: 2500, note: '多元化投資配置' }
        ]
    };

    const showSavingsTemplatesDialog = () => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--bg-card);
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        let templatesHtml = '';
        
        // 存股模板
        templatesHtml += `
            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; color: var(--color-primary); font-size: 16px; font-weight: 600;">📈 存股模板</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        savingsTemplates.stock.forEach((template, index) => {
            templatesHtml += `
                <button class="savings-template-btn" data-type="stock" data-index="${index}" style="
                    padding: 12px;
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    background: var(--bg-card);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${template.name}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${template.note}</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--color-primary);">NT$${template.amount.toLocaleString()}</div>
                </button>
            `;
        });
        
        templatesHtml += `
                </div>
            </div>
        `;

        // 一般儲蓄模板
        templatesHtml += `
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: var(--color-success); font-size: 16px; font-weight: 600;">💰 一般儲蓄模板</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        savingsTemplates.savings.forEach((template, index) => {
            templatesHtml += `
                <button class="savings-template-btn" data-type="savings" data-index="${index}" style="
                    padding: 12px;
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    background: var(--bg-card);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${template.name}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${template.note}</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--color-success);">NT$${template.amount.toLocaleString()}</div>
                </button>
            `;
        });
        
        templatesHtml += `
                </div>
            </div>
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: var(--text-primary);">快速新增儲蓄項目</h3>
            ${templatesHtml}
            <button class="savings-template-cancel" style="
                margin-top: 20px;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: var(--bg-light);
                color: var(--text-secondary);
                font-size: 14px;
                cursor: pointer;
                width: 100%;
            ">取消</button>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // 綁定事件
        dialog.querySelectorAll('.savings-template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                const template = savingsTemplates[type][index];
                
                document.body.removeChild(modal);
                addItem('savings', {
                    ...template,
                    type: type
                });
            });
        });

        dialog.querySelector('.savings-template-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    };

    const loadSavingGoals = () => {
        try {
            const raw = localStorage.getItem(savingGoalsKey);
            const data = raw ? JSON.parse(raw) : [];
            savingGoals = Array.isArray(data) ? data : [];
        } catch (e) {
            savingGoals = [];
        }
    };

    const saveSavingGoals = () => {
        try {
            localStorage.setItem(savingGoalsKey, JSON.stringify(savingGoals));
        } catch (e) {
        }
    };

    const normalizeGoal = (g) => {
        const safe = g && typeof g === 'object' ? g : {};
        return {
            id: safe.id || newId(),
            name: safe.name != null ? String(safe.name) : '',
            target: readNumber(safe.target),
            monthly: readNumber(safe.monthly),
            saved: readNumber(safe.saved)
        };
    };

    const renderSavingGoals = () => {
        if (!goalListEl) return;

        if (!savingGoals.length) {
            goalListEl.innerHTML = '<div class="monthly-planner-empty">尚未新增目標</div>';
            return;
        }

        const base = parseMonthKey(monthKey) || new Date();
        const baseMonth = new Date(base.getFullYear(), base.getMonth(), 1);

        const formatMonthText = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        goalListEl.innerHTML = savingGoals.map((goal) => {
            const g = normalizeGoal(goal);
            const remaining = Math.max(0, g.target - g.saved);
            const canEstimate = g.monthly > 0 && g.target > 0;
            const monthsNeed = canEstimate ? Math.ceil(remaining / g.monthly) : null;
            const eta = monthsNeed != null ? new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthsNeed, 1) : null;
            const percent = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;

            const isCompleted = percent >= 100;
            const statusClass = isCompleted ? 'goal-completed' : '';
            const statusIcon = isCompleted ? '🎉' : '';
            const statusText = isCompleted ? '已達成！' : '';
            
            return `
                <div class="monthly-planner-goal-card ${statusClass}" data-id="${g.id}">
                    <div class="monthly-planner-goal-head">
                        <div class="monthly-planner-goal-name">${statusIcon}${String(g.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        <button class="monthly-planner-goal-delete" type="button">✕</button>
                    </div>
                    <div class="monthly-planner-goal-meta">
                        <div>目標：${formatTwd(g.target)}</div>
                        <div>已存：${formatTwd(g.saved)}</div>
                        <div>剩餘：${formatTwd(remaining)}</div>
                        <div>每月：${formatTwd(g.monthly)}</div>
                    </div>
                    <div class="monthly-planner-goal-progress">
                        <div class="monthly-planner-goal-bar">
                            <div class="monthly-planner-goal-bar-fill" style="width: ${percent.toFixed(1)}%"></div>
                        </div>
                        <div class="monthly-planner-goal-progress-text">${percent.toFixed(1)}% (${g.saved.toLocaleString()} / ${g.target.toLocaleString()})</div>
                    </div>
                    ${statusText ? `<div class="monthly-planner-goal-status">${statusText}</div>` : ''}
                    <div class="monthly-planner-goal-eta">
                        ${canEstimate ? `預計達成：${eta ? formatMonthText(eta) : '-' }（約 ${monthsNeed} 個月）` : '請輸入目標金額與每月存入，才能預估達成時間。'}
                    </div>
                    <div class="monthly-planner-goal-actions">
                        <button class="monthly-planner-btn monthly-planner-btn--secondary monthly-planner-goal-add-to-plan" type="button">加入本月儲蓄</button>
                    </div>
                </div>
            `;
        }).join('');

        goalListEl.querySelectorAll('.monthly-planner-goal-card').forEach((card) => {
            const id = card.getAttribute('data-id');
            const idx = savingGoals.findIndex((x) => x && x.id === id);
            const delBtn = card.querySelector('.monthly-planner-goal-delete');
            const addToPlanBtn = card.querySelector('.monthly-planner-goal-add-to-plan');

            if (idx < 0) return;

            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    savingGoals.splice(idx, 1);
                    saveSavingGoals();
                    renderSavingGoals();
                });
            }

            if (addToPlanBtn) {
                addToPlanBtn.addEventListener('click', () => {
                    const g = normalizeGoal(savingGoals[idx]);
                    if (!g.name || g.monthly <= 0) return;
                    addItem('savings', { name: `存錢目標：${g.name}`, amount: g.monthly, note: '自動加入' });
                });
            }
        });
    };

    const applySample = () => {
        state.income = 37000;
        incomeInput.value = '37000';

        state.items.fixed = [
            { id: newId(), name: '房租', amount: 7500, note: '固定支出' },
            { id: newId(), name: '電燈費', amount: 1500, note: '固定支出' },
            { id: newId(), name: '電信費', amount: 699, note: '固定支出' },
            { id: newId(), name: '保險', amount: 4500, note: '固定支出' },
            { id: newId(), name: '菜錢（跟媽媽煮）', amount: 5000, note: '家用菜錢' },
            { id: newId(), name: '太太礦錢', amount: 4000, note: '每月固定給' },
            { id: newId(), name: '美甲', amount: 2100, note: '保留' },
            { id: newId(), name: '分期', amount: 5500, note: '16,500 ÷ 3 期' },
            { id: newId(), name: '捐款', amount: 400, note: '固定善款' }
        ].map(normalizeItem);

        state.items.savings = [
            { id: newId(), name: '存股', amount: 1000, note: '暫時壓低，等分期結束再加碼', type: 'stock' },
            { id: newId(), name: '預備金儲蓄', amount: 800, note: '每月先小額存', type: 'savings' }
        ].map(normalizeItem);

        state.items.personal = [
            { id: newId(), name: '生活費（個人）', amount: 4000, note: '吃飯、交通、零用' }
        ].map(normalizeItem);

        renderAll();
    };

    load();
    loadSavingGoals();
    state.income = readNumber(incomeInput.value);
    renderAll();
    renderSavingGoals();

    incomeInput.addEventListener('input', () => {
        state.income = readNumber(incomeInput.value);
        renderTotals();
    });

    const bindOnce = (el, type, handler) => {
        if (!el) return;
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        clone.addEventListener(type, handler);
        return clone;
    };

    bindOnce(addFixedBtn, 'click', () => addItem('fixed'));
    bindOnce(addSavingsBtn, 'click', () => {
        showSavingsTypeDialog((type) => {
            addItem('savings', { type });
        });
    });
    bindOnce(addPersonalBtn, 'click', () => addItem('personal'));
    bindOnce(applySampleBtn, 'click', () => applySample());
    bindOnce(saveBtn, 'click', () => save());

    // 綁定快速新增按鈕
    const quickAddBtn = document.getElementById('monthlyPlannerQuickAddBtn');
    bindOnce(quickAddBtn, 'click', () => {
        showSavingsTemplatesDialog();
    });

    // 綁定儲蓄類型標籤切換事件
    const savingsTabs = document.querySelectorAll('.savings-type-tab');
    savingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新活動標籤
            savingsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 更新過濾器並重新渲染
            state.currentSavingsFilter = tab.dataset.type;
            renderGroup('savings', savingsListEl);
        });
    });

    bindOnce(goalAddBtn, 'click', () => {
        if (!goalNameInput || !goalTargetInput || !goalMonthlyInput) return;
        const name = String(goalNameInput.value || '').trim();
        const target = readNumber(goalTargetInput.value);
        const monthly = readNumber(goalMonthlyInput.value);
        const saved = readNumber(goalSavedInput ? goalSavedInput.value : 0);

        if (!name) {
            goalNameInput.focus();
            return;
        }

        const goal = normalizeGoal({ name, target, monthly, saved });
        savingGoals.push(goal);
        saveSavingGoals();
        renderSavingGoals();

        goalNameInput.value = '';
        goalTargetInput.value = '';
        goalMonthlyInput.value = '';
        if (goalSavedInput) goalSavedInput.value = '';
    });
}

// 更新帳本標題（顯示當前選中帳戶的名稱）
function updateLedgerTitle() {
    const ledgerTitle = document.querySelector('.ledger-title');
    if (!ledgerTitle) return;
    
    const selectedAccount = getSelectedAccount();
    if (selectedAccount) {
        ledgerTitle.textContent = `${selectedAccount.name}的帳本`;
    } else {
        ledgerTitle.textContent = '默認帳本';
    }
}

// 初始化記帳本頁面
function initLedger() {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const ledgerList = document.getElementById('ledgerList');
    
    if (!ledgerList) return;
    
    // 初始化類型標籤切換
    initLedgerTypeTabs();
    
    // 初始化搜尋和篩選功能
    initSearchAndFilters();
    
    // 更新帳本標題
    updateLedgerTitle();
    
    // 獲取當前選中的類型
    const currentType = window.ledgerType || 'expense';
    
    // 篩選記錄（先按類型，再應用搜尋和篩選）
    let filteredRecords = filterRecordsByType(records, currentType);
    
    // 應用搜尋和篩選條件
    filteredRecords = applyAllFilters(filteredRecords);
    
    // 更新摘要（使用原始類型篩選後的記錄，不包含搜尋篩選）
    const typeFilteredRecords = filterRecordsByType(records, currentType);
    updateLedgerSummary(typeFilteredRecords, currentType);
    
    // 更新當天支出
    updateDailyExpense();
    
    // 更新帳戶顯示
    if (typeof updateAccountDisplay === 'function') {
        updateAccountDisplay();
    }
    
    // 顯示交易列表（應用所有篩選後的記錄）
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const hasDateFilter = !!((filterDateFrom && filterDateFrom.value) || (filterDateTo && filterDateTo.value));
    displayLedgerTransactions(filteredRecords, hasDateFilter);
}

// 初始化搜尋和篩選功能
function initSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterCategory = document.getElementById('filterCategory');
    const filterAmountMin = document.getElementById('filterAmountMin');
    const filterAmountMax = document.getElementById('filterAmountMax');
    const filterClearBtn = document.getElementById('filterClearBtn');
    
    // 初始化分類選單
    if (filterCategory) {
        const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        const categories = new Set();
        records.forEach(r => {
            if (r.category) {
                categories.add(r.category);
            }
        });
        const sortedCategories = Array.from(categories).sort();
        sortedCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            filterCategory.appendChild(option);
        });
    }
    
    // 綁定篩選事件
    const applyFilters = () => {
        const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        const currentType = window.ledgerType || 'expense';
        let filteredRecords = filterRecordsByType(records, currentType);
        
        // 應用所有篩選
        filteredRecords = applyAllFilters(filteredRecords);
        
        // 更新顯示
        const hasDateFilter = !!((filterDateFrom && filterDateFrom.value) || (filterDateTo && filterDateTo.value));
        displayLedgerTransactions(filteredRecords, hasDateFilter);
    };
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (filterDateFrom) {
        filterDateFrom.addEventListener('change', applyFilters);
    }
    if (filterDateTo) {
        filterDateTo.addEventListener('change', applyFilters);
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', applyFilters);
    }
    if (filterAmountMin) {
        filterAmountMin.addEventListener('input', applyFilters);
    }
    if (filterAmountMax) {
        filterAmountMax.addEventListener('input', applyFilters);
    }
    if (filterClearBtn) {
        filterClearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterDateFrom) filterDateFrom.value = '';
            if (filterDateTo) filterDateTo.value = '';
            if (filterCategory) filterCategory.value = '';
            if (filterAmountMin) filterAmountMin.value = '';
            if (filterAmountMax) filterAmountMax.value = '';
            applyFilters();
        });
    }
}

// 應用所有篩選條件
function applyAllFilters(records) {
    const searchInput = document.getElementById('searchInput');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterCategory = document.getElementById('filterCategory');
    const filterAmountMin = document.getElementById('filterAmountMin');
    const filterAmountMax = document.getElementById('filterAmountMax');
    
    let filtered = [...records];
    
    // 關鍵字搜尋（備註、分類、帳戶）
    if (searchInput && searchInput.value.trim()) {
        const keyword = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(record => {
            const note = (record.note || '').toLowerCase();
            const category = (record.category || '').toLowerCase();
            const accountName = getAccountName(record.account).toLowerCase();
            return note.includes(keyword) || 
                   category.includes(keyword) || 
                   accountName.includes(keyword);
        });
    }
    
    // 日期範圍篩選
    if (filterDateFrom && filterDateFrom.value) {
        const fromDate = new Date(filterDateFrom.value);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate >= fromDate;
        });
    }
    if (filterDateTo && filterDateTo.value) {
        const toDate = new Date(filterDateTo.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate <= toDate;
        });
    }
    
    // 分類篩選
    if (filterCategory && filterCategory.value) {
        filtered = filtered.filter(record => record.category === filterCategory.value);
    }
    
    // 金額範圍篩選
    if (filterAmountMin && filterAmountMin.value) {
        const minAmount = parseFloat(filterAmountMin.value);
        filtered = filtered.filter(record => (record.amount || 0) >= minAmount);
    }
    if (filterAmountMax && filterAmountMax.value) {
        const maxAmount = parseFloat(filterAmountMax.value);
        filtered = filtered.filter(record => (record.amount || 0) <= maxAmount);
    }
    
    return filtered;
}

// 獲取帳戶名稱（輔助函數）
function getAccountName(accountId) {
    if (!accountId || typeof getAccounts !== 'function') return '';
    const accounts = getAccounts();
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : '';
}

// 初始化記帳本類型標籤切換
function initLedgerTypeTabs() {
    const ledgerTypeTabs = document.querySelectorAll('.ledger-type-tab');
    
    // 初始化默認類型
    if (!window.ledgerType) {
        window.ledgerType = 'expense';
    }
    
    ledgerTypeTabs.forEach(tab => {
        // 移除舊的事件監聽器（避免重複綁定）
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        // 設置初始活動狀態
        if (newTab.dataset.type === window.ledgerType) {
            newTab.classList.add('active');
        } else {
            newTab.classList.remove('active');
        }
        
        newTab.addEventListener('click', () => {
            const recordType = newTab.dataset.type;
            
            // 移除所有活動狀態
            document.querySelectorAll('.ledger-type-tab').forEach(t => t.classList.remove('active'));
            
            // 添加活動狀態到當前按鈕
            newTab.classList.add('active');
            
            // 保存記錄類型
            window.ledgerType = recordType;
            
            // 重新初始化記帳本
            initLedger();
        });
    });
}

// 根據類型篩選記錄
function filterRecordsByType(records, type) {
    if (!type || type === 'all') {
        return records;
    }
    
    return records.filter(record => {
        if (type === 'expense') {
            return record.type === 'expense' || !record.type;
        } else if (type === 'income') {
            return record.type === 'income';
        } else if (type === 'transfer') {
            return record.type === 'transfer';
        }
        return true;
    });
}

// 更新記帳本摘要
function updateLedgerSummary(records, type = null) {
    // 兼容：部分呼叫點會不帶 records 參數
    if (!Array.isArray(records)) {
        try {
            const stored = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
            records = Array.isArray(stored) ? stored : [];
        } catch (e) {
            records = [];
        }
    }
    const currentMonth = getSelectedMonthKey();
    
    const summaryMonth = document.getElementById('summaryMonth');
    if (summaryMonth) {
        summaryMonth.textContent = currentMonth;
    }
    
    // 計算當月收入和支出（只計算當前類型的記錄）
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfer = 0;
    
    records.forEach(record => {
        if (!record) return;
        if (!record.date) return;
        const recordDate = new Date(record.date);
        if (isNaN(recordDate.getTime())) return;
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (recordMonth === currentMonth) {
            if (record.type === 'income') {
                totalIncome += Number(record.amount) || 0;
            } else if (record.type === 'expense' || !record.type) {
                totalExpense += Number(record.amount) || 0;
            } else if (record.type === 'transfer') {
                totalTransfer += Number(record.amount) || 0;
            }
        }
    });
    
    // 計算月預算（從所有分類預算中加總）
    const budgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
    let totalBudget = 0;
    Object.keys(budgets).forEach(categoryId => {
        totalBudget += budgets[categoryId];
    });
    
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const summaryLineEl = document.getElementById('summaryLine');
    const monthBudgetEl = document.getElementById('monthBudget');
    
    // 根據類型顯示不同的摘要
    if (type === 'income') {
        if (totalIncomeEl) totalIncomeEl.textContent = `NT$${totalIncome.toLocaleString('zh-TW')}`;
        if (totalExpenseEl) totalExpenseEl.textContent = '--';
        if (summaryLineEl) {
            summaryLineEl.textContent = `總收入: NT$${totalIncome.toLocaleString('zh-TW')}`;
        }
    } else if (type === 'expense') {
        if (totalIncomeEl) totalIncomeEl.textContent = '--';
        if (totalExpenseEl) totalExpenseEl.textContent = `NT$${totalExpense.toLocaleString('zh-TW')}`;
        if (summaryLineEl) {
            summaryLineEl.textContent = `總支出: NT$${totalExpense.toLocaleString('zh-TW')}`;
        }
    } else if (type === 'transfer') {
        if (totalIncomeEl) totalIncomeEl.textContent = '--';
        if (totalExpenseEl) totalExpenseEl.textContent = `NT$${totalTransfer.toLocaleString('zh-TW')}`;
        if (summaryLineEl) {
            summaryLineEl.textContent = `總轉帳: NT$${totalTransfer.toLocaleString('zh-TW')}`;
        }
    } else {
        // 顯示全部
        if (totalIncomeEl) totalIncomeEl.textContent = `NT$${totalIncome.toLocaleString('zh-TW')}`;
        if (totalExpenseEl) totalExpenseEl.textContent = `NT$${totalExpense.toLocaleString('zh-TW')}`;
        if (summaryLineEl) {
            summaryLineEl.textContent = `收入:NT$${totalIncome.toLocaleString('zh-TW')} 支出:NT$${totalExpense.toLocaleString('zh-TW')}`;
        }
    }
    
    if (monthBudgetEl) monthBudgetEl.textContent = `NT$${totalBudget.toLocaleString('zh-TW')}`;
}

// 計算並更新當天支出
function updateDailyExpense() {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 計算今天的總支出（不包括轉帳）
    let dailyExpense = 0;
    records.forEach(record => {
        const recordDate = new Date(record.date);
        const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
        
        // 只計算支出類型的記錄
        if (recordDateStr === todayStr && (record.type === 'expense' || !record.type)) {
            dailyExpense += record.amount || 0;
        }
    });
    
    // 更新顯示
    const dailyExpenseAmount = document.getElementById('dailyExpenseAmount');
    if (dailyExpenseAmount) {
        dailyExpenseAmount.textContent = `NT$${dailyExpense.toLocaleString('zh-TW')}`;
    }
}

// 顯示記帳本交易列表
function displayLedgerTransactions(records, showAll = false) {
    const ledgerList = document.getElementById('ledgerList');
    if (!ledgerList) return;
    
    // 確保 records 是一個有效的陣列
    if (!records || !Array.isArray(records)) {
        records = [];
    }
    
    if (records.length === 0) {
        ledgerList.innerHTML = '<div class="empty-state">尚無交易記錄</div>';
        return;
    }
    
    // 按日期分組
    const grouped = {};
    records.forEach(record => {
        const date = new Date(record.date);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayName = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
        const fullDateKey = `${dateKey} ${dayName}`;
        
        if (!grouped[fullDateKey]) {
            grouped[fullDateKey] = [];
        }
        grouped[fullDateKey].push(record);
    });
    
    // 對每個日期組內的記錄按時間戳排序（最新的在前）
    Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].sort((a, b) => {
            // 優先使用 timestamp，如果沒有則使用 date
            const timeA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
            const timeB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
            return timeB - timeA; // 降序：最新的在前
        });
    });
    
    // 按日期排序（最新的在前）
    const sortedDates = Object.keys(grouped).sort((a, b) => {
        return b.localeCompare(a);
    });
    
    // 如果不是顯示全部，只顯示今天的記錄
    let displayDates = sortedDates;
    let hasMoreRecords = false;
    if (!showAll) {
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        displayDates = sortedDates.filter(dateKey => {
            return dateKey.startsWith(todayKey);
        });

        hasMoreRecords = sortedDates.length > displayDates.length;
    }
    
    let html = '';
    displayDates.forEach(dateKey => {
        // 優化日期顯示：如果是當年，隱藏年份讓畫面更流暢
        let displayHeader = dateKey;
        const currentYear = new Date().getFullYear();
        if (dateKey.startsWith(String(currentYear) + '-')) {
            displayHeader = dateKey.substring(5); // 移除 "YYYY-"
        }

        html += `<div class="transaction-group">`;
        html += `<div class="group-header">${displayHeader}</div>`;
        
        grouped[dateKey].forEach((record, index) => {
            const amount = record.amount || 0;
            const isExpense = record.type === 'expense' || !record.type;
            const isTransfer = record.type === 'transfer';

            // 定期定額轉帳：分類欄位顯示股票（避免顯示未分類）
            let displayCategory = record.category;
            if (isTransfer && (!displayCategory || displayCategory === '')) {
                if (record.linkedInvestment === true && record.investmentRecordId) {
                    try {
                        const inv = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
                        const matched = inv.find(r => (r.timestamp || r.id) === record.investmentRecordId);
                        if (matched && matched.stockCode) {
                            displayCategory = matched.stockName
                                ? `${matched.stockCode} ${matched.stockName}`
                                : matched.stockCode;
                        }
                    } catch (_) {}
                }

                if ((!displayCategory || displayCategory === '') && record.note) {
                    const m = record.note.match(/\((\d{3,6}[A-Z]?)\)/);
                    if (m && m[1]) {
                        displayCategory = m[1];
                    }
                }
            }
            
            // 獲取帳戶信息
            let accountInfo = '';
            if (record.account && typeof getAccounts === 'function') {
                const accounts = getAccounts();
                const account = accounts.find(a => a.id === record.account);
                if (account) {
                    // 如果有上傳的圖片，顯示圖片；否則顯示默認圖標
                    const accountIcon = account.image 
                        ? `<img src="${account.image}" alt="${account.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px; display: inline-block; vertical-align: middle; margin-right: 6px;">`
                        : '💳 ';
                    accountInfo = `<div class="transaction-account">${accountIcon}${account.name}</div>`;
                }
            }
            
            // 獲取表情或分類圖標
            let iconHtml = '';
            if (record.emoji) {
                if (record.emoji.type === 'image' && isLikelyImageSrc(record.emoji.value)) {
                    iconHtml = `<img src="${record.emoji.value}" alt="表情" class="transaction-emoji-image">`;
                } else {
                    iconHtml = record.emoji.value;
                }
            } else {
                iconHtml = getCategoryIcon(record.category);
            }
            
            // 獲取成員信息
            let memberInfo = '';
            if (record.member) {
                const members = typeof getMembers === 'function' ? getMembers() : [];
                const member = members.find(m => m.name === record.member);
                const memberIcon = member ? member.icon : '👤';
                memberInfo = `<div class="transaction-member">${memberIcon} ${record.member}</div>`;
            }
            
            // 獲取備註圖示
            const getNoteIcon = (note) => {
                if (!note) return '';
                const noteIcons = {
                    '早餐': '🍳',
                    '午餐': '🍱',
                    '晚餐': '🍽️',
                    '交通': '🚗',
                    '購物': '🛒',
                    '娛樂': '🎮'
                };
                // 檢查備註中是否包含常用備註關鍵字
                for (const [key, icon] of Object.entries(noteIcons)) {
                    if (note.includes(key)) {
                        return icon + ' ';
                    }
                }
                return '';
            };
            
            const noteIcon = getNoteIcon(record.note);
            const noteDisplay = record.note ? noteIcon + record.note : '';
            
            // 收據圖片顯示 - 支援多張圖片
            let receiptImageHtml = '';
            if (record.receiptImages && record.receiptImages.length > 0) {
                if (record.receiptImages.length === 1) {
                    // 單張圖片顯示
                    receiptImageHtml = `
                        <div class="transaction-receipt" style="margin-top: 8px;">
                            <img src="${record.receiptImages[0]}" alt="收據" class="receipt-thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #e0e0e0;" data-receipt-images='${JSON.stringify(record.receiptImages)}' data-record-timestamp="${record.timestamp || ''}">
                        </div>
                    `;
                } else {
                    // 多張圖片顯示為縮圖畫廊
                    const thumbnails = record.receiptImages.slice(0, 3).map((img, index) => 
                        `<img src="${img}" alt="收據${index + 1}" class="receipt-thumbnail-small" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px; border: 1px solid #e0e0e0; margin-right: 4px;">`
                    ).join('');
                    
                    const moreText = record.receiptImages.length > 3 ? `+${record.receiptImages.length - 3}` : '';
                    
                    receiptImageHtml = `
                        <div class="transaction-receipt-gallery" style="margin-top: 8px; cursor: pointer;" data-receipt-images='${JSON.stringify(record.receiptImages)}' data-record-timestamp="${record.timestamp || ''}">
                            <div class="receipt-thumbnails" style="display: flex; align-items: center;">
                                ${thumbnails}
                                ${moreText ? `<span style="font-size: 12px; color: #666; margin-left: 4px;">${moreText}</span>` : ''}
                            </div>
                        </div>
                    `;
                }
            } else if (record.receiptImage) {
                // 向後相容舊的單張圖片格式
                receiptImageHtml = `
                    <div class="transaction-receipt" style="margin-top: 8px;">
                        <img src="${record.receiptImage}" alt="收據" class="receipt-thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #e0e0e0;" data-receipt-image="${record.receiptImage}" data-record-timestamp="${record.timestamp || ''}">
                    </div>
                `;
            }
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-icon">${iconHtml}</div>
                    <div class="transaction-info">
                        <div class="transaction-category">${displayCategory || '未分類'}</div>
                        ${accountInfo}
                        ${memberInfo}
                        ${noteDisplay ? `<div class="transaction-note">${noteDisplay}</div>` : ''}
                        ${receiptImageHtml}
                    </div>
                    <div class="transaction-amount-wrapper">
                        <div class="transaction-amount ${isExpense ? 'expense' : isTransfer ? 'transfer' : 'income'}">
                            ${isTransfer ? '' : isExpense ? '-' : '+'}NT$${amount.toLocaleString('zh-TW')}
                        </div>
                        <button class="transaction-delete-btn" data-record-timestamp="${record.timestamp || ''}" data-record-date="${record.date}" data-record-amount="${record.amount}" data-record-category="${record.category || ''}" title="刪除">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    // 如果有更多記錄且不是顯示全部，添加今日支出和查看歷史記錄按鈕
    if (hasMoreRecords && !showAll) {
        // 計算今日支出金額
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        let dailyExpense = 0;
        records.forEach(record => {
            const recordDate = new Date(record.date);
            const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
            if (recordDateStr === todayStr && (record.type === 'expense' || !record.type)) {
                dailyExpense += record.amount || 0;
            }
        });
        const todayExpense = `NT$${dailyExpense.toLocaleString('zh-TW')}`;
        
        html += `
            <div class="history-btn-container">
                <div class="daily-expense-in-history">
                    <span class="daily-expense-label">今日支出</span>
                    <span class="daily-expense-amount">${todayExpense}</span>
                </div>
                <button id="viewHistoryBtn" class="view-history-btn">
                    <span class="history-btn-icon">📜</span>
                    <span class="history-btn-text">查看歷史記錄</span>
                    <span class="history-btn-count">(${sortedDates.length - displayDates.length} 天)</span>
                </button>
            </div>
        `;
    }
    
    ledgerList.innerHTML = html;
    
    // 添加交易項目點擊事件監聽器
    addTransactionClickHandlers();
    
    // 綁定收據圖片點擊事件（查看大圖）
    ledgerList.querySelectorAll('.receipt-thumbnail').forEach(img => {
        img.addEventListener('click', () => {
            const imageUrl = img.getAttribute('data-receipt-image');
            if (imageUrl) {
                showReceiptImageModal(imageUrl);
            }
        });
    });
    
    // 綁定多圖片庫點擊事件
    ledgerList.querySelectorAll('.transaction-receipt-gallery').forEach(gallery => {
        gallery.addEventListener('click', () => {
            const imagesData = gallery.getAttribute('data-receipt-images');
            const timestamp = gallery.getAttribute('data-record-timestamp');
            if (imagesData) {
                try {
                    const images = JSON.parse(imagesData);
                    // 找到對應的記錄並顯示詳情
                    const records = JSON.parse(localStorage.getItem('records') || '[]');
                    const record = records.find(r => r.timestamp === timestamp);
                    if (record) {
                        showEntryDetail(record);
                    }
                } catch (error) {
                    console.error('解析圖片數據失敗:', error);
                }
            }
        });
    });
    
    // 綁定刪除按鈕事件
    document.querySelectorAll('.transaction-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止觸發父元素的點擊事件
            deleteTransaction(btn);
        });
    });
    
    // 綁定查看歷史記錄按鈕
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            showHistoryRecords(records);
        });
    }
}

// 顯示歷史記錄
function showHistoryRecords(records) {
    const modal = document.createElement('div');
    modal.className = 'history-records-modal';
    // 檢測是否為手機端
    const isMobile = window.innerWidth <= 480;
    const modalStyle = isMobile 
        ? 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10005; display: flex; align-items: stretch; justify-content: center; padding: 0; overflow: hidden; touch-action: pan-y;'
        : 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10005; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden; touch-action: pan-y;';
    modal.style.cssText = modalStyle;
    
    // 獲取保存的背景圖片
    const savedBackground = localStorage.getItem('historyBackground') || '';
    
    modal.innerHTML = `
        <div class="history-modal-content" id="historyModalContent">
            <div class="history-modal-header">
                <h2>📜 歷史記錄</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="history-advisor-btn" title="理財顧問">💬</button>
                    <button class="history-background-btn" title="選擇背景">🎨</button>
                    <button class="history-close-btn">✕</button>
                </div>
            </div>

            <div class="history-search-bar">
                <div class="history-search-input-wrap">
                    <span class="history-search-icon">🔎</span>
                    <input id="historySearchInput" class="history-search-input" type="text" placeholder="搜尋分類 / 備註 / 成員 / 帳戶 / 金額" />
                </div>
                <button id="historySearchClearBtn" class="history-search-clear" type="button">清除</button>
            </div>
            
            <div id="historyRecordsList" class="history-records-list">
                <!-- 歷史記錄列表將由 JavaScript 動態生成 -->
            </div>
            
            <!-- 理財顧問聊天界面 -->
            <div id="historyAdvisorChat" class="history-advisor-chat" style="display: none;">
                <div class="advisor-chat-header">
                    <div class="advisor-avatar">
                        <img src="image/7.png" alt="小森" class="advisor-avatar-image">
                    </div>
                    <div class="advisor-info">
                        <div class="advisor-name">小森</div>
                        <div class="advisor-status">在線</div>
                    </div>
                    <button class="advisor-close-btn">✕</button>
                </div>
                <div class="advisor-chat-messages" id="advisorChatMessages">
                    <!-- 消息將由 JavaScript 動態生成 -->
                </div>
                <div class="advisor-chat-input-container">
                    <input type="text" id="advisorChatInput" class="advisor-chat-input" placeholder="輸入問題...">
                    <button id="advisorSendBtn" class="advisor-send-btn">發送</button>
                </div>
            </div>
        </div>
    `;
    
    // 應用背景圖片
    const modalContent = modal.querySelector('#historyModalContent');
    if (savedBackground) {
        modalContent.style.backgroundImage = `url(${savedBackground})`;
        modalContent.style.backgroundSize = 'cover';
        modalContent.style.backgroundPosition = 'center';
        modalContent.style.backgroundRepeat = 'no-repeat';
        modalContent.classList.add('has-background');
    } else {
        modalContent.classList.remove('has-background');
    }
    
    document.body.appendChild(modal);

    const historySearchInput = modal.querySelector('#historySearchInput');
    const historySearchClearBtn = modal.querySelector('#historySearchClearBtn');
    if (historySearchInput) {
        if (historySearchClearBtn) {
            historySearchClearBtn.style.display = historySearchInput.value.trim() ? 'inline-flex' : 'none';
        }
        historySearchInput.addEventListener('input', () => {
            if (historySearchClearBtn) {
                historySearchClearBtn.style.display = historySearchInput.value.trim() ? 'inline-flex' : 'none';
            }
            renderHistoryRecords();
        });
        historySearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                renderHistoryRecords();
            }
        });
    }
    if (historySearchClearBtn && historySearchInput) {
        historySearchClearBtn.addEventListener('click', () => {
            historySearchInput.value = '';
            historySearchInput.focus();
            renderHistoryRecords();
        });
    }
    
    // 渲染歷史記錄列表
    const renderHistoryRecords = () => {
        const historyList = modal.querySelector('#historyRecordsList');
        if (!historyList) return;
        
        // 重新讀取最新記錄（確保是最新的）
        const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        const currentType = window.ledgerType || 'expense';
        let filteredRecords = filterRecordsByType(allRecords, currentType);

        const keyword = (historySearchInput ? historySearchInput.value : '').trim().toLowerCase();
        if (keyword) {
            let accounts = [];
            if (typeof getAccounts === 'function') {
                try {
                    accounts = getAccounts() || [];
                } catch (e) {
                    accounts = [];
                }
            }

            filteredRecords = filteredRecords.filter(record => {
                const amountStr = (record.amount ?? '').toString();
                const category = (record.category || '').toLowerCase();
                const note = (record.note || '').toLowerCase();
                const member = (record.member || '').toLowerCase();
                let accountName = '';
                if (record.account && accounts.length) {
                    const acct = accounts.find(a => a.id === record.account);
                    accountName = (acct?.name || '').toLowerCase();
                }
                const combined = `${category} ${note} ${member} ${accountName} ${amountStr}`;
                return combined.includes(keyword);
            });
        }
        
        if (filteredRecords.length === 0) {
            historyList.innerHTML = keyword
                ? '<div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-tertiary);">找不到符合搜尋條件的記錄</div>'
                : '<div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-tertiary);">尚無歷史記錄</div>';
            return;
        }
        
        // 按日期分組
        const grouped = {};
        filteredRecords.forEach(record => {
            const date = new Date(record.date);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayName = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
            const fullDateKey = `${dateKey} ${dayName}`;
            
            if (!grouped[fullDateKey]) {
                grouped[fullDateKey] = [];
            }
            grouped[fullDateKey].push(record);
        });
        
        // 對每個日期組內的記錄按時間戳排序（最新的在前）
        Object.keys(grouped).forEach(dateKey => {
            grouped[dateKey].sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                const timeB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                return timeB - timeA;
            });
        });
        
        // 按日期排序（最新的在前）
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            return b.localeCompare(a);
        });
        
        let html = '';
        sortedDates.forEach(dateKey => {
            // 優化日期顯示：如果是當年，隱藏年份
            let displayHeader = dateKey;
            const currentYear = new Date().getFullYear();
            if (dateKey.startsWith(String(currentYear) + '-')) {
                displayHeader = dateKey.substring(5);
            }

            html += `<div class="history-transaction-group">`;
            html += `<div class="history-group-header">${displayHeader}</div>`;
            
            grouped[dateKey].forEach((record) => {
                const amount = record.amount || 0;
                const isExpense = record.type === 'expense' || !record.type;
                const isTransfer = record.type === 'transfer';
                
                // 獲取帳戶信息
                let accountInfo = '';
                if (record.account && typeof getAccounts === 'function') {
                    const accounts = getAccounts();
                    const account = accounts.find(a => a.id === record.account);
                    if (account) {
                        const accountIcon = account.image 
                            ? `<img src="${account.image}" alt="${account.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px; display: inline-block; vertical-align: middle; margin-right: 6px;">`
                            : '💳 ';
                        accountInfo = `<div class="history-transaction-account">${accountIcon}${account.name}</div>`;
                    }
                }
                
                // 獲取表情或分類圖標
                let iconHtml = '';
                if (record.emoji) {
                    if (record.emoji.type === 'image' && isLikelyImageSrc(record.emoji.value)) {
                        iconHtml = `<img src="${record.emoji.value}" alt="表情" class="transaction-emoji-image" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px;">`;
                    } else {
                        iconHtml = record.emoji.value;
                    }
                } else {
                    iconHtml = getCategoryIcon(record.category);
                }
                
                // 獲取成員信息
                let memberInfo = '';
                if (record.member) {
                    const members = typeof getMembers === 'function' ? getMembers() : [];
                    const member = members.find(m => m.name === record.member);
                    const memberIcon = member ? member.icon : '👤';
                    memberInfo = `<div class="history-transaction-member">${memberIcon} ${record.member}</div>`;
                }
                
                // 獲取備註圖示
                const getNoteIcon = (note) => {
                    if (!note) return '';
                    const noteIcons = {
                        '早餐': '🍳',
                        '午餐': '🍱',
                        '晚餐': '🍽️',
                        '交通': '🚗',
                        '購物': '🛒',
                        '娛樂': '🎮'
                    };
                    for (const [key, icon] of Object.entries(noteIcons)) {
                        if (note.includes(key)) {
                            return icon + ' ';
                        }
                    }
                    return '';
                };
                
                const noteIcon = getNoteIcon(record.note);
                const noteDisplay = record.note ? noteIcon + record.note : '';
                
                // 收據圖片顯示
                let receiptImageHtml = '';
                if (record.receiptImage) {
                    receiptImageHtml = `
                        <div class="history-receipt-container">
                            <img src="${record.receiptImage}" alt="收據" class="history-receipt-thumbnail" data-receipt-image="${record.receiptImage}">
                        </div>
                    `;
                }
                
                html += `
                    <div class="history-transaction-item">
                        <div class="history-transaction-icon">${iconHtml}</div>
                        <div class="history-transaction-info">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                                <div class="history-transaction-category">${record.category || '未分類'}</div>
                                <div class="history-transaction-amount ${isExpense ? 'expense' : isTransfer ? 'transfer' : 'income'}">
                                ${isTransfer ? '' : isExpense ? '-' : '+'}NT$${amount.toLocaleString('zh-TW')}
                            </div>
                        </div>
                            ${accountInfo}
                            ${memberInfo}
                            ${noteDisplay ? `<div class="history-transaction-note">${noteDisplay}</div>` : ''}
                            ${receiptImageHtml}
                        </div>
                        <button class="history-transaction-delete-btn" data-record-timestamp="${record.timestamp || ''}" data-record-date="${record.date}" data-record-amount="${record.amount}" data-record-category="${record.category || ''}" title="刪除">🗑️</button>
                    </div>
                `;
            });
            
            html += `</div>`;
        });
        
        historyList.innerHTML = html;
        
        // 綁定歷史記錄中的收據圖片點擊事件
        historyList.querySelectorAll('.history-receipt-thumbnail').forEach(img => {
            img.addEventListener('click', () => {
                const imageUrl = img.getAttribute('data-receipt-image');
                if (imageUrl) {
                    showReceiptImageModal(imageUrl);
                }
            });
        });
        
        // 綁定歷史記錄中的刪除按鈕事件
        historyList.querySelectorAll('.history-transaction-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // 先刪除記錄
                deleteTransaction(btn);
                
                // 延遲重新渲染，確保 localStorage 已更新
                setTimeout(() => {
                    renderHistoryRecords();
                }, 100);
            });
        });
    };
    
    renderHistoryRecords();
    
    // 理財顧問按鈕
    const advisorBtn = modal.querySelector('.history-advisor-btn');
    const advisorChat = modal.querySelector('#historyAdvisorChat');
    if (advisorBtn && advisorChat) {
        // 確保初始狀態是隱藏的
        advisorChat.style.display = 'none';
        advisorChat.classList.remove('show');
        
        advisorBtn.addEventListener('click', () => {
            if (advisorChat.classList.contains('show')) {
                // 隱藏
                advisorChat.style.display = 'none';
                advisorChat.classList.remove('show');
            } else {
                // 顯示
                advisorChat.style.display = 'flex';
                advisorChat.classList.add('show');
                initAdvisorChat(records, modal);
            }
        });
    }
    
    // 關閉理財顧問
    const advisorCloseBtn = modal.querySelector('.advisor-close-btn');
    if (advisorCloseBtn && advisorChat) {
        advisorCloseBtn.addEventListener('click', () => {
            advisorChat.style.display = 'none';
            advisorChat.classList.remove('show');
        });
    }
    
    // 背景選擇按鈕
    const backgroundBtn = modal.querySelector('.history-background-btn');
    if (backgroundBtn) {
        backgroundBtn.addEventListener('click', () => {
            showHistoryBackgroundSelector(modalContent);
        });
    }
    
    // 關閉按鈕
    const closeBtn = modal.querySelector('.history-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f5f5f5';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
    }
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}

// 顯示歷史記錄背景選擇器
function showHistoryBackgroundSelector(modalContent) {
    const backgroundModal = document.createElement('div');
    backgroundModal.className = 'history-background-selector-modal';
    backgroundModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10010; display: flex; align-items: center; justify-content: center;';
    
    const backgroundOptions = [
        { url: '', name: '無背景', isCustom: false },
        { url: 'https://i.pinimg.com/736x/f9/e7/ef/f9e7efb84d422c7ca8d2b0990a1b686d.jpg', name: '背景 1', isCustom: false },
        { url: 'https://i.pinimg.com/736x/6a/d0/99/6ad099dc3fe5ca7be5bc0db673f436fc.jpg', name: '背景 2', isCustom: false },
        { url: 'https://i.pinimg.com/736x/b0/0f/a7/b00fa7a9bdce0e1903d7db3603372ed1.jpg', name: '背景 3', isCustom: false },
        { url: 'https://i.pinimg.com/736x/2e/3f/73/2e3f7383640e209810550b998cf3f84d.jpg', name: '背景 4', isCustom: false }
    ];
    
    // 獲取自訂背景
    const customBackgrounds = JSON.parse(localStorage.getItem('customHistoryBackgrounds') || '[]');
    customBackgrounds.forEach((bg, index) => {
        backgroundOptions.push({ url: bg.url, name: bg.name || `自訂背景 ${index + 1}`, isCustom: true, id: bg.id || `custom-${index}` });
    });
    
    const savedBackground = localStorage.getItem('historyBackground') || '';
    
    // 創建隱藏的文件輸入
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    const renderBackgroundOptions = () => {
        const savedBackground = localStorage.getItem('historyBackground') || '';
        const customBackgrounds = JSON.parse(localStorage.getItem('customHistoryBackgrounds') || '[]');
        const allOptions = [
            ...backgroundOptions.filter(opt => !opt.isCustom),
            ...customBackgrounds.map((bg, index) => ({ url: bg.url, name: bg.name || `自訂背景 ${index + 1}`, isCustom: true, id: bg.id || `custom-${index}` }))
        ];
        
        return allOptions.map((option, index) => {
            const isSelected = (option.url === savedBackground) || (option.url === '' && savedBackground === '');
            return `
                <div class="background-option ${isSelected ? 'selected' : ''}" data-url="${option.url}" data-custom="${option.isCustom ? 'true' : 'false'}" data-id="${option.id || ''}" style="position: relative; cursor: pointer; border-radius: 12px; overflow: hidden; border: 3px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}; transition: all 0.2s;">
                    ${option.url ? `
                        <img src="${option.url}" alt="${option.name}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                    ` : `
                        <div style="width: 100%; height: 120px; background: var(--bg-light); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px;">無背景</div>
                    `}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 6px; font-size: 12px; text-align: center;">${option.name}</div>
                    ${isSelected ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--color-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">✓</div>' : ''}
                    ${option.isCustom ? '<button class="delete-custom-background-btn" data-id="' + (option.id || '') + '" style="position: absolute; top: 8px; left: 8px; background: rgba(255,0,0,0.8); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; z-index: 10;" title="刪除">×</button>' : ''}
                </div>
            `;
        }).join('');
    };
    
    backgroundModal.innerHTML = `
        <div class="history-background-selector-content" style="background: var(--bg-white); border-radius: 16px; padding: 24px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: var(--text-primary);">選擇背景</h3>
                <button class="background-selector-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-tertiary); padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">✕</button>
            </div>
            <div style="margin-bottom: 20px;">
                <button class="upload-background-btn" style="width: 100%; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    📷 上傳自己的圖片
                </button>
            </div>
            <div class="background-options-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
                ${renderBackgroundOptions()}
            </div>
        </div>
    `;
    
    document.body.appendChild(backgroundModal);
    
    // 上傳按鈕事件
    const uploadBtn = backgroundModal.querySelector('.upload-background-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // 處理文件上傳
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 檢查文件大小（手機放寬限制到 20MB）
            const maxSize = 20 * 1024 * 1024; // 20MB
            if (file.size > maxSize) {
                alert(`圖片太大！請選擇小於 ${Math.round(maxSize / 1024 / 1024)}MB 的圖片。\n目前檔案大小：${Math.round(file.size / 1024 / 1024)}MB`);
                fileInput.value = '';
                return;
            }
            
            // 顯示上傳進度提示
            const progressMsg = document.createElement('div');
            progressMsg.textContent = '正在處理圖片，請稍候...';
            progressMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 15px 25px; border-radius: 8px; z-index: 10000;';
            document.body.appendChild(progressMsg);
            
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    let imageData = event.target.result;
                    
                    // 壓縮圖片（針對手機優化：更小尺寸，適中品質）
                    if (typeof compressImage === 'function') {
                        try {
                            // 手機使用更激進的壓縮
                            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                            const maxWidth = isMobile ? 1280 : 1920;
                            const maxHeight = isMobile ? 720 : 1080;
                            const quality = isMobile ? 0.6 : 0.8;
                            
                            imageData = await compressImage(imageData, maxWidth, maxHeight, quality);
                            console.log('背景圖片已壓縮（手機優化）');
                        } catch (error) {
                            console.error('圖片壓縮失敗:', error);
                            // 壓縮失敗時使用原始圖片
                        }
                    }
                    
                    // 保存到自訂背景列表
                    const customBackgrounds = JSON.parse(localStorage.getItem('customHistoryBackgrounds') || '[]');
                    const newBackground = {
                        id: 'custom-' + Date.now(),
                        url: imageData,
                        name: file.name || '自訂背景',
                        date: new Date().toISOString(),
                        originalSize: file.size,
                        compressed: imageData !== event.target.result
                    };
                    customBackgrounds.push(newBackground);
                    localStorage.setItem('customHistoryBackgrounds', JSON.stringify(customBackgrounds));
                    
                    // 移除進度提示
                    document.body.removeChild(progressMsg);
                    
                    // 重新渲染背景選項
                    const grid = backgroundModal.querySelector('.background-options-grid');
                    if (grid) {
                        const savedBackground = localStorage.getItem('historyBackground') || '';
                        const allOptions = [
                            ...backgroundOptions.filter(opt => !opt.isCustom),
                            ...customBackgrounds.map((bg, index) => ({ url: bg.url, name: bg.name || `自訂背景 ${index + 1}`, isCustom: true, id: bg.id || `custom-${index}` }))
                        ];
                        grid.innerHTML = allOptions.map((option, index) => {
                            const isSelected = (option.url === savedBackground) || (option.url === '' && savedBackground === '');
                            return `
                                <div class="background-option ${isSelected ? 'selected' : ''}" data-url="${option.url}" data-custom="${option.isCustom ? 'true' : 'false'}" data-id="${option.id || ''}" style="position: relative; cursor: pointer; border-radius: 12px; overflow: hidden; border: 3px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}; transition: all 0.2s;">
                                    ${option.url ? `
                                        <img src="${option.url}" alt="${option.name}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                                    ` : `
                                        <div style="width: 100%; height: 120px; background: var(--bg-light); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px;">無背景</div>
                                    `}
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 6px; font-size: 12px; text-align: center;">${option.name}</div>
                                    ${isSelected ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--color-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">✓</div>' : ''}
                                    ${option.isCustom ? '<button class="delete-custom-background-btn" data-id="' + (option.id || '') + '" style="position: absolute; top: 8px; left: 8px; background: rgba(255,0,0,0.8); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; z-index: 10;" title="刪除">×</button>' : ''}
                                </div>
                            `;
                        }).join('');
                        bindBackgroundEvents();
                    }

                    fileInput.value = '';
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('圖片處理失敗:', error);
                // 移除進度提示
                if (document.body.contains(progressMsg)) {
                    document.body.removeChild(progressMsg);
                }
                alert('圖片處理失敗，請重試');
                fileInput.value = '';
            }
        }
    });

    // 綁定背景選擇和刪除事件
    const bindBackgroundEvents = () => {
        // 綁定選擇事件
        backgroundModal.querySelectorAll('.background-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // 如果點擊的是刪除按鈕，不觸發選擇
                if (e.target.classList.contains('delete-custom-background-btn') || e.target.closest('.delete-custom-background-btn')) {
                    return;
                }
                
                const url = option.getAttribute('data-url');
                localStorage.setItem('historyBackground', url);
                
                // 更新當前顯示的背景
                if (url) {
                    modalContent.style.backgroundImage = `url(${url})`;
                    modalContent.style.backgroundSize = 'cover';
                    modalContent.style.backgroundPosition = 'center';
                    modalContent.style.backgroundRepeat = 'no-repeat';
                    modalContent.classList.add('has-background');
                } else {
                    modalContent.style.backgroundImage = 'none';
                    modalContent.classList.remove('has-background');
                }
                
                // 關閉選擇器
                if (document.body.contains(backgroundModal)) {
                    document.body.removeChild(backgroundModal);
                }
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            });
        });
        
        // 綁定刪除按鈕事件
        backgroundModal.querySelectorAll('.delete-custom-background-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const url = btn.closest('.background-option').getAttribute('data-url');
                
                if (confirm('確定要刪除這個自訂背景嗎？')) {
                    // 從列表中移除
                    const customBackgrounds = JSON.parse(localStorage.getItem('customHistoryBackgrounds') || '[]');
                    const filtered = customBackgrounds.filter(bg => bg.id !== id);
                    localStorage.setItem('customHistoryBackgrounds', JSON.stringify(filtered));
                    
                    // 如果刪除的是當前使用的背景，清除背景
                    const currentBackground = localStorage.getItem('historyBackground') || '';
                    if (currentBackground === url) {
                        localStorage.setItem('historyBackground', '');
                        modalContent.style.backgroundImage = 'none';
                        modalContent.classList.remove('has-background');
                    }
                    
                    // 重新渲染
                    const grid = backgroundModal.querySelector('.background-options-grid');
                    if (grid) {
                        const savedBackground = localStorage.getItem('historyBackground') || '';
                        const allOptions = [
                            ...backgroundOptions.filter(opt => !opt.isCustom),
                            ...filtered.map((bg, index) => ({ url: bg.url, name: bg.name || `自訂背景 ${index + 1}`, isCustom: true, id: bg.id || `custom-${index}` }))
                        ];
                        grid.innerHTML = allOptions.map((option, index) => {
                            const isSelected = (option.url === savedBackground) || (option.url === '' && savedBackground === '');
                            return `
                                <div class="background-option ${isSelected ? 'selected' : ''}" data-url="${option.url}" data-custom="${option.isCustom ? 'true' : 'false'}" data-id="${option.id || ''}" style="position: relative; cursor: pointer; border-radius: 12px; overflow: hidden; border: 3px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}; transition: all 0.2s;">
                                    ${option.url ? `
                                        <img src="${option.url}" alt="${option.name}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                                    ` : `
                                        <div style="width: 100%; height: 120px; background: var(--bg-light); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px;">無背景</div>
                                    `}
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 6px; font-size: 12px; text-align: center;">${option.name}</div>
                                    ${isSelected ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--color-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">✓</div>' : ''}
                                    ${option.isCustom ? '<button class="delete-custom-background-btn" data-id="' + (option.id || '') + '" style="position: absolute; top: 8px; left: 8px; background: rgba(255,0,0,0.8); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; z-index: 10;" title="刪除">×</button>' : ''}
                                </div>
                            `;
                        }).join('');
                        bindBackgroundEvents();
                    }
                }
            });
        });
    };
    
    bindBackgroundEvents();
    
    // 關閉按鈕
    const closeBtn = backgroundModal.querySelector('.background-selector-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(backgroundModal)) {
                document.body.removeChild(backgroundModal);
            }
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        });
    }
    
    // 點擊遮罩關閉
    backgroundModal.addEventListener('click', (e) => {
        if (e.target === backgroundModal) {
            if (document.body.contains(backgroundModal)) {
                document.body.removeChild(backgroundModal);
            }
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }
    });
}

// 理財顧問相關函數已移至 js/advisor.js

// 判斷字串是否為「看起來像圖片來源」的 src
function isLikelyImageSrc(value) {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    if (!v) return false;
    if (/^data:image\//i.test(v)) return true;
    if (/^blob:/i.test(v)) return true;
    if (/^https?:\/\//i.test(v)) return true;
    if (/^(?:\.\.\/|\.\/|\/)/.test(v) && /\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?|#|$)/i.test(v)) return true;
    if (/\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?|#|$)/i.test(v)) return true;
    return false;
}

// 刪除交易記錄
function deleteTransaction(btn) {
    // 確認刪除
    if (!confirm('確定要刪除這筆交易記錄嗎？此操作無法復原。')) {
        return;
    }
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    // 獲取記錄的識別信息
    const timestamp = btn.dataset.recordTimestamp;
    const date = btn.dataset.recordDate;
    const amount = parseFloat(btn.dataset.recordAmount);
    const category = btn.dataset.recordCategory;
    
    // 找到並刪除對應的記錄（使用多個字段匹配以確保準確性）
    const filteredRecords = records.filter(record => {
        // 如果有timestamp，優先使用timestamp匹配
        if (timestamp && record.timestamp) {
            return record.timestamp !== timestamp;
        }
        // 否則使用多個字段組合匹配
        return !(record.date === date && 
                 record.amount === amount && 
                 (record.category || '') === category);
    });
    
    // 保存更新後的記錄
    localStorage.setItem('accountingRecords', JSON.stringify(filteredRecords));
    
    // 更新顯示
    if (typeof initLedger === 'function') {
        initLedger();
    } else {
        // 如果initLedger不存在，直接更新
        const updatedRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        if (typeof updateLedgerSummary === 'function') {
            updateLedgerSummary(updatedRecords);
        }
        if (typeof displayLedgerTransactions === 'function') {
            displayLedgerTransactions(updatedRecords);
        }
    }
    
    // 顯示成功訊息
    const successMsg = document.createElement('div');
    successMsg.textContent = '已刪除交易記錄';
    successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 16px 24px; border-radius: 12px; z-index: 10001; font-size: 16px;';
    document.body.appendChild(successMsg);
    setTimeout(() => {
        if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
        }
    }, 1500);
}

// 獲取分類圖標（簡化版）
function getCategoryIcon(category) {
    // 檢查是否有自定義圖片圖標
    const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
    const customIconValue = customIcons[category]?.value;
    if (customIcons[category] && customIcons[category].type === 'image' && isLikelyImageSrc(customIconValue)) {
        return `<img src="${customIconValue}" alt="${category}" class="transaction-emoji-image" onerror="this.outerHTML='📦'">`;
    }

    const defaultImg = getDefaultCategoryImage(category);
    if (defaultImg) {
        return `<img src="${defaultImg}" alt="${category}" class="transaction-emoji-image" onerror="this.outerHTML='📦'">`;
    }
    
    // 查找分類的默認圖標
    const categoryData = allCategories.find(cat => cat.name === category);
    if (categoryData) {
        return categoryData.icon;
    }
    
    const iconMap = {
        '飲食': '🍔',
        '交通': '🚇',
        '娛樂': '🎮',
        '醫療': '🏥',
        '卡費': '💳',
        '投資': '📈'
    };
    return iconMap[category] || '📦';
}

// 圖表實例
let pieChartInstance = null;
let barChartInstance = null;
let monthCompareChartInstance = null;
let lineChartInstance = null;
let stockTradeChartSellInstance = null;
let stockTradeChartDivInstance = null;
let stockPnlChartInstance = null;
let stockAllocationChartInstance = null;
let stockSectorChartInstance = null;
let stockCurrencyChartInstance = null;
let chartTabInited = false;

// 提供理財建議
function provideFinancialAdvice(records) {
    const selectedBase = parseMonthKey(getSelectedMonthKey()) || new Date();
    const now = new Date(selectedBase.getFullYear(), selectedBase.getMonth(), 1);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const expenses = monthlyRecords.filter(r => r.type === 'expense' || !r.type);
    const incomes = monthlyRecords.filter(r => r.type === 'income');
    
    const totalExpense = expenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalIncome = incomes.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    let response = `💡 理財建議：\n\n`;
    
    if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1);
        if (savingsRate > 20) {
            response += `✅ 您的儲蓄率為 ${savingsRate}%，表現優秀！\n`;
        } else if (savingsRate > 0) {
            response += `⚠️ 您的儲蓄率為 ${savingsRate}%，建議提高到 20% 以上。\n`;
        } else {
            response += `❌ 本月出現超支，建議檢視支出項目，找出可以節省的地方。\n`;
        }
    }
    
    // 分類建議
    const categoryStats = {};
    expenses.forEach(r => {
        const category = r.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + (r.amount || 0);
    });
    
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > totalExpense * 0.3) {
        response += `\n📌 注意：「${topCategory[0]}」佔總支出 ${((topCategory[1] / totalExpense) * 100).toFixed(1)}%，建議檢視是否有優化空間。\n`;
    }
    
    response += `\n💪 理財小貼士：\n`;
    response += `• 記帳是理財的第一步，持續記錄很重要\n`;
    response += `• 建議設定預算，控制各分類支出\n`;
    response += `• 定期檢視支出趨勢，找出不必要的開銷\n`;
    response += `• 建立緊急預備金，至少 3-6 個月的生活費\n`;
    
    return response;
}

// 分析分類
function analyzeCategories(records) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyExpenses = records.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    const categoryStats = {};
    monthlyExpenses.forEach(r => {
        const category = r.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + (r.amount || 0);
    });
    
    const total = monthlyExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
    
    let response = `📂 支出分類分析：\n\n`;
    sortedCategories.forEach(([cat, amount], index) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        response += `${index + 1}. ${cat}：NT$ ${amount.toLocaleString('zh-TW')} (${percentage}%)\n`;
    });
    
    return response;
}

// 分析趨勢
function analyzeTrends(records) {
    const now = new Date();
    const monthlyData = {};
    
    // 統計最近 6 個月的支出
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = 0;
    }
    
    records.forEach(r => {
        if (r.type === 'expense' || !r.type) {
            const recordDate = new Date(r.date);
            const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData.hasOwnProperty(monthKey)) {
                monthlyData[monthKey] += (r.amount || 0);
            }
        }
    });
    
    const values = Object.values(monthlyData);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values[values.length - 1] > values[values.length - 2] ? '上升' : '下降';
    
    let response = `📈 支出趨勢分析（最近 6 個月）：\n\n`;
    response += `• 平均月支出：NT$ ${Math.round(avg).toLocaleString('zh-TW')}\n`;
    response += `• 最新趨勢：${trend}\n`;
    
    return response;
}

// 分析預算
function analyzeBudget(records) {
    // 獲取預算設定
    const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    
    if (budgets.length === 0) {
        return `📋 您還沒有設定預算。\n\n建議為主要支出分類設定預算，這樣可以更好地控制支出。\n\n可以在「設置」中設定預算。`;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyExpenses = records.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    let response = `📋 預算執行情況：\n\n`;
    
    budgets.forEach(budget => {
        const categoryExpenses = monthlyExpenses
            .filter(r => (r.category || '未分類') === budget.category)
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        const percentage = (categoryExpenses / budget.amount * 100).toFixed(1);
        const status = percentage > 100 ? '❌ 超支' : percentage > 80 ? '⚠️ 接近' : '✅ 正常';
        
        response += `${budget.category}：\n`;
        response += `• 預算：NT$ ${budget.amount.toLocaleString('zh-TW')}\n`;
        response += `• 已用：NT$ ${categoryExpenses.toLocaleString('zh-TW')} (${percentage}%)\n`;
        response += `• 狀態：${status}\n\n`;
    });
    
    return response;
}

// 查詢特定日期的記錄
function queryDateRecords(userMessage, records) {
    // 解析日期
    const datePatterns = [
        /(\d{1,2})\s*[月\/\-]\s*(\d{1,2})/g,  // 例如：12月5號、12/5、12-5
        /(\d{1,2})\s*號/g,  // 例如：5號
        /(\d{4})\s*[年\/\-]\s*(\d{1,2})\s*[月\/\-]\s*(\d{1,2})/g,  // 例如：2024年12月5日
        /今天|今日/g,
        /昨天|昨日/g,
        /前天/g,
        /(\d+)\s*天前/g
    ];
    
    let targetDate = null;
    const now = new Date();
    
    // 嘗試匹配各種日期格式
    for (const pattern of datePatterns) {
        const match = userMessage.match(pattern);
        if (match) {
            const matchStr = match[0];
            
            if (matchStr.includes('今天') || matchStr.includes('今日')) {
                targetDate = new Date(now);
            } else if (matchStr.includes('昨天') || matchStr.includes('昨日')) {
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() - 1);
            } else if (matchStr.includes('前天')) {
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() - 2);
            } else if (matchStr.includes('天前')) {
                const daysAgo = parseInt(matchStr.match(/(\d+)/)[1]);
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() - daysAgo);
            } else {
                // 解析月日格式
                const numbers = matchStr.match(/\d+/g);
                if (numbers && numbers.length >= 2) {
                    const month = parseInt(numbers[0]);
                    const day = parseInt(numbers[1]);
                    targetDate = new Date(now.getFullYear(), month - 1, day);
                } else if (numbers && numbers.length === 1) {
                    // 只有日期，使用當前月份
                    const day = parseInt(numbers[0]);
                    targetDate = new Date(now.getFullYear(), now.getMonth(), day);
                }
            }
            
            if (targetDate) break;
        }
    }
    
    // 如果沒有找到日期，嘗試查找最近的記錄
    if (!targetDate) {
        // 如果用戶問「買了什麼」但沒有指定日期，返回最近的記錄
        if (userMessage.includes('買了什麼') || userMessage.includes('花了什麼')) {
            // 返回最近幾筆記錄
            const recentRecords = records
                .filter(r => r.type === 'expense' || !r.type)
                .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB - dateA;
                })
                .slice(0, 10);
            
            if (recentRecords.length === 0) {
                return '📋 您最近沒有支出記錄。';
            }
            
            let response = '📋 您最近的支出記錄：\n\n';
            recentRecords.forEach((record, index) => {
                const date = new Date(record.date);
                const dateStr = `${date.getMonth() + 1}月${date.getDate()}號`;
                const amount = record.amount || 0;
                const category = record.category || '未分類';
                response += `${index + 1}. ${dateStr} - ${category}：NT$ ${amount.toLocaleString('zh-TW')}\n`;
            });
            
            return response;
        }
        
        return '📅 我沒有在您的問題中找到具體日期。\n\n您可以這樣問我：\n• "12月5號買了什麼"\n• "昨天花了什麼"\n• "查一下今天買了什麼"\n• "幾月幾號買了什麼東西"';
    }
    
    // 格式化日期用於比較
    const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    // 查找該日期的記錄
    const dateRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
        return recordDateStr === targetDateStr;
    });
    
    if (dateRecords.length === 0) {
        const dateStr = `${targetDate.getMonth() + 1}月${targetDate.getDate()}號`;
        return `📅 ${dateStr} 沒有找到任何記錄。\n\n您可以查看其他日期的記錄，或者告訴我您想查詢的具體日期。`;
    }
    
    // 分類統計
    const expenses = dateRecords.filter(r => r.type === 'expense' || !r.type);
    const incomes = dateRecords.filter(r => r.type === 'income');
    const transfers = dateRecords.filter(r => r.type === 'transfer');
    
    const dateStr = `${targetDate.getMonth() + 1}月${targetDate.getDate()}號`;
    let response = `📅 ${dateStr} 的記錄：\n\n`;
    
    if (expenses.length > 0) {
        const totalExpense = expenses.reduce((sum, r) => sum + (r.amount || 0), 0);
        response += `📤 支出 (${expenses.length} 筆，共 NT$ ${totalExpense.toLocaleString('zh-TW')})：\n`;
        expenses.forEach((record, index) => {
            const category = record.category || '未分類';
            const amount = record.amount || 0;
            const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
            const member = record.member || '';
            const note = record.note ? ` (${record.note})` : '';
            response += `${index + 1}. ${category}：NT$ ${amount.toLocaleString('zh-TW')}`;
            if (account) response += ` [${account}]`;
            if (member) response += ` [${member}]`;
            if (note) response += note;
            response += '\n';
        });
        response += '\n';
    }
    
    if (incomes.length > 0) {
        const totalIncome = incomes.reduce((sum, r) => sum + (r.amount || 0), 0);
        response += `💰 收入 (${incomes.length} 筆，共 NT$ ${totalIncome.toLocaleString('zh-TW')})：\n`;
        incomes.forEach((record, index) => {
            const category = record.category || '未分類';
            const amount = record.amount || 0;
            const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
            response += `${index + 1}. ${category}：NT$ ${amount.toLocaleString('zh-TW')}`;
            if (account) response += ` [${account}]`;
            response += '\n';
        });
        response += '\n';
    }
    
    if (transfers.length > 0) {
        response += `🔄 轉帳 (${transfers.length} 筆)：\n`;
        transfers.forEach((record, index) => {
            const amount = record.amount || 0;
            const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
            response += `${index + 1}. NT$ ${amount.toLocaleString('zh-TW')}`;
            if (account) response += ` [${account}]`;
            response += '\n';
        });
    }
    
    return response;
}

// 查詢特定金額和分類的記錄
function queryAmountAndCategory(userMessage, records) {
    // 提取金額
    const amountMatches = userMessage.match(/(\d+)/g);
    if (!amountMatches || amountMatches.length === 0) {
        return '💰 我沒有在您的問題中找到金額。\n\n您可以這樣問我：\n• "我什麼時候買午餐花了170"\n• "哪天買了東西花了500"';
    }
    
    // 取第一個數字作為金額（通常是最後提到的金額）
    const targetAmount = parseFloat(amountMatches[amountMatches.length - 1]);
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
        return '💰 我無法識別您提到的金額。\n\n請告訴我具體的金額，例如："我什麼時候買午餐花了170"';
    }
    
    // 提取分類關鍵詞
    const categoryKeywords = [
        '午餐', '早餐', '晚餐', '宵夜', '食物', '餐', '飯',
        '交通', '車', '公車', '捷運', '計程車', '油錢',
        '購物', '買', '衣服', '鞋子', '用品',
        '娛樂', '電影', '遊戲', '唱歌',
        '醫療', '看病', '藥',
        '房租', '水電', '電費', '水費', '網路',
        '其他'
    ];
    
    let targetCategory = null;
    for (const keyword of categoryKeywords) {
        if (userMessage.includes(keyword)) {
            targetCategory = keyword;
            break;
        }
    }
    
    // 如果沒有找到分類關鍵詞，嘗試從記錄中匹配分類名稱
    if (!targetCategory) {
        const allCategories = [...new Set(records.map(r => r.category).filter(c => c))];
        for (const cat of allCategories) {
            if (userMessage.includes(cat)) {
                targetCategory = cat;
                break;
            }
        }
    }
    
    // 過濾記錄：匹配金額和分類（如果指定了分類）
    let matchedRecords = records.filter(record => {
        const recordAmount = record.amount || 0;
        // 允許金額有小的誤差（±1元）
        const amountMatch = Math.abs(recordAmount - targetAmount) <= 1;
        
        if (!amountMatch) return false;
        
        // 如果是支出記錄
        if (record.type === 'expense' || !record.type) {
            // 如果指定了分類，檢查分類是否匹配
            if (targetCategory) {
                const recordCategory = record.category || '未分類';
                return recordCategory.includes(targetCategory) || targetCategory.includes(recordCategory);
            }
            // 如果沒有指定分類，只匹配金額
            return true;
        }
        
        return false;
    });
    
    // 如果沒有找到完全匹配的，嘗試只匹配金額
    if (matchedRecords.length === 0 && targetCategory) {
        matchedRecords = records.filter(record => {
            const recordAmount = record.amount || 0;
            const amountMatch = Math.abs(recordAmount - targetAmount) <= 1;
            return amountMatch && (record.type === 'expense' || !record.type);
        });
    }
    
    if (matchedRecords.length === 0) {
        let response = `🔍 沒有找到符合條件的記錄。\n\n`;
        if (targetCategory) {
            response += `搜尋條件：\n• 分類：${targetCategory}\n• 金額：NT$ ${targetAmount.toLocaleString('zh-TW')}\n\n`;
        } else {
            response += `搜尋條件：\n• 金額：NT$ ${targetAmount.toLocaleString('zh-TW')}\n\n`;
        }
        response += `💡 提示：\n• 確認金額是否正確\n• 確認分類名稱是否匹配\n• 可以只問金額，例如："什麼時候花了170"`;
        return response;
    }
    
    // 按日期排序（最新的在前）
    matchedRecords.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    let response = `🔍 找到 ${matchedRecords.length} 筆符合條件的記錄：\n\n`;
    
    matchedRecords.forEach((record, index) => {
        const date = new Date(record.date);
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}號`;
        const category = record.category || '未分類';
        const amount = record.amount || 0;
        const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
        const member = record.member || '';
        const note = record.note ? ` (${record.note})` : '';
        
        response += `${index + 1}. ${dateStr} - ${category}：NT$ ${amount.toLocaleString('zh-TW')}`;
        if (account) response += ` [${account}]`;
        if (member) response += ` [${member}]`;
        if (note) response += note;
        response += '\n';
    });
    
    if (matchedRecords.length === 1) {
        const record = matchedRecords[0];
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}號`;
        response += `\n✅ 答案是：${dateStr}`;
    } else {
        response += `\n💡 找到多筆記錄，請查看上面的詳細列表。`;
    }
    
    return response;
}

// 查詢特定金額買了什麼（例如：1500是買了什麼）
function queryAmountOnly(userMessage, records, targetAmount) {
    // 過濾記錄：匹配金額
    const matchedRecords = records.filter(record => {
        const recordAmount = record.amount || 0;
        // 允許金額有小的誤差（±1元）
        const amountMatch = Math.abs(recordAmount - targetAmount) <= 1;
        return amountMatch && (record.type === 'expense' || !record.type);
    });
    
    if (matchedRecords.length === 0) {
        return `🔍 沒有找到金額為 NT$ ${targetAmount.toLocaleString('zh-TW')} 的支出記錄。\n\n💡 提示：\n• 確認金額是否正確\n• 可能該金額的記錄還沒有記錄`;
    }
    
    // 按日期排序（最新的在前）
    matchedRecords.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    let response = `💰 金額 NT$ ${targetAmount.toLocaleString('zh-TW')} 的支出記錄：\n\n`;
    
    matchedRecords.forEach((record, index) => {
        const date = new Date(record.date);
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}號`;
        const category = record.category || '未分類';
        const amount = record.amount || 0;
        const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
        const member = record.member || '';
        const note = record.note ? ` (${record.note})` : '';
        
        response += `${index + 1}. ${dateStr} - ${category}：NT$ ${amount.toLocaleString('zh-TW')}`;
        if (account) response += ` [${account}]`;
        if (member) response += ` [${member}]`;
        if (note) response += note;
        response += '\n';
    });
    
    if (matchedRecords.length === 1) {
        const record = matchedRecords[0];
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}號`;
        const category = record.category || '未分類';
        response += `\n✅ 答案是：${dateStr} 買了 ${category}`;
    }
    
    return response;
}

// 查詢特定日期和金額的記錄（例如：12/7買了1500的東西）
function queryDateAndAmount(userMessage, records, dateMatch, targetAmount) {
    // 解析日期
    const month = parseInt(dateMatch[1]);
    const day = parseInt(dateMatch[2]);
    const now = new Date();
    
    // 如果月份大於12，可能是 日/月 格式
    let targetDate;
    if (month > 12 && day <= 12) {
        targetDate = new Date(now.getFullYear(), day - 1, month);
    } else {
        targetDate = new Date(now.getFullYear(), month - 1, day);
    }
    
    // 格式化日期用於比較
    const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    // 查找該日期且金額匹配的記錄
    const matchedRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
        const recordAmount = record.amount || 0;
        const amountMatch = Math.abs(recordAmount - targetAmount) <= 1;
        return recordDateStr === targetDateStr && amountMatch && (record.type === 'expense' || !record.type);
    });
    
    const dateStr = `${targetDate.getMonth() + 1}月${targetDate.getDate()}號`;
    
    if (matchedRecords.length === 0) {
        return `🔍 ${dateStr} 沒有找到金額為 NT$ ${targetAmount.toLocaleString('zh-TW')} 的支出記錄。\n\n💡 提示：\n• 確認日期是否正確\n• 確認金額是否正確`;
    }
    
    let response = `📅 ${dateStr} 金額 NT$ ${targetAmount.toLocaleString('zh-TW')} 的記錄：\n\n`;
    
    matchedRecords.forEach((record, index) => {
        const category = record.category || '未分類';
        const amount = record.amount || 0;
        const account = record.account && typeof getAccounts === 'function' ? getAccounts().find(a => a.id === record.account)?.name : '';
        const member = record.member || '';
        const note = record.note ? ` (${record.note})` : '';
        
        response += `${index + 1}. ${category}：NT$ ${amount.toLocaleString('zh-TW')}`;
        if (account) response += ` [${account}]`;
        if (member) response += ` [${member}]`;
        if (note) response += note;
        response += '\n';
    });
    
    if (matchedRecords.length === 1) {
        const record = matchedRecords[0];
        const category = record.category || '未分類';
        response += `\n✅ 答案是：${category}`;
    }
    
    return response;
}

// 一般回應
function getGeneralResponse(userMessage, records) {
    const responses = [
        '我理解您的問題。讓我為您分析一下記帳數據...',
        '這是個好問題！根據您的記帳記錄...',
        '讓我查看一下您的財務狀況...',
        '根據您的記帳習慣，我建議...'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + '\n\n您可以問我關於支出、收入、分類、趨勢、預算等問題，或者查詢特定日期的記錄（例如："12月5號買了什麼"），我會根據您的記帳數據提供分析。';
}

 // 初始化圖表頁面
function initChart() {
    setupChartTabs();
    // 初始化所有圖表
    updateAllCharts();
}

function setupChartTabs() {
    if (chartTabInited) return;
    const tabExpense = document.getElementById('chartTabExpense');
    const tabInvestment = document.getElementById('chartTabInvestment');
    const pageExpense = document.getElementById('chartExpensePage');
    const pageInvestment = document.getElementById('chartInvestmentPage');
    if (!tabExpense || !tabInvestment || !pageExpense || !pageInvestment) return;

    const activate = (target) => {
        const showExpense = target === 'expense';
        tabExpense.classList.toggle('active', showExpense);
        tabInvestment.classList.toggle('active', !showExpense);
        pageExpense.classList.toggle('chart-page--active', showExpense);
        pageInvestment.classList.toggle('chart-page--active', !showExpense);
        // 重繪圖表避免尺寸錯誤
        if (typeof updateAllCharts === 'function') {
            setTimeout(() => updateAllCharts(), 30);
        }
    };

    tabExpense.addEventListener('click', () => activate('expense'));
    tabInvestment.addEventListener('click', () => activate('investment'));
    activate('expense');
    chartTabInited = true;
}

 // 更新所有圖表
function updateAllCharts() {
    updatePieChart();    // 圓餅圖：本月支出結構
    updateBarChart();    // 長條圖：各分類支出
    updateMonthCompareChart(); // 長條圖：上月 vs 本月分類比較
    updateLineChart();   // 折線圖：每月總支出趨勢
    updateStockAllocationChart(); // 股票持倉分佈
    updateStockPnlChart(); // 股票持倉盈虧
    updateStockTradeChart(); // 股票交易分析
}

function updateMonthCompareChart() {
    const canvas = document.getElementById('monthCompareChart');
    if (!canvas) return;

    const insightEl = document.getElementById('monthCompareInsight');
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const thisMonthKey = getSelectedMonthKey();
    const lastMonthKey = addMonthsToKey(thisMonthKey, -1);

    const isExpense = (r) => r && (r.type === 'expense' || !r.type);
    const monthKeyOf = (dateStr) => {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const sumByCategory = (monthKey) => {
        const map = {};
        records.forEach(r => {
            if (!isExpense(r)) return;
            if (monthKeyOf(r.date) !== monthKey) return;
            const cat = r.category || '未分類';
            map[cat] = (map[cat] || 0) + (r.amount || 0);
        });
        return map;
    };

    const thisMap = sumByCategory(thisMonthKey);
    const lastMap = sumByCategory(lastMonthKey);
    const categories = Array.from(new Set([...Object.keys(thisMap), ...Object.keys(lastMap)]));

    if (categories.length === 0) {
        if (monthCompareChartInstance) {
            monthCompareChartInstance.destroy();
            monthCompareChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }

    // 依「本月」金額排序，取前 10 類
    const ranked = categories
        .map(c => ({
            category: c,
            thisAmount: thisMap[c] || 0,
            lastAmount: lastMap[c] || 0,
            diff: (thisMap[c] || 0) - (lastMap[c] || 0)
        }))
        .sort((a, b) => b.thisAmount - a.thisAmount)
        .slice(0, 10);

    // 文案：找出差異最大的分類
    const diffTop = [...ranked].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
    if (insightEl && diffTop) {
        const diffAbs = Math.abs(diffTop.diff);
        if (diffAbs === 0) {
            insightEl.textContent = `本月與上月差異不大（前 ${ranked.length} 類）`;
        } else {
            const direction = diffTop.diff > 0 ? '多' : '少';
            insightEl.textContent = `本月${diffTop.category}比上月${direction} NT$${diffAbs.toLocaleString('zh-TW')}`;
        }
    }

    const labels = ranked.map(r => r.category);
    const lastValues = ranked.map(r => r.lastAmount);
    const thisValues = ranked.map(r => r.thisAmount);

    if (monthCompareChartInstance) {
        monthCompareChartInstance.destroy();
    }

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#ff69b4';
    const primaryLight = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-rgba-20').trim() || 'rgba(255, 105, 180, 0.25)';
    const borderLight = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || '#f0f0f0';
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';

    monthCompareChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '上月',
                    data: lastValues,
                    backgroundColor: primaryLight,
                    borderColor: borderLight,
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 12
                },
                {
                    label: '本月',
                    data: thisValues,
                    backgroundColor: primary,
                    borderColor: primary,
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 12
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textSecondary,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-white').trim() || 'var(--bg-white)',
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    borderColor: borderLight,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: NT$${context.parsed.x.toLocaleString('zh-TW')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textSecondary,
                        callback: function(value) {
                            return 'NT$' + value.toLocaleString('zh-TW');
                        }
                    },
                    grid: {
                        color: borderLight
                    }
                },
                y: {
                    ticks: {
                        color: textSecondary
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 圓餅圖：本月支出結構
function updatePieChart() {
    const palette = getThemeChartPalette();
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    const insightEl = document.getElementById('pieChartInsight');
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const currentMonth = getSelectedMonthKey();
    
    // 過濾本月支出記錄
    const monthRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        return recordMonth === currentMonth && record.type === 'expense';
    });
    
    if (monthRecords.length === 0) {
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }
    
    // 按分類統計
    const data = getChartData(monthRecords, 'category');
    if (data.labels.length === 0) {
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }

    // 一句人話：最大支出分類占比
    if (insightEl) {
        const total = data.values.reduce((a, b) => a + b, 0);
        const topLabel = data.labels[0];
        const topValue = data.values[0] || 0;
        const pct = total > 0 ? ((topValue / total) * 100).toFixed(0) : '0';
        insightEl.textContent = `本月花最多在「${topLabel}」，佔本月支出約 ${pct}%（NT$${topValue.toLocaleString('zh-TW')}）`;
    }
    
    const colors = generateColors(data.labels.length, palette);
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    pieChartInstance = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
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
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-white').trim() || 'var(--bg-white)',
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || '#f0f0f0',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: NT$${value.toLocaleString('zh-TW')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 長條圖：各分類支出
function updateBarChart() {
    const palette = getThemeChartPalette();
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    const insightEl = document.getElementById('barChartInsight');
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const currentMonth = getSelectedMonthKey();
    
    // 過濾本月支出記錄
    const monthRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        return recordMonth === currentMonth && record.type === 'expense';
    });
    
    if (monthRecords.length === 0) {
        if (barChartInstance) {
            barChartInstance.destroy();
            barChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }
    
    // 按分類統計
    const data = getChartData(monthRecords, 'category');
    if (data.labels.length === 0) {
        if (barChartInstance) {
            barChartInstance.destroy();
            barChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }

    // 一句人話：本月最高支出分類
    if (insightEl) {
        const topLabel = data.labels[0];
        const topValue = data.values[0] || 0;
        insightEl.textContent = `本月最高支出分類是「${topLabel}」，共 NT$${topValue.toLocaleString('zh-TW')}`;
    }
    
    // 只顯示前10個分類（按金額排序）
    const topData = {
        labels: data.labels.slice(0, 10),
        values: data.values.slice(0, 10)
    };
    
    const colors = generateColors(topData.labels.length, palette);
    
    if (barChartInstance) {
        barChartInstance.destroy();
    }
    
    barChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: topData.labels,
            datasets: [{
                label: '支出金額',
                data: topData.values,
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
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-white').trim() || 'var(--bg-white)',
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || '#f0f0f0',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `NT$${context.parsed.y.toLocaleString('zh-TW')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: palette.textSecondary
                    },
                    grid: {
                        color: palette.border
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: palette.textSecondary,
                        callback: function(value) {
                            return 'NT$' + value.toLocaleString('zh-TW');
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || '#f0f0f0'
                    }
                }
            }
        }
    });
}

// 折線圖：每月總支出趨勢
function updateLineChart() {
    const palette = getThemeChartPalette();
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;

    const insightEl = document.getElementById('lineChartInsight');
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    // 過濾支出記錄
    const expenseRecords = records.filter(record => record.type === 'expense');
    
    if (expenseRecords.length === 0) {
        if (lineChartInstance) {
            lineChartInstance.destroy();
            lineChartInstance = null;
        }
        if (insightEl) insightEl.textContent = '';
        return;
    }
    
    // 按月份統計（最近12個月）
    const monthlyData = {};
    const now = new Date();
    
    // 初始化最近12個月
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = 0;
    }
    
    // 統計每月支出
    expenseRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey] += record.amount || 0;
        }
    });
    
    const labels = Object.keys(monthlyData);
    const values = Object.values(monthlyData);

    // 一句人話：本月 vs 上月總支出變化（用 labels 最後兩個月）
    if (insightEl && labels.length >= 2) {
        const last = values[values.length - 1] || 0;
        const prev = values[values.length - 2] || 0;
        const diff = last - prev;
        const diffAbs = Math.abs(diff);
        if (diffAbs === 0) {
            insightEl.textContent = `本月總支出與上月差不多（NT$${last.toLocaleString('zh-TW')}）`;
        } else {
            const dir = diff > 0 ? '多' : '少';
            insightEl.textContent = `本月總支出比上月${dir} NT$${diffAbs.toLocaleString('zh-TW')}（本月 NT$${last.toLocaleString('zh-TW')}）`;
        }
    } else if (insightEl) {
        insightEl.textContent = '';
    }
    
    if (lineChartInstance) {
        lineChartInstance.destroy();
    }
    
    lineChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '總支出',
                data: values,
                borderColor: palette.primary,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary-rgba-10').trim() || 'rgba(255, 105, 180, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `NT$${context.parsed.y.toLocaleString('zh-TW')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'NT$' + value.toLocaleString('zh-TW');
                        }
                    }
                }
            }
        }
    });
}

// 獲取圖表數據
function getChartData(records, dimension) {
    const dataMap = {};
    let total = 0;
    
    records.forEach(record => {
        let key = '';
        
        if (dimension === 'category') {
            key = record.category || '未分類';
        } else if (dimension === 'account') {
            if (record.account && typeof getAccounts === 'function') {
                const accounts = getAccounts();
                const account = accounts.find(a => a.id === record.account);
                key = account ? account.name : '未指定帳戶';
            } else {
                key = '未指定帳戶';
            }
        } else if (dimension === 'member') {
            // 使用成員欄位，如果沒有則顯示「未指定成員」
            key = record.member || '未指定成員';
        }
        
        if (!dataMap[key]) {
            dataMap[key] = 0;
        }
        dataMap[key] += record.amount || 0;
        total += record.amount || 0;
    });
    
    // 轉換為數組並排序
    const entries = Object.entries(dataMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    
    return {
        labels: entries.map(e => e.label),
        values: entries.map(e => e.value),
        total: total
    };
}

// 生成顏色（會依主題色或自訂顏色）
function generateColors(count, palette) {
    // 檢查是否有自訂圖表顏色
    const customTheme = getCustomTheme();
    let baseColors = [];
    
    if (customTheme.chartColors && customTheme.chartColors.length > 0) {
        // 使用自訂顏色
        baseColors = customTheme.chartColors.map(color => {
            // 將 hex 顏色轉換為 rgba
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return {
                bg: `rgba(${r}, ${g}, ${b}, 0.8)`,
                border: `rgba(${r}, ${g}, ${b}, 1)`
            };
        });
        
        // 如果自訂顏色不夠，重複使用
        while (baseColors.length < count) {
            baseColors = baseColors.concat(baseColors);
        }
    } else {
        // 根據當前主題生成顏色
        const root = document.documentElement;
        const primaryColor = palette?.primary || getComputedStyle(root).getPropertyValue('--color-primary').trim();
        const primaryLight = palette?.primaryLight || getComputedStyle(root).getPropertyValue('--color-primary-light').trim();
        const primaryLighter = palette?.primaryLighter || getComputedStyle(root).getPropertyValue('--color-primary-lighter').trim();
        const primaryDark = palette?.primaryDark || getComputedStyle(root).getPropertyValue('--color-primary-dark').trim();
        
        // 將 hex 顏色轉換為 RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        // 生成主題相關的顏色系列
        const primaryRgb = hexToRgb(primaryColor);
        const lightRgb = hexToRgb(primaryLight);
        const lighterRgb = hexToRgb(primaryLighter);
        const darkRgb = hexToRgb(primaryDark);
        
        if (primaryRgb && lightRgb && lighterRgb && darkRgb) {
            // 根據主題顏色生成漸變色系列
            baseColors = [
                { bg: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`, border: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 1)` },
                { bg: `rgba(${lightRgb.r}, ${lightRgb.g}, ${lightRgb.b}, 0.8)`, border: `rgba(${lightRgb.r}, ${lightRgb.g}, ${lightRgb.b}, 1)` },
                { bg: `rgba(${lighterRgb.r}, ${lighterRgb.g}, ${lighterRgb.b}, 0.8)`, border: `rgba(${lighterRgb.r}, ${lighterRgb.g}, ${lighterRgb.b}, 1)` },
                { bg: `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.8)`, border: `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 1)` },
                // 生成更多漸變色
                { bg: `rgba(${Math.min(255, primaryRgb.r + 20)}, ${Math.min(255, primaryRgb.g + 20)}, ${Math.min(255, primaryRgb.b + 20)}, 0.8)`, border: `rgba(${Math.min(255, primaryRgb.r + 20)}, ${Math.min(255, primaryRgb.g + 20)}, ${Math.min(255, primaryRgb.b + 20)}, 1)` },
                { bg: `rgba(${Math.max(0, primaryRgb.r - 20)}, ${Math.max(0, primaryRgb.g - 20)}, ${Math.max(0, primaryRgb.b - 20)}, 0.8)`, border: `rgba(${Math.max(0, primaryRgb.r - 20)}, ${Math.max(0, primaryRgb.g - 20)}, ${Math.max(0, primaryRgb.b - 20)}, 1)` },
                { bg: `rgba(${Math.min(255, lightRgb.r + 15)}, ${Math.min(255, lightRgb.g + 15)}, ${Math.min(255, lightRgb.b + 15)}, 0.8)`, border: `rgba(${Math.min(255, lightRgb.r + 15)}, ${Math.min(255, lightRgb.g + 15)}, ${Math.min(255, lightRgb.b + 15)}, 1)` },
                { bg: `rgba(${Math.max(0, lightRgb.r - 15)}, ${Math.max(0, lightRgb.g - 15)}, ${Math.max(0, lightRgb.b - 15)}, 0.8)`, border: `rgba(${Math.max(0, lightRgb.r - 15)}, ${Math.max(0, lightRgb.g - 15)}, ${Math.max(0, lightRgb.b - 15)}, 1)` },
                { bg: `rgba(${Math.min(255, lighterRgb.r + 10)}, ${Math.min(255, lighterRgb.g + 10)}, ${Math.min(255, lighterRgb.b + 10)}, 0.8)`, border: `rgba(${Math.min(255, lighterRgb.r + 10)}, ${Math.min(255, lighterRgb.g + 10)}, ${Math.min(255, lighterRgb.b + 10)}, 1)` },
                { bg: `rgba(${Math.max(0, darkRgb.r - 10)}, ${Math.max(0, darkRgb.g - 10)}, ${Math.max(0, darkRgb.b - 10)}, 0.8)`, border: `rgba(${Math.max(0, darkRgb.r - 10)}, ${Math.max(0, darkRgb.g - 10)}, ${Math.max(0, darkRgb.b - 10)}, 1)` }
            ];
        } else {
            // 如果無法解析顏色，使用預設粉色系
            baseColors = [
                { bg: 'rgba(255, 105, 180, 0.8)', border: 'rgba(255, 105, 180, 1)' },
                { bg: 'rgba(255, 182, 193, 0.8)', border: 'rgba(255, 182, 193, 1)' },
                { bg: 'rgba(255, 192, 203, 0.8)', border: 'rgba(255, 192, 203, 1)' },
                { bg: 'rgba(255, 20, 147, 0.8)', border: 'rgba(255, 20, 147, 1)' },
                { bg: 'rgba(219, 112, 147, 0.8)', border: 'rgba(219, 112, 147, 1)' },
                { bg: 'rgba(199, 21, 133, 0.8)', border: 'rgba(199, 21, 133, 1)' },
                { bg: 'rgba(255, 160, 122, 0.8)', border: 'rgba(255, 160, 122, 1)' },
                { bg: 'rgba(255, 140, 0, 0.8)', border: 'rgba(255, 140, 0, 1)' },
                { bg: 'rgba(255, 165, 0, 0.8)', border: 'rgba(255, 165, 0, 1)' },
                { bg: 'rgba(255, 215, 0, 0.8)', border: 'rgba(255, 215, 0, 1)' }
            ];
        }
    }
    
    const backgrounds = [];
    const borders = [];
    
    for (let i = 0; i < count; i++) {
        const color = baseColors[i % baseColors.length];
        backgrounds.push(color.bg);
        borders.push(color.border);
    }
    
    return { backgrounds, borders };
}

// 更新圖例
function updateChartLegend(data, colors) {
    const chartLegend = document.getElementById('chartLegend');
    if (!chartLegend) return;
    
    let html = '<div class="chart-legend-header">';
    html += `<div class="legend-total">總計: NT$${data.total.toLocaleString('zh-TW')}</div>`;
    html += '</div>';
    html += '<div class="chart-legend-list">';
    
    data.labels.forEach((label, index) => {
        const value = data.values[index];
        const percentage = ((value / data.total) * 100).toFixed(1);
        
        html += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${colors.backgrounds[index]}; border-color: ${colors.borders[index]};"></div>
                <div class="legend-info">
                    <div class="legend-label">${label}</div>
                    <div class="legend-value">NT$${value.toLocaleString('zh-TW')} (${percentage}%)</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    chartLegend.innerHTML = html;
}

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKeyParts(monthKey) {
    const m = /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : null;
    if (!m) return null;
    const [y, mo] = m.split('-').map(v => parseInt(v, 10));
    if (!y || !mo) return null;
    return { year: y, month: mo };
}

function shiftMonthKey(monthKey, deltaMonths) {
    const parsed = parseMonthKeyParts(monthKey);
    if (!parsed) return null;
    const d = new Date(parsed.year, parsed.month - 1, 1);
    d.setMonth(d.getMonth() + deltaMonths);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function getRecentMonthKeys(count = 12, anchorMonthKey = null) {
    const anchor = anchorMonthKey && /^\d{4}-\d{2}$/.test(anchorMonthKey) ? anchorMonthKey : getCurrentMonthKey();
    const keys = [];
    for (let i = 0; i < count; i++) {
        const k = shiftMonthKey(anchor, -i);
        if (k) keys.push(k);
    }
    return keys;
}

function ensureMonthBudgetsInitialized(monthKey) {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return;
    ensureMonthlyBudgetMigration();
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const obj = byMonth && typeof byMonth === 'object' ? byMonth : {};
    if (obj[monthKey] && typeof obj[monthKey] === 'object') return;

    // Try to copy from the nearest previous month that has budgets
    let source = null;
    for (let i = 1; i <= 36; i++) {
        const prevKey = shiftMonthKey(monthKey, -i);
        if (!prevKey) break;
        const prevBudgets = obj[prevKey];
        if (prevBudgets && typeof prevBudgets === 'object' && Object.keys(prevBudgets).length > 0) {
            source = prevBudgets;
            break;
        }
    }

    obj[monthKey] = source ? { ...source } : {};
    localStorage.setItem('categoryBudgetsByMonth', JSON.stringify(obj));
}

function ensureMonthlyBudgetMigration() {
    const monthKey = getCurrentMonthKey();
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const obj = byMonth && typeof byMonth === 'object' ? byMonth : {};

    // categoryBudgets 是「本月」預算，其他功能（固定支出同步、下月卡費等）會直接寫入它，
    // 所以以它為準同步到本月的分月預算
    const legacyRaw = localStorage.getItem('categoryBudgets');
    if (legacyRaw === null) return;
    let legacy;
    try {
        legacy = JSON.parse(legacyRaw);
    } catch (e) {
        return;
    }
    if (!legacy || typeof legacy !== 'object') return;
    if (JSON.stringify(obj[monthKey] || null) === JSON.stringify(legacy)) return;

    obj[monthKey] = { ...legacy };
    localStorage.setItem('categoryBudgetsByMonth', JSON.stringify(obj));
}

function setBudgetSelectedMonthKey(monthKey) {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return;
    localStorage.setItem('budgetSelectedMonthKey', monthKey);
}

function getBudgetSelectedMonthKey() {
    ensureMonthlyBudgetMigration();
    const stored = localStorage.getItem('budgetSelectedMonthKey');
    if (stored && /^\d{4}-\d{2}$/.test(stored)) return stored;
    return getCurrentMonthKey();
}

function getCategoryBudgetsForSelectedMonth() {
    ensureMonthlyBudgetMigration();
    const monthKey = getBudgetSelectedMonthKey();
    ensureMonthBudgetsInitialized(monthKey);
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const budgets = byMonth && typeof byMonth === 'object' ? byMonth[monthKey] : null;
    return budgets && typeof budgets === 'object' ? budgets : {};
}

function saveCategoryBudgetsForSelectedMonth(budgets) {
    ensureMonthlyBudgetMigration();
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const monthKey = getBudgetSelectedMonthKey();
    const nextByMonth = byMonth && typeof byMonth === 'object' ? { ...byMonth } : {};
    nextByMonth[monthKey] = budgets && typeof budgets === 'object' ? { ...budgets } : {};
    localStorage.setItem('categoryBudgetsByMonth', JSON.stringify(nextByMonth));

    if (monthKey === getCurrentMonthKey()) {
        localStorage.setItem('categoryBudgets', JSON.stringify(nextByMonth[monthKey] || {}));
    }
}

function getBudgetMonthsSorted() {
    ensureMonthlyBudgetMigration();
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const keys = byMonth && typeof byMonth === 'object' ? Object.keys(byMonth) : [];
    const months = keys.filter(k => /^\d{4}-\d{2}$/.test(k)).sort((a, b) => b.localeCompare(a));
    const selected = getBudgetSelectedMonthKey();
    if (!months.includes(selected)) months.unshift(selected);
    const recent = getRecentMonthKeys(12, selected);
    return Array.from(new Set([...recent, ...months]));
}

function getTotalBudgetAmountForMonthKey(monthKey) {
    const byMonth = JSON.parse(localStorage.getItem('categoryBudgetsByMonth') || '{}');
    const budgets = byMonth && typeof byMonth === 'object' ? byMonth[monthKey] : null;
    const obj = budgets && typeof budgets === 'object' ? budgets : {};
    let total = 0;
    Object.keys(obj).forEach(k => { total += Number(obj[k]) || 0; });
    return total;
}

function renderBudgetMonthPanel() {
    const selectEl = document.getElementById('budgetMonthSelect');
    const listEl = document.getElementById('budgetMonthList');
    if (!selectEl || !listEl) return;

    const months = getBudgetMonthsSorted();
    const selected = getBudgetSelectedMonthKey();

    selectEl.innerHTML = months.map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`).join('');

    if (!selectEl.dataset.bound) {
        selectEl.addEventListener('change', () => {
            setBudgetSelectedMonthKey(selectEl.value);
            initBudget();
        });
        selectEl.dataset.bound = '1';
    }

    listEl.innerHTML = '';
    listEl.style.display = 'none';
}

// 計算分類的已使用金額（當月）
function getCategoryUsedAmount(categoryName, records) {
    const currentMonth = getBudgetSelectedMonthKey();
    
    let used = 0;
    records.forEach(record => {
        const recordDate = new Date(record.date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        if (recordMonth === currentMonth && 
            (record.type === 'expense' || !record.type) && 
            record.category === categoryName) {
            used += record.amount;
        }
    });
    
    return used;
}

// 顯示預算設定對話框（美化版）
function showBudgetSettingDialog(categoryName) {
    const budgets = { ...getCategoryBudgetsForSelectedMonth() };
    const dailyTrackingState = JSON.parse(localStorage.getItem('dailyBudgetTracking') || '{}');
    const currentBudget = budgets[categoryName] || 0;
    const isCurrentlyTracking = dailyTrackingState[categoryName] === true;
    
    // 查找分類信息
    const category = allCategories.find(cat => cat.name === categoryName);
    const categoryIcon = category ? category.icon : '💰';
    
    // 創建預算設定模態框
    const budgetModal = document.createElement('div');
    budgetModal.className = 'budget-setting-modal';
    
    budgetModal.innerHTML = `
        <div class="budget-setting-modal-content" style="background: var(--bg-white); border-radius: 24px; padding: 28px; max-width: 420px; width: 100%; box-shadow: var(--shadow-primary-lg), 0 4px 16px rgba(0, 0, 0, 0.15); border: 1px solid var(--color-primary-rgba-20); animation: slideIn 0.3s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 28px;">${categoryIcon}</span>
                    <span>設定預算</span>
                </h2>
                <button class="budget-setup-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-tertiary); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">×</button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 16px; background: var(--bg-gradient-light); border-radius: 12px; border: 1px solid var(--color-primary-rgba-20);">
                <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">分類名稱</div>
                <div style="font-size: 18px; color: var(--color-primary-dark); font-weight: 600;">
                    ${categoryName}
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label for="budgetAmountInput" style="display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">預算金額 <span style="font-size: 12px; font-weight: normal; color: var(--text-tertiary);">(輸入 0 可刪除預算)</span></label>
                <div style="position: relative;">
                    <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-weight: 600; font-size: 16px;">NT$</span>
                    <input type="number" id="budgetAmountInput" value="${currentBudget}" step="0.01" min="0" placeholder="請輸入預算金額" class="budget-amount-input" style="width: 100%; padding: 14px 16px 14px 60px; border: 2px solid var(--border-light); border-radius: 12px; font-size: 18px; font-weight: 600; background: var(--bg-white); color: var(--text-primary); transition: all 0.3s; box-sizing: border-box;">
                </div>
            </div>
            
            <div style="margin-bottom: 28px; padding: 16px; background: var(--bg-gradient-light); border-radius: 12px; border: 1px solid var(--color-primary-rgba-20);">
                <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                    <input type="checkbox" id="enableDailyTracking" ${isCurrentlyTracking ? 'checked' : ''} style="width: 20px; height: 20px; margin-right: 12px; cursor: pointer; accent-color: var(--color-primary); flex-shrink: 0;">
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                            <span>📅</span>
                            <span>開啟每日預算追蹤</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">監控每天的預算使用情況，幫助您更好地控制支出</div>
                    </div>
                </label>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button id="budgetSetupCancelBtn" class="budget-setup-cancel-btn" style="flex: 1; padding: 14px; border: 2px solid var(--border-light); border-radius: 12px; background: var(--bg-white); color: var(--text-primary); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;">取消</button>
                <button id="budgetSetupSaveBtn" class="budget-setup-save-btn" style="flex: 2; padding: 14px; border: none; border-radius: 12px; background: var(--bg-gradient); color: var(--text-white); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-primary);">儲存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(budgetModal);
    
    // 關閉按鈕
    const closeBtn = budgetModal.querySelector('.budget-setup-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
        if (document.body.contains(budgetModal)) {
            document.body.removeChild(budgetModal);
        }
    });
    
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--bg-lighter)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
    }
    
    const cancelBtn = budgetModal.querySelector('#budgetSetupCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
        if (document.body.contains(budgetModal)) {
            document.body.removeChild(budgetModal);
        }
    });
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'var(--bg-lighter)';
            cancelBtn.style.borderColor = 'var(--color-primary-light)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'var(--bg-white)';
            cancelBtn.style.borderColor = 'var(--border-light)';
        });
    }
    
    // 儲存按鈕懸停效果
    const saveBtn = budgetModal.querySelector('#budgetSetupSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('mouseenter', () => {
            saveBtn.style.transform = 'translateY(-2px)';
            saveBtn.style.boxShadow = 'var(--shadow-primary-lg)';
        });
        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.transform = 'translateY(0)';
            saveBtn.style.boxShadow = 'var(--shadow-primary)';
        });
    }
    
    // 輸入框聚焦效果
    const budgetInput = budgetModal.querySelector('#budgetAmountInput');
    if (budgetInput) {
        budgetInput.addEventListener('focus', function() {
            this.style.borderColor = 'var(--color-primary)';
            this.style.boxShadow = '0 4px 12px var(--color-primary-rgba-20)';
        });
        budgetInput.addEventListener('blur', function() {
            this.style.borderColor = 'var(--border-light)';
            this.style.boxShadow = 'none';
        });
    }
    
    // 點擊遮罩關閉
    budgetModal.addEventListener('click', (e) => {
        if (e.target === budgetModal) {
            if (document.body.contains(budgetModal)) {
                document.body.removeChild(budgetModal);
            }
        }
    });
    
    // 保存按鈕
    budgetModal.querySelector('#budgetSetupSaveBtn').addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const budgetInput = budgetModal.querySelector('#budgetAmountInput');
        const enableDailyTracking = budgetModal.querySelector('#enableDailyTracking').checked;
        const budgetAmount = parseFloat(budgetInput.value);
    
    if (isNaN(budgetAmount) || budgetAmount < 0) {
        alert('請輸入有效的金額（大於等於0）');
            budgetInput.focus();
        return;
    }
    
    if (budgetAmount === 0) {
        // 如果輸入0，刪除預算
        delete budgets[categoryName];
            // 同時刪除每日追蹤設定
            delete dailyTrackingState[categoryName];
    } else {
        budgets[categoryName] = budgetAmount;
            
            // 保存每日追蹤設定
            if (enableDailyTracking) {
                dailyTrackingState[categoryName] = true;
            } else {
                delete dailyTrackingState[categoryName];
            }
    }
    
    saveCategoryBudgetsForSelectedMonth(budgets);
        localStorage.setItem('dailyBudgetTracking', JSON.stringify(dailyTrackingState));
        
        // 關閉模態框
        if (document.body.contains(budgetModal)) {
            document.body.removeChild(budgetModal);
        }
    
    // 重新初始化預算頁面
    initBudget();
    });
    
    // 自動聚焦到輸入框
    setTimeout(() => {
        budgetModal.querySelector('#budgetAmountInput').focus();
        budgetModal.querySelector('#budgetAmountInput').select();
    }, 100);
}

// 編輯預算
function editBudget(categoryName) {
    showBudgetSettingDialog(categoryName);
}

// 初始化預算頁面
function initBudget() {
    // 自動套用下月預算（如果有的話）
    applyNextMonthBudgets();
    
    renderBudgetMonthPanel();
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const budgets = getCategoryBudgetsForSelectedMonth();
    
    // 計算總預算
    let totalBudget = 0;
    Object.keys(budgets).forEach(categoryId => {
        totalBudget += budgets[categoryId];
    });
    
    // 計算已使用
    const currentMonth = getBudgetSelectedMonthKey();
    
    let totalUsed = 0;
    
    records.forEach(record => {
        const recordDate = new Date(record.date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        if (recordMonth === currentMonth && (record.type === 'expense' || !record.type)) {
            totalUsed += record.amount;
        }
    });
    
    const remaining = totalBudget - totalUsed;
    
    // 更新顯示
    const totalBudgetEl = document.getElementById('totalBudgetAmount');
    const totalUsedEl = document.getElementById('totalBudgetUsed');
    const remainingEl = document.getElementById('totalBudgetRemaining');
    
    if (totalBudgetEl) {
        totalBudgetEl.textContent = `NT$${totalBudget.toLocaleString('zh-TW')}`;
        // 確保有正確的類別
        totalBudgetEl.classList.add('budget-total');
        totalBudgetEl.classList.remove('over-budget');
    }
    if (totalUsedEl) {
        totalUsedEl.textContent = `NT$${totalUsed.toLocaleString('zh-TW')}`;
        // 確保有正確的類別
        totalUsedEl.classList.add('budget-used');
        if (totalUsed > totalBudget && totalBudget > 0) {
            totalUsedEl.classList.add('over-budget');
        } else {
            totalUsedEl.classList.remove('over-budget');
        }
    }
    if (remainingEl) {
        remainingEl.textContent = `NT$${remaining.toLocaleString('zh-TW')}`;
        // 確保有正確的類別
        remainingEl.classList.add('budget-remaining');
        if (remaining < 0) {
            remainingEl.classList.add('over-budget');
        } else {
            remainingEl.classList.remove('over-budget');
        }
    }
    
    // 顯示預算列表
    const budgetList = document.getElementById('budgetList');
    if (budgetList) {
        // 先載入自定義分類，確保 allCategories 包含最新分類
        loadCustomCategories();
        
        // 獲取所有啟用的分類（與記帳本保持一致）
        // 使用 getEnabledCategories(null) 獲取所有啟用的分類，不分類型
        let allAvailableCategories = getEnabledCategories(null);
        
        // 過濾出有設定預算的分類，以及所有分類（用於新增預算）
        const categoriesWithBudget = allAvailableCategories.filter(cat => budgets.hasOwnProperty(cat.name));
        const categoriesWithoutBudget = allAvailableCategories.filter(cat => !budgets.hasOwnProperty(cat.name));
        
        // 始終顯示「新增預算」按鈕（如果還有未設定預算的分類）
        if (categoriesWithBudget.length === 0 && categoriesWithoutBudget.length === 0) {
            budgetList.innerHTML = '<div class="empty-state">尚無預算設定<br><small>點擊「新增預算」按鈕開始設定</small></div><div class="budget-add-section"><button class="budget-edit-btn budget-add-btn-full" onclick="showAddBudgetDialog()">➕ 新增預算</button></div>';
        } else {
            let html = '';
            
            // 顯示已設定預算的分類
            categoriesWithBudget.forEach(category => {
                const budget = budgets[category.name];
                const used = getCategoryUsedAmount(category.name, records);
                const remaining = budget - used;
                const percentage = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
                const isOverBudget = used > budget;
                
                // 進度條顏色類名（使用CSS變數）
                let progressColorClass = 'progress-success'; // 綠色
                if (percentage >= 100) {
                    progressColorClass = 'progress-error'; // 紅色（超過）
                } else if (percentage >= 80) {
                    progressColorClass = 'progress-warning'; // 橙色（接近）
                }
                
                // 為所有開啟每日追蹤的分類添加查看詳細追蹤按鈕
                const dailyTrackingState = JSON.parse(localStorage.getItem('dailyBudgetTracking') || '{}');
                const isDailyTrackingEnabled = dailyTrackingState[category.name] === true;
                let dailyBudgetButton = '';
                if (isDailyTrackingEnabled) {
                    dailyBudgetButton = `
                        <button class="daily-budget-track-btn" data-category="${category.name}">
                            📅 查看每日追蹤
                        </button>
                    `;
                }
                
                html += `
                    <div class="budget-item">
                        <div class="budget-item-icon">${category.icon}</div>
                        <div class="budget-item-info">
                            <div class="budget-item-header">
                                <span class="budget-item-name">${category.name}</span>
                                <span class="budget-item-status ${isOverBudget ? 'over-budget' : ''}">
                                    ${isOverBudget ? '已超支' : `${percentage.toFixed(0)}%`}
                                </span>
                            </div>
                            <div class="budget-progress-bar">
                                <div class="budget-progress-fill ${progressColorClass}" style="width: ${percentage}%;"></div>
                            </div>
                            <div class="budget-item-details">
                                <div class="budget-detail-item">
                                    <span class="budget-detail-label">預算</span>
                                    <span class="budget-detail-value budget-detail-total">NT$${budget.toLocaleString('zh-TW')}</span>
                                </div>
                                <div class="budget-detail-item">
                                    <span class="budget-detail-label">已使用</span>
                                    <span class="budget-detail-value budget-detail-used ${isOverBudget ? 'over-budget' : ''}">NT$${used.toLocaleString('zh-TW')}</span>
                                </div>
                                <div class="budget-detail-item">
                                    <span class="budget-detail-label">剩餘</span>
                                    <span class="budget-detail-value budget-detail-remaining ${remaining < 0 ? 'over-budget' : ''}">NT$${remaining.toLocaleString('zh-TW')}</span>
                                </div>
                            </div>
                            ${dailyBudgetButton}
                        </div>
                        <button class="budget-edit-btn" onclick="editBudget('${category.name}')">編輯</button>
                    </div>
                `;
            });
            
            // 始終顯示「新增預算」按鈕（如果還有未設定預算的分類）
            if (categoriesWithoutBudget.length > 0) {
                html += `
                    <div class="budget-add-section">
                        <button class="budget-edit-btn budget-add-btn-full" onclick="showAddBudgetDialog()">
                            ➕ 新增預算
                        </button>
                    </div>
                `;
            } else {
                // 即使所有分類都已設定預算，也顯示「新增預算」按鈕，允許重新設定或添加新分類
                html += `
                    <div class="budget-add-section">
                        <button class="budget-edit-btn budget-add-btn-full" onclick="showAddBudgetDialog()">
                            ➕ 新增預算
                        </button>
                    </div>
                `;
            }
            
            budgetList.innerHTML = html;
            
            // 為所有開啟每日追蹤的分類按鈕綁定事件監聽器
            const trackBtns = budgetList.querySelectorAll('.daily-budget-track-btn');
            trackBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const categoryName = btn.dataset.category;
                    if (categoryName) {
                        showDailyBudgetPage(categoryName);
                    }
                });
            });
        }
    }
}

// 計算每日預算信息
function calculateDailyBudget(categoryName, totalBudget, records) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    // 計算當月天數
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 基礎每日預算
    const baseDailyBudget = totalBudget / daysInMonth;
    
    // 獲取當月所有該分類的記錄
    const monthRecords = records.filter(record => {
        if (record.category !== categoryName) return false;
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear && 
               recordDate.getMonth() === currentMonth &&
               (record.type === 'expense' || !record.type);
    });
    
    // 計算每日使用情況
    const dailyUsage = {};
    monthRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const day = recordDate.getDate();
        if (!dailyUsage[day]) {
            dailyUsage[day] = 0;
        }
        dailyUsage[day] += record.amount || 0;
    });
    
    // 計算今日使用
    const todayUsed = dailyUsage[currentDay] || 0;
    
    // 計算累積調整（用多了扣明天，用少了加明天）
    let cumulativeAdjustment = 0;
    for (let day = 1; day < currentDay; day++) {
        const dayUsed = dailyUsage[day] || 0;
        const adjustment = baseDailyBudget - dayUsed; // 正數表示省了，負數表示超了
        cumulativeAdjustment += adjustment;
    }
    
    // 今日可用 = 基礎每日預算 + 累積調整 - 今日已用
    const todayAvailable = baseDailyBudget + cumulativeAdjustment - todayUsed;
    
    // 明日調整 = 今日的調整（基礎每日預算 - 今日已用）
    const todayAdjustment = baseDailyBudget - todayUsed;
    const tomorrowAdjustment = todayAdjustment;
    
    return {
        dailyBudget: Math.round(baseDailyBudget * 100) / 100,
        todayUsed: Math.round(todayUsed * 100) / 100,
        todayAvailable: Math.round(todayAvailable * 100) / 100,
        adjustment: Math.round(tomorrowAdjustment * 100) / 100,
        daysInMonth: daysInMonth,
        dailyUsage: dailyUsage,
        totalBudget: totalBudget
    };
}

// 顯示每日預算追蹤頁面
function showDailyBudgetPage(categoryName = '生活費') {
    const pageBudget = document.getElementById('pageBudget');
    const pageDailyBudget = document.getElementById('pageDailyBudget');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (!pageDailyBudget) return;
    
    // 保存當前分類名稱到全局變量
    window.currentDailyBudgetCategory = categoryName;
    
    // 隱藏預算頁面
    if (pageBudget) pageBudget.style.display = 'none';
    
    // 顯示每日預算追蹤頁面
    pageDailyBudget.style.display = 'block';
    
    // 隱藏底部導航
    if (bottomNav) bottomNav.style.display = 'none';
    
    // 初始化頁面內容
    initDailyBudgetPage(categoryName);
}

// 返回預算設定頁面
function showBudgetPage() {
    const pageBudget = document.getElementById('pageBudget');
    const pageDailyBudget = document.getElementById('pageDailyBudget');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (!pageBudget) return;
    
    // 隱藏每日預算追蹤頁面
    if (pageDailyBudget) pageDailyBudget.style.display = 'none';
    
    // 顯示預算頁面
    pageBudget.style.display = 'block';
    
    // 顯示底部導航
    if (bottomNav) bottomNav.style.display = 'flex';
    
    // 重新初始化預算頁面
    if (typeof initBudget === 'function') {
        initBudget();
    }
}

// 初始化每日預算追蹤頁面
function initDailyBudgetPage(categoryName = '生活費') {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const budgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
    const budget = budgets[categoryName] || 0;
    
    // 更新頁面標題
    const titleElement = document.querySelector('.daily-budget-title');
    if (titleElement) {
        const categoryIcon = categoryName === '生活費' ? '💰' : categoryName === '卡費' ? '💳' : '📊';
        titleElement.textContent = `${categoryIcon} ${categoryName}每日預算追蹤`;
    }
    
    if (budget === 0) {
        const summary = document.getElementById('dailyBudgetSummary');
        const calendar = document.getElementById('dailyBudgetCalendar');
        if (summary) {
            summary.innerHTML = `<div class="empty-state">尚未設定「${categoryName}」分類的預算<br><small>請先在預算設定頁面設定預算</small></div>`;
        }
        if (calendar) calendar.innerHTML = '';
        return;
    }
    
    const dailyInfo = calculateDailyBudget(categoryName, budget, records);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const daysInMonth = dailyInfo.daysInMonth;
    
    // 如果是卡費分類，計算下個月的預約扣款
    let nextMonthBillsHtml = '';
    if (categoryName === '卡費') {
        const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
        const nextMonthYear = nextMonthDate.getFullYear();
        const nextMonthNum = nextMonthDate.getMonth();
        
        const nextMonthBills = records.filter(record => {
            if (record.category !== categoryName) return false;
            if (record.type !== 'expense' && record.type !== undefined) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === nextMonthYear && 
                   recordDate.getMonth() === nextMonthNum &&
                   record.isNextMonthBill === true;
        });
        
        if (nextMonthBills.length > 0) {
            const nextMonthTotal = nextMonthBills.reduce((sum, record) => sum + (record.amount || 0), 0);
            nextMonthBillsHtml = `
                <button class="summary-item summary-item--cta" type="button" data-category="${categoryName}">
                    <div class="summary-label">下月預約扣款</div>
                    <div class="summary-value highlight">NT$${nextMonthTotal.toLocaleString('zh-TW')}</div>
                    <div class="summary-cta-text">共 ${nextMonthBills.length} 筆 · 點擊查看</div>
                </button>
            `;
        }
    }
    
    // 更新摘要信息
    const summary = document.getElementById('dailyBudgetSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="daily-budget-summary-card" id="dailyBudgetSummaryCard">
                <div class="summary-item">
                    <div class="summary-label">總預算</div>
                    <div class="summary-value">NT$${budget.toLocaleString('zh-TW')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">每日可用</div>
                    <div class="summary-value highlight">NT$${dailyInfo.dailyBudget.toLocaleString('zh-TW')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">今日已用</div>
                    <div class="summary-value ${dailyInfo.todayUsed > dailyInfo.todayAvailable ? 'over' : ''}">NT$${dailyInfo.todayUsed.toLocaleString('zh-TW')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">今日可用</div>
                    <div class="summary-value ${dailyInfo.todayAvailable < 0 ? 'over' : 'highlight'}">NT$${dailyInfo.todayAvailable.toLocaleString('zh-TW')}</div>
                </div>
                ${dailyInfo.adjustment !== 0 ? `
                    <div class="summary-item">
                        <div class="summary-label">明日調整</div>
                        <div class="summary-value ${dailyInfo.adjustment > 0 ? 'positive' : 'negative'}">
                            ${dailyInfo.adjustment > 0 ? '+' : ''}NT$${dailyInfo.adjustment.toLocaleString('zh-TW')}
                        </div>
                    </div>
                ` : ''}
                ${nextMonthBillsHtml}
            </div>
        `;
    }
    
    // 綁定下月預約扣款按鈕
    const summaryCard = document.getElementById('dailyBudgetSummaryCard');
    if (summaryCard) {
        summaryCard.querySelectorAll('.summary-item--cta').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category || '卡費';
                showNextMonthBills(cat);
            });
        });
    }
    
    // 生成每日日曆
    const calendar = document.getElementById('dailyBudgetCalendar');
    if (calendar) {
        let calendarHtml = '<div class="daily-calendar-title">當月每日明細</div>';
        calendarHtml += '<div class="daily-calendar-grid">';
        
        let cumulativeAdjustment = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayUsed = dailyInfo.dailyUsage[day] || 0;
            const dayAdjustment = dailyInfo.dailyBudget - dayUsed;
            cumulativeAdjustment += dayAdjustment;
            const dayAvailable = dailyInfo.dailyBudget + cumulativeAdjustment - dayUsed;
            
            const isToday = day === currentDay;
            const isPast = day < currentDay;
            const isFuture = day > currentDay;
            
            calendarHtml += `
                <div class="daily-calendar-item ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}" data-day="${day}" style="cursor: pointer;" onclick="showDailyDetail('${categoryName}', ${day}, ${currentYear}, ${currentMonth + 1})">
                    <div class="daily-item-header">
                        <span class="daily-item-day">${day}日</span>
                        ${isToday ? '<span class="daily-item-today-badge">今天</span>' : ''}
                    </div>
                    <div class="daily-item-content">
                        <div class="daily-item-row">
                            <span class="daily-item-label">已用</span>
                            <span class="daily-item-value ${dayUsed > dailyInfo.dailyBudget ? 'over' : ''}">NT$${dayUsed.toLocaleString('zh-TW')}</span>
                        </div>
                        <div class="daily-item-row">
                            <span class="daily-item-label">可用</span>
                            <span class="daily-item-value ${dayAvailable < 0 ? 'over' : ''}">NT$${dayAvailable.toLocaleString('zh-TW')}</span>
                        </div>
                        ${dayAdjustment !== 0 ? `
                            <div class="daily-item-row">
                                <span class="daily-item-label">調整</span>
                                <span class="daily-item-value ${dayAdjustment > 0 ? 'positive' : 'negative'}">
                                    ${dayAdjustment > 0 ? '+' : ''}NT$${dayAdjustment.toLocaleString('zh-TW')}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    ${dayUsed > 0 ? '<div style="margin-top: 8px; font-size: 11px; color: var(--text-tertiary);">點擊查看詳情</div>' : ''}
                </div>
            `;
        }
        
        calendarHtml += '</div>';
        calendar.innerHTML = calendarHtml;
    }
    
    // 綁定返回按鈕（返回到預算設定頁面）
    const dailyBudgetBackBtn = document.getElementById('dailyBudgetBackBtn');
    if (dailyBudgetBackBtn) {
        dailyBudgetBackBtn.onclick = null; // 清除舊的 onclick
        dailyBudgetBackBtn.addEventListener('click', () => {
            showBudgetPage();
        });
    }
}

// 顯示某一天的詳細記錄
function showDailyDetail(categoryName, day, year, month) {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 獲取當天的所有該分類記錄
    const dayRecords = records.filter(record => {
        if (record.category !== categoryName) return false;
        if (record.type !== 'expense' && record.type !== undefined) return false;
        return record.date === dateStr;
    });
    
    // 計算當天總金額
    const dayTotal = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
    
    // 查找分類信息
    const category = allCategories.find(cat => cat.name === categoryName);
    const categoryIcon = category ? category.icon : '💰';
    
    // 創建詳細記錄模態框
    const detailModal = document.createElement('div');
    detailModal.className = 'daily-detail-modal';

    let recordsTitleText = `記錄明細 (${dayRecords.length}筆)`;
    let recordsHtml = '';
    if (categoryName === '卡費') {
        // 卡費：不在每日明細彈窗展開詳細，改為點擊後跳出「下月預約扣款」彈窗
        const now = new Date();
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonthYear = nextMonthDate.getFullYear();
        const nextMonthNum = nextMonthDate.getMonth();
        const nextMonthBills = records.filter(record => {
            if (record.category !== '卡費') return false;
            if (record.type !== 'expense' && record.type !== undefined) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === nextMonthYear &&
                   recordDate.getMonth() === nextMonthNum &&
                   record.isNextMonthBill === true;
        });
        const nextMonthTotal = nextMonthBills.reduce((sum, r) => sum + (r.amount || 0), 0);

        recordsTitleText = '卡費明細';
        recordsHtml = `
            <button class="summary-item summary-item--cta" type="button" data-category="卡費">
                <div class="summary-label">下月預約扣款</div>
                <div class="summary-value highlight">NT$${nextMonthTotal.toLocaleString('zh-TW')}</div>
                <div class="summary-cta-text">共 ${nextMonthBills.length} 筆 · 點擊查看</div>
            </button>
        `;
    } else if (dayRecords.length === 0) {
        recordsHtml = '<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">當天沒有記錄</div>';
    } else {
        dayRecords.forEach(record => {
            const iconHtml = record.emoji 
                ? (record.emoji.type === 'image' && isLikelyImageSrc(record.emoji.value)
                    ? `<img src="${record.emoji.value}" alt="表情" style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px;">`
                    : record.emoji.value)
                : getCategoryIcon(record.category);
            
            recordsHtml += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-light); border-radius: 12px; margin-bottom: 8px;">
                    <div style="font-size: 24px; flex-shrink: 0;">${iconHtml}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${record.category || '未分類'}</div>
                        ${record.note ? `<div style="font-size: 12px; color: var(--text-secondary);">${record.note}</div>` : ''}
                    </div>
                    <div style="font-size: 18px; font-weight: 600; color: var(--color-error);">-NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
                </div>
            `;
        });
    }
    
    detailModal.innerHTML = `
        <div class="daily-detail-modal__panel">
            <div class="daily-detail-modal__header">
                <h2 class="daily-detail-modal__title">
                    <span class="daily-detail-modal__icon">${categoryIcon}</span>
                    <span>${year}年${month}月${day}日</span>
                </h2>
                <button class="daily-detail-close-btn" type="button" aria-label="close">×</button>
            </div>
            
            <div class="daily-detail-summary-card">
                <div>
                    <div class="daily-detail-summary-label">分類</div>
                    <div class="daily-detail-summary-value">${categoryName}</div>
                </div>
                <div class="daily-detail-summary-value-wrap">
                    <div class="daily-detail-summary-label">當日總計</div>
                    <div class="daily-detail-summary-total">NT$${dayTotal.toLocaleString('zh-TW')}</div>
                </div>
            </div>
            
            <div class="daily-detail-records-header">${recordsTitleText}</div>
            <div class="daily-detail-records-list">
                ${recordsHtml}
            </div>
            
            <!-- 快速記帳按鈕 -->
            <button class="daily-detail-quick-add-btn" type="button">
                <span class="daily-detail-quick-add-btn__icon">➕</span>
                <span>快速記帳</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(detailModal);

    // 卡費：綁定「下月預約扣款」按鈕
    if (categoryName === '卡費') {
        const ctaBtn = detailModal.querySelector('.summary-item--cta[data-category="卡費"]');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (document.body.contains(detailModal)) {
                    document.body.removeChild(detailModal);
                }
                showNextMonthBills('卡費');
            });
        }
    }
    
    // 快速記帳按鈕事件和樣式
    const quickAddBtn = detailModal.querySelector('.daily-detail-quick-add-btn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            // 顯示快速記帳輸入框
            const amountInput = prompt(
                `快速記帳 - ${categoryName}\n\n日期：${year}年${month}月${day}日\n分類：${categoryName}\n\n請輸入金額：`,
                ''
            );
            
            if (amountInput && !isNaN(parseFloat(amountInput)) && parseFloat(amountInput) > 0) {
                const amount = parseFloat(amountInput);
                
                // 如果是卡費分類，詢問是否計入下個月
                let recordDate = dateStr;
                let isNextMonthBill = false;
                if (categoryName === '卡費') {
                    const nextMonth = confirm('此卡費是否要計入下個月？\n\n點擊「確定」= 計入下個月\n點擊「取消」= 計入本月');
                    if (nextMonth) {
                        isNextMonthBill = true;
                        // 計算下個月的日期
                        const currentDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
                        recordDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`;
                    }
                }
                
                // 獲取選中的帳戶（如果沒有選中，自動使用默認帳戶）
                let selectedAccount = getSelectedAccount();
                if (!selectedAccount) {
                    selectedAccount = getDefaultAccount();
                }
                
                // 如果沒有帳戶，提示創建帳戶
                if (!selectedAccount) {
                    alert('請先創建帳戶');
                    return;
                }
                
                // 獲取分類信息
                const category = allCategories.find(cat => cat.name === categoryName);
                const categoryEmoji = category ? (category.emoji || { type: 'emoji', value: category.icon }) : null;
                
                // 創建記錄
                const record = {
                    type: 'expense',
                    category: categoryName,
                    amount: amount,
                    note: isNextMonthBill ? '(下月帳單)' : '',
                    date: recordDate,
                    account: selectedAccount.id,
                    emoji: categoryEmoji,
                    timestamp: new Date().toISOString(),
                    isNextMonthBill: isNextMonthBill // 標記是否為下月帳單
                };
                
                // 保存到 localStorage
                let allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                allRecords.push(record);
                localStorage.setItem('accountingRecords', JSON.stringify(allRecords));
                
                // 更新帳戶顯示
                if (typeof updateAccountDisplay === 'function') {
                    updateAccountDisplay();
                }
                
                // 更新記帳本顯示
                if (typeof updateLedgerSummary === 'function') {
                    updateLedgerSummary(allRecords);
                }
                if (typeof displayLedgerTransactions === 'function') {
                    displayLedgerTransactions(allRecords);
                }
                
                // 重新顯示詳情頁面（刷新數據）
                if (document.body.contains(detailModal)) {
                    document.body.removeChild(detailModal);
                }
                showDailyDetail(categoryName, day, year, month);
                
                // 如果是在每日預算頁面，也需要更新
                if (typeof initDailyBudgetPage === 'function') {
                    initDailyBudgetPage(categoryName);
                }
            }
        });
    }
    
    // 關閉按鈕
    detailModal.querySelector('.daily-detail-close-btn').addEventListener('click', () => {
        if (document.body.contains(detailModal)) {
            document.body.removeChild(detailModal);
        }
    });
    
    // 點擊遮罩關閉
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            if (document.body.contains(detailModal)) {
                document.body.removeChild(detailModal);
            }
        }
    });
}

// 顯示下個月預約扣款明細
function showNextMonthBills(categoryName) {
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth();
    const nextMonthName = `${nextMonthYear}年${nextMonthNum + 1}月`;
    
    // 獲取下個月的預約扣款
    const nextMonthBills = records.filter(record => {
        if (record.category !== categoryName) return false;
        if (record.type !== 'expense' && record.type !== undefined) return false;
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === nextMonthYear && 
               recordDate.getMonth() === nextMonthNum &&
               record.isNextMonthBill === true;
    });
    
    // 按日期排序
    nextMonthBills.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const totalAmount = nextMonthBills.reduce((sum, record) => sum + (record.amount || 0), 0);
    
    // 檢查是否已設定下月預算
    const budgetKey = `${nextMonthYear}-${nextMonthNum + 1}`;
    const nextMonthBudgets = JSON.parse(localStorage.getItem('nextMonthBudgets') || '{}');
    const hasSetBudget = nextMonthBudgets[budgetKey] && nextMonthBudgets[budgetKey][categoryName];
    const setBudgetAmount = hasSetBudget ? nextMonthBudgets[budgetKey][categoryName].amount : null;
    
    // 創建模態框
    const modal = document.createElement('div');
    modal.className = 'next-month-bills-modal';
    
    const panel = document.createElement('div');
    panel.className = 'next-month-bills-panel';
    
    const billsHtml = nextMonthBills.length === 0
        ? '<div class="next-month-bills-empty">沒有下月預約扣款</div>'
        : nextMonthBills.map(record => {
            const recordDate = new Date(record.date);
            const day = recordDate.getDate();
            const recordId = record.timestamp || record.id || '';
            const noteText = record.note && record.note !== '(下月帳單)' ? record.note.replace('(下月帳單)', '').trim() : '';
            return `
                <div class="next-month-bill-item" data-record-id="${recordId}">
                    <div class="next-month-bill-main">
                        <div class="next-month-bill-icon">💳</div>
                        <div class="next-month-bill-info">
                            <div class="next-month-bill-date">${nextMonthNum + 1}月${day}日</div>
                            <div class="next-month-bill-note ${noteText ? '' : 'is-empty'}">${noteText || '無備註'}</div>
                        </div>
                        <div class="next-month-bill-amount" data-record-id="${recordId}" title="點金額可刪除">NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
                    </div>
                </div>
            `;
        }).join('');
    
    panel.innerHTML = `
        <div class="next-month-bills-header">
            <div class="next-month-bills-header-bar">
                <div class="next-month-bills-title">
                    <span>📅</span>
                    <span>${nextMonthName}預約扣款</span>
                </div>
                <button class="next-month-close-btn" type="button">×</button>
            </div>
            ${hasSetBudget ? `
                <div class="next-month-budget-card">
                    <div class="label">
                        <span>✓</span>
                        <span>已設定下月預算</span>
                    </div>
                    <div class="value">NT$${setBudgetAmount.toLocaleString('zh-TW')}</div>
                    <div class="hint">將在 ${nextMonthName} 自動生效</div>
                </div>
            ` : ''}
            <button class="set-next-month-budget-btn" data-category="${categoryName}" data-next-month-year="${nextMonthYear}" data-next-month-num="${nextMonthNum}" data-total-amount="${totalAmount}" type="button">
                <span>💰</span>
                <span>${hasSetBudget ? '修改下月卡費預算' : '設定下月卡費預算'}</span>
            </button>
        </div>
        <div class="next-month-bills-list">
            <div class="next-month-bills-list-title">
                <span>📋</span>
                <span>扣款明細</span>
            </div>
            ${billsHtml}
        </div>
        <div class="next-month-bills-footer">
            <div class="next-month-bills-tip">
                <span>💡</span>
                <span>這些是您標記為「下月扣款」的卡費記錄，不會計入本月預算統計。</span>
            </div>
        </div>
    `;
    
    modal.appendChild(panel);
    document.body.appendChild(modal);
    
    const closeModal = () => {
        if (!document.body.contains(modal)) return;
        panel.classList.add('closing');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 230);
    };
    
    // 綁定預算設定按鈕事件
    const setBudgetBtn = panel.querySelector('.set-next-month-budget-btn');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            const category = setBudgetBtn.dataset.category;
            const nextYear = parseInt(setBudgetBtn.dataset.nextMonthYear);
            const nextMonth = parseInt(setBudgetBtn.dataset.nextMonthNum);
            const currentTotal = parseFloat(setBudgetBtn.dataset.totalAmount);
            setNextMonthBudget(category, nextYear, nextMonth, currentTotal, modal);
        });
    }

    // 點擊項目：開啟詳細彈窗（彈窗內再提供編輯/刪除）
    panel.querySelectorAll('.next-month-bill-item[data-record-id]').forEach(item => {
        item.addEventListener('click', () => {
            const recordId = item.dataset.recordId;
            if (!recordId) return;
            showNextMonthBillDetail(recordId, categoryName, modal);
        });
    });

    // 點金額：直接開刪除彈窗（不顯示詳細）
    panel.querySelectorAll('.next-month-bill-amount[data-record-id]').forEach(amountEl => {
        amountEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const recordId = amountEl.dataset.recordId;
            if (!recordId) return;
            showNextMonthBillDeleteOnlyModal(recordId, categoryName, modal);
        });
    });
    
    // 關閉按鈕
    const closeBtn = panel.querySelector('.next-month-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function renderNextMonthBillsPage(categoryName) {
    const container = document.getElementById('nextMonthBillsPageContent');
    if (!container) return;

    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth();
    const nextMonthName = `${nextMonthYear}年${nextMonthNum + 1}月`;

    const titleEl = document.getElementById('nextMonthBillsPageTitle');
    if (titleEl) titleEl.textContent = `${nextMonthName}預約扣款`;

    const nextMonthBills = records
        .filter(record => {
            if (record.category !== categoryName) return false;
            if (record.type !== 'expense' && record.type !== undefined) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === nextMonthYear &&
                   recordDate.getMonth() === nextMonthNum &&
                   record.isNextMonthBill === true;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalAmount = nextMonthBills.reduce((sum, r) => sum + (r.amount || 0), 0);

    if (!nextMonthBills.length) {
        container.innerHTML = '<div class="next-month-bills-empty">沒有下月預約扣款</div>';
        return;
    }

    const headerHtml = `
        <div class="nmb-hero" data-category="${categoryName}" data-next-year="${nextMonthYear}" data-next-month-num="${nextMonthNum}" data-total-amount="${totalAmount}">
            <div class="nmb-hero-top">
                <div class="nmb-hero-title">
                    <span class="nmb-hero-badge">${nextMonthName}</span>
                    <span class="nmb-hero-subtitle">${categoryName} 預約扣款</span>
                </div>
                <button class="nmb-hero-btn" type="button" data-action="refresh">重新整理</button>
            </div>

            <div class="nmb-hero-metrics">
                <div class="nmb-metric">
                    <div class="nmb-metric-label">合計</div>
                    <div class="nmb-metric-value">NT$${totalAmount.toLocaleString('zh-TW')}</div>
                </div>
                <div class="nmb-metric">
                    <div class="nmb-metric-label">筆數</div>
                    <div class="nmb-metric-value">${nextMonthBills.length}</div>
                </div>
            </div>

            <div class="nmb-hero-actions">
                ${categoryName === '卡費' ? '<button class="nmb-action" type="button" data-action="setBudget">設定卡費預算</button>' : ''}
                <button class="nmb-action nmb-action--secondary" type="button" data-action="back">返回</button>
            </div>
        </div>
        <div class="nmb-section-title">扣款明細</div>
    `;

    const billsHtml = nextMonthBills.map(record => {
        const recordDate = new Date(record.date);
        const day = recordDate.getDate();
        const recordId = record.timestamp || record.id || '';
        const noteText = record.note && record.note !== '(下月帳單)' ? record.note.replace('(下月帳單)', '').trim() : '';
        return `
            <div class="next-month-bill-item" data-record-id="${recordId}">
                <div class="next-month-bill-main">
                    <div class="next-month-bill-icon">💳</div>
                    <div class="next-month-bill-info">
                        <div class="next-month-bill-date">${nextMonthNum + 1}月${day}日</div>
                        <div class="next-month-bill-note ${noteText ? '' : 'is-empty'}">${noteText || '無備註'}</div>
                    </div>
                    <div class="next-month-bill-amount" data-record-id="${recordId}" title="點金額可刪除">NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = headerHtml + billsHtml;

    const hero = container.querySelector('.nmb-hero');
    if (hero) {
        const refreshBtn = hero.querySelector('[data-action="refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                renderNextMonthBillsPage(categoryName);
            });
        }

        const backBtn = hero.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                closeNextMonthBillsPage();
            });
        }

        const setBudgetBtn = hero.querySelector('[data-action="setBudget"]');
        if (setBudgetBtn) {
            setBudgetBtn.addEventListener('click', () => {
                const nextYear = parseInt(hero.dataset.nextYear, 10);
                const nextMonth = parseInt(hero.dataset.nextMonthNum, 10);
                const currentTotal = parseFloat(hero.dataset.totalAmount);
                setNextMonthBudget(categoryName, nextYear, nextMonth, currentTotal, null);
            });
        }
    }

    // 點擊項目：開啟詳細彈窗（彈窗內再提供編輯/刪除）
    container.querySelectorAll('.next-month-bill-item[data-record-id]').forEach(item => {
        item.addEventListener('click', () => {
            const recordId = item.dataset.recordId;
            if (!recordId) return;
            showNextMonthBillDetail(recordId, categoryName, null);
        });
    });

    // 點金額：直接開刪除彈窗（不顯示詳細）
    container.querySelectorAll('.next-month-bill-amount[data-record-id]').forEach(amountEl => {
        amountEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const recordId = amountEl.dataset.recordId;
            if (!recordId) return;
            showNextMonthBillDeleteOnlyModal(recordId, categoryName, null);
        });
    });
}

function showNextMonthBillsPage(categoryName = '卡費', returnPageId = '') {
    const pageNextMonthBills = document.getElementById('pageNextMonthBills');
    if (!pageNextMonthBills) return;

    const pageDailyBudget = document.getElementById('pageDailyBudget');
    const pageBudget = document.getElementById('pageBudget');
    const pageSettings = document.getElementById('pageSettings');
    const pageLedger = document.getElementById('pageLedger');
    const pageChart = document.getElementById('pageChart');
    const pageInvestment = document.getElementById('pageInvestment');
    const pageInput = document.getElementById('pageInput');
    const inputSection = document.getElementById('inputSection');
    const bottomNav = document.querySelector('.bottom-nav');

    // 記錄返回頁面
    if (returnPageId) {
        window.nextMonthBillsReturnPageId = returnPageId;
    } else if (pageDailyBudget && pageDailyBudget.style.display !== 'none') {
        window.nextMonthBillsReturnPageId = 'pageDailyBudget';
    } else if (pageBudget && pageBudget.style.display !== 'none') {
        window.nextMonthBillsReturnPageId = 'pageBudget';
    } else {
        window.nextMonthBillsReturnPageId = 'pageLedger';
    }

    // 隱藏其他頁面
    if (pageInput) pageInput.style.display = 'none';
    if (pageLedger) pageLedger.style.display = 'none';
    if (inputSection) inputSection.style.display = 'none';
    if (pageChart) pageChart.style.display = 'none';
    if (pageBudget) pageBudget.style.display = 'none';
    if (pageSettings) pageSettings.style.display = 'none';
    if (pageInvestment) pageInvestment.style.display = 'none';
    if (pageDailyBudget) pageDailyBudget.style.display = 'none';

    pageNextMonthBills.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'none';

    window.nextMonthBillsPageCategoryName = categoryName;
    renderNextMonthBillsPage(categoryName);
}

function closeNextMonthBillsPage() {
    const pageNextMonthBills = document.getElementById('pageNextMonthBills');
    if (pageNextMonthBills) pageNextMonthBills.style.display = 'none';

    const returnId = window.nextMonthBillsReturnPageId || 'pageLedger';
    const returnEl = document.getElementById(returnId);
    if (returnEl) returnEl.style.display = 'block';

    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        // dailyBudget / nextMonthBills 頁面不顯示；其他主頁恢復底部導航
        const showNavIds = [
            'pageLedger',
            'pageChart',
            'pageBudget',
            'pageSettings',
            'pageInvestment',
            'pageWallet',
            'pageMonthlyPlanner'
        ];
        bottomNav.style.display = showNavIds.includes(returnId) ? 'flex' : 'none';
    }
}

function showNextMonthBillDetail(recordId, categoryName, parentModal) {
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const record = allRecords.find(r => (r.timestamp || r.id) === recordId);
    if (!record) {
        alert('找不到該記錄');
        return;
    }

    const recordDate = new Date(record.date);
    const noteText = record.note && record.note !== '(下月帳單)' ? record.note.replace('(下月帳單)', '').trim() : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10006; display: flex; align-items: center; justify-content: center; padding: 16px;';

    modal.innerHTML = `
        <div class="modal-content-standard" style="width: 100%; max-width: 420px;">
            <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                <div style="font-size: 16px; font-weight: 700;">下月扣款明細</div>
                <button class="modal-close-btn" type="button" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap: 10px;">
                <div><strong>日期：</strong>${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日</div>
                <div><strong>分類：</strong>${record.category || ''}</div>
                <div><strong>金額：</strong>NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
                <div><strong>備註：</strong>${noteText || '無'}</div>
            </div>
            <div style="display:flex; gap: 12px; margin-top: 18px;">
                <button class="next-month-bill-btn next-month-bill-btn--edit" type="button" data-action="edit" style="flex: 1; justify-content: center;">✏️ 編輯</button>
                <button class="next-month-bill-btn next-month-bill-btn--delete" type="button" data-action="delete" style="flex: 1; justify-content: center;">🗑️ 刪除</button>
            </div>
        </div>
    `;

    const close = () => {
        if (document.body.contains(modal)) document.body.removeChild(modal);
    };

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', close);

    const editBtn = modal.querySelector('[data-action="edit"]');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            close();
            editNextMonthBill(recordId, categoryName, parentModal);
        });
    }

    const deleteBtn = modal.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            close();
            deleteNextMonthBill(recordId, categoryName, parentModal);
        });
    }

    document.body.appendChild(modal);
}

function showNextMonthBillDeleteOnlyModal(recordId, categoryName, parentModal) {
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const record = allRecords.find(r => (r.timestamp || r.id) === recordId);
    if (!record) {
        alert('找不到該記錄');
        return;
    }

    const recordDate = new Date(record.date);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10006; display: flex; align-items: center; justify-content: center; padding: 16px;';

    modal.innerHTML = `
        <div class="modal-content-standard" style="width: 100%; max-width: 420px;">
            <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                <div style="font-size: 16px; font-weight: 700;">刪除下月扣款？</div>
                <button class="modal-close-btn" type="button" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap: 10px;">
                <div><strong>日期：</strong>${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日</div>
                <div><strong>金額：</strong>NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
            </div>
            <div style="display:flex; gap: 12px; margin-top: 18px;">
                <button class="next-month-bill-btn" type="button" data-action="cancel" style="flex: 1; justify-content: center;">取消</button>
                <button class="next-month-bill-btn next-month-bill-btn--delete" type="button" data-action="delete" style="flex: 1; justify-content: center;">🗑️ 刪除</button>
            </div>
        </div>
    `;

    const close = () => {
        if (document.body.contains(modal)) document.body.removeChild(modal);
    };

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', close);

    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    const deleteBtn = modal.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            close();
            deleteNextMonthBill(recordId, categoryName, parentModal);
        });
    }

    document.body.appendChild(modal);
}

// 編輯下月卡費記錄
function editNextMonthBill(recordId, categoryName, parentModal) {
    let allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const recordIndex = allRecords.findIndex(r => (r.timestamp || r.id) === recordId);
    
    if (recordIndex === -1) {
        alert('找不到該記錄');
        return;
    }
    
    const record = allRecords[recordIndex];
    const recordDate = new Date(record.date);
    
    // 彈出編輯對話框
    const newAmount = prompt(
        `編輯下月卡費\n\n日期：${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日\n目前金額：NT$${record.amount}\n\n請輸入新金額：`,
        record.amount
    );
    
    if (newAmount === null) return; // 取消編輯
    
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
        alert('請輸入有效金額');
        return;
    }
    
    // 詢問是否修改備註
    const currentNote = record.note && record.note !== '(下月帳單)' ? record.note.replace('(下月帳單)', '').trim() : '';
    const newNote = prompt(
        `編輯備註（選填）\n\n目前備註：${currentNote || '無'}\n\n請輸入新備註：`,
        currentNote
    );
    
    // 更新記錄
    allRecords[recordIndex].amount = amount;
    if (newNote !== null) {
        allRecords[recordIndex].note = newNote ? `(下月帳單) ${newNote}` : '(下月帳單)';
    }
    
    localStorage.setItem('accountingRecords', JSON.stringify(allRecords));
    
    // 更新顯示
    if (typeof updateAccountDisplay === 'function') {
        updateAccountDisplay();
    }
    if (typeof updateLedgerSummary === 'function') {
        updateLedgerSummary(allRecords);
    }
    if (typeof displayLedgerTransactions === 'function') {
        displayLedgerTransactions(allRecords);
    }
    if (typeof initDailyBudgetPage === 'function') {
        initDailyBudgetPage(categoryName);
    }
    
    // 重新整理顯示
    if (parentModal && document.body.contains(parentModal)) {
        document.body.removeChild(parentModal);
        showNextMonthBills(categoryName);
    } else {
        const pageNextMonthBills = document.getElementById('pageNextMonthBills');
        if (pageNextMonthBills && pageNextMonthBills.style.display !== 'none') {
            renderNextMonthBillsPage(categoryName);
        }
    }
    
    alert('編輯成功！');
}

// 刪除下月卡費記錄
function deleteNextMonthBill(recordId, categoryName, parentModal) {
    let allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const recordIndex = allRecords.findIndex(r => (r.timestamp || r.id) === recordId);
    
    if (recordIndex === -1) {
        alert('找不到該記錄');
        return;
    }
    
    const record = allRecords[recordIndex];
    const recordDate = new Date(record.date);
    
    // 確認刪除
    if (!confirm(`確定要刪除此筆下月卡費嗎？\n\n日期：${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日\n金額：NT$${record.amount.toLocaleString('zh-TW')}\n\n此操作無法復原。`)) {
        return;
    }
    
    // 刪除記錄
    allRecords.splice(recordIndex, 1);
    localStorage.setItem('accountingRecords', JSON.stringify(allRecords));
    
    // 更新顯示
    if (typeof updateAccountDisplay === 'function') {
        updateAccountDisplay();
    }
    if (typeof updateLedgerSummary === 'function') {
        updateLedgerSummary(allRecords);
    }
    if (typeof displayLedgerTransactions === 'function') {
        displayLedgerTransactions(allRecords);
    }
    if (typeof initDailyBudgetPage === 'function') {
        initDailyBudgetPage(categoryName);
    }
    
    if (parentModal && document.body.contains(parentModal)) {
        document.body.removeChild(parentModal);

        // 檢查是否還有下月記錄
        const remainingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        const now = new Date();
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const hasNextMonthBills = remainingRecords.some(r => {
            if (r.category !== categoryName) return false;
            const rDate = new Date(r.date);
            return rDate.getFullYear() === nextMonthDate.getFullYear() && 
                   rDate.getMonth() === nextMonthDate.getMonth() &&
                   r.isNextMonthBill === true;
        });
        
        if (hasNextMonthBills) {
            showNextMonthBills(categoryName);
        }
    } else {
        const pageNextMonthBills = document.getElementById('pageNextMonthBills');
        if (pageNextMonthBills && pageNextMonthBills.style.display !== 'none') {
            renderNextMonthBillsPage(categoryName);
        }
    }
    
    alert('刪除成功！');
}

// 設定下月卡費預算
function setNextMonthBudget(categoryName, nextYear, nextMonth, currentTotal, parentModal) {
    const nextMonthName = `${nextYear}年${nextMonth + 1}月`;
    
    // 詢問用戶要設定的預算金額
    const budgetInput = prompt(
        `設定 ${nextMonthName} 的卡費預算\n\n目前已登記的扣款總額：NT$${currentTotal.toLocaleString('zh-TW')}\n\n請輸入您預計下個月的卡費預算：`,
        currentTotal
    );
    
    if (budgetInput === null) return; // 取消設定
    
    const budget = parseFloat(budgetInput);
    if (isNaN(budget) || budget <= 0) {
        alert('請輸入有效的預算金額');
        return;
    }
    
    // 確認設定
    const difference = budget - currentTotal;
    const differenceText = difference > 0 
        ? `超出已登記扣款 NT$${Math.abs(difference).toLocaleString('zh-TW')}` 
        : difference < 0 
        ? `低於已登記扣款 NT$${Math.abs(difference).toLocaleString('zh-TW')}` 
        : '與已登記扣款相同';
    
    if (!confirm(`確認設定 ${nextMonthName} 的卡費預算？\n\n預算金額：NT$${budget.toLocaleString('zh-TW')}\n已登記扣款：NT$${currentTotal.toLocaleString('zh-TW')}\n差額：${differenceText}\n\n此預算會在 ${nextMonthName} 自動生效。`)) {
        return;
    }
    
    // 獲取或創建下月預算資料
    let nextMonthBudgets = JSON.parse(localStorage.getItem('nextMonthBudgets') || '{}');
    const budgetKey = `${nextYear}-${nextMonth + 1}`;
    
    if (!nextMonthBudgets[budgetKey]) {
        nextMonthBudgets[budgetKey] = {};
    }
    
    nextMonthBudgets[budgetKey][categoryName] = {
        amount: budget,
        createdAt: new Date().toISOString(),
        createdFrom: 'nextMonthBills',
        year: nextYear,
        month: nextMonth + 1
    };
    
    localStorage.setItem('nextMonthBudgets', JSON.stringify(nextMonthBudgets));
    
    // 檢查是否已經到了下個月，如果是則立即套用
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (nextYear === currentYear && (nextMonth + 1) === currentMonth) {
        // 已經是下個月了，立即套用預算
        let categoryBudgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
        categoryBudgets[categoryName] = budget;
        localStorage.setItem('categoryBudgets', JSON.stringify(categoryBudgets));
        
        // 更新預算頁面顯示
        if (typeof initBudget === 'function') {
            initBudget();
        }
        
        alert(`設定成功！\n\n${nextMonthName} 的卡費預算已設定為 NT$${budget.toLocaleString('zh-TW')}\n\n由於已經是該月份，預算已立即生效！`);
    } else {
        alert(`設定成功！\n\n${nextMonthName} 的卡費預算已設定為 NT$${budget.toLocaleString('zh-TW')}\n\n預算會在 ${nextMonthName} 自動生效。`);
    }
    
    // 關閉並重新開啟視窗以更新顯示
    if (parentModal && document.body.contains(parentModal)) {
        document.body.removeChild(parentModal);
    }
    showNextMonthBills(categoryName);
}

// 自動套用下月預算（在月初時調用）
function applyNextMonthBudgets() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const budgetKey = `${currentYear}-${currentMonth}`;
    
    let nextMonthBudgets = JSON.parse(localStorage.getItem('nextMonthBudgets') || '{}');
    
    if (nextMonthBudgets[budgetKey]) {
        ensureMonthlyBudgetMigration();
        const monthKey = getCurrentMonthKey();
        const prevSelected = getBudgetSelectedMonthKey();
        setBudgetSelectedMonthKey(monthKey);
        let categoryBudgets = { ...getCategoryBudgetsForSelectedMonth() };
        let hasChanges = false;
        
        for (const [categoryName, budgetInfo] of Object.entries(nextMonthBudgets[budgetKey])) {
            categoryBudgets[categoryName] = budgetInfo.amount;
            hasChanges = true;
        }
        
        if (hasChanges) {
            saveCategoryBudgetsForSelectedMonth(categoryBudgets);
            
            // 清除已套用的下月預算
            delete nextMonthBudgets[budgetKey];
            localStorage.setItem('nextMonthBudgets', JSON.stringify(nextMonthBudgets));
            
            // 更新預算頁面顯示
            if (typeof initBudget === 'function') {
                initBudget();
            }
        }

        setBudgetSelectedMonthKey(prevSelected);
    }
}

// 顯示新增預算對話框
function showAddBudgetDialog() {
    // 先載入自定義分類，確保 allCategories 包含最新分類
    loadCustomCategories();
    
    // 獲取所有啟用的分類（與記帳本保持一致）
    // 使用 getEnabledCategories(null) 獲取所有啟用的分類，不分類型
    let allAvailableCategories = getEnabledCategories(null);
    
    const budgets = getCategoryBudgetsForSelectedMonth();
    
    // 創建模態框
    const modal = document.createElement('div');
    modal.className = 'budget-category-modal';
    
    // 按類型分組分類
    const categoriesByType = {
        expense: allAvailableCategories.filter(cat => cat.type === 'expense'),
        income: allAvailableCategories.filter(cat => cat.type === 'income'),
        transfer: allAvailableCategories.filter(cat => cat.type === 'transfer')
    };
    
    let categoryListHtml = '';
    
    // 支出分類
    if (categoriesByType.expense.length > 0) {
        categoryListHtml += `
            <div class="budget-category-section">
                <div class="budget-category-section-title">💰 支出分類</div>
                <div class="budget-category-grid">
                    ${categoriesByType.expense.map(cat => {
                        const hasBudget = budgets.hasOwnProperty(cat.name);
                        const budgetAmount = hasBudget ? budgets[cat.name] : 0;
                        return `
                            <div class="budget-category-item ${hasBudget ? 'has-budget' : ''}" data-category-name="${cat.name}">
                                <div class="budget-category-icon">${cat.icon}</div>
                                <div class="budget-category-name">${cat.name}</div>
                                ${hasBudget ? `<div class="budget-category-budget">NT$${budgetAmount.toLocaleString('zh-TW')}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // 收入分類
    if (categoriesByType.income.length > 0) {
        categoryListHtml += `
            <div class="budget-category-section">
                <div class="budget-category-section-title">💵 收入分類</div>
                <div class="budget-category-grid">
                    ${categoriesByType.income.map(cat => {
                        const hasBudget = budgets.hasOwnProperty(cat.name);
                        const budgetAmount = hasBudget ? budgets[cat.name] : 0;
                        return `
                            <div class="budget-category-item ${hasBudget ? 'has-budget' : ''}" data-category-name="${cat.name}">
                                <div class="budget-category-icon">${cat.icon}</div>
                                <div class="budget-category-name">${cat.name}</div>
                                ${hasBudget ? `<div class="budget-category-budget">NT$${budgetAmount.toLocaleString('zh-TW')}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // 轉帳分類
    if (categoriesByType.transfer.length > 0) {
        categoryListHtml += `
            <div class="budget-category-section">
                <div class="budget-category-section-title">🔄 轉帳分類</div>
                <div class="budget-category-grid">
                    ${categoriesByType.transfer.map(cat => {
                        const hasBudget = budgets.hasOwnProperty(cat.name);
                        const budgetAmount = hasBudget ? budgets[cat.name] : 0;
                        return `
                            <div class="budget-category-item ${hasBudget ? 'has-budget' : ''}" data-category-name="${cat.name}">
                                <div class="budget-category-icon">${cat.icon}</div>
                                <div class="budget-category-name">${cat.name}</div>
                                ${hasBudget ? `<div class="budget-category-budget">NT$${budgetAmount.toLocaleString('zh-TW')}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="budget-category-modal-content modal-content-standard">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0;">選擇分類設定預算</h2>
                <button class="budget-category-close-btn" style="background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">✕</button>
            </div>
            
            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-light); border-radius: 12px; font-size: 14px; color: var(--text-secondary);">
                💡 點擊分類卡片即可設定或更新預算金額
            </div>
            
            <div class="budget-category-list" style="max-height: 60vh; overflow-y: auto;">
                ${categoryListHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    const closeBtn = modal.querySelector('.budget-category-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--bg-lighter)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
    }
    
    // 綁定分類點擊事件
    modal.querySelectorAll('.budget-category-item').forEach(item => {
        item.addEventListener('click', () => {
            const categoryName = item.dataset.categoryName;
            const selectedCategory = allAvailableCategories.find(cat => cat.name === categoryName);
            
            if (!selectedCategory) return;
            
            // 關閉分類選擇模態框
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            
            // 顯示預算設定對話框
            showBudgetSettingDialog(selectedCategory.name);
        });
    });
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}

// 初始化分類管理頁面
function initCategoryManagePage() {
    const categoryManageList = document.getElementById('categoryManageList');
    if (!categoryManageList) return;
    
    // 初始渲染（顯示所有分類，不分類型）
    renderCategoryManageList();
}

// 渲染分類管理列表（顯示所有分類，不分類型）
function renderCategoryManageList() {
    const categoryManageList = document.getElementById('categoryManageList');
    if (!categoryManageList) return;
    
    const state = getCategoryEnabledState();
    
    // 顯示所有分類，不分類型，統一顯示
    // 獲取自定義圖標
    const customIcons = JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}');
    
    let html = '';
    
    // 顯示所有分類（只按名稱排序，不按類型分組）
    const sortedCategories = [...allCategories].sort((a, b) => {
        return a.name.localeCompare(b.name, 'zh-TW');
    });
    
    sortedCategories.forEach(category => {
        const isEnabled = state[category.name] === true;
        
        // 檢查是否有自定義圖片圖標
        const customIconValue = customIcons[category.name]?.value;
        const hasCustomIcon = customIcons[category.name] && customIcons[category.name].type === 'image' && isLikelyImageSrc(customIconValue);
        const iconDisplay = hasCustomIcon 
            ? `<img src="${customIconValue}" alt="${category.name}" class="category-manage-item-icon-image">`
            : category.icon;
        
        // 類型標籤圖標（小圖標）
        const typeIcon = category.type === 'expense' ? '📤' : category.type === 'income' ? '💰' : '🔄';
        const typeColor = category.type === 'expense' ? '#ff6b6b' : category.type === 'income' ? '#51cf66' : '#4dabf7';
        
        html += `
            <div class="category-manage-item" style="position: relative;">
                <div class="category-manage-item-icon">${iconDisplay}</div>
                <div class="category-manage-item-info">
                    <div class="category-manage-item-name">${category.name}</div>
                </div>
                <span class="category-type-badge" style="position: absolute; top: 8px; right: 8px; font-size: 10px; padding: 2px 4px; background: ${typeColor}20; border: 1px solid ${typeColor}50; border-radius: 6px; color: ${typeColor}; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <span style="font-size: 10px;">${typeIcon}</span>
                </span>
                <div class="category-manage-item-actions">
                    <label class="category-manage-toggle ${isEnabled ? 'active' : ''}" data-category="${category.name}">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} style="display: none;">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    });
    
    categoryManageList.innerHTML = html;
    
    // 綁定開關事件 - 監聽 checkbox 的 change 事件
    categoryManageList.querySelectorAll('.category-manage-toggle input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation(); // 防止事件冒泡到父元素
            
            const toggle = checkbox.closest('.category-manage-toggle');
            const categoryName = toggle.dataset.category;
            
            // 獲取當前狀態
            const state = getCategoryEnabledState();
            const currentState = state[categoryName] !== false; // 默認為 true
            
            // 根據 checkbox 的狀態設置（checkbox 已經改變了狀態）
            const newState = checkbox.checked;
            
            // 如果狀態不一致，則更新
            if (currentState !== newState) {
                state[categoryName] = newState;
                saveCategoryEnabledState(state);
            }
            
            // 更新UI
            if (newState) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
            
            // 重新初始化分類網格（如果記帳輸入頁面可見）
            const pageInput = document.getElementById('pageInput');
            if (pageInput && pageInput.style.display !== 'none') {
                const activeTab = document.querySelector('.tab-btn.active');
                const tabType = activeTab ? activeTab.dataset.tab : 'recommended';
                initCategoryGrid(tabType, null); // 顯示所有分類
            }
        });
        
        // 同時阻止 label 的點擊事件冒泡
        const toggle = checkbox.closest('.category-manage-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡到父元素
            });
        }
    });
}

// 注意：壓縮圖片和安全保存函數已移至 js/storage.js 模組

// 顯示新增分類對話框
function showAddCategoryDialog(type = 'expense') {
    // 創建模態框
    const modal = document.createElement('div');
    modal.className = 'category-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10005; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;';
    
    modal.innerHTML = `
        <div class="category-modal-content" style="background: white; border-radius: 16px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #333;">新增分類</h3>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">✕</button>
            </div>
            
            <div class="category-modal-field" style="margin-bottom: 20px;">
                <label class="category-modal-label" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">分類類型</label>
                <div class="category-modal-type-select" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="category-modal-type-option ${type === 'expense' ? 'active' : ''}" data-type="expense" style="flex: 1; padding: 12px; border: 2px solid ${type === 'expense' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${type === 'expense' ? '#fff5f9' : '#ffffff'}; color: ${type === 'expense' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        👤 支出
                    </button>
                    <button class="category-modal-type-option ${type === 'income' ? 'active' : ''}" data-type="income" style="flex: 1; padding: 12px; border: 2px solid ${type === 'income' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${type === 'income' ? '#fff5f9' : '#ffffff'}; color: ${type === 'income' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        💰 收入
                    </button>
                    <button class="category-modal-type-option ${type === 'transfer' ? 'active' : ''}" data-type="transfer" style="flex: 1; padding: 12px; border: 2px solid ${type === 'transfer' ? '#ffb6d9' : '#e0e0e0'}; border-radius: 12px; background: ${type === 'transfer' ? '#fff5f9' : '#ffffff'}; color: ${type === 'transfer' ? '#ff69b4' : '#666'}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        💳 轉帳
                    </button>
                </div>
            </div>
            
            <div class="category-modal-field" style="margin-bottom: 20px;">
                <label class="category-modal-label" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">分類名稱</label>
                <input type="text" id="categoryNameInput" class="category-modal-input" placeholder="例如：早餐、交通費、獎金..." style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 16px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#ffb6d9'" onblur="this.style.borderColor='#e0e0e0'">
            </div>
            
            <div class="category-modal-field" style="margin-bottom: 24px;">
                <label class="category-modal-label" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">分類圖標</label>
                
                <!-- 圖標預覽 -->
                <div id="iconPreview" style="width: 80px; height: 80px; border: 2px solid #e0e0e0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 40px; background: #fafafa; margin: 0 auto 16px; overflow: hidden;">
                    📦
                </div>
                
                <!-- 快速選擇常用圖標 -->
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 13px; color: #666; margin-bottom: 8px;">快速選擇</label>
                    <div id="quickIconGrid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; padding: 8px; background: #f8f8f8; border-radius: 8px; max-height: 120px; overflow-y: auto;">
                        <!-- 常用圖標將由 JavaScript 動態生成 -->
                    </div>
                </div>
                
                <!-- Emoji 輸入 -->
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 13px; color: #666; margin-bottom: 6px;">或輸入其他 Emoji</label>
                    <input type="text" id="categoryIconInput" class="category-modal-input" placeholder="例如：🍔 🚇 💰" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 20px; text-align: center; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#ffb6d9'" onblur="this.style.borderColor='#e0e0e0'">
                </div>
                
                            </div>
            
            <div class="category-modal-actions" style="display: flex; gap: 12px;">
                <button class="category-modal-btn secondary" id="cancelCategoryBtn" style="flex: 1; padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; background: #ffffff; color: #666; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='#ffffff'">
                    取消
                </button>
                <button class="category-modal-btn primary" id="saveCategoryBtn" style="flex: 1; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #ffb6d9 0%, #ff9ec7 100%); color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 182, 217, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 182, 217, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 182, 217, 0.3)'">
                    儲存
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let selectedType = type;
    
    // 常用圖標列表
    const commonIcons = {
        expense: [
            '🍔', '🧃', '🚇', '🏢', '💡', '🧹', '🎮', '🏥',
            '🎓', '🛍️', '👕', '💄', '⚽', '🏋️', '🎬', '🎵',
            '📚', '☕', '🍫', '⛽', '🅿️', '🛡️', '💳', '💰',
            '🎁', '🏖️', '🐾', '💇', '💅', '📱', '⚡', '🔥'
        ],
        income: [
            '💼', '🎁', '📈', '💵', '🏠', '💪', '🧧', '↩️',
            '💰', '🎊', '💹', '📝', '👔', '🎤', '✍️', '📋',
            '🛡️', '🎰', '📦', '💳', '⚖️', '🤝', '📄', '👨‍🏫',
            '🎨', '🌐', '📷', '📺', '🛒', '🛍️', '💴', '🏛️'
        ],
        transfer: [
            '🔄', '🏦', '💸', '💳', '💵', '📱', '💼', '📈',
            '🔀', '💱', '🏧', '💶', '💷', '💴', '🪙', '💲'
        ]
    };
    
    // 圖標預覽
    const iconInput = modal.querySelector('#categoryIconInput');
    const iconPreview = modal.querySelector('#iconPreview');
    const quickIconGrid = modal.querySelector('#quickIconGrid');
    
    // 渲染快速選擇圖標網格
    const renderQuickIcons = (type) => {
        const icons = commonIcons[type] || commonIcons.expense;
        console.log('渲染快速圖標，類型:', type, '數量:', icons.length);
        
        quickIconGrid.innerHTML = icons.map(icon => 
            `<button type="button" class="quick-icon-btn" data-icon="${icon}">${icon}</button>`
        ).join('');
        
        console.log('快速圖標渲染完成');
        
        // 綁定快速圖標點擊事件
        setTimeout(() => {
            const buttons = quickIconGrid.querySelectorAll('.quick-icon-btn');
            console.log('綁定快速圖標按鈕事件，數量:', buttons.length);
            
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const icon = btn.dataset.icon;
                    iconInput.value = icon;
                    iconPreview.textContent = icon;
                });
            });
            
            console.log('✓ 快速圖標按鈕事件綁定完成');
        }, 50);
    };
    
    // 類型選擇
    const typeOptions = modal.querySelectorAll('.category-modal-type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedType = option.dataset.type;
            console.log('切換類型到:', selectedType);
            
            // 更新按鈕樣式
            typeOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.style.borderColor = '#e0e0e0';
                opt.style.background = '#ffffff';
                opt.style.color = '#666';
            });
            option.classList.add('active');
            option.style.borderColor = '#ffb6d9';
            option.style.background = '#fff5f9';
            option.style.color = '#ff69b4';
            
            // 更新快速圖標
            renderQuickIcons(selectedType);
        });
    });
    
    // 初始渲染快速圖標
    renderQuickIcons(selectedType);
    
    iconInput.addEventListener('input', (e) => {
        const icon = firstGrapheme(e.target.value);
        e.target.value = icon;
        if (icon) {
            iconPreview.innerHTML = `<span style="font-size: 40px;">${icon}</span>`;
        } else {
            iconPreview.innerHTML = '<span style="font-size: 40px;">📦</span>';
        }
    });
    
        
        
    // 關閉按鈕
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#cancelCategoryBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // 保存按鈕
    modal.querySelector('#saveCategoryBtn').addEventListener('click', async () => {
        const nameInput = modal.querySelector('#categoryNameInput');
        const iconInput = modal.querySelector('#categoryIconInput');
        
        const name = nameInput.value.trim();
        const icon = firstGrapheme(iconInput.value) || '📦';
        
        if (!name) {
            alert('請輸入分類名稱');
            nameInput.focus();
            return;
        }
        
        // 檢查是否已存在相同名稱和類型的分類
        const exists = allCategories.some(cat => cat.name === name && cat.type === selectedType);
        if (exists) {
            alert(`「${name}」分類已存在！`);
            nameInput.focus();
            return;
        }
        
        // 創建新分類
        const newCategory = {
            name: name,
            icon: icon,
            type: selectedType
        };
        
        console.log('📝 創建新分類:', newCategory);
        
        // 1. 保存到localStorage
        const savedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        savedCategories.push(newCategory);
        localStorage.setItem('customCategories', JSON.stringify(savedCategories));
        
        console.log('✓ 保存新分類到 localStorage:', newCategory);
        
        // 2. 添加到分類列表（記憶體中）
        allCategories.push(newCategory);
        console.log('✓ 添加到 allCategories，新總數:', allCategories.length);
        
        // 3. 設置新分類為啟用狀態
        const enabledState = getCategoryEnabledState();
        enabledState[name] = true;
        saveCategoryEnabledState(enabledState);
        console.log('✓ 設置新分類為啟用狀態');
        
        // 4. 關閉對話框
        closeModal();
        
        // 5. 重新渲染分類管理列表
        if (typeof renderCategoryManageList === 'function') {
            renderCategoryManageList();
        }
        
        // 6. 立即重新初始化分類網格（確保新分類立即顯示）
        const pageInput = document.getElementById('pageInput');
        if (pageInput && pageInput.style.display !== 'none') {
            console.log('✓ 記帳輸入頁面可見，立即更新分類網格');
            
            // 強制重新載入自定義分類
            loadCustomCategories();
            
            // 獲取當前的 tab
            const activeTab = document.querySelector('.tab-btn.active');
            const currentTabType = activeTab ? activeTab.dataset.tab : 'more';
            
            console.log('當前 tab:', currentTabType);
            
            // 重新初始化分類網格
            initCategoryGrid(currentTabType, null);
            
            console.log('✓ 分類網格已更新');
        } else {
            console.log('記帳輸入頁面未顯示，分類已保存，下次打開時會顯示');
        }
        
        // 顯示成功提示
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">✓ 分類新增成功！</div>
            <div style="font-size: 13px; opacity: 0.9;">
                ${name} (${selectedType === 'expense' ? '支出' : selectedType === 'income' ? '收入' : '轉帳'}) - Emoji圖標
            </div>
        `;
        successMsg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 16px 24px; border-radius: 12px; z-index: 10006; text-align: center; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);';
        document.body.appendChild(successMsg);
        setTimeout(() => {
            if (document.body.contains(successMsg)) {
                document.body.removeChild(successMsg);
            }
        }, 2500);
    });
    
    // 自動聚焦到名稱輸入框
    setTimeout(() => {
        modal.querySelector('#categoryNameInput').focus();
    }, 100);
}


// 初始化設置頁面
function initSettingsPage() {
    const settingsList = document.getElementById('settingsList');
    if (!settingsList) return;

    const settingsSections = [
        {
            title: '🎨 個人化設定',
            items: [
                {
                    icon: '🎨',
                    title: '主題',
                    description: '霓虹波動 / 日系 / 極光等主題',
                    action: 'theme',
                    accent: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                    iconGradient: 'linear-gradient(135deg, #ff758c, #ff7eb3)'
                },
                {
                    icon: '🔤',
                    title: '字體',
                    description: '調整字級與閱讀體驗',
                    action: 'fontSize',
                    accent: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
                    iconGradient: 'linear-gradient(135deg, #96fbc4, #f9f586)'
                },
                            ]
        },
        {
            title: '👤 雲端硬碟帳號',
            items: (() => {
                const session = window.DriveSync ? DriveSync.getSession() : null;
                const items = [
                    session
                        ? { icon: '👤', title: `已登入：${session.username}`, description: '點這裡登出', action: 'driveAccount', accent: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', iconGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' }
                        : { icon: '👤', title: '登入 / 註冊', description: '登入後資料會上傳到雲端硬碟', action: 'driveAccount', accent: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', iconGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' }
                ];
                if (session) {
                    items.push(
                        { icon: '⬆️', title: '上傳到雲端硬碟', description: '資料存成 data.json，圖片放進「圖片」資料夾', action: 'driveUpload', accent: 'linear-gradient(135deg, #43e97b, #38f9d7)', iconGradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
                        { icon: '⬇️', title: '從雲端硬碟還原', description: '用雲端資料取代這台裝置的資料', action: 'driveRestore', accent: 'linear-gradient(135deg, #fa709a, #fee140)', iconGradient: 'linear-gradient(135deg, #fa709a, #fee140)' }
                    );
                }
                return items;
            })()
        },
        {
            title: '💾 本機備份',
            items: [
                { icon: '💾', title: '備份', description: '匯出本機資料檔', action: 'backup', accent: 'linear-gradient(135deg, #fddb92, #d1fdff)', iconGradient: 'linear-gradient(135deg, #fddb92, #d1fdff)' },
                { icon: '📥', title: '還原', description: '從本機檔案還原', action: 'restore', accent: 'linear-gradient(135deg, #fcb69f, #ffecd2)', iconGradient: 'linear-gradient(135deg, #fcb69f, #ffecd2)' }
            ]
        },
        {
            title: '📊 分析工具',
            items: [
                { icon: '📈', title: '年報', description: '生成年度分析報告', action: 'annualReport', accent: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', iconGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
                { icon: '📑', title: '分期', description: '管理分期與長期支出', action: 'installmentRules', accent: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', iconGradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' }
            ]
        },
        {
            title: '📚 說明與支援',
            items: [
                { icon: '👨‍💻', title: '關於', description: '創作者與版本資訊', action: 'creator', accent: 'linear-gradient(135deg, #d299c2, #fef9d7)', iconGradient: 'linear-gradient(135deg, #d299c2, #fef9d7)' }
            ]
        }
    ];

    const sectionHTML = settingsSections.map(section => {
        const itemsHtml = section.items.map(item => {
            const accentStyle = item.accent ? `style="background:${item.accent};"` : '';
            const iconStyle = item.iconGradient ? `style="background:${item.iconGradient};"` : '';
            const iconContent = item.image
                ? `<img src="${item.image}" alt="${item.title}">`
                : `<span>${item.icon || ''}</span>`;
            
            // 為刪除功能添加特殊樣式
            const isDeleteAction = item.action === 'deleteAllData';
            const deleteClass = isDeleteAction ? ' delete-warning' : '';
            const deleteWarning = isDeleteAction ? '<span class="settings-item-warning">⚠️ 此操作無法復原</span>' : '';
            
            return `
                <div class="settings-item${deleteClass}" data-action="${item.action}">
                    <div class="settings-item-accent" ${accentStyle}></div>
                    <div class="settings-item-icon" ${iconStyle} ${isDeleteAction ? 'style="background: linear-gradient(135deg, #dc3545, #ff6b6b); border: 2px solid #dc3545; animation: pulse 2s infinite;"' : ''}>
                        ${iconContent}
                    </div>
                    <div class="settings-item-text-group">
                        <span class="settings-item-text" ${isDeleteAction ? 'style="color: #dc3545;"' : ''}>${item.title}</span>
                        ${item.description ? `<span class="settings-item-subtext">${item.description}</span>` : ''}
                        ${deleteWarning}
                    </div>
                    <span class="settings-item-arrow">›</span>
                </div>
            `;
        }).join('');

        return `
            <div class="settings-section">
                ${section.title ? `<div class="settings-section-title">${section.title}</div>` : ''}
                <div class="settings-section-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');

    settingsList.innerHTML = sectionHTML;

    // 綁定點擊事件
    document.querySelectorAll('.settings-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'driveAccount') {
                DriveSync.accountMenu();
            } else if (action === 'driveUpload') {
                DriveSync.upload();
            } else if (action === 'driveRestore') {
                DriveSync.restore();
            } else if (action === 'driveSetUrl') {
                DriveSync.setUrl();
            } else if (action === 'uploadAllData') {
                uploadAllDataToGoogleSheet();
            } else if (action === 'deleteAllData') {
                deleteAllDataFromGoogleSheet();
            } else if (action === 'backup') {
                backupData();
            } else if (action === 'restore') {
                restoreData();
            } else if (action === 'setGoogleSheetUploadUrl') {
                setGoogleSheetUploadUrl();
            } else if (action === 'setGoogleCloudBackupKey') {
                setGoogleCloudBackupKey();
            } else if (action === 'cloudBackupFull') {
                cloudBackupToGoogleSheet();
            } else if (action === 'cloudRestoreFull') {
                cloudRestoreFromGoogleSheet();
            } else if (action === 'uploadAllRecordsDetailsToGoogleSheet') {
                uploadAllRecordsDetailsToGoogleSheet();
            } else if (action === 'uploadRecordsByAccountToGoogleSheet') {
                uploadRecordsByAccountToGoogleSheet();
            } else if (action === 'uploadIncomeExpenseCategorySummaryToGoogleSheet') {
                uploadIncomeExpenseCategorySummaryToGoogleSheet();
            } else if (action === 'creator') {
                showCreatorInfo();
            } else if (action === 'theme') {
                showThemeSelector();
            } else if (action === 'fontSize') {
                showFontSizeSelector();
                        } else if (action === 'annualReport') {
                showAnnualReport();
            } else if (action === 'installmentRules') {
                showInstallmentManagementPage();
            }
        });
    });
}

// 顯示想買的東西/存錢目標頁面
function showWishlistSavingsPage() {
    document.getElementById('pageSettings').style.display = 'none';
    document.getElementById('pageWishlistSavings').style.display = 'block';
    
    // 重新渲染列表
    switchTab(wishlistSavingsManager.currentTab || 'wishlist');
}

function getInstallmentRules() {
    return JSON.parse(localStorage.getItem('installmentRules') || '[]');
}

function setInstallmentRules(rules) {
    localStorage.setItem('installmentRules', JSON.stringify(rules));
}

function normalizeMonthKey(monthKey) {
    if (!monthKey) return '';
    const m = String(monthKey).trim();
    if (/^\d{4}-\d{2}$/.test(m)) return m;
    if (/^\d{4}\/\d{2}$/.test(m)) return m.replace('/', '-');
    return m;
}

function getInstallmentPaidPeriods(ruleId) {
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const set = new Set();
    allRecords.forEach(r => {
        if (r && r.installmentRuleId === ruleId && Number.isFinite(r.installmentPeriodNumber)) {
            set.add(Number(r.installmentPeriodNumber));
        }
    });
    return set.size;
}

function showInstallmentManagementPage() {
    const pageSettings = document.getElementById('pageSettings');
    const page = document.getElementById('installmentManagementPage');
    const setup = document.getElementById('installmentSetupPage');
    const bottomNav = document.querySelector('.bottom-nav');
    if (pageSettings) pageSettings.style.display = 'none';
    if (setup) setup.style.display = 'none';
    if (page) page.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'none';
    updateInstallmentList();
}

function showSettingsPage() {
    const pageSettings = document.getElementById('pageSettings');
    const installmentManagementPage = document.getElementById('installmentManagementPage');
    const installmentSetupPage = document.getElementById('installmentSetupPage');
    const bottomNav = document.querySelector('.bottom-nav');

    if (installmentManagementPage) installmentManagementPage.style.display = 'none';
    if (installmentSetupPage) installmentSetupPage.style.display = 'none';
    if (pageSettings) pageSettings.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
    if (typeof initSettingsPage === 'function') {
        initSettingsPage();
    }
}

function updateInstallmentPerPeriodPreview() {
    const totalAmount = parseFloat(document.getElementById('installmentTotalAmountInput')?.value) || 0;
    const totalPeriods = parseInt(document.getElementById('installmentTotalPeriodsInput')?.value, 10) || 0;
    const previewEl = document.getElementById('installmentPerPeriodAmountInput');
    if (!previewEl) return;
    if (totalAmount > 0 && totalPeriods > 0) {
        previewEl.value = Math.round(totalAmount / totalPeriods);
    } else {
        previewEl.value = '';
    }
}

function showInstallmentSetupPage(ruleId = null, mode = 'edit') {
    const page = document.getElementById('installmentSetupPage');
    const management = document.getElementById('installmentManagementPage');
    const titleEl = document.getElementById('installmentSetupTitle');
    const voidBtn = document.getElementById('installmentVoidBtn');
    const reviseBtn = document.getElementById('installmentReviseBtn');

    if (management) management.style.display = 'none';
    if (page) page.style.display = 'block';

    window.editingInstallmentRuleId = null;
    window.revisingInstallmentRuleId = null;

    const setForm = (rule) => {
        const nameEl = document.getElementById('installmentNameInput');
        const catEl = document.getElementById('installmentCategoryInput');
        const totalAmountEl = document.getElementById('installmentTotalAmountInput');
        const totalPeriodsEl = document.getElementById('installmentTotalPeriodsInput');
        const dayEl = document.getElementById('installmentDayInput');
        const startMonthEl = document.getElementById('installmentStartMonthInput');
        const enabledEl = document.getElementById('installmentEnabledInput');

        if (nameEl) nameEl.value = rule?.name || '';
        if (catEl) catEl.value = rule?.category || '';
        if (totalAmountEl) totalAmountEl.value = rule?.totalAmount ?? '';
        if (totalPeriodsEl) totalPeriodsEl.value = rule?.totalPeriods ?? '';
        if (dayEl) dayEl.value = rule?.day ?? 1;
        if (startMonthEl) startMonthEl.value = rule?.startMonthKey || '';
        if (enabledEl) enabledEl.checked = !!(rule?.enabled ?? true);

        updateInstallmentPerPeriodPreview();
    };

    if (!ruleId) {
        if (titleEl) titleEl.textContent = '新增分期規則';
        if (voidBtn) voidBtn.style.display = 'none';
        if (reviseBtn) reviseBtn.style.display = 'none';
        setForm({ day: 1, enabled: true });
        return;
    }

    const rules = getInstallmentRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) {
        if (titleEl) titleEl.textContent = '新增分期規則';
        if (voidBtn) voidBtn.style.display = 'none';
        if (reviseBtn) reviseBtn.style.display = 'none';
        setForm({ day: 1, enabled: true });
        return;
    }

    if (mode === 'revise') {
        window.revisingInstallmentRuleId = ruleId;
        if (titleEl) titleEl.textContent = '修正分期';
        if (voidBtn) voidBtn.style.display = 'none';
        if (reviseBtn) reviseBtn.style.display = 'none';
        setForm(rule);
        return;
    }

    window.editingInstallmentRuleId = ruleId;
    if (titleEl) titleEl.textContent = '編輯分期規則';
    if (voidBtn) voidBtn.style.display = 'inline-flex';
    if (reviseBtn) reviseBtn.style.display = 'inline-flex';
    setForm(rule);
}

function saveInstallmentRule() {
    const name = document.getElementById('installmentNameInput')?.value?.trim() || '';
    const category = document.getElementById('installmentCategoryInput')?.value?.trim() || '';
    const totalAmount = parseFloat(document.getElementById('installmentTotalAmountInput')?.value) || 0;
    const totalPeriods = parseInt(document.getElementById('installmentTotalPeriodsInput')?.value, 10) || 0;
    const day = parseInt(document.getElementById('installmentDayInput')?.value, 10) || 0;
    const startMonthKey = normalizeMonthKey(document.getElementById('installmentStartMonthInput')?.value || '');
    const enabled = !!document.getElementById('installmentEnabledInput')?.checked;

    if (!name || !category || !totalAmount || !totalPeriods || !day || !startMonthKey) {
        alert('請填寫所有必填欄位');
        return;
    }
    if (totalAmount <= 0) {
        alert('總金額必須大於 0');
        return;
    }
    if (totalPeriods <= 0) {
        alert('期數必須大於 0');
        return;
    }
    if (day < 1 || day > 28) {
        alert('扣款日期必須在 1-28 號之間');
        return;
    }
    if (!/^\d{4}-\d{2}$/.test(startMonthKey)) {
        alert('起始月份格式錯誤，請選擇月份（例如 2025-01）');
        return;
    }

    const perPeriodAmount = Math.round(totalAmount / totalPeriods);
    const nowIso = new Date().toISOString();
    let rules = getInstallmentRules();

    if (window.revisingInstallmentRuleId) {
        const oldId = window.revisingInstallmentRuleId;
        const oldRule = rules.find(r => r.id === oldId);
        const carriedPaidPeriods = oldRule
            ? Math.min(parseInt(oldRule.totalPeriods, 10) || 0, (parseInt(oldRule.carriedPaidPeriods, 10) || 0) + getInstallmentPaidPeriods(oldId))
            : 0;

        // 舊規則標記為已修正
        rules = rules.map(r => r.id === oldId ? { ...r, enabled: false, status: 'revised', revisedAt: nowIso } : r);

        const newRule = {
            id: Date.now().toString(),
            name,
            category,
            totalAmount,
            totalPeriods,
            perPeriodAmount,
            day,
            startMonthKey,
            enabled,
            status: 'active',
            createdAt: nowIso,
            revisedFromRuleId: oldId,
            carriedPaidPeriods
        };
        rules.push(newRule);
        setInstallmentRules(rules);
        window.revisingInstallmentRuleId = null;
        showInstallmentManagementPage();
        checkAndGenerateInstallments();
        return;
    }

    if (window.editingInstallmentRuleId) {
        const id = window.editingInstallmentRuleId;
        const idx = rules.findIndex(r => r.id === id);
        if (idx !== -1) {
            rules[idx] = {
                ...rules[idx],
                name,
                category,
                totalAmount,
                totalPeriods,
                perPeriodAmount,
                day,
                startMonthKey,
                enabled,
                status: enabled ? 'active' : 'inactive',
                updatedAt: nowIso
            };
        }
    } else {
        const newRule = {
            id: Date.now().toString(),
            name,
            category,
            totalAmount,
            totalPeriods,
            perPeriodAmount,
            day,
            startMonthKey,
            enabled,
            status: 'active',
            createdAt: nowIso,
            carriedPaidPeriods: 0
        };
        rules.push(newRule);
    }

    setInstallmentRules(rules);
    showInstallmentManagementPage();
    checkAndGenerateInstallments();
}

function deleteInstallmentRule(ruleId) {
    if (!ruleId) return;
    if (!confirm('確定要刪除此分期規則嗎？\n\n刪除後不會再自動產生記帳。\n\n已經產生的記帳紀錄將保留。')) return;
    const rules = getInstallmentRules().filter(r => r.id !== ruleId);
    setInstallmentRules(rules);
    showInstallmentManagementPage();
}

function reviseInstallmentRule(ruleId) {
    if (!ruleId) return;
    showInstallmentSetupPage(ruleId, 'revise');
}

function updateInstallmentList() {
    const container = document.getElementById('installmentListContainer');
    if (!container) return;

    const rules = getInstallmentRules();
    if (rules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🧾</div>
                <div class="empty-text">尚無分期規則</div>
                <div class="empty-hint">點擊右上角「➕」新增分期規則</div>
            </div>
        `;
        return;
    }

    const sorted = [...rules].sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
    });

    let html = '';
    sorted.forEach(rule => {
        const enabled = !!rule.enabled && rule.status !== 'revised';
        const statusText = enabled ? '啟用中' : (rule.status === 'revised' ? '已修正' : '已停用');
        const statusClass = enabled ? 'active' : 'inactive';

        const carried = parseInt(rule.carriedPaidPeriods, 10) || 0;
        const paidGenerated = getInstallmentPaidPeriods(rule.id);
        const paid = Math.min((parseInt(rule.totalPeriods, 10) || 0), carried + paidGenerated);
        const totalPeriods = parseInt(rule.totalPeriods, 10) || 0;
        const remainingPeriods = Math.max(0, totalPeriods - paid);

        const perAmount = parseFloat(rule.perPeriodAmount) || 0;
        const paidAmount = Math.max(0, Math.round(paid * perAmount));
        const totalAmount = parseFloat(rule.totalAmount) || 0;
        const remainingAmount = Math.max(0, Math.round(totalAmount - paidAmount));

        html += `
            <div class="dca-item-card">
                <div class="dca-item-header">
                    <div class="dca-item-icon">🧾</div>
                    <div class="dca-item-info">
                        <div class="dca-item-name">${rule.name || '未命名分期'}</div>
                        <div class="dca-item-code">${rule.category || '未分類'}</div>
                    </div>
                    <div class="dca-item-status ${statusClass}">${statusText}</div>
                </div>
                <div class="dca-item-body">
                    <div class="dca-item-row">
                        <span class="dca-item-label">每期金額</span>
                        <span class="dca-item-value">NT$${Math.round(perAmount).toLocaleString('zh-TW')}</span>
                    </div>
                    <div class="dca-item-row">
                        <span class="dca-item-label">扣款日期</span>
                        <span class="dca-item-value">每月 ${rule.day} 號</span>
                    </div>
                    <div class="dca-item-row">
                        <span class="dca-item-label">起始月份</span>
                        <span class="dca-item-value">${rule.startMonthKey || '-'}</span>
                    </div>
                    <div class="dca-progress">
                        <div class="dca-progress-header">
                            <span class="dca-progress-text">已繳：第 ${paid} 期 / ${totalPeriods} 期（剩餘 ${remainingPeriods} 期）</span>
                        </div>
                        <div class="dca-progress-bar" aria-label="分期進度條">
                            <div class="dca-progress-fill" style="width: ${totalPeriods > 0 ? Math.min(100, Math.round((paid / totalPeriods) * 100)) : 0}%"></div>
                        </div>
                        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                            <span>已繳 NT$${paidAmount.toLocaleString('zh-TW')}</span>
                            <span>剩餘 NT$${remainingAmount.toLocaleString('zh-TW')}</span>
                        </div>
                    </div>
                </div>
                <div class="dca-item-actions">
                    <button class="dca-edit-btn" onclick="editInstallmentRule('${rule.id}')">編輯</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editInstallmentRule(ruleId) {
    showInstallmentSetupPage(ruleId, 'edit');
}

function monthKeyFromDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function parseMonthKeyToDate(monthKey) {
    const mk = normalizeMonthKey(monthKey);
    if (!/^\d{4}-\d{2}$/.test(mk)) return null;
    const [y, m] = mk.split('-').map(Number);
    return new Date(y, m - 1, 1);
}

function addMonthsToMonthKey(monthKey, delta) {
    const d = parseMonthKeyToDate(monthKey);
    if (!d) return monthKey;
    d.setMonth(d.getMonth() + delta);
    return monthKeyFromDate(d);
}

function checkAndGenerateInstallments() {
    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonthKey = monthKeyFromDate(today);

        const rules = getInstallmentRules();
        if (!rules.length) return;

        let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');

        const existingIndex = new Set();
        accountingRecords.forEach(r => {
            if (r && r.installmentRuleId && Number.isFinite(r.installmentPeriodNumber)) {
                existingIndex.add(`${r.installmentRuleId}#${Number(r.installmentPeriodNumber)}`);
            }
        });

        let mutated = false;

        rules.forEach(rule => {
            const enabled = !!rule.enabled && rule.status !== 'revised';
            if (!enabled) return;

            const totalPeriods = parseInt(rule.totalPeriods, 10) || 0;
            if (totalPeriods <= 0) return;

            const day = parseInt(rule.day, 10) || 1;
            if (day < 1 || day > 28) return;

            const perAmount = parseFloat(rule.perPeriodAmount) || 0;
            if (perAmount <= 0) return;

            const carried = parseInt(rule.carriedPaidPeriods, 10) || 0;
            const startMonthKey = normalizeMonthKey(rule.startMonthKey);
            if (!/^\d{4}-\d{2}$/.test(startMonthKey)) return;

            const startDate = parseMonthKeyToDate(startMonthKey);
            if (!startDate) return;

            const paidGenerated = getInstallmentPaidPeriods(rule.id);
            const alreadyPaid = Math.min(totalPeriods, carried + paidGenerated);
            if (alreadyPaid >= totalPeriods) return;

            for (let periodNumber = alreadyPaid + 1; periodNumber <= totalPeriods; periodNumber++) {
                const monthIndex = periodNumber - carried - 1;
                if (monthIndex < 0) continue;
                const dueMonthKey = addMonthsToMonthKey(startMonthKey, monthIndex);

                const isDueMonthPast = dueMonthKey < currentMonthKey;
                const isDueMonthNow = dueMonthKey === currentMonthKey;
                const dueReached = isDueMonthPast || (isDueMonthNow && currentDay >= day);
                if (!dueReached) break;

                const idxKey = `${rule.id}#${periodNumber}`;
                if (existingIndex.has(idxKey)) continue;

                const dueDateObj = parseMonthKeyToDate(dueMonthKey);
                if (!dueDateObj) continue;
                const dueDate = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), day);
                const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

                const record = {
                    type: 'expense',
                    category: rule.category || '未分類',
                    amount: Math.round(perAmount),
                    note: `${rule.name || '分期'}：第 ${periodNumber} 期 / ${totalPeriods} 期`,
                    date: dueDateStr,
                    timestamp: new Date().toISOString(),
                    installmentRuleId: rule.id,
                    installmentPeriodNumber: periodNumber,
                    installmentDueMonthKey: dueMonthKey
                };

                accountingRecords.push(record);
                existingIndex.add(idxKey);
                mutated = true;
            }
        });

        if (mutated) {
            localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
            const ledgerPage = document.getElementById('pageLedger');
            if (ledgerPage && ledgerPage.style.display !== 'none' && typeof initLedger === 'function') {
                initLedger();
            }
        }
    } catch (e) {
        console.error('checkAndGenerateInstallments failed', e);
    }
}

// ========== 年度報告功能 ==========

// 顯示年度報告
function showAnnualReport() {
    const currentYear = new Date().getFullYear();
    
    // 獲取記帳記錄
    const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    // 獲取投資記錄
    const investmentRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    
    // 過濾當年的記錄
    const yearRecords = accountingRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear;
    });
    
    const yearInvestmentRecords = investmentRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear;
    });
    
    // 計算年支出排行
    const expenseRecords = yearRecords.filter(r => r.type === 'expense' || !r.type);
    const categoryExpenses = {};
    expenseRecords.forEach(record => {
        const category = record.category || '未分類';
        if (!categoryExpenses[category]) {
            categoryExpenses[category] = 0;
        }
        categoryExpenses[category] += record.amount || 0;
    });
    
    const expenseRanking = Object.entries(categoryExpenses)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    
    // 計算年投資總投入
    const buyRecords = yearInvestmentRecords.filter(r => r.type === 'buy');
    const totalInvestment = buyRecords.reduce((sum, record) => {
        const price = record.price || 0;
        const shares = record.shares || 0;
        const fee = record.fee || 0;
        return sum + (price * shares + fee);
    }, 0);
    
    // 計算年股息總額
    const dividendRecords = yearInvestmentRecords.filter(r => r.type === 'dividend');
    const totalDividend = dividendRecords.reduce((sum, record) => {
        return sum + (record.amount || 0);
    }, 0);
    
    // 找出最燒錢分類
    const topExpenseCategory = expenseRanking.length > 0 ? expenseRanking[0] : null;
    
    // 計算總支出
    const totalExpense = expenseRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
    
    // 創建模態框
    const modal = document.createElement('div');
    modal.className = 'annual-report-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10006; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
    
    let expenseRankingHtml = '';
    if (expenseRanking.length === 0) {
        expenseRankingHtml = '<div class="annual-report-empty" style="text-align: center; padding: 20px; color: #999;">尚無支出記錄</div>';
    } else {
        expenseRanking.forEach((item, index) => {
            const percentage = ((item.amount / totalExpense) * 100).toFixed(1);
            expenseRankingHtml += `
                <div class="annual-report-rank-row" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #f0f0f0;">
                    <div class="annual-report-rank-index" style="width: 30px; text-align: center; font-weight: 600; color: #666;">${index + 1}</div>
                    <div class="annual-report-rank-category" style="flex: 1; font-size: 15px; color: #333;">${item.category}</div>
                    <div class="annual-report-rank-amount" style="font-size: 15px; font-weight: 600; color: #f44336;">NT$${item.amount.toLocaleString('zh-TW')}</div>
                    <div class="annual-report-rank-percent" style="width: 60px; text-align: right; font-size: 13px; color: #999; margin-left: 12px;">${percentage}%</div>
                </div>
            `;
        });
    }
    
    modal.innerHTML = `
        <div class="annual-report-content" style="background: white; border-radius: 20px; padding: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div class="annual-report-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; position: sticky; top: 0; background: white; z-index: 10; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0;">
                <h2 class="annual-report-title" style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">📊 ${currentYear} 年度報告</h2>
                <button class="annual-report-close-btn" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">✕</button>
            </div>
            
            <div class="annual-report-body" style="display: flex; flex-direction: column; gap: 24px;">
                <!-- 總支出 -->
                <div class="annual-report-total" style="background: linear-gradient(135deg, #ffeef5 0%, #fff5f9 100%); padding: 20px; border-radius: 16px; border: 2px solid #ffb6d9;">
                    <div class="annual-report-total-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">年度總支出</div>
                    <div class="annual-report-total-value" style="font-size: 32px; font-weight: 700; color: #ff69b4;">NT$${totalExpense.toLocaleString('zh-TW')}</div>
                </div>
                
                <!-- 年支出排行 -->
                <div class="annual-report-ranking" style="background: #f8f8f8; padding: 20px; border-radius: 16px;">
                    <h3 class="annual-report-section-title" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333;">📈 年支出排行（Top 10）</h3>
                    <div class="annual-report-ranking-list" style="background: white; border-radius: 12px; overflow: hidden;">
                        ${expenseRankingHtml}
                    </div>
                </div>
                
                <!-- 投資相關 -->
                <div class="annual-report-investment-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="annual-report-card annual-report-investment" style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 20px; border-radius: 16px; border: 2px solid #c8e6c9;">
                        <div class="annual-report-card-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">年投資總投入</div>
                        <div class="annual-report-card-value" style="font-size: 24px; font-weight: 700; color: #4caf50;">NT$${totalInvestment.toLocaleString('zh-TW')}</div>
                    </div>
                    
                    <div class="annual-report-card annual-report-dividend" style="background: linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%); padding: 20px; border-radius: 16px; border: 2px solid #ffe0b2;">
                        <div class="annual-report-card-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">年股息總額</div>
                        <div class="annual-report-card-value" style="font-size: 24px; font-weight: 700; color: #ff9800;">NT$${totalDividend.toLocaleString('zh-TW')}</div>
                    </div>
                </div>
                
                <!-- 最燒錢分類 -->
                ${topExpenseCategory ? `
                    <div class="annual-report-top-category" style="background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%); padding: 20px; border-radius: 16px; border: 2px solid #ffcdd2; text-align: center;">
                        <div class="annual-report-top-label" style="font-size: 16px; color: #666; margin-bottom: 12px;">😅 最燒錢分類</div>
                        <div class="annual-report-top-name" style="font-size: 28px; font-weight: 700; color: #f44336; margin-bottom: 8px;">${topExpenseCategory.category}</div>
                        <div class="annual-report-top-amount" style="font-size: 20px; color: #666;">NT$${topExpenseCategory.amount.toLocaleString('zh-TW')}</div>
                        <div class="annual-report-top-percent" style="font-size: 14px; color: #999; margin-top: 8px;">佔總支出 ${((topExpenseCategory.amount / totalExpense) * 100).toFixed(1)}%</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="annual-report-footer" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center;">
                <button id="exportAnnualReportBtn" style="padding: 12px 24px; background: #ff69b4; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">📄 匯出報告</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    const closeBtn = modal.querySelector('.annual-report-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
    
    // 匯出報告
    const exportBtn = modal.querySelector('#exportAnnualReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportAnnualReport(currentYear, {
                totalExpense,
                expenseRanking,
                totalInvestment,
                totalDividend,
                topExpenseCategory
            });
        });
    }
}

// 匯出年度報告
function exportAnnualReport(year, data) {
    let reportText = `📊 ${year} 年度報告\n`;
    reportText += `生成時間：${new Date().toLocaleString('zh-TW')}\n\n`;
    reportText += `═══════════════════════════════════\n\n`;
    
    reportText += `💰 年度總支出：NT$${data.totalExpense.toLocaleString('zh-TW')}\n\n`;
    
    reportText += `📈 年支出排行（Top 10）：\n`;
    data.expenseRanking.forEach((item, index) => {
        const percentage = ((item.amount / data.totalExpense) * 100).toFixed(1);
        reportText += `${index + 1}. ${item.category}：NT$${item.amount.toLocaleString('zh-TW')} (${percentage}%)\n`;
    });
    reportText += `\n`;
    
    reportText += `📊 年投資總投入：NT$${data.totalInvestment.toLocaleString('zh-TW')}\n`;
    reportText += `💵 年股息總額：NT$${data.totalDividend.toLocaleString('zh-TW')}\n\n`;
    
    if (data.topExpenseCategory) {
        const percentage = ((data.topExpenseCategory.amount / data.totalExpense) * 100).toFixed(1);
        reportText += `😅 最燒錢分類：${data.topExpenseCategory.category}\n`;
        reportText += `   金額：NT$${data.topExpenseCategory.amount.toLocaleString('zh-TW')}\n`;
        reportText += `   佔總支出：${percentage}%\n`;
    }
    
    reportText += `\n═══════════════════════════════════\n`;
    reportText += `由記帳本 App 自動生成`;
    
    // 創建下載連結
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${year}年度報告.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('年度報告已匯出！');
}

// 備份資料（包含所有資料）
function backupData() {
    try {
        // 收集所有 localStorage 中的資料
        const data = {
            // 記帳相關
            accountingRecords: JSON.parse(localStorage.getItem('accountingRecords') || '[]'),
            categoryBudgets: JSON.parse(localStorage.getItem('categoryBudgets') || '{}'),
            categoryEnabledState: JSON.parse(localStorage.getItem('categoryEnabledState') || '{}'),
            dailyBudgetTracking: JSON.parse(localStorage.getItem('dailyBudgetTracking') || '{}'),
            customCategories: JSON.parse(localStorage.getItem('customCategories') || '[]'),
            categoryCustomIcons: JSON.parse(localStorage.getItem('categoryCustomIcons') || '{}'),
            
            // 投資相關
            investmentRecords: JSON.parse(localStorage.getItem('investmentRecords') || '[]'),
            dcaPlans: JSON.parse(localStorage.getItem('dcaPlans') || '[]'),
            stockCurrentPrices: JSON.parse(localStorage.getItem('stockCurrentPrices') || '{}'),

            installmentRules: JSON.parse(localStorage.getItem('installmentRules') || '[]'),
            
            // 帳戶相關
            accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
            
            // 表情和圖標
            imageEmojis: JSON.parse(localStorage.getItem('imageEmojis') || '[]'),
            
            // 成員
            members: JSON.parse(localStorage.getItem('members') || '[]'),
            
            // 設定
            theme: localStorage.getItem('theme') || 'default',
            fontSize: localStorage.getItem('fontSize') || 'medium',
            customTheme: JSON.parse(localStorage.getItem('customTheme') || '{}'),
            
            // 備份資訊
            backupDate: new Date().toISOString(),
            backupVersion: '1.0',
            appName: '記帳本'
        };
        
        // 計算資料大小
        const dataStr = JSON.stringify(data, null, 2);
        const sizeInMB = new Blob([dataStr]).size / (1024 * 1024);
        
        // 顯示資料統計
        const stats = {
            accountingRecords: data.accountingRecords.length,
            investmentRecords: data.investmentRecords.length,
            accounts: data.accounts.length,
            categories: data.customCategories.length,
            budgets: Object.keys(data.categoryBudgets).length,
            dcaPlans: data.dcaPlans.length,
            installmentRules: data.installmentRules.length
        };
        
        const statsMessage = `資料統計：
• 記帳記錄：${stats.accountingRecords} 筆
• 投資記錄：${stats.investmentRecords} 筆
• 帳戶：${stats.accounts} 個
• 自定義分類：${stats.categories} 個
• 預算設定：${stats.budgets} 個
• 定期定額：${stats.dcaPlans} 個
• 分期規則：${stats.installmentRules} 個
• 檔案大小：${sizeInMB.toFixed(2)} MB`;
        
        // 確認備份
        if (!confirm(`${statsMessage}\n\n確定要下載備份檔案嗎？`)) {
            return;
        }
        
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        a.download = `記帳本完整備份_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`資料備份成功！\n\n${statsMessage}\n\n檔案已下載到您的下載資料夾。\n\n您可以在其他設備上使用「還原資料」功能來匯入此備份檔案。`);
    } catch (error) {
        console.error('備份失敗:', error);
        alert('備份失敗，請稍後再試。\n\n錯誤訊息：' + error.message);
    }
}

// 注意：compressAllIcons 和 getStorageInfo 函數已移至 js/storage.js 模組


// 還原資料
function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!confirm('確定要還原資料嗎？\n這將覆蓋現有的所有資料！')) {
                    return;
                }

                await applyBackupDataPayload(data);
            } catch (error) {
                console.error('還原失敗:', error);
                alert('還原失敗，請確認檔案格式正確。');
            }
        };
        
        reader.readAsText(file);
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// 匯入投資記錄（CSV 格式）
function importInvestmentData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target.result;
                const lines = csvText.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    alert('檔案格式錯誤：檔案至少需要包含標題行和一行資料。');
                    return;
                }
                
                // 查找投資記錄區塊（可能與記帳記錄混合）
                let startIndex = 0;
                let isInvestmentSection = false;
                
                // 檢查是否有投資記錄標題
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('投資記錄') || lines[i].includes('日期,類型,股票')) {
                        startIndex = i + 1;
                        isInvestmentSection = true;
                        break;
                    }
                }
                
                // 如果沒有找到投資記錄標題，檢查第一行是否包含股票相關欄位
                if (!isInvestmentSection) {
                    const firstLine = lines[0].toLowerCase();
                    if (firstLine.includes('股票') || firstLine.includes('stock')) {
                        startIndex = 1;
                        isInvestmentSection = true;
                    } else {
                        alert('檔案格式錯誤：請確認檔案包含投資記錄資料。\n\n支援格式：CSV 檔案，需包含「日期」、「類型」、「股票代碼」等欄位。');
                        return;
                    }
                }
                
                // 解析 CSV 標題行
                const headerLine = isInvestmentSection ? lines[startIndex - 1] : lines[0];
                const headers = headerLine.split(',').map(h => h.trim());
                
                // 檢查必要的欄位
                const hasStockCode = headers.some(h => h.includes('股票代碼') || h.includes('stockCode') || h.toLowerCase().includes('code'));
                const hasDate = headers.some(h => h.includes('日期') || h.includes('date'));
                const hasType = headers.some(h => h.includes('類型') || h.includes('type'));
                
                if (!hasStockCode || !hasDate || !hasType) {
                    alert('檔案格式錯誤：缺少必要欄位。\n\n請確認檔案包含：日期、類型、股票代碼等欄位。');
                    return;
                }
                
                // 確認匯入
                const dataLines = lines.slice(startIndex);
                if (!confirm(`即將匯入 ${dataLines.length} 筆投資記錄。\n\n這將新增記錄到現有資料中，不會覆蓋現有資料。\n\n確定要繼續嗎？`)) {
                    return;
                }
                
                // 獲取現有記錄
                let existingRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
                let importedCount = 0;
                let skippedCount = 0;
                
                // 解析每一行資料
                for (let i = 0; i < dataLines.length; i++) {
                    const line = dataLines[i].trim();
                    if (!line) continue;
                    
                    const values = line.split(',').map(v => v.trim());
                    if (values.length < headers.length) continue;
                    
                    // 建立記錄物件
                    const record = {};
                    let typeValue = '';
                    
                    headers.forEach((header, index) => {
                        const value = values[index] || '';
                        const headerLower = header.toLowerCase();
                        
                        if (headerLower.includes('日期') || headerLower.includes('date')) {
                            record.date = value;
                        } else if (headerLower.includes('類型') || headerLower.includes('type')) {
                            typeValue = value;
                            if (value.includes('買入') || value.includes('buy') || value.toLowerCase() === 'buy') {
                                record.type = 'buy';
                            } else if (value.includes('賣出') || value.includes('sell') || value.toLowerCase() === 'sell') {
                                record.type = 'sell';
                            } else if (value.includes('股息') || value.includes('dividend') || value.toLowerCase() === 'dividend') {
                                record.type = 'dividend';
                            }
                        } else if (headerLower.includes('股票代碼') || headerLower.includes('stockcode') || (headerLower.includes('stock') && headerLower.includes('code'))) {
                            record.stockCode = value;
                        } else if (headerLower.includes('股票名稱') || headerLower.includes('stockname') || (headerLower.includes('stock') && headerLower.includes('name'))) {
                            record.stockName = value;
                        } else if (headerLower.includes('價格') || headerLower.includes('price')) {
                            record.price = parseFloat(value) || 0;
                        } else if (headerLower.includes('股數') || headerLower.includes('shares') || headerLower.includes('數量')) {
                            record.shares = parseInt(value) || 0;
                        } else if (headerLower.includes('手續費') || headerLower.includes('fee')) {
                            record.fee = parseFloat(value) || 0;
                        } else if (headerLower.includes('證交稅') || headerLower.includes('tax')) {
                            record.tax = parseFloat(value) || 0;
                        } else if (headerLower.includes('備註') || headerLower.includes('note') || headerLower.includes('說明')) {
                            record.note = value;
                        } else if (headerLower.includes('每股') || headerLower.includes('pershare')) {
                            record.perShare = parseFloat(value) || 0;
                        } else if (headerLower.includes('實收') || headerLower.includes('amount')) {
                            record.amount = parseFloat(value) || 0;
                        } else if (headerLower.includes('股利類型') || headerLower.includes('dividendtype')) {
                            if (value.includes('現金') || value.includes('cash')) {
                                record.dividendType = 'cash';
                            } else if (value.includes('股票') || value.includes('stock')) {
                                record.dividendType = 'stock';
                            }
                        } else if (headerLower.includes('再投入') || headerLower.includes('reinvest')) {
                            record.reinvest = value === 'true' || value === '是' || value === '1' || value.toLowerCase() === 'yes';
                        }
                    });
                    
                    // 驗證必要欄位
                    if (!record.date || !record.type || !record.stockCode) {
                        skippedCount++;
                        continue;
                    }
                    
                    // 根據類型驗證其他必要欄位
                    if (record.type === 'buy' || record.type === 'sell') {
                        if (!record.price || !record.shares) {
                            skippedCount++;
                            continue;
                        }
                    } else if (record.type === 'dividend') {
                        if (!record.perShare || !record.shares || !record.amount) {
                            skippedCount++;
                            continue;
                        }
                        if (!record.dividendType) {
                            record.dividendType = 'cash'; // 預設為現金股利
                        }
                    } else {
                        skippedCount++;
                        continue;
                    }
                    
                    // 設定預設值
                    if (!record.stockName && typeof findStockName === 'function') {
                        record.stockName = findStockName(record.stockCode) || record.stockCode;
                    } else if (!record.stockName) {
                        record.stockName = record.stockCode;
                    }
                    
                    record.timestamp = new Date().toISOString();
                    
                    // 添加到現有記錄
                    existingRecords.push(record);
                    importedCount++;
                }
                
                // 保存記錄
                localStorage.setItem('investmentRecords', JSON.stringify(existingRecords));
                
                // 顯示結果
                let message = `匯入完成！\n\n成功匯入：${importedCount} 筆記錄`;
                if (skippedCount > 0) {
                    message += `\n跳過：${skippedCount} 筆（格式不正確）`;
                }
                message += '\n\n頁面將自動更新以顯示最新資料。';
                
                alert(message);
                
                // 更新投資總覽
                if (typeof updateInvestmentOverview === 'function') {
                    updateInvestmentOverview();
                }
                if (typeof updateInvestmentRecords === 'function') {
                    updateInvestmentRecords();
                }
                if (typeof updatePortfolioList === 'function') {
                    updatePortfolioList();
                }
                
            } catch (error) {
                console.error('匯入失敗:', error);
                alert('匯入失敗，請確認檔案格式正確。\n\n支援格式：CSV 檔案，需包含「日期」、「類型」、「股票代碼」等欄位。');
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// 匯出資料
function exportData() {
    try {
        const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        const investmentRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
        
        if (records.length === 0 && investmentRecords.length === 0) {
            alert('目前沒有資料可以匯出。');
            return;
        }
        
        // 轉換記帳記錄為 CSV 格式
        let csvContent = '日期,類型,分類,金額,備註,帳戶,表情\n';
        records.forEach(record => {
            const date = record.date || '';
            const type = record.type === 'income' ? '收入' : record.type === 'expense' ? '支出' : record.type === 'transfer' ? '轉帳' : '支出';
            const category = record.category || '';
            const amount = record.amount || 0;
            const note = (record.note || '').replace(/,/g, '，'); // 替換逗號避免 CSV 格式問題
            const account = record.account || '';
            const emoji = record.emoji || '';
            
            csvContent += `${date},${type},${category},${amount},${note},${account},${emoji}\n`;
        });
        
        // 如果有投資記錄，也加入
        if (investmentRecords.length > 0) {
            csvContent += '\n\n投資記錄\n';
            csvContent += '日期,類型,股票代碼,股票名稱,價格,股數,手續費,備註\n';
            investmentRecords.forEach(record => {
                const date = record.date || '';
                const type = record.type === 'buy' ? '買入' : record.type === 'sell' ? '賣出' : record.type === 'dividend' ? '股息' : '';
                const stockCode = record.stockCode || '';
                const stockName = (record.stockName || '').replace(/,/g, '，');
                const price = record.price || 0;
                const shares = record.shares || 0;
                const fee = record.fee || 0;
                const note = (record.note || '').replace(/,/g, '，');
                
                csvContent += `${date},${type},${stockCode},${stockName},${price},${shares},${fee},${note}\n`;
            });
        }
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // 添加 BOM 以支持中文
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        a.download = `記帳本匯出_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('資料匯出成功！\nCSV 檔案已下載到您的下載資料夾。\n您可以使用 Excel 或其他試算表軟體開啟。');
    } catch (error) {
        console.error('匯出失敗:', error);
        alert('匯出失敗，請稍後再試。');
    }
}

// 匯入檔案（CSV 格式）
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target.result;
                const lines = csvText.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    alert('檔案格式錯誤：檔案至少需要包含標題行和一行資料。');
                    return;
                }
                
                // 解析 CSV 標題行
                const headers = lines[0].split(',').map(h => h.trim());
                
                // 檢查必要的欄位
                const requiredFields = ['日期', '分類', '金額'];
                const missingFields = requiredFields.filter(field => !headers.includes(field));
                if (missingFields.length > 0) {
                    alert(`檔案格式錯誤：缺少必要欄位：${missingFields.join(', ')}\n\n請確認檔案包含：日期、分類、金額等欄位。`);
                    return;
                }
                
                // 確認匯入
                if (!confirm(`即將匯入 ${lines.length - 1} 筆記錄。\n\n這將新增記錄到現有資料中，不會覆蓋現有資料。\n\n確定要繼續嗎？`)) {
                    return;
                }
                
                // 獲取現有記錄
                let existingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                let importedCount = 0;
                let skippedCount = 0;
                
                // 解析每一行資料
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length < headers.length) continue;
                    
                    // 建立記錄物件
                    const record = {};
                    headers.forEach((header, index) => {
                        const value = values[index] || '';
                        if (header === '日期') {
                            record.date = value;
                        } else if (header === '分類') {
                            record.category = value;
                        } else if (header === '金額') {
                            record.amount = parseFloat(value) || 0;
                        } else if (header === '類型' || header === '收支類型') {
                            record.type = value === '收入' ? 'income' : (value === '支出' ? 'expense' : 'expense');
                        } else if (header === '備註' || header === '說明') {
                            record.note = value;
                        } else if (header === '帳戶') {
                            // 嘗試找到對應的帳戶 ID
                            const accounts = typeof getAccounts === 'function' ? getAccounts() : [];
                            const account = accounts.find(a => a.name === value);
                            if (account) {
                                record.account = account.id;
                            }
                        }
                    });
                    
                    // 驗證必要欄位
                    if (!record.date || !record.category || !record.amount || record.amount <= 0) {
                        skippedCount++;
                        continue;
                    }
                    
                    // 設定預設值
                    if (!record.type) {
                        record.type = 'expense';
                    }
                    record.timestamp = new Date().toISOString();
                    
                    // 添加到現有記錄
                    existingRecords.push(record);
                    importedCount++;
                }
                
                // 保存記錄
                localStorage.setItem('accountingRecords', JSON.stringify(existingRecords));
                
                // 顯示結果
                let message = `匯入完成！\n\n成功匯入：${importedCount} 筆記錄`;
                if (skippedCount > 0) {
                    message += `\n跳過：${skippedCount} 筆（格式不正確）`;
                }
                message += '\n\n頁面將重新載入以顯示最新資料。';
                
                alert(message);
                
                // 重新載入頁面
                location.reload();
                
            } catch (error) {
                console.error('匯入失敗:', error);
                alert('匯入失敗，請確認檔案格式正確。\n\n支援格式：CSV 檔案，需包含「日期」、「分類」、「金額」欄位。');
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// 顯示創作者信息
function showCreatorInfo() {
    const modal = document.createElement('div');
    modal.className = 'creator-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10004; display: flex; align-items: center; justify-content: center; overflow-y: auto;';
    
    modal.innerHTML = `
        <div class="creator-content" style="background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); -webkit-overflow-scrolling: touch;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 16px; position: sticky; top: 0; background: white; z-index: 10; padding-bottom: 8px;">
                <button class="creator-close-btn" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">✕</button>
            </div>
            
            <div style="font-size: 64px; margin-bottom: 20px;">👨‍💻</div>
            <h2 style="font-size: 24px; font-weight: 600; color: #333; margin: 0 0 8px 0;">記帳本</h2>
            <p style="font-size: 14px; color: #999; margin: 0 0 24px 0;">版本 1.0.7</p>
            
            <div style="text-align: left; margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, #fff5f9 0%, #ffeef5 100%); border-radius: 12px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #ff69b4; margin: 0 0 12px 0;">關於本應用</h3>
                <p style="font-size: 14px; color: #666; line-height: 1.8; margin: 0 0 12px 0;">
                    這是一個功能完整的個人記帳應用，幫助您輕鬆管理財務、追蹤支出、設定預算，並進行投資記錄。
                </p>
                <p style="font-size: 14px; color: #666; line-height: 1.8; margin: 0;">
                    所有數據都存儲在您的設備本地，保護您的隱私安全。
                </p>
            </div>
            
            <div style="text-align: left; margin-bottom: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #333; margin: 0 0 12px 0;">主要功能</h3>
                <div style="font-size: 14px; color: #666; line-height: 2;">
                    <div>✓ 多帳戶管理</div>
                    <div>✓ 分類記帳</div>
                    <div>✓ 預算設定</div>
                    <div>✓ 投資追蹤</div>
                    <div>✓ 圖表分析</div>
                    <div>✓ 資料備份與還原</div>
                </div>
            </div>
            
            <div style="padding-top: 20px; border-top: 1px solid #f0f0f0;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                    Made with ❤️ for better financial management
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    const closeBtn = modal.querySelector('.creator-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
        
        // 懸停效果
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f5f5f5';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
    }
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}

// 應用字體大小
function applyFontSize(fontSize) {
    const root = document.documentElement;
    // 設置基礎字體大小變數
    root.style.setProperty('--base-font-size', `${fontSize}px`);
    root.style.setProperty('--font-base', `${fontSize}px`);
    // 根據基礎字體大小計算其他字體大小
    root.style.setProperty('--font-xs', `${Math.round(fontSize * 0.6875)}px`); // 11/16
    root.style.setProperty('--font-sm', `${Math.round(fontSize * 0.75)}px`); // 12/16
    root.style.setProperty('--font-md', `${Math.round(fontSize * 0.875)}px`); // 14/16
    root.style.setProperty('--font-lg', `${Math.round(fontSize * 1.125)}px`); // 18/16
    root.style.setProperty('--font-xl', `${Math.round(fontSize * 1.25)}px`); // 20/16
    root.style.setProperty('--font-xxl', `${Math.round(fontSize * 1.5)}px`); // 24/16
    root.style.setProperty('--font-xxxl', `${Math.round(fontSize * 2)}px`); // 32/16
    document.body.style.fontSize = `${fontSize}px`;
    localStorage.setItem('fontSize', fontSize.toString());
}

// 獲取當前字體大小
function getCurrentFontSize() {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved) : 16; // 預設 16px
}

// 初始化字體大小
function initFontSize() {
    const fontSize = getCurrentFontSize();
    applyFontSize(fontSize);
}

// 顯示字體大小選擇器
function showFontSizeSelector() {
    const modal = document.createElement('div');
    modal.className = 'font-size-select-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10005; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;';
    
    const currentFontSize = getCurrentFontSize();
    
    modal.innerHTML = `
        <div class="font-size-content" style="background: white; border-radius: 20px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0;">🔤 字體大小</h2>
                <button class="font-size-close-btn" style="background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: all var(--transition-fast);">✕</button>
            </div>
            
            <div style="margin-bottom: 24px;">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text-primary);">調整字體大小</div>
                
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 14px; color: #666;">小</span>
                        <span id="fontSizeValue" style="font-size: 18px; font-weight: 600; color: var(--color-primary);">${currentFontSize}px</span>
                        <span style="font-size: 14px; color: #666;">大</span>
                    </div>
                    <input type="range" id="fontSizeSlider" min="12" max="24" step="1" value="${currentFontSize}" 
                           style="width: 100%; height: 8px; border-radius: 4px; background: #e0e0e0; outline: none; -webkit-appearance: none;">
                    <style>
                        #fontSizeSlider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: var(--color-primary, #ff69b4);
                            cursor: pointer;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        #fontSizeSlider::-moz-range-thumb {
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: var(--color-primary, #ff69b4);
                            cursor: pointer;
                            border: none;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                    </style>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 24px;">
                    <button class="font-size-preset" data-size="12" style="padding: 12px; border: 2px solid ${currentFontSize === 12 ? '#ff69b4' : '#e0e0e0'}; border-radius: 12px; background: ${currentFontSize === 12 ? '#fff5f9' : 'white'}; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">小</div>
                        <div style="font-size: 10px; color: #666;">12px</div>
                    </button>
                    <button class="font-size-preset" data-size="14" style="padding: 12px; border: 2px solid ${currentFontSize === 14 ? '#ff69b4' : '#e0e0e0'}; border-radius: 12px; background: ${currentFontSize === 14 ? '#fff5f9' : 'white'}; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">中</div>
                        <div style="font-size: 10px; color: #666;">14px</div>
                    </button>
                    <button class="font-size-preset" data-size="16" style="padding: 12px; border: 2px solid ${currentFontSize === 16 ? '#ff69b4' : '#e0e0e0'}; border-radius: 12px; background: ${currentFontSize === 16 ? '#fff5f9' : 'white'}; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">標準</div>
                        <div style="font-size: 10px; color: #666;">16px</div>
                    </button>
                    <button class="font-size-preset" data-size="20" style="padding: 12px; border: 2px solid ${currentFontSize === 20 ? '#ff69b4' : '#e0e0e0'}; border-radius: 12px; background: ${currentFontSize === 20 ? '#fff5f9' : 'white'}; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">大</div>
                        <div style="font-size: 10px; color: #666;">20px</div>
                    </button>
                </div>
                
                <div style="margin-top: 24px; padding: 16px; background: #f8f8f8; border-radius: 12px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">預覽效果：</div>
                    <div id="fontSizePreview" style="font-size: ${currentFontSize}px; line-height: 1.6; color: #333;">
                        這是一段預覽文字，您可以調整滑桿來查看不同字體大小的效果。調整後的字體大小會應用到整個應用程式。
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="font-size-reset-btn" style="flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 12px; background: white; color: #666; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">重置</button>
                <button class="font-size-confirm-btn" style="flex: 1; padding: 12px; border: none; border-radius: 12px; background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%); color: white; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);">確認</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const slider = modal.querySelector('#fontSizeSlider');
    const valueDisplay = modal.querySelector('#fontSizeValue');
    const preview = modal.querySelector('#fontSizePreview');
    const presetButtons = modal.querySelectorAll('.font-size-preset');
    const resetBtn = modal.querySelector('.font-size-reset-btn');
    const confirmBtn = modal.querySelector('.font-size-confirm-btn');
    const closeBtn = modal.querySelector('.font-size-close-btn');
    
    // 保存原始字體大小（用於取消時恢復）
    const originalSize = getCurrentFontSize();
    
    // 臨時應用字體大小（僅用於預覽，不保存）
    const applyFontSizePreview = (size) => {
        const root = document.documentElement;
        root.style.setProperty('--base-font-size', `${size}px`);
        root.style.setProperty('--font-base', `${size}px`);
        root.style.setProperty('--font-xs', `${Math.round(size * 0.6875)}px`);
        root.style.setProperty('--font-sm', `${Math.round(size * 0.75)}px`);
        root.style.setProperty('--font-md', `${Math.round(size * 0.875)}px`);
        root.style.setProperty('--font-lg', `${Math.round(size * 1.125)}px`);
        root.style.setProperty('--font-xl', `${Math.round(size * 1.25)}px`);
        root.style.setProperty('--font-xxl', `${Math.round(size * 1.5)}px`);
        root.style.setProperty('--font-xxxl', `${Math.round(size * 2)}px`);
        document.body.style.fontSize = `${size}px`;
    };
    
    // 更新預覽
    const updatePreview = (size) => {
        valueDisplay.textContent = `${size}px`;
        preview.style.fontSize = `${size}px`;
        applyFontSizePreview(size);
    };
    
    // 滑桿事件
    slider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        updatePreview(size);
        
        // 更新預設按鈕狀態
        presetButtons.forEach(btn => {
            const btnSize = parseInt(btn.dataset.size);
            if (btnSize === size) {
                btn.style.borderColor = '#ff69b4';
                btn.style.background = '#fff5f9';
            } else {
                btn.style.borderColor = '#e0e0e0';
                btn.style.background = 'white';
            }
        });
    });
    
    // 預設按鈕事件
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = parseInt(btn.dataset.size);
            slider.value = size;
            updatePreview(size);
            
            // 更新所有按鈕狀態
            presetButtons.forEach(b => {
                const bSize = parseInt(b.dataset.size);
                if (bSize === size) {
                    b.style.borderColor = '#ff69b4';
                    b.style.background = '#fff5f9';
                } else {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'white';
                }
            });
        });
    });
    
    // 重置按鈕
    resetBtn.addEventListener('click', () => {
        const defaultSize = 16;
        slider.value = defaultSize;
        updatePreview(defaultSize);
        
        presetButtons.forEach(btn => {
            const btnSize = parseInt(btn.dataset.size);
            if (btnSize === defaultSize) {
                btn.style.borderColor = '#ff69b4';
                btn.style.background = '#fff5f9';
            } else {
                btn.style.borderColor = '#e0e0e0';
                btn.style.background = 'white';
            }
        });
    });
    
    // 確認按鈕
    confirmBtn.addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const finalSize = parseInt(slider.value);
        applyFontSize(finalSize);
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
    
    // 關閉按鈕
    const closeModal = () => {
        // 恢復原來的字體大小
        applyFontSize(originalSize);
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    // 載入股票名稱映射表
    loadStockNames();

    // 到期提醒：定期定額（日期到了主動詢問是否執行）
    if (typeof checkAndExecuteDCAPlans === 'function') {
        checkAndExecuteDCAPlans();
    }
    
    // 應用保存的字體大小
    initFontSize();
    
    // 初始化 Header 標籤（支出/收入/轉帳）- 先初始化，確保 accountingType 正確設置
    initHeaderTabs();
    
    // 初始化標籤切換
    initTabSwitching();
    
    // 初始化分類網格（根據當前的 accountingType）
    const activeTabBtn = document.querySelector('.tab-btn.active');
    const tabType = activeTabBtn ? activeTabBtn.dataset.tab : 'recommended';
    initCategoryGrid(tabType, null); // 顯示所有分類
    
    // 初始化鍵盤
    initKeyboard();
    
    // 初始化日期按鈕
    initDateButton();
    
    // 初始化保存按鈕
    initSaveButton();
    
    // 初始化下月計入選項
    initNextMonthOption();
    
    // 初始化主題系統
    if (typeof getCurrentTheme === 'function' && typeof applyTheme === 'function') {
        const savedTheme = getCurrentTheme();
        applyTheme(savedTheme);
        console.log('✅ 主題系統已初始化，當前主題:', savedTheme);
    } else {
        console.warn('⚠️ 主題系統函數未找到');
    }
    
    // 防止所有輸入框focus時自動滾動（手機適配，防止數字鍵盤移位）
    setTimeout(() => {
        const allInputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea');
        allInputs.forEach(input => {
            // 防止focus時自動滾動導致視口移位
            input.addEventListener('focus', function(e) {
                setTimeout(() => {
                    if (this.scrollIntoView) {
                        this.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }
                }, 100);
            });
        });
    }, 500);
    
    // 初始化常用備註按鈕
    initQuickNotes();
    
    // 初始化常用項目一鍵記錄
    initQuickActions();
    
    // 初始化上一筆複製按鈕
    initCopyLastButton();
    
    // 初始化帳戶管理
    if (typeof initAccountManagement === 'function') {
        initAccountManagement();
    }
    
    // 頁面載入時自動設置默認帳戶（如果還沒有選中帳戶）
    const defaultAccount = getDefaultAccount();
    if (defaultAccount && !window.selectedAccount) {
        window.selectedAccount = defaultAccount;
        // 更新帳戶顯示
        if (typeof updateAccountDisplay === 'function') {
            updateAccountDisplay();
        }
        // 更新帳本標題
        if (typeof updateLedgerTitle === 'function') {
            updateLedgerTitle();
        }
    }
    
    // 初始化底部導航
    initBottomNav();

    // 初始化記帳日記詳情對話框
    initEntryDetailModal();

    initMonthSwitchers();

    // 每月20號提醒上傳（延遲避免干擾初始化流程）
    setTimeout(() => {
        if (typeof maybeRemindMonthlyUpload === 'function') {
            maybeRemindMonthlyUpload();
        }
    }, 1500);

    // 檢查小森每日開啟對話
    setTimeout(() => {
        const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        if (typeof checkDailyOpenDialog === 'function') {
            checkDailyOpenDialog(allRecords);
        }
        // 檢查月度對話
        if (typeof checkMonthlyDialogs === 'function') {
            checkMonthlyDialogs(allRecords);
        }
        // 檢查月結算評語（每月1號）
        if (typeof checkMonthlySummaryDialog === 'function') {
            checkMonthlySummaryDialog(allRecords);
        }
        // 檢查超支原因提示
        if (typeof checkOverspendReasonDialog === 'function') {
            checkOverspendReasonDialog();
        }
        // 檢查記帳中斷提醒
        if (typeof checkStreakBreakReminder === 'function') {
            checkStreakBreakReminder(allRecords);
        }
    }, 1000);
    
    // 定時檢查無記帳提醒（每小時檢查一次，21:00前）
    setInterval(() => {
        const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        if (typeof checkNoEntryTodayDialog === 'function') {
            checkNoEntryTodayDialog(allRecords);
        }
    }, 3600000); // 每小時檢查一次
    
    // 初始化所有返回鍵
    const chartBackBtn = document.getElementById('chartBackBtn');
    if (chartBackBtn) {
        chartBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    const budgetBackBtn = document.getElementById('budgetBackBtn');
    if (budgetBackBtn) {
        budgetBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }

    const monthlyPlannerBackBtn = document.getElementById('monthlyPlannerBackBtn');
    if (monthlyPlannerBackBtn) {
        monthlyPlannerBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    const settingsBackBtn = document.getElementById('settingsBackBtn');
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    const investmentBackBtn = document.getElementById('investmentBackBtn');
    // 投資專區返回按鈕已刪除，只保留買入按鈕

    const nextMonthBillsBackBtn = document.getElementById('nextMonthBillsBackBtn');
    if (nextMonthBillsBackBtn) {
        nextMonthBillsBackBtn.addEventListener('click', () => {
            closeNextMonthBillsPage();
        });
    }
    
    // 默認顯示記帳本頁面
    const pageLedger = document.getElementById('pageLedger');
    const headerSection = document.querySelector('.header-section');
    if (pageLedger) {
        pageLedger.style.display = 'block';
        if (headerSection) headerSection.style.display = 'none';
        initLedger();
    }
    
    // 檢查並執行到期的定期定額 / 分期規則（延遲執行，確保其他初始化完成）
    setTimeout(() => {
        checkAndExecuteDCAPlans();
        if (typeof checkAndGenerateInstallments === 'function') {
            checkAndGenerateInstallments();
        }
    }, 1000);

    // 分期規則頁面：事件綁定
    const installmentBackBtn = document.getElementById('installmentBackBtn');
    if (installmentBackBtn) {
        installmentBackBtn.addEventListener('click', () => {
            showSettingsPage();
        });
    }

    const installmentAddBtn = document.getElementById('installmentAddBtn');
    if (installmentAddBtn) {
        installmentAddBtn.addEventListener('click', () => {
            showInstallmentSetupPage(null);
        });
    }

    const installmentSetupBackBtn = document.getElementById('installmentSetupBackBtn');
    if (installmentSetupBackBtn) {
        installmentSetupBackBtn.addEventListener('click', () => {
            showInstallmentManagementPage();
        });
    }

    const installmentSaveBtn = document.getElementById('installmentSaveBtn');
    if (installmentSaveBtn) {
        installmentSaveBtn.addEventListener('click', () => {
            saveInstallmentRule();
        });
    }

    const installmentVoidBtn = document.getElementById('installmentVoidBtn');
    if (installmentVoidBtn) {
        installmentVoidBtn.addEventListener('click', () => {
            deleteInstallmentRule(window.editingInstallmentRuleId);
        });
    }

    const installmentReviseBtn = document.getElementById('installmentReviseBtn');
    if (installmentReviseBtn) {
        installmentReviseBtn.addEventListener('click', () => {
            reviseInstallmentRule(window.editingInstallmentRuleId);
        });
    }

    const installmentTotalAmountInput = document.getElementById('installmentTotalAmountInput');
    const installmentTotalPeriodsInput = document.getElementById('installmentTotalPeriodsInput');
    if (installmentTotalAmountInput) {
        installmentTotalAmountInput.addEventListener('input', updateInstallmentPerPeriodPreview);
    }
    if (installmentTotalPeriodsInput) {
        installmentTotalPeriodsInput.addEventListener('input', updateInstallmentPerPeriodPreview);
    }

    // 初始化記帳輸入頁面（當顯示時）
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        // 當頁面顯示時初始化分類
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isVisible = pageInput.style.display !== 'none';
                    if (isVisible) {
                        // 確保 Header 標籤狀態正確
                        initHeaderTabs();
                        // 根據當前的 accountingType 初始化分類網格
                        const activeTabBtn = document.querySelector('.tab-btn.active');
                        const tabType = activeTabBtn ? activeTabBtn.dataset.tab : 'recommended';
                        const recordType = window.accountingType || 'expense';
                        initCategoryGrid(tabType, recordType);
                    }
                }
            });
        });
        observer.observe(pageInput, { attributes: true, attributeFilter: ['style'] });
    }
    
    // 初始化搜索功能
    const searchBtn = document.getElementById('searchBtn');
    const searchCloseBtn = document.getElementById('searchCloseBtn');
    const searchContainer = document.getElementById('searchContainer');
    
    if (searchBtn && searchContainer) {
        searchBtn.addEventListener('click', () => {
            searchContainer.style.display = 'flex';
        });
    }
    
    if (searchCloseBtn && searchContainer) {
        searchCloseBtn.addEventListener('click', () => {
            searchContainer.style.display = 'none';
        });
    }
    
    // 初始化FAB按鈕
    const fabBtn = document.getElementById('fabBtn');
    const bottomNav = document.querySelector('.bottom-nav');
    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            const pageInput = document.getElementById('pageInput');
            const pageLedger = document.getElementById('pageLedger');
            const inputSection = document.getElementById('inputSection');
            
            if (pageInput) {
                pageInput.style.display = 'block';
                // 不顯示記帳輸入頁面的 header（因為所有分類一起顯示，不需要類型切換）
                const headerSection = document.querySelector('.header-section');
                if (headerSection) headerSection.style.display = 'none';
                // 初始化 Header 標籤（先初始化，確保 active 狀態正確）
                initHeaderTabs();
                // 初始化標籤切換
                initTabSwitching();
                // 初始化分類網格（顯示所有分類）
                const activeTabBtn = document.querySelector('.tab-btn.active');
                const tabType = activeTabBtn ? activeTabBtn.dataset.tab : 'recommended';
                console.log('打開記帳輸入頁面，tab:', tabType);
                initCategoryGrid(tabType, null); // 顯示所有分類
                // 初始化常用項目
                initQuickActions();
                // 隱藏底部導航欄
                if (bottomNav) bottomNav.style.display = 'none';
            }
            if (pageLedger) {
                pageLedger.style.display = 'none';
                // 隱藏記帳輸入頁面的 header
                const headerSection = document.querySelector('.header-section');
                if (headerSection) headerSection.style.display = 'none';
            }
            if (inputSection) {
                inputSection.style.display = 'block';
                // 確保默認為收起狀態
                if (!inputSection.classList.contains('collapsed')) {
                    inputSection.classList.add('collapsed');
                }
                // 更新收起按鈕圖標
                const collapseBtn = document.getElementById('collapseBtn');
                if (collapseBtn) {
                    const collapseIcon = collapseBtn.querySelector('.collapse-icon');
                    if (collapseIcon) {
                        collapseIcon.textContent = '▲';
                    }
                }
            }
        });
    }
    
    // 當關閉記帳輸入頁面時，返回記帳本
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    // 記帳輸入頁面返回鍵
    const inputPageBackBtn = document.getElementById('inputPageBackBtn');
    if (inputPageBackBtn) {
        inputPageBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    // 輸入區域返回鍵（當數字鍵盤彈出時）
    const inputSectionBackBtn = document.getElementById('inputSectionBackBtn');
    if (inputSectionBackBtn) {
        inputSectionBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    // 初始化分類管理返回按鈕
    const categoryManageBackBtn = document.getElementById('categoryManageBackBtn');
    if (categoryManageBackBtn) {
        categoryManageBackBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    // 初始化輸入區域收起按鈕
    const collapseBtn = document.getElementById('collapseBtn');
    const inputSection = document.getElementById('inputSection');
    if (collapseBtn && inputSection) {
        // 確保初始狀態為收起
        if (!inputSection.classList.contains('collapsed')) {
            inputSection.classList.add('collapsed');
        }
        
        // 更新圖標函數
        const updateCollapseIcon = () => {
            const collapseIcon = collapseBtn.querySelector('.collapse-icon');
            if (collapseIcon) {
                collapseIcon.textContent = inputSection.classList.contains('collapsed') ? '▲' : '▼';
            }
        };
        
        // 切換收起/展開
        const toggleCollapse = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            inputSection.classList.toggle('collapsed');
            updateCollapseIcon();
        };
        
        collapseBtn.addEventListener('click', toggleCollapse);
        
        // 支持觸摸事件（優化手機體驗）
        collapseBtn.addEventListener('touchend', toggleCollapse, { passive: false });
        
        // 點擊金額區域也可以展開（更直觀）
        const amountDisplay = inputSection.querySelector('.amount-display');
        if (amountDisplay) {
            amountDisplay.addEventListener('click', () => {
                if (inputSection.classList.contains('collapsed')) {
                    inputSection.classList.remove('collapsed');
                    updateCollapseIcon();
                }
            });
            amountDisplay.style.cursor = 'pointer';
        }
        
        // 點擊數字鍵盤時自動展開輸入區域（在 initKeyboard 中已處理，這裡不需要重複）
    }
    
    // 初始化帳戶按鈕
    const accountBtn = document.querySelector('.account-btn');
    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            showAccountSelectModal();
        });
    }
    
    // 初始化帳戶管理功能
    initAccountManagement();
    
    // 初始化表情按鈕
    const emojiBtn = document.querySelector('.emoji-btn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            showEmojiSelectModal();
        });
    }
    
    // 初始化表情選擇功能
    initEmojiSelector();
    
    // 初始化成員按鈕
    const memberBtn = document.getElementById('memberBtn');
    if (memberBtn) {
        memberBtn.addEventListener('click', () => {
            showMemberSelectModal();
        });
    }
    
    // 初始化載具按鈕
    const carrierBtn = document.getElementById('carrierBtn');
    const carrierRow = document.getElementById('carrierRow');
    if (carrierBtn && carrierRow) {
        carrierBtn.addEventListener('click', () => {
            if (carrierRow.style.display === 'none' || !carrierRow.style.display) {
                carrierRow.style.display = 'flex';
            } else {
                carrierRow.style.display = 'none';
            }
        });
    }
    
    // 初始化圖片按鈕
    const imageBtn = document.getElementById('imageBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const imageGallery = document.getElementById('imageGallery');
    const imageCount = document.getElementById('imageCount');
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    imageInput.multiple = true; // 允許選擇多個檔案
    document.body.appendChild(imageInput);
    
    // 更新圖片庫顯示
    function updateImageGallery() {
        if (!imageGallery || !imageCount) return;
        
        const images = window.selectedReceiptImages || [];
        imageCount.textContent = `已上傳 ${images.length} 張照片`;
        
        // 清空現有縮圖
        imageGallery.innerHTML = '';
        
        // 添加縮圖
        images.forEach((imageData, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'image-thumbnail';
            thumbnail.innerHTML = `
                <img src="${imageData}" alt="照片 ${index + 1}" class="thumbnail-img">
                <button class="thumbnail-remove" data-index="${index}">✕</button>
            `;
            
            // 點擊縮圖顯示大圖
            thumbnail.querySelector('.thumbnail-img').addEventListener('click', () => {
                showReceiptImageModal(imageData);
            });
            
            // 移除單張圖片
            thumbnail.querySelector('.thumbnail-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeImageAtIndex(index);
            });
            
            imageGallery.appendChild(thumbnail);
        });
        
        // 如果有圖片，顯示第一張作為主預覽
        if (images.length > 0 && previewImage) {
            previewImage.src = images[0];
            
            // 為主預覽圖片添加點擊放大功能
            previewImage.addEventListener('click', () => {
                showReceiptImageModal(images[0]);
            });
            previewImage.style.cursor = 'pointer';
        }
    }
    
    // 移除指定索引的圖片
    function removeImageAtIndex(index) {
        if (!window.selectedReceiptImages) return;
        
        window.selectedReceiptImages.splice(index, 1);
        updateImageGallery();
        
        // 如果沒有圖片了，隱藏預覽
        if (window.selectedReceiptImages.length === 0) {
            if (imagePreview) imagePreview.style.display = 'none';
            if (previewImage) previewImage.src = '';
        }
    }
    
    if (imageBtn) {
        imageBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    // 處理圖片選擇
    imageInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 初始化圖片陣列
            if (!window.selectedReceiptImages) {
                window.selectedReceiptImages = [];
            }
            
            // 檢查總圖片數量限制
            const totalImages = window.selectedReceiptImages.length + files.length;
            if (totalImages > 10) {
                alert(`最多只能上傳10張圖片！您已選擇 ${files.length} 張，加上現有的 ${window.selectedReceiptImages.length} 張，總共 ${totalImages} 張。`);
                imageInput.value = '';
                return;
            }
            
            // 計算預估總大小
            let estimatedTotalSize = 0;
            window.selectedReceiptImages.forEach(img => {
                estimatedTotalSize += img.length;
            });
            
            // 預估新圖片大小（假設壓縮後平均每張200KB）
            estimatedTotalSize += files.length * 200000;
            
            // 如果預估總大小太大，給出警告
            if (estimatedTotalSize > 2000000) { // 2MB
                if (!confirm(`預估總圖片大小較大（約${Math.round(estimatedTotalSize/1024/1024)}MB），可能影響儲存效能。\n\n建議減少照片數量或壓縮照片。\n\n是否繼續上傳？`)) {
                    imageInput.value = '';
                    return;
                }
            }
            
            // 處理每個檔案
            for (const file of files) {
                // 檢查文件大小（限制為 5MB）
                if (file.size > 5 * 1024 * 1024) {
                    alert(`圖片 ${file.name} 太大！請選擇小於 5MB 的圖片。`);
                    continue;
                }
                
                try {
                    const imageData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => resolve(event.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    
                    let processedImageData = imageData;
                    
                    // 壓縮圖片（使用 storage.js 中的壓縮函數）
                    if (typeof compressImage === 'function') {
                        try {
                            processedImageData = await compressImage(imageData, 800, 800, 0.7);
                            console.log('圖片已壓縮');
                        } catch (error) {
                            console.error('圖片壓縮失敗:', error);
                            // 如果壓縮失敗，使用原始圖片
                            processedImageData = imageData;
                        }
                    }
                    
                    // 添加到圖片陣列
                    window.selectedReceiptImages.push(processedImageData);
                    
                    // 檢查單張圖片大小
                    const imageSize = processedImageData.length;
                    console.log(`圖片 ${file.name} 處理後大小: ${imageSize} 字符`);
                    
                    // 如果單張圖片太大，給出警告
                    if (imageSize > 500000) { // 500KB
                        console.warn(`圖片 ${file.name} 較大: ${imageSize} 字符`);
                    }
                    
                } catch (error) {
                    console.error('處理圖片失敗:', error);
                    alert(`處理圖片 ${file.name} 時發生錯誤`);
                }
            }
            
            // 更新圖片庫顯示
            updateImageGallery();
            
            // 顯示圖片預覽區域
            if (imagePreview) {
                imagePreview.style.display = 'block';
            }
            
            console.log(`已上傳 ${window.selectedReceiptImages.length} 張圖片`);
        }
        
        // 清空檔案輸入
        imageInput.value = '';
    });
    
    // 移除圖片按鈕
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            if (previewImage) {
                previewImage.src = '';
            }
            if (imagePreview) {
                imagePreview.style.display = 'none';
            }
            imageInput.value = '';
            window.selectedReceiptImages = [];
            updateImageGallery();
            console.log('已清除所有圖片');
        });
    }
});

// ========== 記帳日記詳情功能 ==========

let currentEntryDetailRecord = null;

// 初始化記帳日記詳情對話框
function initEntryDetailModal() {
    const entryDetailModal = document.getElementById('entryDetailModal');
    const entryDetailBackBtn = document.getElementById('entryDetailBackBtn');
    const entryDetailClose = document.getElementById('entryDetailClose');
    
    // 關閉對話框
    function closeEntryDetailModal() {
        if (entryDetailModal) {
            entryDetailModal.style.display = 'none';
        }
    }
    
    if (entryDetailBackBtn) {
        entryDetailBackBtn.addEventListener('click', closeEntryDetailModal);
    }
    
    if (entryDetailClose) {
        entryDetailClose.addEventListener('click', closeEntryDetailModal);
    }
    
    // 點擊遮罩關閉
    const modalOverlay = entryDetailModal?.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeEntryDetailModal);
    }

    const editBtn = document.getElementById('entryDetailEditBtn');
    const editSection = document.getElementById('entryDetailEditSection');
    const typeSelect = document.getElementById('entryEditType');
    const saveBtn = document.getElementById('entryEditSaveBtn');
    const cancelBtn = document.getElementById('entryEditCancelBtn');

    if (editBtn && editSection) {
        editBtn.addEventListener('click', () => {
            if (!currentEntryDetailRecord) return;
            const isVisible = editSection.style.display === 'block';
            if (isVisible) {
                hideEntryEditSection();
            } else {
                populateEntryEditForm(currentEntryDetailRecord);
                editSection.style.display = 'block';
                editBtn.classList.add('is-active');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideEntryEditSection);
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            refreshEntryEditCategoryOptions(typeSelect.value, '');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', handleEntryEditSave);
    }
}

// 顯示記帳日記詳情
function showEntryDetail(record) {
    const entryDetailModal = document.getElementById('entryDetailModal');
    const entryDetailCategory = document.getElementById('entryDetailCategory');
    const entryDetailAmount = document.getElementById('entryDetailAmount');
    const entryDetailDate = document.getElementById('entryDetailDate');
    const entryDetailNote = document.getElementById('entryDetailNote');
    const entryDetailGallery = document.getElementById('entryDetailGallery');
    
    if (!entryDetailModal) return;
    
    currentEntryDetailRecord = record ? { ...record } : null;

    // 顯示前先重置編輯區塊
    hideEntryEditSection();
    const editBtn = document.getElementById('entryDetailEditBtn');
    if (editBtn) {
        if (record) {
            editBtn.style.display = 'inline-flex';
            editBtn.classList.remove('is-active');
        } else {
            editBtn.style.display = 'none';
        }
    }

    // 設置基本資訊
    if (entryDetailCategory) {
        entryDetailCategory.textContent = record.category || '未分類';
    }
    
    if (entryDetailAmount) {
        const isExpense = record.type === 'expense' || !record.type;
        const isTransfer = record.type === 'transfer';
        const amountClass = isExpense ? 'expense' : isTransfer ? 'transfer' : 'income';
        entryDetailAmount.className = `entry-detail-amount ${amountClass}`;
        entryDetailAmount.textContent = `${isTransfer ? '' : isExpense ? '-' : '+'}NT$${(record.amount || 0).toLocaleString('zh-TW')}`;
    }
    
    if (entryDetailDate) {
        const date = new Date(record.date);
        const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        entryDetailDate.textContent = dateStr;
    }
    
    if (entryDetailNote) {
        entryDetailNote.textContent = record.note || '';
        entryDetailNote.style.display = record.note ? 'block' : 'none';
    }
    
    // 設置圖片庫
    if (entryDetailGallery) {
        entryDetailGallery.innerHTML = '';
        
        let images = [];
        if (record.receiptImages && record.receiptImages.length > 0) {
            images = record.receiptImages;
        } else if (record.receiptImage) {
            images = [record.receiptImage];
        }
        
        if (images.length > 0) {
            images.forEach((imageData, index) => {
                const img = document.createElement('img');
                img.src = imageData;
                img.alt = `照片 ${index + 1}`;
                img.addEventListener('click', () => {
                    // 點擊圖片可以放大查看
                    showReceiptImageModal(imageData);
                });
                entryDetailGallery.appendChild(img);
            });
        } else {
            entryDetailGallery.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">沒有照片記錄</p>';
        }
    }
    
    // 顯示對話框
    entryDetailModal.style.display = 'flex';
}

function hideEntryEditSection() {
    const editSection = document.getElementById('entryDetailEditSection');
    const editBtn = document.getElementById('entryDetailEditBtn');
    if (editSection) {
        editSection.style.display = 'none';
    }
    if (editBtn) {
        editBtn.classList.remove('is-active');
    }
}

function populateEntryEditForm(record) {
    if (!record) return;
    const typeSelect = document.getElementById('entryEditType');
    const categorySelect = document.getElementById('entryEditCategory');
    const amountInput = document.getElementById('entryEditAmount');
    const dateInput = document.getElementById('entryEditDate');
    const accountSelect = document.getElementById('entryEditAccount');
    const memberSelect = document.getElementById('entryEditMember');
    const noteInput = document.getElementById('entryEditNote');

    const type = record.type || 'expense';
    if (typeSelect) {
        typeSelect.value = type;
    }
    refreshEntryEditCategoryOptions(type, record.category || '');

    if (amountInput) {
        amountInput.value = typeof record.amount === 'number' ? record.amount : (record.amount || 0);
    }

    if (dateInput) {
        dateInput.value = record.date ? record.date.substring(0, 10) : '';
    }

    fillEntryEditAccountOptions(record);
    fillEntryEditMemberOptions(record.member || '');

    if (noteInput) {
        noteInput.value = record.note || '';
    }
}

function refreshEntryEditCategoryOptions(type, selectedCategory) {
    const categorySelect = document.getElementById('entryEditCategory');
    if (!categorySelect) return;

    const categoriesSource = typeof getEnabledCategories === 'function'
        ? getEnabledCategories(type)
        : (Array.isArray(window.allCategories) ? window.allCategories.filter(cat => !type || cat.type === type) : []);

    categorySelect.innerHTML = categoriesSource.length
        ? '<option value="">請選擇分類</option>'
        : '<option value="">沒有可用的分類</option>';

    categoriesSource.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon || '📦'} ${cat.name}`;
        if (cat.name === selectedCategory) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });

    if (selectedCategory && !categoriesSource.some(cat => cat.name === selectedCategory) && categorySelect.firstChild) {
        categorySelect.firstChild.selected = true;
    }
}

function fillEntryEditAccountOptions(record) {
    const accountSelect = document.getElementById('entryEditAccount');
    if (!accountSelect) return;

    const accounts = typeof getAccounts === 'function' ? getAccounts() : [];
    const selectedAccountId = record.account || record.fromAccount || '';

    let optionsHtml = '<option value="">（無指定帳戶）</option>';
    accounts.forEach(account => {
        optionsHtml += `<option value="${account.id}">${account.name || account.id}</option>`;
    });
    accountSelect.innerHTML = optionsHtml;
    accountSelect.value = selectedAccountId || '';
}

function fillEntryEditMemberOptions(selectedName) {
    const memberSelect = document.getElementById('entryEditMember');
    if (!memberSelect) return;

    const members = typeof getMembers === 'function' ? getMembers() : [];
    let optionsHtml = '<option value="">（無成員）</option>';
    members.forEach(member => {
        optionsHtml += `<option value="${member.name}">${member.icon || '👤'} ${member.name}</option>`;
    });
    memberSelect.innerHTML = optionsHtml;
    memberSelect.value = selectedName || '';
}

function handleEntryEditSave() {
    if (!currentEntryDetailRecord) return;

    const typeSelect = document.getElementById('entryEditType');
    const categorySelect = document.getElementById('entryEditCategory');
    const amountInput = document.getElementById('entryEditAmount');
    const dateInput = document.getElementById('entryEditDate');
    const accountSelect = document.getElementById('entryEditAccount');
    const memberSelect = document.getElementById('entryEditMember');
    const noteInput = document.getElementById('entryEditNote');

    const type = typeSelect?.value || currentEntryDetailRecord.type || 'expense';
    const category = categorySelect?.value || '';
    const amountValue = parseFloat(amountInput?.value || '0');
    const date = dateInput?.value || currentEntryDetailRecord.date;
    const accountId = accountSelect?.value || '';
    const memberName = memberSelect?.value || '';
    const note = noteInput?.value.trim() || '';

    if (!category) {
        alert('請選擇分類');
        return;
    }

    if (!amountValue || amountValue <= 0) {
        alert('金額必須大於 0');
        return;
    }

    if (!date) {
        alert('請選擇日期');
        return;
    }

    let records = [];
    try {
        records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    } catch (error) {
        console.error('無法解析記帳記錄：', error);
        alert('讀取記帳記錄時發生錯誤');
        return;
    }

    let recordIndex = -1;
    if (currentEntryDetailRecord.timestamp) {
        recordIndex = records.findIndex(r => r?.timestamp === currentEntryDetailRecord.timestamp);
    }
    if (recordIndex === -1) {
        recordIndex = records.findIndex(r =>
            !currentEntryDetailRecord.timestamp &&
            !r.timestamp &&
            r.date === currentEntryDetailRecord.date &&
            (r.amount || 0) === (currentEntryDetailRecord.amount || 0) &&
            (r.category || '') === (currentEntryDetailRecord.category || '')
        );
    }

    if (recordIndex === -1) {
        alert('找不到原始紀錄，可能已被刪除');
        return;
    }

    const targetRecord = records[recordIndex] || {};
    const normalizedAmount = Math.round(amountValue * 100) / 100;

    const updatedRecord = {
        ...targetRecord,
        type,
        category,
        amount: normalizedAmount,
        date,
        note,
        member: memberName || ''
    };

    if (type === 'transfer') {
        updatedRecord.fromAccount = accountId || targetRecord.fromAccount || targetRecord.account || '';
        updatedRecord.account = updatedRecord.fromAccount;
    } else {
        updatedRecord.account = accountId || '';
        delete updatedRecord.fromAccount;
        delete updatedRecord.toAccount;
    }

    records[recordIndex] = updatedRecord;
    localStorage.setItem('accountingRecords', JSON.stringify(records));

    currentEntryDetailRecord = { ...updatedRecord };
    showEntryDetail(updatedRecord);
    if (typeof initLedger === 'function') {
        initLedger();
    } else if (typeof updateLedgerSummary === 'function') {
        updateLedgerSummary(records);
    }

    alert('紀錄已更新');
}

// 添加點擊事件監聽器到交易項目
function addTransactionClickHandlers() {
    const transactionItems = document.querySelectorAll('.transaction-item');
    
    transactionItems.forEach(item => {
        // 移除舊的事件監聽器
        item.removeEventListener('click', handleTransactionClick);
        // 添加新的事件監聽器
        item.addEventListener('click', handleTransactionClick);
    });
}

// 處理交易項目點擊
function handleTransactionClick(e) {
    // 如果點擊的是刪除按鈕，不觸發詳情對話框
    if (e.target.classList.contains('transaction-delete-btn')) {
        return;
    }
    
    // 如果點擊的是圖片，不觸發詳情對話框（圖片有自己的處理邏輯）
    if (e.target.classList.contains('receipt-thumbnail') || e.target.classList.contains('receipt-thumbnail-small')) {
        return;
    }
    
    // 獲取記錄資訊
    const item = e.currentTarget;
    const timestamp = item.querySelector('.transaction-delete-btn')?.dataset.recordTimestamp;
    const date = item.querySelector('.transaction-delete-btn')?.dataset.recordDate;
    const amount = parseInt(item.querySelector('.transaction-delete-btn')?.dataset.recordAmount || '0');
    const category = item.querySelector('.transaction-delete-btn')?.dataset.recordCategory || '';
    
    if (!date || !amount) return;
    
    // 從 localStorage 獲取完整記錄
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const record = records.find(r => 
        r.date === date && 
        r.amount === amount && 
        (r.category || '') === category &&
        (timestamp ? r.timestamp === timestamp : true)
    );
    
    if (record) {
        showEntryDetail(record);
    }
}

// ========== 新投資專區UI功能 ==========

// 初始化操作按鈕
function initInvestmentActions() {
    const buyBtn = document.getElementById('actionBuy');
    const sellBtn = document.getElementById('actionSell');
    const dividendBtn = document.getElementById('actionDividend');
    const dcaBtn = document.getElementById('actionDCA');
    
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            showInvestmentInputPage('buy');
        });
    }
    
    if (sellBtn) {
        sellBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            quickOpenSellPage();
        });
    }
    
    if (dividendBtn) {
        dividendBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            // 顯示股息輸入頁面
            const dividendInputPage = document.getElementById('dividendInputPage');
            const overview = document.getElementById('investmentOverview');
            const detailPage = document.getElementById('stockDetailPage');
            const inputPage = document.getElementById('investmentInputPage');
            const bottomNav = document.querySelector('.bottom-nav');
            const investmentActions = document.querySelector('.investment-actions');
            
            if (overview) overview.style.display = 'none';
            if (detailPage) detailPage.style.display = 'none';
            if (inputPage) inputPage.style.display = 'none';
            if (dividendInputPage) {
                dividendInputPage.style.display = 'block';
                // 隱藏底部導航欄
                if (bottomNav) bottomNav.style.display = 'none';
                // 隱藏操作按鈕
                if (investmentActions) investmentActions.style.display = 'none';
                // 初始化股息輸入頁面
                initDividendInput();
            }
        });
    }
    
    // 初始化拖動排序功能（只針對股息和定期定額按鈕）
    initButtonDragAndDrop();
    
    if (dcaBtn) {
        dcaBtn.addEventListener('click', () => {
            playClickSound(); // 播放點擊音效
            showDCAManagementPage();
        });
    }
}

// 初始化按鈕拖動排序功能
function initButtonDragAndDrop() {
    const investmentActions = document.querySelector('.investment-actions');
    if (!investmentActions) return;
    
    // 只允許股息和定期定額按鈕可以拖動
    const dividendBtn = document.getElementById('actionDividend');
    const dcaBtn = document.getElementById('actionDCA');
    
    [dividendBtn, dcaBtn].forEach(btn => {
        if (!btn) return;
        
        // 添加可拖動標記
        btn.classList.add('draggable');
        btn.draggable = true;
        
        // 拖動開始
        btn.addEventListener('dragstart', (e) => {
            btn.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', btn.outerHTML);
            e.dataTransfer.setData('text/plain', btn.id);
        });
        
        // 拖動結束
        btn.addEventListener('dragend', () => {
            btn.classList.remove('dragging');
            // 移除所有拖動相關的樣式
            document.querySelectorAll('.action-btn').forEach(b => {
                b.classList.remove('drag-over');
            });
        });
        
        // 拖動進入
        btn.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (!btn.classList.contains('dragging')) {
                btn.classList.add('drag-over');
            }
        });
        
        // 拖動離開
        btn.addEventListener('dragleave', () => {
            btn.classList.remove('drag-over');
        });
        
        // 拖動經過
        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        // 放置
        btn.addEventListener('drop', (e) => {
            e.preventDefault();
            btn.classList.remove('drag-over');
            
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedBtn = document.getElementById(draggedId);
            
            if (!draggedBtn || draggedBtn === btn) return;
            
            // 獲取所有按鈕
            const allButtons = Array.from(investmentActions.querySelectorAll('.action-btn'));
            const draggedIndex = allButtons.indexOf(draggedBtn);
            const targetIndex = allButtons.indexOf(btn);
            
            if (draggedIndex === -1 || targetIndex === -1) return;
            
            // 重新排列按鈕
            if (draggedIndex < targetIndex) {
                investmentActions.insertBefore(draggedBtn, btn.nextSibling);
            } else {
                investmentActions.insertBefore(draggedBtn, btn);
            }
            
            // 保存新的順序到 localStorage
            saveButtonOrder();
            
            // 播放音效
            playClickSound();
        });
    });
}

// 保存按鈕順序
function saveButtonOrder() {
    const investmentActions = document.querySelector('.investment-actions');
    if (!investmentActions) return;
    
    const buttons = Array.from(investmentActions.querySelectorAll('.action-btn'));
    const order = buttons.map(btn => btn.id);
    
    try {
        localStorage.setItem('investmentButtonOrder', JSON.stringify(order));
    } catch (error) {
        console.error('保存按鈕順序失敗:', error);
    }
}

// 載入按鈕順序
function loadButtonOrder() {
    const investmentActions = document.querySelector('.investment-actions');
    if (!investmentActions) return;
    
    try {
        const savedOrder = localStorage.getItem('investmentButtonOrder');
        if (!savedOrder) return;
        
        const order = JSON.parse(savedOrder);
        const buttons = Array.from(investmentActions.querySelectorAll('.action-btn'));
        
        // 按照保存的順序重新排列
        order.forEach(id => {
            const btn = document.getElementById(id);
            if (btn && investmentActions.contains(btn)) {
                investmentActions.appendChild(btn);
            }
        });
    } catch (error) {
        console.error('載入按鈕順序失敗:', error);
    }
}

// 更新投資總覽
function updateInvestmentOverview() {
    updateInvestmentSummary();
    updateStockList();
}

// 更新持股清單
function updateStockList() {
    const portfolio = getPortfolio();
    const stockList = document.getElementById('stockList');
    const stockCount = document.getElementById('stockCount');
    const searchInput = document.getElementById('stockSearchInput');
    const searchClearBtn = document.getElementById('stockSearchClearBtn');
    
    if (!stockList) return;
    
    // 獲取搜尋關鍵字
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    // 過濾持股列表
    let filteredPortfolio = portfolio;
    if (searchQuery) {
        filteredPortfolio = portfolio.filter(stock => {
            const stockCode = (stock.stockCode || '').toLowerCase();
            const stockName = (stock.stockName || '').toLowerCase();
            return stockCode.includes(searchQuery) || stockName.includes(searchQuery);
        });
    }
    
    // 更新持股數量（顯示過濾後的數量）
    if (stockCount) {
        if (searchQuery && filteredPortfolio.length !== portfolio.length) {
            stockCount.textContent = `${filteredPortfolio.length}/${portfolio.length} 檔`;
        } else {
        stockCount.textContent = `${portfolio.length} 檔`;
        }
    }
    
    // 顯示/隱藏清除按鈕
    if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
    }
    
    if (filteredPortfolio.length === 0) {
        if (searchQuery) {
            stockList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">找不到符合「${searchQuery}」的持股</div>
                    <div class="empty-hint">請嘗試其他關鍵字</div>
                </div>
            `;
        } else {
        stockList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-text">尚無持股</div>
                <div class="empty-hint">點擊下方「買入」按鈕開始投資</div>
            </div>
        `;
        }
        return;
    }
    
    let html = '';
    filteredPortfolio.forEach(stock => {
        // 計算未實現損益（使用保存的當前價格，如果沒有則使用平均成本）
        const currentPrice = getStockCurrentPrice(stock.stockCode) || stock.avgCost;
        const previousClose = getStockPreviousClosePrice(stock.stockCode);
        // 若昨收缺失，背景嘗試補抓，避免顯示 --
        if (!previousClose) {
            fetchPreviousCloseOnly(stock.stockCode).then((prev) => {
                if (prev) {
                    // 略微延遲刷新，避免頻繁重繪
                    setTimeout(() => {
                        try {
                            updateStockList();
                        } catch (_) {}
                    }, 120);
                }
            });
        }
        const marketValue = (currentPrice || 0) * (stock.shares || 0);
        const unrealizedPnl = marketValue - (stock.totalCost || 0);
        const isPositive = unrealizedPnl >= 0;

        const priceArrowDir = (previousClose && previousClose > 0 && currentPrice != null)
            ? (currentPrice > previousClose ? 'up' : (currentPrice < previousClose ? 'down' : ''))
            : '';

        const dailyChange = (previousClose && previousClose > 0 && currentPrice != null)
            ? (currentPrice - previousClose)
            : null;
        const dailyChangePct = (dailyChange != null && previousClose && previousClose > 0)
            ? (dailyChange / previousClose * 100)
            : null;
        const isDailyPositive = dailyChange != null ? dailyChange >= 0 : true;
        const displayPrice = (currentPrice != null && currentPrice !== 0 ? currentPrice : 0).toFixed(2);
        const displayPrevClose = (previousClose != null && previousClose > 0 ? previousClose : null);
        const displayAvg = (stock.avgCost != null && stock.avgCost !== 0 ? stock.avgCost : 0).toFixed(2);
        const displayPnl = Math.abs(unrealizedPnl).toLocaleString('zh-TW');

        const displayDailyChange = dailyChange != null ? Math.abs(dailyChange).toFixed(2) : '--';
        const displayDailyPct = dailyChangePct != null ? Math.abs(dailyChangePct).toFixed(2) : '--';
        const displayDailyText = dailyChange != null
            ? `${isDailyPositive ? '+' : '-'}${displayDailyChange} (${isDailyPositive ? '+' : '-'}${displayDailyPct}%)`
            : '--';

        const showDailyChange = dailyChange != null;
        
        html += `
            <div class="stock-item-card" data-stock-code="${stock.stockCode}">
                <div class="stock-grid-card-top">
                    <div class="stock-grid-card-title">
                        <div class="stock-card-name">${stock.stockName}</div>
                        <div class="stock-card-code">${stock.stockCode}</div>
                    </div>
                    <div class="stock-grid-card-price">
                        <div class="stock-grid-card-price-value">
                            <span class="stock-grid-card-price-number">${formatNumber(currentPrice || 0, 2)}</span>
                            <span class="stock-grid-card-price-unit">現價</span>
                            <span class="stock-grid-card-price-arrow ${priceArrowDir}">${priceArrowDir === 'up' ? '▲' : (priceArrowDir === 'down' ? '▼' : '')}</span>
                        </div>
                        <div class="stock-grid-card-price-sub">
                            <span class="stock-grid-card-price-prev-label">昨收</span>
                            <span class="stock-grid-card-price-prev">${displayPrevClose != null ? formatNumber(displayPrevClose, 2) : '--'}</span>
                        </div>
                    </div>
                </div>

                ${showDailyChange ? `
                <div class="stock-grid-card-change ${isDailyPositive ? 'positive' : 'negative'}">
                    <span class="stock-grid-card-change-arrow">${isDailyPositive ? '▲' : '▼'}</span>
                    <span class="stock-grid-card-change-value">${displayDailyText}</span>
                </div>
                ` : ''}
                <div class="stock-grid-card-tags">
                    <div class="stock-grid-card-tag stock-grid-card-tag--shares">${stock.shares} 股</div>
                </div>
            </div>
        `;
    });
    
    stockList.innerHTML = html;
    
    // 綁定點擊事件
    document.querySelectorAll('.stock-item-card').forEach(card => {
        card.addEventListener('click', () => {
            const stockCode = card.dataset.stockCode;
            showStockDetailPage(stockCode);
        });
    });
}

// 顯示個股詳情頁面
function showStockDetailPage(stockCode) {
    const portfolio = getPortfolio();
    const stock = portfolio.find(s => s.stockCode === stockCode);
    
    if (!stock) return;
    
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    if (overview) overview.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (investmentActions) investmentActions.style.display = 'none';
    
    if (detailPage) {
        detailPage.style.display = 'block';
        
        // 更新個股資訊
        document.getElementById('stockDetailName').textContent = stock.stockName;
        document.getElementById('stockDetailCode').textContent = stock.stockCode;
        
        // 更新查價連結
        const quoteLink = document.getElementById('metricQuoteLink');
        if (quoteLink) {
            const quoteSite = quoteLink.dataset.site || 'cnyes';
            let href = '#';
            if (quoteSite === 'cnyes') {
                href = `https://www.cnyes.com/twstock/${stock.stockCode}`;
            }
            quoteLink.href = href;

            // 有些情況會被外層事件攔截或阻止預設跳轉，因此這裡明確綁定開新分頁
            quoteLink.onclick = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (!href || href === '#') {
                    alert('請先選擇股票後再查價');
                    return;
                }
                window.open(href, '_blank', 'noopener');
            };
        }
        
        // 更新關鍵數據
        const stockShares = stock.shares || 0;
        const stockAvgCost = stock.avgCost != null && stock.avgCost !== 0 ? stock.avgCost : 0;
        document.getElementById('metricShares').textContent = `${stockShares.toLocaleString('zh-TW')} 股`;
        document.getElementById('metricAvgCost').textContent = `NT$${stockAvgCost.toFixed(2)}`;

        const measureInputTextWidthPx = (inputEl, text) => {
            try {
                const style = window.getComputedStyle(inputEl);
                const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                const canvas = measureInputTextWidthPx._canvas || (measureInputTextWidthPx._canvas = document.createElement('canvas'));
                const ctx = canvas.getContext('2d');
                if (!ctx) return null;
                ctx.font = font;
                const metrics = ctx.measureText(text);
                return metrics?.width ?? null;
            } catch (_) {
                return null;
            }
        };

        const applyAutoWidth = (el) => {
            if (!el) return;

            const isMobile = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
            if (isMobile) {
                el.style.width = '100%';
                return;
            }

            const value = (el.value ?? '').toString();
            const wrapper = el.closest('.metric-price-wrapper');
            const quoteBtn = document.getElementById('metricQuoteLink');

            const textWidth = measureInputTextWidthPx(el, value || '0');
            // 讓 input 內部留一些左右 padding 的空間（略大一點避免跳動）
            const desired = (textWidth != null ? Math.ceil(textWidth) : 80) + 36;
            const minW = 120;

            let maxW = wrapper ? wrapper.clientWidth : 360;
            if (wrapper && quoteBtn) {
                const gap = 12;
                maxW = Math.max(120, wrapper.clientWidth - quoteBtn.offsetWidth - gap);
            }

            const finalW = Math.max(minW, Math.min(desired, maxW));
            el.style.width = `${finalW}px`;
        };

        let currentPriceInput = document.getElementById('metricCurrentPrice');
        if (currentPriceInput) {

            // 優先使用保存的當前價格，如果沒有則使用平均成本
            const savedPrice = getStockCurrentPrice(stockCode);
            const defaultPrice = savedPrice || stockAvgCost;
            currentPriceInput.value = (defaultPrice != null ? defaultPrice : 0).toFixed(2);

            applyAutoWidth(currentPriceInput);
            
            // 自動獲取現價（如果今天沒有手動輸入的價格）
            if (!hasManualPriceToday(stockCode)) {
            fetchStockPrice(stockCode).then(price => {
                if (price && currentPriceInput) {
                    currentPriceInput.value = price.toFixed(2);
                    applyAutoWidth(currentPriceInput);
                    // 觸發 input 事件以更新未實現損益
                    currentPriceInput.dispatchEvent(new Event('input'));
                } else if (stockCode.endsWith('B')) {
                    // 債券 ETF 無法自動獲取價格時，顯示提示
                    console.info(`💡 債券 ETF ${stockCode} 無法自動獲取價格，請手動輸入`);
                }
            }).catch(err => {
                console.log('自動獲取現價失敗，使用已保存的價格');
                if (stockCode.endsWith('B')) {
                    console.info(`💡 債券 ETF ${stockCode} 無法自動獲取價格，請在輸入框中手動輸入當前價格`);
                }
            });
            } else {
                // 今天已有手動輸入的價格，不自動更新
                console.log(`📝 ${stockCode} 今天已有手動輸入的價格，不自動更新`);
            }
        }
        
        // 初始化返回按鈕
        const backBtn = document.getElementById('stockDetailBackBtn');
        if (backBtn) {
            backBtn.onclick = () => {
                // 返回投資專區概覽頁面
                if (overview) overview.style.display = 'block';
                if (detailPage) detailPage.style.display = 'none';
                if (bottomNav) bottomNav.style.display = 'flex';
                if (investmentActions) investmentActions.style.display = 'flex';
                // 更新投資概覽
                updateInvestmentOverview();
            };
        }
        
        // 計算未實現損益
        if (currentPriceInput) {
            // 移除舊的事件監聽器（如果有的話）
            const newInput = currentPriceInput.cloneNode(true);
            currentPriceInput.parentNode.replaceChild(newInput, currentPriceInput);
            currentPriceInput = newInput;
            
            newInput.addEventListener('input', () => {
                if (typeof applyAutoWidth === 'function') {
                    applyAutoWidth(newInput);
                } else if (typeof window !== 'undefined' && typeof window.applyAutoWidth === 'function') {
                    window.applyAutoWidth(newInput);
                }
                const currentPrice = parseFloat(newInput.value) || stockAvgCost;
                const unrealizedPnl = (currentPrice - stockAvgCost) * stockShares;
                const pnlEl = document.getElementById('metricUnrealizedPnl');
                if (pnlEl) {
                    pnlEl.textContent = `${unrealizedPnl >= 0 ? '+' : ''}NT$${Math.abs(unrealizedPnl).toLocaleString('zh-TW')}`;
                    pnlEl.className = `metric-value-large pnl ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`;
                }
                
                // 保存當前價格到 localStorage（標記為手動輸入）
                if (currentPrice && currentPrice > 0) {
                    saveStockCurrentPrice(stockCode, currentPrice, true); // true = 手動輸入
                    // 更新投資總覽
                    updateInvestmentSummary();
                }
            });
        }
        
        // 初始計算未實現損益
        const savedPrice = getStockCurrentPrice(stockCode);
        const currentPrice = parseFloat(currentPriceInput?.value) || savedPrice || stockAvgCost;
        const unrealizedPnl = (currentPrice - stockAvgCost) * stockShares;
        const pnlEl = document.getElementById('metricUnrealizedPnl');
        if (pnlEl) {
            pnlEl.textContent = `${unrealizedPnl >= 0 ? '+' : ''}NT$${Math.abs(unrealizedPnl).toLocaleString('zh-TW')}`;
            pnlEl.className = `metric-value-large pnl ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`;
        }
        
        // 更新記錄列表
        updateStockRecords(stockCode);
        
        // 初始化分頁切換
        initRecordTabs();
    }
}

// 初始化記錄分頁切換
function initRecordTabs() {
    document.querySelectorAll('.record-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.record-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabType = tab.dataset.tab;
            document.querySelectorAll('.record-list').forEach(list => {
                list.style.display = list.dataset.tab === tabType ? 'block' : 'none';
            });
        });
    });
}

// 更新個股記錄列表
function updateStockRecords(stockCode) {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const stockRecords = records.filter(r => r.stockCode === stockCode);
    
    // 買入記錄（按時間排序，越晚買的越前面）
    const buyRecords = stockRecords.filter(r => r.type === 'buy').sort((a, b) => {
        // 按時間戳降序排列（最新的在前）
        const timeA = new Date(a.timestamp || a.date || 0).getTime();
        const timeB = new Date(b.timestamp || b.date || 0).getTime();
        return timeB - timeA; // 降序：越晚的越前面
    });
    const buyList = document.getElementById('buyRecordList');
    if (buyList) {
        if (buyRecords.length === 0) {
            buyList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📈</div>
                    <div style="color: #999; margin-bottom: 8px; font-size: 16px;">尚無買入記錄</div>
                    <div style="font-size: 12px; color: #ccc; margin-bottom: 24px;">點擊下方按鈕開始記錄買入交易</div>
                    <button class="empty-state-btn" onclick="showInvestmentInputPage('buy')" style="
                        background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 24px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(76, 175, 80, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.3)';">
                        ➕ 新增買入記錄
                    </button>
                </div>
            `;
        } else {
            buyList.innerHTML = buyRecords.map(r => createRecordCard(r)).join('');
        }

        bindRecordOverflowMenu(buyList);

        // 綁定買入標籤點擊事件：點「買入」直接帶上一筆資料到買入頁
        buyList.querySelectorAll('.record-card-type.buy').forEach(badge => {
            const newBadge = badge.cloneNode(true);
            badge.parentNode.replaceChild(newBadge, badge);
            newBadge.style.cursor = 'pointer';
            newBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                playClickSound();

                const stockCode = newBadge.dataset.stockCode || '';
                const stockName = newBadge.dataset.stockName || '';
                const price = parseFloat(newBadge.dataset.price || '0') || 0;
                const shares = parseInt(newBadge.dataset.shares || '0', 10) || 0;
                const fee = parseFloat(newBadge.dataset.fee || '0') || 0;
                const isDCA = (newBadge.dataset.isdca || '') === '1';

                showInvestmentInputPage('buy');
                setTimeout(() => {
                    const codeInput = document.getElementById('calcStockCodeInput');
                    const nameInput = document.getElementById('calcStockNameInput');
                    const priceInput = document.getElementById('calcPriceInput');
                    const sharesInput = document.getElementById('calcSharesInput');
                    const feeInput = document.getElementById('calcFeeInput');
                    const autoFeeCheckbox = document.getElementById('calcAutoFeeCheckbox');
                    const isDCAInput = document.getElementById('calcIsDCAInput');

                    if (codeInput) {
                        codeInput.value = stockCode;
                        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (nameInput) {
                        nameInput.value = stockName;
                        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    if (priceInput) {
                        priceInput.value = price > 0 ? String(price) : '';
                        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (sharesInput) {
                        sharesInput.value = shares > 0 ? String(shares) : '0';
                        sharesInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (autoFeeCheckbox) {
                        autoFeeCheckbox.checked = false;
                        autoFeeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (feeInput) {
                        feeInput.disabled = false;
                        feeInput.style.opacity = '1';
                        feeInput.value = String(fee || 0);
                        feeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (isDCAInput) {
                        isDCAInput.checked = isDCA;
                        isDCAInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    if (typeof updateInvestmentDisplay === 'function') {
                        updateInvestmentDisplay();
                    }
                }, 120);
            });
        });
    }
    
    // 賣出記錄
    const sellRecords = stockRecords.filter(r => r.type === 'sell');
    const sellList = document.getElementById('sellRecordList');
    if (sellList) {
        if (sellRecords.length === 0) {
            sellList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📉</div>
                    <div style="color: #999; margin-bottom: 8px; font-size: 16px;">尚無賣出記錄</div>
                    <div style="font-size: 12px; color: #ccc; margin-bottom: 24px;">點擊下方按鈕開始記錄賣出交易</div>
                    <button class="empty-state-btn" onclick="quickOpenSellPage()" style="
                        background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 24px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 107, 157, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 107, 157, 0.3)';">
                        ➕ 新增賣出記錄
                    </button>
                </div>
            `;
        } else {
            sellList.innerHTML = sellRecords.map(r => createRecordCard(r)).join('');
        }

        bindRecordOverflowMenu(sellList);
    }
    
    // 股息記錄（排序：最新在前）
    const dividendRecords = stockRecords
        .filter(r => r.type === 'dividend')
        .sort((a, b) => {
            const timeA = new Date(a.timestamp || a.date || 0).getTime();
            const timeB = new Date(b.timestamp || b.date || 0).getTime();
            return timeB - timeA;
        });
    const dividendList = document.getElementById('dividendRecordList');
    if (dividendList) {
        // 先取舊值以便重新渲染後保留使用者輸入
        const currentYearValue = (dividendList.querySelector('#dividendYearFilter') || {}).value || '';
        const yearTrimmed = currentYearValue.trim();
        const hasYearFilter = yearTrimmed.length > 0;
        const isYearValid = /^\d{4}$/.test(yearTrimmed);
        const yearKey = hasYearFilter && isYearValid ? yearTrimmed : null;
        const filteredDividend = hasYearFilter
            ? (isYearValid
                ? dividendRecords.filter(r => {
                    const exYear = String(r.exDividendDate || '').slice(0, 4);
                    return exYear === yearKey;
                })
                : [])
            : dividendRecords;

        const yearEscaped = (currentYearValue || '').replace(/"/g, '&quot;');

        let html = `
            <div class="record-search">
                <input type="text" id="dividendYearFilter" class="record-search-input" placeholder="除息年份（全部）" value="${yearEscaped}" aria-label="依除息年份篩選，例如 2024">
            </div>
            <div class="dividend-add-btn-container">
                <button class="dividend-quick-add-btn" data-stock-code="${stockCode}">
                    <span class="dividend-quick-add-icon">➕</span>
                    <span class="dividend-quick-add-text">新增股息</span>
                </button>
            </div>
        `;
        
        if (filteredDividend.length === 0) {
            html += `
                <div class="dividend-empty-state">
                    <div class="dividend-empty-icon">
                        <img src="./image/1.png" alt="股息" style="width: 83px; height: 83px; opacity: 0.5; object-fit: contain;">
                    </div>
                    <div class="dividend-empty-text">${hasYearFilter ? '該年份沒有除息日記錄' : '尚無股息記錄'}</div>
                    <div class="dividend-empty-hint">${hasYearFilter ? '請確認除息年份或清空篩選' : '點擊上方按鈕開始記錄股息'}</div>
                </div>
            `;
        } else {
            html += filteredDividend.map(r => createRecordCard(r)).join('');
        }
        
        dividendList.innerHTML = html;
        
        // 重新綁定新的輸入欄位
        const newYearInput = dividendList.querySelector('#dividendYearFilter');
        if (newYearInput && !newYearInput.dataset.bound) {
            const handleYearFilter = () => {
                const val = (newYearInput.value || '').trim();
                if (val === '' || /^\d{4}$/.test(val)) {
                    updateStockRecords(stockCode);
                }
            };
            newYearInput.addEventListener('change', handleYearFilter);
            newYearInput.addEventListener('input', handleYearFilter);
            newYearInput.dataset.bound = '1';
        }
        
        // 綁定快捷按鈕事件
        const quickAddBtn = dividendList.querySelector('.dividend-quick-add-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                const stockCode = quickAddBtn.dataset.stockCode;
                const stockName = findStockName(stockCode) || stockCode;
                // 打開股息輸入頁面，預填股票代碼
                quickAddDividend(stockCode, stockName, 0, 0, 'cash');
            });
        }

        if (dividendRecords.length > 0) {
            bindRecordOverflowMenu(dividendList);

            // 綁定新增股息按鈕事件（卡片上的）
            dividendList.querySelectorAll('.record-add-dividend-fab').forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const stockCode = newBtn.dataset.stockCode;
                    const stockName = newBtn.dataset.stockName;
                    const perShare = parseFloat(newBtn.dataset.perShare) || 0;
                    const shares = parseInt(newBtn.dataset.shares) || 0;
                    const dividendType = newBtn.dataset.dividendType || 'cash';
                    quickAddDividend(stockCode, stockName, perShare, shares, dividendType);
                });
            });
        }
    }
}

// 創建記錄卡片
function createRecordCard(record) {
    const recordId = record.timestamp || record.id || Date.now().toString();
    if (record.type === 'buy') {
        const price = record.price != null ? record.price : 0;
        const shares = record.shares || 0;
        const totalAmount = Math.ceil(price * shares + (record.fee || 0));
        const isDividendReinvest = record.isDividendReinvest === true;
        const isDCA = record.isDCA === true;
        return `
            <div class="record-card ${isDividendReinvest ? 'dividend-reinvest' : ''} ${isDCA ? 'dca-invest' : ''}" data-record-id="${recordId}">
                <div class="record-card-header">
                    <div class="record-card-headline">
                        <span class="record-card-type buy ${isDividendReinvest ? 'dividend-reinvest-badge' : ''} ${isDCA ? 'dca-badge' : ''}" data-stock-code="${record.stockCode || ''}" data-stock-name="${record.stockName || ''}" data-price="${price}" data-shares="${shares}" data-fee="${record.fee || 0}" data-isdca="${isDCA ? '1' : '0'}" title="再買一次">${isDividendReinvest ? '💰 股利購買' : isDCA ? '📅 定期定額' : '📈 買入'}</span>
                        <span class="record-card-date">${record.date}</span>
                    </div>
                    ${renderRecordActionButtons(recordId)}
                </div>
                <div class="record-card-details">
                    <div>價格：NT$${price.toFixed(2)}</div>
                    <div>股數：${record.shares || 0} 股</div>
                    <div>手續費：NT$${(record.fee || 0).toLocaleString('zh-TW')}</div>
                    ${isDCA ? '<div class="dca-label">📅 定期定額</div>' : ''}
                    ${isDividendReinvest ? '<div class="dividend-reinvest-label">💎 股利再投入</div>' : ''}
                </div>
                <div class="record-card-amount">投入金額：NT$${(totalAmount != null ? totalAmount : 0).toLocaleString('zh-TW')}</div>
            </div>
        `;
    } else if (record.type === 'sell') {
        const price = record.price != null ? record.price : 0;
        const shares = record.shares || 0;
        const totalAmount = price * shares - (record.fee || 0) - (record.tax || 0);
        return `
            <div class="record-card" data-record-id="${recordId}">
                <div class="record-card-header">
                    <div class="record-card-headline">
                        <span class="record-card-type sell">🔻 賣出</span>
                        <span class="record-card-date">${record.date}</span>
                    </div>
                    ${renderRecordActionButtons(recordId)}
                </div>
                <div class="record-card-details">
                    <div>價格：NT$${price.toFixed(2)}</div>
                    <div>股數：${shares} 股</div>
                    <div>手續費：NT$${(record.fee || 0).toLocaleString('zh-TW')}</div>
                    <div>證交稅：NT$${(record.tax || 0).toLocaleString('zh-TW')}</div>
                </div>
                <div class="record-card-amount">實收金額：NT$${(totalAmount != null ? totalAmount : 0).toLocaleString('zh-TW')}</div>
                <div class="record-card-amount ${(record.realizedPnl || 0) >= 0 ? 'positive' : 'negative'}">
                    實現損益：${(record.realizedPnl || 0) >= 0 ? '+' : ''}NT$${(record.realizedPnl != null ? record.realizedPnl : 0).toLocaleString('zh-TW')}
                </div>
            </div>
        `;
    } else if (record.type === 'dividend') {
        const exMonth = record.exDividendDate ? record.exDividendDate.slice(0, 7) : '';
        const payMonth = record.date ? String(record.date).slice(0, 7) : '';
        return `
            <div class="record-card" data-record-id="${recordId}">
                <div class="record-card-header">
                    <div class="record-card-headline">
                        <span class="record-card-type dividend">${record.dividendType === 'cash' ? '💰 現金股利' : '🪙 股票股利'}</span>
                        <span class="record-card-date">${record.date}</span>
                    </div>
                    ${renderRecordActionButtons(recordId)}
                </div>
                <div class="record-card-details">
                    <div>每股：NT$${(record.perShare != null ? record.perShare : 0).toFixed(2)}</div>
                    <div>股數：${record.shares || 0} 股</div>
                    ${record.exDividendDate ? `<div>除息日：${record.exDividendDate}</div>` : ''}
                    ${record.date ? `<div>領息日：${record.date}</div>` : ''}
                    ${record.historicalPerShare ? `<div>過去每股：NT$${Number(record.historicalPerShare).toFixed(2)}</div>` : ''}
                    ${record.reinvest ? '<div>再投入 ✓</div>' : ''}
                </div>
                <div class="record-card-amount">實收金額：NT$${(record.amount != null ? record.amount : 0).toLocaleString('zh-TW')}</div>
            </div>
        `;
    }
    return '';
}

// 刪除投資記錄
function deleteInvestmentRecord(recordId) {
    let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    
    // 嘗試多種方式匹配記錄ID
    const recordIdStr = String(recordId);
    let recordIndex = -1;
    
    // 先嘗試精確匹配
    recordIndex = records.findIndex(r => {
        const rTimestamp = r.timestamp ? String(r.timestamp) : null;
        const rId = r.id ? String(r.id) : null;
        return (rTimestamp === recordIdStr) || (rId === recordIdStr);
    });
    
    if (recordIndex === -1) {
        // 如果還是找不到，嘗試更寬鬆的匹配
        recordIndex = records.findIndex(r => {
            const rTimestamp = r.timestamp ? String(r.timestamp) : '';
            const rId = r.id ? String(r.id) : '';
            return rTimestamp.includes(recordIdStr) || rId.includes(recordIdStr);
        });
    }
    
    if (recordIndex === -1) {
        alert('找不到該記錄，請重新整理頁面後再試。');
        return;
    }
    
    const record = records[recordIndex];
    
    // 確認刪除
    const recordType = record.type === 'dividend' 
        ? (record.dividendType === 'cash' ? '現金股利' : '股票股利')
        : record.type === 'buy' ? '買入' : '賣出';
    
    if (!confirm(`確定要刪除此筆${recordType}記錄嗎？\n\n股票代碼：${record.stockCode}\n日期：${record.date}\n\n此操作無法復原。`)) {
        return;
    }
    
    // 保存股票代碼（用於後續更新）
    const stockCode = record.stockCode;
    
    // 如果刪除的是股利記錄，同時刪除關聯的買入記錄（股利再投入）
    let deletedBuyRecords = [];
    if (record.type === 'dividend') {
        const dividendTimestamp = record.timestamp || record.id;
        if (dividendTimestamp) {
            // 找到所有關聯的買入記錄（通過 dividendRecordId）
            // 使用字符串比較確保匹配
            const dividendTimestampStr = String(dividendTimestamp);
            deletedBuyRecords = records.filter(r => {
                if (r.type === 'buy' && r.isDividendReinvest === true && r.dividendRecordId) {
                    const rDividendId = String(r.dividendRecordId);
                    return rDividendId === dividendTimestampStr;
                }
                return false;
            });
            
            // 從記錄中移除這些買入記錄
            if (deletedBuyRecords.length > 0) {
                const deletedIds = deletedBuyRecords.map(r => {
                    const id = r.timestamp || r.id;
                    return id ? String(id) : null;
                }).filter(id => id !== null);
                
                // 重新計算 recordIndex（因為過濾後索引可能改變）
                records = records.filter(r => {
                    const rId = r.timestamp || r.id;
                    const rIdStr = rId ? String(rId) : null;
                    return !rIdStr || !deletedIds.includes(rIdStr);
                });
                
                // 重新查找股利記錄的索引（因為過濾後索引可能改變）
                recordIndex = records.findIndex(r => {
                    const rTimestamp = r.timestamp ? String(r.timestamp) : null;
                    const rId = r.id ? String(r.id) : null;
                    return (rTimestamp === recordIdStr) || (rId === recordIdStr);
                });
                
                console.log(`找到 ${deletedBuyRecords.length} 筆關聯的股利再投入買入記錄，準備刪除`);
            }
        }
    }
    
    // 從陣列中刪除記錄（先刪除關聯的買入記錄，再刪除股利記錄本身）
    if (recordIndex !== -1) {
    records.splice(recordIndex, 1);
    }
    
    // 如果刪除的是定期定額記錄，減少該計劃的執行次數
    if (record.isDCA && record.dcaPlanId) {
        try {
            const dcaPlans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
            const planIndex = dcaPlans.findIndex(p => p.id === record.dcaPlanId);
            if (planIndex !== -1) {
                const plan = dcaPlans[planIndex];
                const currentCount = parseInt(plan.executedCount, 10) || 0;
                if (currentCount > 0) {
                    dcaPlans[planIndex].executedCount = currentCount - 1;
                    localStorage.setItem('dcaPlans', JSON.stringify(dcaPlans));
                    console.log(`定期定額計劃 ${plan.stockCode} 執行次數已減少為 ${currentCount - 1}`);
                    
                    // 更新定期定額列表顯示
                    if (typeof updateDCAList === 'function') {
                        updateDCAList();
                    }
                }
            }
        } catch (e) {
            console.warn('更新定期定額執行次數失敗:', e);
        }
    }
    
    // 保存到 localStorage
    try {
        // 先確保投資記錄一定能成功刪除與保存
        localStorage.setItem('investmentRecords', JSON.stringify(records));
        console.log('記錄已刪除，ID:', recordIdStr);

        // 再嘗試刪除記帳本中關聯的「轉帳」紀錄（買入才會建立 linkedInvestment 轉帳）
        try {
            const deletedInvestmentIds = [];
            const mainDeletedId = record.timestamp || record.id;
            if (mainDeletedId) deletedInvestmentIds.push(String(mainDeletedId));
            if (deletedBuyRecords.length > 0) {
                deletedBuyRecords.forEach(r => {
                    const id = r.timestamp || r.id;
                    if (id) deletedInvestmentIds.push(String(id));
                });
            }

            if (deletedInvestmentIds.length > 0) {
                let accountingRecords;
                try {
                    accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                    if (!Array.isArray(accountingRecords)) accountingRecords = [];
                } catch (e) {
                    accountingRecords = [];
                }

                const beforeLen = accountingRecords.length;
                accountingRecords = accountingRecords.filter(ar => {
                    if (!ar) return false;
                    if (ar.type !== 'transfer') return true;
                    if (ar.linkedInvestment !== true) return true;
                    const invId = ar.investmentRecordId != null ? String(ar.investmentRecordId) : '';
                    return !deletedInvestmentIds.includes(invId);
                });
                if (accountingRecords.length !== beforeLen) {
                    localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                }

                // 若記帳本頁面有開著，刷新顯示（避免刷新報錯導致整個刪除失敗）
                try {
                    if (typeof updateLedgerSummary === 'function') {
                        updateLedgerSummary(accountingRecords);
                    }
                    if (typeof displayLedgerTransactions === 'function') {
                        displayLedgerTransactions(accountingRecords);
                    }
                } catch (e) {
                    console.warn('刷新記帳本顯示失敗（不影響刪除）:', e);
                }
            }
        } catch (e) {
            console.warn('連動刪除轉帳失敗（不影響刪除）:', e);
        }
        
        // 如果有刪除關聯的買入記錄，顯示提示
        if (deletedBuyRecords.length > 0) {
            console.log(`同時刪除了 ${deletedBuyRecords.length} 筆關聯的股利再投入買入記錄`);
        }
        
        // 更新所有相關顯示
        updateInvestmentSummary();
        updatePortfolioList();
        updateInvestmentRecords();
        updateStockRecords(stockCode);
        
        // 檢查是否正在查看股票詳情頁面，如果是則重新顯示
        const stockDetailPage = document.getElementById('stockDetailPage');
        if (stockDetailPage && stockDetailPage.style.display !== 'none') {
            showStockDetailPage(stockCode);
        }
        
        // 顯示刪除成功的提示
        if (deletedBuyRecords.length > 0) {
            alert(`記錄已刪除！\n\n同時刪除了 ${deletedBuyRecords.length} 筆關聯的股利再投入買入記錄。`);
        } else {
        alert('記錄已刪除！');
        }
    } catch (error) {
        console.error('刪除記錄失敗:', error);
        alert('刪除記錄時發生錯誤，請重試。');
    }
}

// 編輯投資記錄
function editInvestmentRecord(recordId) {
    console.log('編輯記錄，ID:', recordId, '類型:', typeof recordId);
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    console.log('所有記錄數量:', records.length);
    
    // 嘗試多種方式匹配記錄ID（統一轉換為字符串比較）
    const recordIdStr = String(recordId);
    let record = null;
    
    // 先嘗試精確匹配
    record = records.find(r => {
        const rTimestamp = r.timestamp ? String(r.timestamp) : null;
        const rId = r.id ? String(r.id) : null;
        return (rTimestamp === recordIdStr) || (rId === recordIdStr);
    });
    
    // 如果還是找不到，嘗試更寬鬆的匹配
    if (!record) {
        record = records.find(r => {
            const rTimestamp = r.timestamp ? String(r.timestamp) : '';
            const rId = r.id ? String(r.id) : '';
            return rTimestamp.includes(recordIdStr) || rId.includes(recordIdStr);
        });
    }
    
    console.log('找到的記錄:', record);
    
    if (!record) {
        console.error('找不到記錄，嘗試的ID:', recordIdStr);
        console.error('記錄列表中的ID範例:', records.slice(0, 3).map(r => ({
            timestamp: r.timestamp,
            id: r.id,
            type: r.type
        })));
        alert('找不到該記錄，請重新整理頁面後再試。\n記錄ID: ' + recordIdStr);
        return;
    }
    
    // 根據記錄類型顯示對應的編輯表單
    if (record.type === 'buy') {
        showEditBuyRecordModal(record);
    } else if (record.type === 'sell') {
        showEditSellRecordModal(record);
    } else if (record.type === 'dividend') {
        showEditDividendRecordModal(record);
    } else {
        alert('未知的記錄類型: ' + record.type);
    }
}

// 顯示編輯買入記錄模態框
function showEditBuyRecordModal(record) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div class="modal-content-standard" style="max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0;">編輯買入記錄</h2>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">✕</button>
            </div>
            <div class="form-field">
                <label class="form-label">股票代碼</label>
                <input type="text" id="editBuyStockCode" class="form-input" value="${record.stockCode || ''}" placeholder="例如: 2330">
            </div>
            <div class="form-field">
                <label class="form-label">買入日期</label>
                <input type="date" id="editBuyDate" class="form-input" value="${record.date || ''}">
            </div>
            <div class="form-field">
                <label class="form-label">買入價格</label>
                <input type="number" id="editBuyPrice" class="form-input" value="${record.price != null && record.price !== '' ? String(record.price) : ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">股數</label>
                <input type="number" id="editBuyShares" class="form-input" value="${record.shares != null && record.shares !== '' ? String(record.shares) : ''}" step="1" min="1" placeholder="0">
            </div>
            <div class="form-field">
                <label class="form-label">手續費</label>
                <input type="number" id="editBuyFee" class="form-input" value="${record.fee || 0}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-checkbox-label">
                    <input type="checkbox" id="editBuyIsDCA" class="form-checkbox" ${record.isDCA ? 'checked' : ''}>
                    <span class="form-checkbox-text">定期定額</span>
                </label>
            </div>
            <div class="form-field">
                <label class="form-label">備註</label>
                <input type="text" id="editBuyNote" class="form-input" value="${record.note || ''}" placeholder="選填">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button id="editBuyCancelBtn" class="form-delete-btn" style="flex: 1;">取消</button>
                <button id="editBuySaveBtn" class="form-submit-btn" style="flex: 2;">儲存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 確保輸入框可以正常編輯（延遲設置，確保DOM已渲染）
    setTimeout(() => {
        const priceInput = document.getElementById('editBuyPrice');
        const sharesInput = document.getElementById('editBuyShares');
        const feeInput = document.getElementById('editBuyFee');
        if (priceInput) {
            priceInput.removeAttribute('readonly');
            priceInput.removeAttribute('disabled');
            priceInput.style.pointerEvents = 'auto';
            priceInput.style.userSelect = 'auto';
            priceInput.style.webkitUserSelect = 'auto';
            priceInput.readOnly = false;
            priceInput.disabled = false;
        }
        if (sharesInput) {
            sharesInput.removeAttribute('readonly');
            sharesInput.removeAttribute('disabled');
            sharesInput.style.pointerEvents = 'auto';
            sharesInput.style.userSelect = 'auto';
            sharesInput.style.webkitUserSelect = 'auto';
            sharesInput.readOnly = false;
            sharesInput.disabled = false;
        }
        if (feeInput) {
            feeInput.removeAttribute('readonly');
            feeInput.removeAttribute('disabled');
            feeInput.style.pointerEvents = 'auto';
            feeInput.readOnly = false;
            feeInput.disabled = false;
        }
    }, 100);
    
    // 關閉按鈕
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#editBuyCancelBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 保存按鈕
    modal.querySelector('#editBuySaveBtn').addEventListener('click', () => {
        const stockCode = document.getElementById('editBuyStockCode').value.trim();
        const date = document.getElementById('editBuyDate').value;
        const priceInput = document.getElementById('editBuyPrice');
        const sharesInput = document.getElementById('editBuyShares');
        const price = parseFloat(priceInput ? priceInput.value : 0);
        const shares = parseInt(sharesInput ? sharesInput.value : 0);
        const fee = parseFloat(document.getElementById('editBuyFee').value) || 0;
        const isDCA = document.getElementById('editBuyIsDCA').checked;
        const note = document.getElementById('editBuyNote').value.trim();
        
        console.log('編輯買入記錄 - 輸入值:', { stockCode, date, price, shares, fee, isDCA, note });
        
        if (!stockCode || !date || !price || !shares) {
            alert('請填寫所有必填欄位\n\n股票代碼: ' + (stockCode || '未填寫') + '\n日期: ' + (date || '未填寫') + '\n價格: ' + (price || '未填寫') + '\n股數: ' + (shares || '未填寫'));
            return;
        }
        
        if (price <= 0 || shares <= 0) {
            alert('價格和股數必須大於0\n\n價格: ' + price + '\n股數: ' + shares);
            return;
        }
        
        if (isNaN(price) || isNaN(shares)) {
            alert('價格和股數必須是有效的數字\n\n價格: ' + (priceInput ? priceInput.value : 'N/A') + '\n股數: ' + (sharesInput ? sharesInput.value : 'N/A'));
            return;
        }
        
        // 更新記錄
        try {
        const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
            // 使用多種方式匹配記錄ID
            const recordId = record.timestamp || record.id;
            const recordIdStr = String(recordId);
            console.log('嘗試更新記錄，ID:', recordIdStr, '原始記錄:', record);
            
            const index = records.findIndex(r => {
                const rTimestamp = r.timestamp ? String(r.timestamp) : null;
                const rId = r.id ? String(r.id) : null;
                return (rTimestamp === recordIdStr) || (rId === recordIdStr);
            });
            
            console.log('找到的記錄索引:', index, '總記錄數:', records.length);
            
        if (index !== -1) {
                // 保留原始記錄的所有屬性，只更新修改的欄位
                const updatedRecord = {
                ...records[index],
                stockCode: stockCode,
                date: date,
                price: price,
                shares: shares,
                fee: fee,
                isDCA: isDCA,
                    note: note,
                    // 確保保留原始ID
                    timestamp: records[index].timestamp || record.timestamp,
                    id: records[index].id || record.id
            };
                
                records[index] = updatedRecord;
                
                // 嘗試保存到 localStorage
                try {
            localStorage.setItem('investmentRecords', JSON.stringify(records));
            
                    // 立即更新顯示，不使用延遲
                    const oldStockCode = record.stockCode;
                    
                    // 更新核心數據
            updateInvestmentSummary();
            updatePortfolioList();
            updateInvestmentRecords();
                    
                    // 如果股票代碼改變了，需要更新兩個股票的顯示
                    if (oldStockCode !== stockCode) {
                        updateStockRecords(oldStockCode);
                        updateStockRecords(stockCode);
                    } else {
                        updateStockRecords(stockCode);
                    }
                    
                    // 檢查是否正在查看股票詳情頁面，如果是則重新顯示（重新計算所有數據）
                    const stockDetailPage = document.getElementById('stockDetailPage');
                    if (stockDetailPage && stockDetailPage.style.display !== 'none') {
                        // 重新計算持股數據並更新詳情頁面
                        const portfolio = getPortfolio();
                        const updatedStock = portfolio.find(s => s.stockCode === stockCode);
                        if (updatedStock) {
                            showStockDetailPage(stockCode);
                        }
                    }
                    
            updateInvestmentOverview();
            
            document.body.removeChild(modal);
            alert('記錄已更新！');
                } catch (storageError) {
                    console.error('localStorage 保存失敗:', storageError);
                    if (storageError.name === 'QuotaExceededError') {
                        alert('存儲空間不足，無法保存記錄。請刪除一些舊記錄後再試。');
                    } else {
                        alert('保存失敗：' + storageError.message);
                    }
                }
            } else {
                console.error('找不到記錄，ID:', recordIdStr);
                console.error('記錄列表中的ID範例:', records.slice(0, 3).map(r => ({
                    timestamp: r.timestamp,
                    id: r.id,
                    type: r.type,
                    stockCode: r.stockCode
                })));
                alert('找不到要更新的記錄，請重新整理頁面後再試。\n記錄ID: ' + recordIdStr);
            }
        } catch (error) {
            console.error('更新記錄時發生錯誤:', error);
            alert('更新記錄時發生錯誤：' + error.message);
        }
    });
}

// 顯示編輯賣出記錄模態框
function showEditSellRecordModal(record) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div class="modal-content-standard" style="max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0;">編輯賣出記錄</h2>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">✕</button>
            </div>
            <div class="form-field">
                <label class="form-label">股票代碼</label>
                <input type="text" id="editSellStockCode" class="form-input" value="${record.stockCode || ''}" placeholder="例如: 2330">
            </div>
            <div class="form-field">
                <label class="form-label">賣出日期</label>
                <input type="date" id="editSellDate" class="form-input" value="${record.date || ''}">
            </div>
            <div class="form-field">
                <label class="form-label">賣出價格</label>
                <input type="number" id="editSellPrice" class="form-input" value="${record.price != null && record.price !== '' ? String(record.price) : ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">股數</label>
                <input type="number" id="editSellShares" class="form-input" value="${record.shares != null && record.shares !== '' ? String(record.shares) : ''}" step="1" min="1" placeholder="0">
            </div>
            <div class="form-field">
                <label class="form-label">手續費</label>
                <input type="number" id="editSellFee" class="form-input" value="${record.fee || 0}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">證交稅</label>
                <input type="number" id="editSellTax" class="form-input" value="${record.tax || 0}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">備註</label>
                <input type="text" id="editSellNote" class="form-input" value="${record.note || ''}" placeholder="選填">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button id="editSellCancelBtn" class="form-delete-btn" style="flex: 1;">取消</button>
                <button id="editSellSaveBtn" class="form-submit-btn" style="flex: 2;">儲存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 確保輸入框可以正常編輯（延遲設置，確保DOM已渲染）
    setTimeout(() => {
        const priceInput = document.getElementById('editSellPrice');
        const sharesInput = document.getElementById('editSellShares');
        const feeInput = document.getElementById('editSellFee');
        const taxInput = document.getElementById('editSellTax');
        if (priceInput) {
            priceInput.removeAttribute('readonly');
            priceInput.removeAttribute('disabled');
            priceInput.style.pointerEvents = 'auto';
            priceInput.style.userSelect = 'auto';
            priceInput.style.webkitUserSelect = 'auto';
            priceInput.readOnly = false;
            priceInput.disabled = false;
        }
        if (sharesInput) {
            sharesInput.removeAttribute('readonly');
            sharesInput.removeAttribute('disabled');
            sharesInput.style.pointerEvents = 'auto';
            sharesInput.style.userSelect = 'auto';
            sharesInput.style.webkitUserSelect = 'auto';
            sharesInput.readOnly = false;
            sharesInput.disabled = false;
        }
        if (feeInput) {
            feeInput.removeAttribute('readonly');
            feeInput.removeAttribute('disabled');
            feeInput.style.pointerEvents = 'auto';
            feeInput.readOnly = false;
            feeInput.disabled = false;
        }
        if (taxInput) {
            taxInput.removeAttribute('readonly');
            taxInput.removeAttribute('disabled');
            taxInput.style.pointerEvents = 'auto';
            taxInput.readOnly = false;
            taxInput.disabled = false;
        }
    }, 100);
    
    // 關閉按鈕
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#editSellCancelBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 保存按鈕
    modal.querySelector('#editSellSaveBtn').addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const stockCode = document.getElementById('editSellStockCode').value.trim();
        const date = document.getElementById('editSellDate').value;
        const price = parseFloat(document.getElementById('editSellPrice').value);
        const shares = parseInt(document.getElementById('editSellShares').value);
        const fee = parseFloat(document.getElementById('editSellFee').value) || 0;
        const tax = parseFloat(document.getElementById('editSellTax').value) || 0;
        const note = document.getElementById('editSellNote').value.trim();
        
        if (!stockCode || !date || !price || !shares) {
            alert('請填寫所有必填欄位');
            return;
        }
        
        if (price <= 0 || shares <= 0) {
            alert('價格和股數必須大於0');
            return;
        }
        
        // 重新計算實現損益
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        let realizedPnl = record.realizedPnl || 0;
        
        if (stock) {
            const avgCost = stock.avgCost;
            const totalCost = avgCost * shares;
            const totalAmount = price * shares;
            const totalRevenue = totalAmount - fee - tax;
            realizedPnl = totalRevenue - totalCost;
        }
        
        // 更新記錄
        try {
        const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
            // 使用多種方式匹配記錄ID
            const recordId = record.timestamp || record.id;
            const recordIdStr = String(recordId);
            console.log('嘗試更新賣出記錄，ID:', recordIdStr, '原始記錄:', record);
            
            const index = records.findIndex(r => {
                const rTimestamp = r.timestamp ? String(r.timestamp) : null;
                const rId = r.id ? String(r.id) : null;
                return (rTimestamp === recordIdStr) || (rId === recordIdStr);
            });
            
            console.log('找到的記錄索引:', index, '總記錄數:', records.length);
            
        if (index !== -1) {
                // 保留原始記錄的所有屬性，只更新修改的欄位
                const updatedRecord = {
                ...records[index],
                stockCode: stockCode,
                date: date,
                price: price,
                shares: shares,
                fee: fee,
                tax: tax,
                note: note,
                    realizedPnl: realizedPnl,
                    // 確保保留原始ID
                    timestamp: records[index].timestamp || record.timestamp,
                    id: records[index].id || record.id
            };
                
                records[index] = updatedRecord;
                
                // 嘗試保存到 localStorage
                try {
            localStorage.setItem('investmentRecords', JSON.stringify(records));
            
                    // 立即更新顯示，不使用延遲
                    const oldStockCode = record.stockCode;
                    
                    // 更新核心數據
            updateInvestmentSummary();
            updatePortfolioList();
            updateInvestmentRecords();
                    
                    // 如果股票代碼改變了，需要更新兩個股票的顯示
                    if (oldStockCode !== stockCode) {
                        updateStockRecords(oldStockCode);
                        updateStockRecords(stockCode);
                    } else {
                        updateStockRecords(stockCode);
                    }
                    
                    // 檢查是否正在查看股票詳情頁面，如果是則重新顯示（重新計算所有數據）
                    const stockDetailPage = document.getElementById('stockDetailPage');
                    if (stockDetailPage && stockDetailPage.style.display !== 'none') {
                        // 重新計算持股數據並更新詳情頁面
                        const portfolio = getPortfolio();
                        const updatedStock = portfolio.find(s => s.stockCode === stockCode);
                        if (updatedStock) {
                            showStockDetailPage(stockCode);
                        }
                    }
                    
            updateInvestmentOverview();
            
            document.body.removeChild(modal);
            alert('記錄已更新！');
                } catch (storageError) {
                    console.error('localStorage 保存失敗:', storageError);
                    if (storageError.name === 'QuotaExceededError') {
                        alert('存儲空間不足，無法保存記錄。請刪除一些舊記錄後再試。');
                    } else {
                        alert('保存失敗：' + storageError.message);
                    }
                }
            } else {
                console.error('找不到記錄，ID:', recordIdStr);
                console.error('記錄列表中的ID範例:', records.slice(0, 3).map(r => ({
                    timestamp: r.timestamp,
                    id: r.id,
                    type: r.type,
                    stockCode: r.stockCode
                })));
                alert('找不到要更新的記錄，請重新整理頁面後再試。\n記錄ID: ' + recordIdStr);
            }
        } catch (error) {
            console.error('更新記錄時發生錯誤:', error);
            alert('更新記錄時發生錯誤：' + error.message);
        }
    });
}

// 顯示編輯股息記錄模態框
function showEditDividendRecordModal(record) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div class="modal-content-standard" style="max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0;">編輯股息記錄</h2>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">✕</button>
            </div>
            <div class="form-field">
                <label class="form-label">股票代碼</label>
                <input type="text" id="editDividendStockCode" class="form-input" value="${record.stockCode || ''}" placeholder="例如: 2330">
            </div>
            <div class="form-field">
                <label class="form-label">股票名稱（選填）</label>
                <input type="text" id="editDividendStockName" class="form-input" value="${record.stockName || ''}" placeholder="例如: 台積電">
            </div>
            <div class="form-field">
                <label class="form-label">股息日期</label>
                <input type="date" id="editDividendDate" class="form-input" value="${record.date || ''}">
            </div>
            <div class="form-field">
                <label class="form-label">除息日（選填）</label>
                <input type="date" id="editDividendExDate" class="form-input" value="${record.exDividendDate || ''}">
            </div>
            <div class="form-field">
                <label class="form-label">股息類型</label>
                <select id="editDividendType" class="form-input">
                    <option value="cash" ${record.dividendType === 'cash' ? 'selected' : ''}>現金股利</option>
                    <option value="stock" ${record.dividendType === 'stock' ? 'selected' : ''}>股票股利</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">每股金額</label>
                <input type="number" id="editDividendPerShare" class="form-input" value="${record.perShare != null && record.perShare !== '' ? String(record.perShare) : ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">歷史每股金額（選填）</label>
                <input type="number" id="editDividendHistoricalPerShare" class="form-input" value="${record.historicalPerShare != null && record.historicalPerShare !== '' ? String(record.historicalPerShare) : ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">股數</label>
                <input type="number" id="editDividendShares" class="form-input" value="${record.shares != null && record.shares !== '' ? String(record.shares) : ''}" step="1" min="1" placeholder="0">
            </div>
            <div class="form-field">
                <label class="form-label">實收金額</label>
                <input type="number" id="editDividendAmount" class="form-input" value="${record.amount != null && record.amount !== '' ? String(record.amount) : ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-field">
                <label class="form-label">手續費（選填）</label>
                <input type="number" id="editDividendFee" class="form-input" value="${record.fee != null && record.fee !== '' ? String(record.fee) : '0'}" step="0.01" min="0" placeholder="0.00">
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">股息入帳時可能產生的手續費</div>
            </div>
            <div class="form-field">
                <label class="form-checkbox-label">
                    <input type="checkbox" id="editDividendReinvest" class="form-checkbox" ${record.reinvest ? 'checked' : ''}>
                    <span class="form-checkbox-text">再投入</span>
                </label>
            </div>
            <div class="form-field">
                <label class="form-label">備註</label>
                <input type="text" id="editDividendNote" class="form-input" value="${record.note || ''}" placeholder="選填">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button id="editDividendCancelBtn" class="form-delete-btn" style="flex: 1;">取消</button>
                <button id="editDividendSaveBtn" class="form-submit-btn" style="flex: 2;">儲存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 確保輸入框可以正常編輯（延遲設置，確保DOM已渲染）
    setTimeout(() => {
        const perShareInput = document.getElementById('editDividendPerShare');
        const sharesInput = document.getElementById('editDividendShares');
        const amountInput = document.getElementById('editDividendAmount');
        const feeInput = document.getElementById('editDividendFee');
        if (perShareInput) {
            perShareInput.removeAttribute('readonly');
            perShareInput.removeAttribute('disabled');
            perShareInput.style.pointerEvents = 'auto';
            perShareInput.style.userSelect = 'auto';
            perShareInput.style.webkitUserSelect = 'auto';
            perShareInput.readOnly = false;
            perShareInput.disabled = false;
        }
        if (sharesInput) {
            sharesInput.removeAttribute('readonly');
            sharesInput.removeAttribute('disabled');
            sharesInput.style.pointerEvents = 'auto';
            sharesInput.style.userSelect = 'auto';
            sharesInput.style.webkitUserSelect = 'auto';
            sharesInput.readOnly = false;
            sharesInput.disabled = false;
        }
        if (amountInput) {
            amountInput.removeAttribute('readonly');
            amountInput.removeAttribute('disabled');
            amountInput.style.pointerEvents = 'auto';
            amountInput.style.userSelect = 'auto';
            amountInput.style.webkitUserSelect = 'auto';
            amountInput.readOnly = false;
            amountInput.disabled = false;
        }
        if (feeInput) {
            feeInput.removeAttribute('readonly');
            feeInput.removeAttribute('disabled');
            feeInput.style.pointerEvents = 'auto';
            feeInput.style.userSelect = 'auto';
            feeInput.style.webkitUserSelect = 'auto';
            feeInput.readOnly = false;
            feeInput.disabled = false;
        }
    }, 100);
    
    // 關閉按鈕
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#editDividendCancelBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 保存按鈕
    modal.querySelector('#editDividendSaveBtn').addEventListener('click', () => {
        playClickSound(); // 播放點擊音效
        const stockCode = document.getElementById('editDividendStockCode').value.trim();
        const stockNameFromInput = document.getElementById('editDividendStockName')?.value?.trim() || '';
        const date = document.getElementById('editDividendDate').value;
        const dividendType = document.getElementById('editDividendType').value;
        const perShare = parseFloat(document.getElementById('editDividendPerShare').value);
        const shares = parseInt(document.getElementById('editDividendShares').value);
        const amount = parseFloat(document.getElementById('editDividendAmount').value);
        const fee = parseFloat(document.getElementById('editDividendFee')?.value) || 0;
        const reinvest = document.getElementById('editDividendReinvest').checked;
        const note = document.getElementById('editDividendNote').value.trim();
        const stockName = stockNameFromInput || (typeof findStockName === 'function' ? (findStockName(stockCode) || '') : '') || stockCode;
        const historicalPerShare = parseFloat(document.getElementById('editDividendHistoricalPerShare')?.value) || null;
        const exDividendDate = document.getElementById('editDividendExDate')?.value || '';
        
        if (!stockCode || !date || perShare <= 0 || shares <= 0 || amount <= 0) {
            alert('請填寫所有必填欄位');
            return;
        }
        
        // 更新記錄
        try {
        const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
            // 使用多種方式匹配記錄ID
            const recordId = record.timestamp || record.id;
            const recordIdStr = String(recordId);
            console.log('嘗試更新股息記錄，ID:', recordIdStr, '原始記錄:', record);
            
            const index = records.findIndex(r => {
                const rTimestamp = r.timestamp ? String(r.timestamp) : null;
                const rId = r.id ? String(r.id) : null;
                return (rTimestamp === recordIdStr) || (rId === recordIdStr);
            });
            
            console.log('找到的記錄索引:', index, '總記錄數:', records.length);
            
        if (index !== -1) {
                // 保留原始記錄的所有屬性，只更新修改的欄位
                const updatedRecord = {
                    ...record,
                    type: 'dividend',
                    stockCode: stockCode,
                    stockName: stockName,
                    date: date,
                    exDividendDate: exDividendDate,
                    dividendType: dividendType || 'cash',
                    perShare: perShare,
                    historicalPerShare: historicalPerShare,
                    shares: shares,
                    amount: amount,
                    fee: fee,
                    reinvest: reinvest,
                    note: note
                };
                
                records[index] = updatedRecord;

                // 編輯股息時同步「股利再投入」的買入記錄
                try {
                    const dividendLinkId = String(updatedRecord.timestamp || updatedRecord.id);
                    const linkedBuyIndexes = [];
                    records.forEach((r, i) => {
                        if (r && r.type === 'buy' && r.isDividendReinvest && String(r.dividendRecordId) === dividendLinkId) {
                            linkedBuyIndexes.push(i);
                        }
                    });

                    const shouldHaveReinvestBuy = (updatedRecord.dividendType === 'cash' && !!updatedRecord.reinvest && (updatedRecord.amount || 0) > 0);

                    if (!shouldHaveReinvestBuy) {
                        // 取消再投入 / 非現金股利：刪除所有關聯買入記錄
                        if (linkedBuyIndexes.length > 0) {
                            linkedBuyIndexes.sort((a, b) => b - a).forEach(i => records.splice(i, 1));
                        }
                    } else {
                        // 現金股利 + 再投入：建立或更新關聯買入記錄
                        const existingBuyIndex = linkedBuyIndexes.length > 0 ? linkedBuyIndexes[0] : -1;
                        const existingBuyRecord = existingBuyIndex !== -1 ? records[existingBuyIndex] : null;

                        // 優先沿用原本的買入價格，避免編輯時一直跳 prompt
                        const savedPrice = getStockCurrentPrice(stockCode);
                        const portfolio = getPortfolio();
                        const stock = portfolio.find(s => s.stockCode === stockCode);
                        const avgCost = stock && stock.avgCost > 0 ? stock.avgCost : 0;
                        let buyPrice = (existingBuyRecord && existingBuyRecord.price > 0)
                            ? existingBuyRecord.price
                            : (savedPrice || avgCost || 0);

                        if (buyPrice <= 0) {
                            const userPrice = prompt(`請輸入 ${stockCode} 的現價（用於計算股利再投入的股數）：`);
                            if (userPrice && parseFloat(userPrice) > 0) {
                                buyPrice = parseFloat(userPrice);
                            }
                        }

                        if (buyPrice > 0) {
                            const reinvestFee = 0;
                            const availableAmount = amount;
                            const buyShares = Math.floor(availableAmount / buyPrice);

                            if (buyShares > 0) {
                                const buyRecord = {
                                    type: 'buy',
                                    stockCode: stockCode,
                                    stockName: stockCode,
                                    date: date,
                                    price: buyPrice,
                                    shares: buyShares,
                                    fee: reinvestFee,
                                    isDividendReinvest: true,
                                    dividendRecordId: dividendLinkId,
                                    note: `股利再投入（來自 ${date} 現金股利，使用${(existingBuyRecord && existingBuyRecord.price > 0) ? '原買入價格' : savedPrice ? '現價' : avgCost ? '平均成本' : '手動輸入價格'}）${note ? ' - ' + note : ''}`,
                                    timestamp: existingBuyRecord?.timestamp || new Date().toISOString()
                                };

                                if (existingBuyIndex !== -1) {
                                    records[existingBuyIndex] = {
                                        ...records[existingBuyIndex],
                                        ...buyRecord
                                    };
                                    // 多餘的關聯買入記錄移除
                                    if (linkedBuyIndexes.length > 1) {
                                        linkedBuyIndexes.slice(1).sort((a, b) => b - a).forEach(i => records.splice(i, 1));
                                    }
                                    
                                    // 創建或更新記帳本轉帳記錄
                                    try {
                                        let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                                        const transferIndex = accountingRecords.findIndex(ar => 
                                            ar.linkedInvestment === true && 
                                            ar.investmentRecordId === buyRecord.timestamp
                                        );
                                        
                                        const transferRecord = {
                                            type: 'transfer',
                                            category: '股票再投入',
                                            amount: amount,
                                            note: `股利再投入：${stockCode} ${buyShares}股 @ NT$${buyPrice.toFixed(2)}`,
                                            date: date,
                                            fromAccount: '現金',
                                            toAccount: '投資',
                                            linkedInvestment: true,
                                            investmentRecordId: buyRecord.timestamp,
                                            timestamp: buyRecord.timestamp
                                        };
                                        
                                        if (transferIndex !== -1) {
                                            accountingRecords[transferIndex] = transferRecord;
                                        } else {
                                            accountingRecords.push(transferRecord);
                                        }
                                        
                                        localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                                        console.log('已更新股利再投入轉帳記錄');
                                    } catch (e) {
                                        console.warn('更新股利再投入轉帳記錄失敗:', e);
                                    }
                                } else {
                                    records.push(buyRecord);
                                    
                                    // 創建新的記帳本轉帳記錄
                                    try {
                                        let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                                        const transferRecord = {
                                            type: 'transfer',
                                            category: '股票再投入',
                                            amount: amount,
                                            note: `股利再投入：${stockCode} ${buyShares}股 @ NT$${buyPrice.toFixed(2)}`,
                                            date: date,
                                            fromAccount: '現金',
                                            toAccount: '投資',
                                            linkedInvestment: true,
                                            investmentRecordId: buyRecord.timestamp,
                                            timestamp: buyRecord.timestamp
                                        };
                                        accountingRecords.push(transferRecord);
                                        localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                                        console.log('已創建股利再投入轉帳記錄');
                                    } catch (e) {
                                        console.warn('創建股利再投入轉帳記錄失敗:', e);
                                    }
                                }
                            } else {
                                // 金額不足以買入至少1股：刪除既有關聯買入記錄並提示
                                if (linkedBuyIndexes.length > 0) {
                                    // 刪除關聯的記帳本轉帳記錄
                                    try {
                                        const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                                        const deletedInvestmentIds = linkedBuyIndexes.map(i => {
                                            const invRecord = records[i];
                                            return invRecord ? (invRecord.timestamp || invRecord.id) : null;
                                        }).filter(id => id !== null);
                                        
                                        if (deletedInvestmentIds.length > 0) {
                                            accountingRecords = accountingRecords.filter(ar => {
                                                if (!ar || ar.type !== 'transfer' || ar.linkedInvestment !== true) return true;
                                                const invId = ar.investmentRecordId != null ? String(ar.investmentRecordId) : '';
                                                return !deletedInvestmentIds.includes(invId);
                                            });
                                            localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                                            console.log('已刪除關聯的股利再投入轉帳記錄');
                                        }
                                    } catch (e) {
                                        console.warn('刪除股利再投入轉帳記錄失敗:', e);
                                    }
                                    
                                    linkedBuyIndexes.sort((a, b) => b - a).forEach(i => records.splice(i, 1));
                                }
                                alert(`⚠️ 股利再投入金額不足\n\n股利金額：NT$${amount.toLocaleString('zh-TW')}\n可用金額：NT$${amount.toLocaleString('zh-TW')}\n股票現價：NT$${buyPrice.toFixed(2)}\n\n可用金額不足以買入至少1股（需要至少 NT$${buyPrice.toLocaleString('zh-TW')}）`);
                            }
                        } else {
                            // 沒有價格無法計算：刪除既有關聯買入記錄
                            if (linkedBuyIndexes.length > 0) {
                                // 刪除關聯的記帳本轉帳記錄
                                try {
                                    const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                                    const deletedInvestmentIds = linkedBuyIndexes.map(i => {
                                        const invRecord = records[i];
                                        return invRecord ? (invRecord.timestamp || invRecord.id) : null;
                                    }).filter(id => id !== null);
                                    
                                    if (deletedInvestmentIds.length > 0) {
                                        accountingRecords = accountingRecords.filter(ar => {
                                            if (!ar || ar.type !== 'transfer' || ar.linkedInvestment !== true) return true;
                                            const invId = ar.investmentRecordId != null ? String(ar.investmentRecordId) : '';
                                            return !deletedInvestmentIds.includes(invId);
                                        });
                                        localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                                        console.log('已刪除關聯的股利再投入轉帳記錄');
                                    }
                                } catch (e) {
                                    console.warn('刪除股利再投入轉帳記錄失敗:', e);
                                }
                                
                                linkedBuyIndexes.sort((a, b) => b - a).forEach(i => records.splice(i, 1));
                            }
                        }
                    }
                } catch (syncError) {
                    console.error('同步股利再投入買入記錄失敗:', syncError);
                }
                
                // 嘗試保存到 localStorage
                try {
            localStorage.setItem('investmentRecords', JSON.stringify(records));
            
                    // 立即更新顯示，不使用延遲
                    const oldStockCode = record.stockCode;
                    
                    // 更新核心數據
            updateInvestmentSummary();
            updatePortfolioList();
            updateInvestmentRecords();
                    
                    // 如果股票代碼改變了，需要更新兩個股票的顯示
                    if (oldStockCode !== stockCode) {
                        updateStockRecords(oldStockCode);
                        updateStockRecords(stockCode);
                    } else {
                        updateStockRecords(stockCode);
                    }
                    
                    // 檢查是否正在查看股票詳情頁面，如果是則重新顯示（重新計算所有數據）
                    const stockDetailPage = document.getElementById('stockDetailPage');
                    if (stockDetailPage && stockDetailPage.style.display !== 'none') {
                        // 重新計算持股數據並更新詳情頁面
                        const portfolio = getPortfolio();
                        const updatedStock = portfolio.find(s => s.stockCode === stockCode);
                        if (updatedStock) {
                            showStockDetailPage(stockCode);
                        }
                    }
                    
            updateInvestmentOverview();
            
            document.body.removeChild(modal);
            alert('記錄已更新！');
                } catch (storageError) {
                    console.error('localStorage 保存失敗:', storageError);
                    if (storageError.name === 'QuotaExceededError') {
                        alert('存儲空間不足，無法保存記錄。請刪除一些舊記錄後再試。');
                    } else {
                        alert('保存失敗：' + storageError.message);
                    }
                }
            } else {
                console.error('找不到記錄，ID:', recordIdStr);
                console.error('記錄列表中的ID範例:', records.slice(0, 3).map(r => ({
                    timestamp: r.timestamp,
                    id: r.id,
                    type: r.type,
                    stockCode: r.stockCode
                })));
                alert('找不到要更新的記錄，請重新整理頁面後再試。\n記錄ID: ' + recordIdStr);
            }
        } catch (error) {
            console.error('更新記錄時發生錯誤:', error);
            alert('更新記錄時發生錯誤：' + error.message);
        }
    });
}

// 顯示買入/賣出輸入畫面
function showInvestmentInputPage(type) {
    const inputPage = document.getElementById('investmentInputPage');
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (overview) overview.style.display = 'none';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) {
        inputPage.style.display = 'flex';
        
        // 隱藏底部導航欄
        if (bottomNav) bottomNav.style.display = 'none';
        
        // 隱藏操作按鈕
        const investmentActions = document.querySelector('.investment-actions');
        if (investmentActions) investmentActions.style.display = 'none';
        
        // 初始化輸入畫面
        initInvestmentInput(type);
    }
}

// 初始化買入/賣出輸入
function initInvestmentInput(type) {
    // 保存交易類型
    window.investmentInputType = type;
    
    // 初始化投資類型選擇
    let selectedInvestmentType = 'stock'; // 預設為股票
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有active類別
            typeButtons.forEach(b => b.classList.remove('active'));
            // 添加active類別到點擊的按鈕
            btn.classList.add('active');
            selectedInvestmentType = btn.dataset.type;
            window.investmentType = selectedInvestmentType;
        });
    });
    window.investmentType = selectedInvestmentType;
    
    // 獲取新的表單元素
    const stockCodeInput = document.getElementById('calcStockCodeInput');
    const stockNameInput = document.getElementById('calcStockNameInput');
    const dateInput = document.getElementById('calcDateInput');
    const priceInput = document.getElementById('calcPriceInput');
    const sharesInput = document.getElementById('calcSharesInput');
    const queryBtn = document.getElementById('queryStockPriceBtn');
    const dcaFieldContainer = document.getElementById('dcaFieldContainer');
    const isDCAInput = document.getElementById('calcIsDCAInput');
    
    // 顯示/隱藏定期定額選項（僅買入時顯示）
    if (dcaFieldContainer) {
        dcaFieldContainer.style.display = type === 'buy' ? 'block' : 'none';
    }
    if (isDCAInput) {
        isDCAInput.checked = false; // 重置為未選中
    }
    
    // 設置日期為今天
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    
    // 初始化股票代碼和名稱
    if (type === 'sell') {
        // 賣出：從持股中選擇
        const portfolio = getPortfolio();
        if (portfolio.length > 0) {
            // 預設選擇第一個持股
            const firstStock = portfolio[0];
            if (stockCodeInput) stockCodeInput.value = firstStock.stockCode;
            if (stockNameInput) stockNameInput.value = firstStock.stockName || firstStock.stockCode;
            window.selectedStockCode = firstStock.stockCode;
            // 自動填入當前持股數（賣出時）
            if (sharesInput && firstStock.shares > 0) {
                sharesInput.value = firstStock.shares;
            }
            // 更新持股數提示
            if (typeof updateCurrentSharesHint === 'function') {
                updateCurrentSharesHint(firstStock.stockCode);
            }
        } else {
            alert('您目前沒有持股，無法賣出');
            // 返回投資總覽
            const inputPage = document.getElementById('investmentInputPage');
            const overview = document.getElementById('investmentOverview');
            const bottomNav = document.querySelector('.bottom-nav');
            const investmentActions = document.querySelector('.investment-actions');
            if (inputPage) inputPage.style.display = 'none';
            if (overview) overview.style.display = 'block';
            if (bottomNav) bottomNav.style.display = 'flex';
            if (investmentActions) investmentActions.style.display = 'flex';
            return;
        }
    } else {
        // 買入：清空輸入框
        if (stockCodeInput) stockCodeInput.value = '';
        if (stockNameInput) stockNameInput.value = '';
        window.selectedStockCode = '';
    }
    
    // 查詢股價按鈕（暫時顯示提示）
    if (queryBtn) {
        queryBtn.onclick = async () => {
            const code = stockCodeInput ? stockCodeInput.value.trim() : '';
            if (!code) {
                showAppAlert({
                    title: '查詢股價',
                    message: '請先輸入股票代碼'
                });
                return;
            }

            queryBtn.disabled = true;
            queryBtn.textContent = '查詢中...';
            try {
                const normalized = code.replace(/\s+/g, '');
                const price = await fetchStockPrice(normalized, { allowPrompt: false });
                if (price != null) {
                    if (priceInput) {
                        priceInput.value = price.toFixed(2);
                    }
                    showAppAlert({
                        title: '查詢成功',
                        message: `目前 ${normalized} 的現價約為 NT$${price.toFixed(2)}（來自 Yahoo/自動更新）`
                    });
                } else {
                    showAppAlert({
                        title: '查詢失敗',
                        message: '無法取得最新股價，請稍後再試或手動輸入。'
                    });
                    const url = `https://www.cnyes.com/twstock/${encodeURIComponent(normalized)}`;
                    window.open(url, '_blank', 'noopener');
                }
            } catch (error) {
                console.error('查詢股價失敗', error);
                showAppAlert({
                    title: '查詢錯誤',
                    message: '發生錯誤，請稍後再試。'
                });
            } finally {
                queryBtn.disabled = false;
                queryBtn.textContent = '查詢股價';
            }
        };
    }
    
    // 使用全局函數
    const findStockName = window.findStockName;
    
    // 更新當前持股數提示和按鈕
    function updateCurrentSharesHint(stockCode) {
        if (!stockCode) {
            const hint = document.getElementById('currentSharesHint');
            const btn = document.getElementById('sharesAutoFillBtn');
            if (hint) hint.style.display = 'none';
            if (btn) btn.style.opacity = '0.5';
            return;
        }
        
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        const hint = document.getElementById('currentSharesHint');
        const btn = document.getElementById('sharesAutoFillBtn');
        const sharesInput = document.getElementById('calcSharesInput');
        
        if (stock && stock.shares > 0) {
            // 有持股，顯示提示和啟用按鈕
            if (hint) {
                hint.textContent = `💡 當前持股：${stock.shares.toLocaleString('zh-TW')} 股`;
                hint.style.display = 'block';
                hint.style.color = 'var(--color-primary)';
            }
            if (btn) {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.dataset.currentShares = stock.shares;
            }
        } else {
            // 沒有持股，隱藏提示和禁用按鈕
            if (hint) {
                hint.textContent = '💡 目前沒有此股票的持股';
                hint.style.display = 'block';
                hint.style.color = 'var(--text-tertiary)';
            }
            if (btn) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.dataset.currentShares = '0';
            }
        }
    }
    
    // 自動填入當前持股數按鈕
    const sharesAutoFillBtn = document.getElementById('sharesAutoFillBtn');
    if (sharesAutoFillBtn) {
        sharesAutoFillBtn.addEventListener('click', () => {
            const stockCode = stockCodeInput ? stockCodeInput.value.trim() : '';
            if (!stockCode) {
                alert('請先輸入股票代碼');
                return;
            }
            
            const portfolio = getPortfolio();
            const stock = portfolio.find(s => s.stockCode === stockCode);
            
            if (stock && stock.shares > 0 && sharesInput) {
                sharesInput.value = stock.shares;
                sharesInput.placeholder = '已自動填入當前持股數';
                if (typeof updateInvestmentDisplay === 'function') {
                    updateInvestmentDisplay();
                }
                
                // 添加視覺反饋
                sharesInput.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)';
                setTimeout(() => {
                    if (sharesInput) {
                        sharesInput.style.background = '';
                    }
                }, 1000);
            } else {
                alert('目前沒有此股票的持股');
            }
        });
    }
    
    // 股票代碼輸入時，自動帶入股票名稱
    if (stockCodeInput) {
        let inputTimeout = null;
        
        // 實時自動辨識並填入股票名稱
        stockCodeInput.addEventListener('input', () => {
            const code = stockCodeInput.value.trim();
            
            // 清除之前的延遲
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            
            // 延遲一點時間，等用戶輸入完成
            inputTimeout = setTimeout(() => {
                if (code && stockNameInput) {
                    const stockName = findStockName(code);
                    if (stockName) {
                        // 自動填入找到的股票名稱
                        stockNameInput.value = stockName;
                        window.selectedStockCode = code;
                        // 恢復原始 placeholder
                        stockNameInput.placeholder = '例如: 台積電';
                    } else {
                        // 如果沒有找到，清空名稱欄位讓用戶手動輸入
                        if (!stockNameInput.value || stockNameInput.value === code) {
                            stockNameInput.value = '';
                            stockNameInput.placeholder = '未找到，請手動輸入';
                        }
                    }
                    // 更新當前持股數提示
                    updateCurrentSharesHint(code);
                } else if (!code && stockNameInput) {
                    // 如果代碼為空，清空名稱
                    stockNameInput.value = '';
                    stockNameInput.placeholder = '例如: 台積電';
                    // 隱藏持股數提示
                    const hint = document.getElementById('currentSharesHint');
                    if (hint) {
                        hint.style.display = 'none';
                    }
                }
            }, 300); // 300ms 延遲，避免頻繁查找
        });
        
        // 失去焦點時也檢查一次（確保即時更新）
        stockCodeInput.addEventListener('blur', () => {
            const code = stockCodeInput.value.trim();
            if (code && stockNameInput) {
                const stockName = findStockName(code);
                if (stockName) {
                    stockNameInput.value = stockName;
                    window.selectedStockCode = code;
                } else if (!stockNameInput.value) {
                    // 如果沒有找到且名稱為空，使用代碼作為名稱
                    stockNameInput.value = code;
                    stockNameInput.placeholder = '未找到，請手動輸入';
                }
                window.selectedStockCode = code;
            }
            // 自動檢查並提示當前持股數
            updateCurrentSharesHint(code);
        });
    }
    
    // 初始化輸入框事件
    initInvestmentInputFields();
    
    // 初始化顯示
    updateInvestmentDisplay();
    
    // 初始化確認按鈕
    const saveBtn = document.getElementById('investmentSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            playClickSound(); // 播放點擊音效
            saveInvestmentRecord(type);
        };
    }
    
    // 初始化返回按鈕（返回到投資專區）
    const backBtn = document.getElementById('investmentInputBackBtn');
    if (backBtn) {
        // 移除舊的事件監聽器，避免重複綁定
        backBtn.onclick = null;
        backBtn.addEventListener('click', () => {
            // 返回到投資專區
            const inputPage = document.getElementById('investmentInputPage');
            const overview = document.getElementById('investmentOverview');
            const detailPage = document.getElementById('stockDetailPage');
            const dividendPage = document.getElementById('dividendPage');
            const dividendInputPage = document.getElementById('dividendInputPage');
            const bottomNav = document.querySelector('.bottom-nav');
            const investmentActions = document.querySelector('.investment-actions');
            
            // 隱藏輸入頁面
            if (inputPage) inputPage.style.display = 'none';
            if (dividendInputPage) dividendInputPage.style.display = 'none';
            
            // 顯示投資總覽
            if (overview) overview.style.display = 'block';
            if (detailPage) detailPage.style.display = 'none';
            if (dividendPage) dividendPage.style.display = 'none';
            
            // 顯示底部導航欄和操作按鈕
            if (bottomNav) bottomNav.style.display = 'flex';
            if (investmentActions) investmentActions.style.display = 'flex';
            
            // 更新投資總覽
            if (typeof updateInvestmentOverview === 'function') {
                updateInvestmentOverview();
            }
        });
    }
    
}

// 投資輸入狀態
let investmentInputState = {
    price: '0',
    shares: '0',
    isEditingPrice: true, // true=編輯價格, false=編輯股數
    isNewNumber: true
};

// 處理投資鍵盤按鍵（已移除鍵盤，保留函數以防其他地方調用）
function handleInvestmentKeyPress(key) {
    const state = investmentInputState;
    const currentValue = state.isEditingPrice ? state.price : state.shares;
    
    if (key === 'delete') {
        // 刪除最後一個字符
        if (currentValue.length > 1) {
            if (state.isEditingPrice) {
                state.price = currentValue.slice(0, -1);
            } else {
                state.shares = currentValue.slice(0, -1);
            }
        } else {
            if (state.isEditingPrice) {
                state.price = '0';
            } else {
                state.shares = '0';
            }
        }
        state.isNewNumber = false;
    } else if (key === '.') {
        // 小數點（只允許在價格中使用）
        if (state.isEditingPrice && !currentValue.includes('.')) {
            if (state.isNewNumber || currentValue === '0') {
                state.price = '0.';
            } else {
                state.price += '.';
            }
            state.isNewNumber = false;
        }
    } else if (key === '×' || key === '÷' || key === '+' || key === '-') {
        // 運算符：切換編輯模式
        state.isEditingPrice = !state.isEditingPrice;
        state.isNewNumber = true;
    } else {
        // 數字
        if (state.isNewNumber || currentValue === '0') {
            if (state.isEditingPrice) {
                state.price = key;
            } else {
                state.shares = key;
            }
            state.isNewNumber = false;
        } else {
            if (state.isEditingPrice) {
                state.price += key;
            } else {
                state.shares += key;
            }
        }
    }
    
    updateInvestmentDisplay();
}

// 計算投資手續費
function calculateInvestmentFee(totalAmount, shares = 0) {
    // 手續費為總金額的0.1425%，但只有買足 1,000 股才會啟動最低 NT$20，其他數量直接用比例計算
    const fee = Math.round(totalAmount * 0.001425);
    if (shares >= 1000) {
        return Math.max(fee, 20);
    }
    return fee;
}

// 更新投資輸入顯示
function updateInvestmentDisplay() {
    const priceInput = document.getElementById('calcPriceInput');
    const sharesInput = document.getElementById('calcSharesInput');
    const feeInput = document.getElementById('calcFeeInput');
    
    const price = parseFloat(priceInput?.value) || 0;
    const shares = parseInt(sharesInput?.value) || 0;
    const total = price * shares;
    
    // 手續費：檢查是否勾選自動計算
    const autoFeeCheckbox = document.getElementById('calcAutoFeeCheckbox');
    const isAutoFee = autoFeeCheckbox?.checked || false;
    const fee = isAutoFee ? calculateInvestmentFee(total, shares) : (parseFloat(feeInput?.value) || 0);
    
    // 如果勾選自動計算，更新手續費欄位顯示
    if (isAutoFee && feeInput) {
        feeInput.value = fee;
    }
    
    const finalAmount = total + fee;
    
    // 更新顯示區域
    const calcPriceEl = document.getElementById('calcPrice');
    const calcSharesEl = document.getElementById('calcShares');
    const calcTotalEl = document.getElementById('calcTotal');
    const calcFeeEl = document.getElementById('calcFee');
    const calcFinalAmountEl = document.getElementById('calcFinalAmount');
    
    if (calcPriceEl) {
        calcPriceEl.textContent = `NT$${price.toFixed(2)}`;
    }
    if (calcSharesEl) {
        calcSharesEl.textContent = `${shares.toLocaleString('zh-TW')} 股`;
    }
    if (calcTotalEl) {
        calcTotalEl.textContent = `NT$${total.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (calcFeeEl) {
        calcFeeEl.textContent = `NT$${fee.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (calcFinalAmountEl) {
        calcFinalAmountEl.textContent = `NT$${finalAmount.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
}

// 保存投資記錄
function saveInvestmentRecord(type) {
    // 從新的表單輸入框獲取值
    const stockCodeInput = document.getElementById('calcStockCodeInput');
    const stockNameInput = document.getElementById('calcStockNameInput');
    const dateInput = document.getElementById('calcDateInput');
    const priceInput = document.getElementById('calcPriceInput');
    const sharesInput = document.getElementById('calcSharesInput');
    
    if (!priceInput || !sharesInput || !stockCodeInput || !dateInput) {
        alert('找不到輸入框');
        return;
    }
    
    const stockCode = stockCodeInput.value.trim();
    const stockName = stockNameInput ? stockNameInput.value.trim() : '';
    const date = dateInput.value || new Date().toISOString().split('T')[0];
    const price = parseFloat(priceInput.value) || 0;
    const shares = parseInt(sharesInput.value) || 0;
    
    if (!stockCode) {
        alert('請輸入股票代碼');
        return;
    }
    
    if (price <= 0 || shares <= 0) {
        alert('請輸入有效的價格和股數');
        return;
    }
    
    // 如果股票名稱是空的，使用代碼作為名稱
    const finalStockName = stockName || stockCode;
    
    // 計算總金額和手續費
    const totalAmount = price * shares;
    const feeInput = document.getElementById('calcFeeInput');
    const autoFeeCheckbox = document.getElementById('calcAutoFeeCheckbox');
    const isAutoFee = autoFeeCheckbox?.checked || false;
    const fee = isAutoFee ? calculateInvestmentFee(totalAmount, shares) : (parseFloat(feeInput?.value) || 0);
    
    let record;
    
    if (type === 'buy') {
        // 讀取定期定額選項
        const isDCAInput = document.getElementById('calcIsDCAInput');
        const isDCA = isDCAInput ? isDCAInput.checked : false;
        
        // 買入記錄
        record = {
            type: 'buy',
            stockCode: stockCode,
            stockName: finalStockName,
            investmentType: window.investmentType || 'stock', // 投資類型：stock/etf/bond
            date: date,
            price: price,
            shares: shares,
            fee: fee,
            isDCA: isDCA,
            note: '',
            timestamp: new Date().toISOString()
        };
    } else if (type === 'sell') {
        // 賣出記錄
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        
        if (!stock || stock.shares < shares) {
            alert('持股不足，無法賣出');
            return;
        }
        
        // 計算實現損益
        const avgCost = stock.avgCost;
        const totalCost = avgCost * shares;
        const tax = Math.round(totalAmount * 0.003); // 0.3% 證交稅
        const totalRevenue = totalAmount - fee - tax;
        const realizedPnl = totalRevenue - totalCost;
        
        record = {
            type: 'sell',
            stockCode: stockCode,
            stockName: finalStockName,
            investmentType: window.investmentType || 'stock', // 投資類型：stock/etf/bond
            date: date,
            price: price,
            shares: shares,
            fee: fee,
            tax: tax,
            note: '',
            realizedPnl: realizedPnl,
            timestamp: new Date().toISOString()
        };
    } else {
        alert('未知的交易類型');
        return;
    }
    
    // 保存記錄
    let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    records.push(record);
    localStorage.setItem('investmentRecords', JSON.stringify(records));
    
    // 買入：自動在記帳本中記錄「轉帳」（顯示於轉帳分頁）
    if (type === 'buy') {
        // 總投入金額（價格 × 股數 + 手續費），無條件進位為整數
        const totalCost = Math.ceil(totalAmount + fee);

        const selectedAccountId = (typeof getSelectedAccount === 'function' ? getSelectedAccount()?.id : null) || '';
        const accounts = (typeof getAccounts === 'function' ? getAccounts() : []) || [];
        const configuredSettlementAccountId = localStorage.getItem('investmentSettlementAccountId') || '';
        let settlementAccountId = configuredSettlementAccountId;
        if (!settlementAccountId) {
            const candidate = accounts.find(a => {
                const name = String(a?.name || '');
                return /交割|證券|券商|broker|settle/i.test(name);
            });
            if (candidate && candidate.id) settlementAccountId = candidate.id;
        }
        if (!settlementAccountId) settlementAccountId = selectedAccountId;

        // 創建記帳記錄
        const accountingRecord = {
            type: 'transfer',
            category: finalStockName ? `${stockCode} ${finalStockName}` : stockCode,
            amount: totalCost,
            account: selectedAccountId,
            fromAccount: selectedAccountId,
            toAccount: settlementAccountId,
            note: `${record.isDCA ? '定期定額' : '買入'}：${finalStockName} (${stockCode}) ${shares}股 @ NT$${price.toLocaleString('zh-TW')}`,
            date: date,
            timestamp: new Date().toISOString(),
            linkedInvestment: true,
            investmentRecordId: record.timestamp
        };

        // 保存到記帳記錄
        let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
        accountingRecords.push(accountingRecord);
        localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));

        // 更新記帳本顯示（如果記帳本頁面已初始化）
        if (typeof updateLedgerSummary === 'function') {
            updateLedgerSummary(accountingRecords);
        }
        if (typeof displayLedgerTransactions === 'function') {
            displayLedgerTransactions(accountingRecords);
        }
    }
    
    // 重置輸入狀態
    investmentInputState = {
        price: '0',
        shares: '0',
        isEditingPrice: true,
        isNewNumber: true
    };
    
    // 返回投資總覽
    const inputPage = document.getElementById('investmentInputPage');
    const overview = document.getElementById('investmentOverview');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    if (inputPage) inputPage.style.display = 'none';
    if (overview) overview.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
    if (investmentActions) investmentActions.style.display = 'flex';
    
    // 更新投資總覽
    updateInvestmentOverview();
    
    // 顯示成功訊息
    let message = type === 'buy' 
        ? `買入記錄已儲存！\n${stockName} (${stockCode})\n${shares}股 @ NT$${price.toLocaleString('zh-TW')}`
        : `賣出記錄已儲存！\n${stockName} (${stockCode})\n${shares}股 @ NT$${price.toLocaleString('zh-TW')}\n實現損益：NT$${record.realizedPnl.toLocaleString('zh-TW')}`;
    
    // 如果是買入，提示已自動記錄到記帳本
    if (type === 'buy') {
        message += `\n\n✓ 已自動記錄到記帳本「轉帳」`;
    }
    
    alert(message);
}

// 初始化投資輸入框
function initInvestmentInputFields() {
    const priceInput = document.getElementById('calcPriceInput');
    const sharesInput = document.getElementById('calcSharesInput');
    const feeInput = document.getElementById('calcFeeInput');
    const autoFeeCheckbox = document.getElementById('calcAutoFeeCheckbox');

    if (priceInput) {
        priceInput.addEventListener('focus', () => {
            if (priceInput.value === '0') priceInput.value = '';
        });
        priceInput.addEventListener('blur', () => {
            if (priceInput.value === '') priceInput.value = '0';
            updateInvestmentDisplay();
        });
        priceInput.addEventListener('input', () => {
            updateInvestmentDisplay();
        });
    }

    if (sharesInput) {
        sharesInput.addEventListener('focus', () => {
            if (sharesInput.value === '0') {
                sharesInput.value = '';
                sharesInput.placeholder = '輸入股數';
            }
        });
        sharesInput.addEventListener('blur', () => {
            if (sharesInput.value === '' || sharesInput.value === '0') {
                sharesInput.value = '0';
                sharesInput.placeholder = '輸入股數';
            }
            updateInvestmentDisplay();
        });
        sharesInput.addEventListener('input', (e) => {
            // 確保股數是整數，移除所有非數字字符
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value !== e.target.value) {
                e.target.value = value;
            }
            updateInvestmentDisplay();
        });
        sharesInput.addEventListener('keydown', (e) => {
            // 允許退格、刪除、Tab、方向鍵等
            if (!/[0-9]/.test(e.key) && 
                !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) &&
                !(e.ctrlKey || e.metaKey)) {
                e.preventDefault();
            }
        });
    }
    
    // 手續費輸入框事件
    if (feeInput) {
        feeInput.addEventListener('input', () => {
            updateInvestmentDisplay();
        });
    }
    
    // 自動計算手續費勾選框事件
    if (autoFeeCheckbox) {
        autoFeeCheckbox.addEventListener('change', () => {
            if (autoFeeCheckbox.checked && feeInput) {
                // 勾選時禁用手動輸入並自動計算
                feeInput.disabled = true;
                feeInput.style.opacity = '0.6';
            } else if (feeInput) {
                // 取消勾選時啟用手動輸入
                feeInput.disabled = false;
                feeInput.style.opacity = '1';
            }
            updateInvestmentDisplay();
        });
    }
}

// 快速新增股息（基於現有記錄）
function quickAddDividend(stockCode, stockName, perShare, shares, dividendType) {
    // 顯示股息輸入頁面
    const dividendInputPage = document.getElementById('dividendInputPage');
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const inputPage = document.getElementById('investmentInputPage');
    const dividendPage = document.getElementById('dividendPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    if (overview) overview.style.display = 'none';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) inputPage.style.display = 'none';
    if (dividendPage) dividendPage.style.display = 'none';
    if (dividendInputPage) {
        dividendInputPage.style.display = 'block';
        // 隱藏底部導航欄
        if (bottomNav) bottomNav.style.display = 'none';
        // 隱藏操作按鈕
        if (investmentActions) investmentActions.style.display = 'none';
        
        // 預填表單資料
        const stockCodeInput = document.getElementById('dividendStockCodeInput');
        const stockNameInput = document.getElementById('dividendStockNameInput');
        const dateInput = document.getElementById('dividendDateInput');
        const perShareInput = document.getElementById('dividendPerShareInput');
    const historicalPerShareInput = document.getElementById('dividendHistoricalPerShareInput');
        const sharesInput = document.getElementById('dividendSharesInput');
        const amountInput = document.getElementById('dividendAmountInput');
        const reinvestInput = document.getElementById('dividendReinvestInput');
        const noteInput = document.getElementById('dividendNoteInput');
        
        if (stockCodeInput) stockCodeInput.value = stockCode || '';
        if (stockNameInput) stockNameInput.value = stockName || '';
        if (dateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }
        if (perShareInput) perShareInput.value = perShare > 0 ? perShare.toFixed(2) : '0';
        if (sharesInput) sharesInput.value = shares > 0 ? shares : '0';
        if (amountInput) {
            // 自動計算金額
            const calculatedAmount = perShare > 0 && shares > 0 ? (perShare * shares).toFixed(2) : '0';
            amountInput.value = calculatedAmount;
        }
        if (reinvestInput) reinvestInput.checked = false;
        if (noteInput) noteInput.value = '';
        
        // 設置股息類型
        if (dividendType) {
            window.dividendType = dividendType;
            const typeButtons = document.querySelectorAll('#dividendInputPage .type-btn');
            typeButtons.forEach(btn => {
                if (btn.dataset.type === dividendType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        
        // 初始化股息輸入頁面
        initDividendInput();
    }
}

// 初始化股息輸入頁面
function initDividendInput() {
    const stockCodeInput = document.getElementById('dividendStockCodeInput');
    const stockNameInput = document.getElementById('dividendStockNameInput');
    const dateInput = document.getElementById('dividendDateInput');
    const perShareInput = document.getElementById('dividendPerShareInput');
    const historicalPerShareInput = document.getElementById('dividendHistoricalPerShareInput');
    const sharesInput = document.getElementById('dividendSharesInput');
    const amountInput = document.getElementById('dividendAmountInput');
    const reinvestInput = document.getElementById('dividendReinvestInput');
    const noteInput = document.getElementById('dividendNoteInput');
    const backBtn = document.getElementById('dividendInputBackBtn');
    const saveBtn = document.getElementById('dividendSaveBtn');
    
    // 設置日期為今天
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    
    // 初始化股息類型選擇
    const typeButtons = document.querySelectorAll('#dividendInputPage .type-btn');
    let selectedType = 'cash'; // 預設為現金股利
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            window.dividendType = selectedType;
        });
    });
    window.dividendType = selectedType;
    
    // 更新當前持股數提示和按鈕（股息頁面專用）
    function updateDividendCurrentSharesHint(stockCode) {
        if (!stockCode) {
            const hint = document.getElementById('dividendCurrentSharesHint');
            const btn = document.getElementById('dividendSharesAutoFillBtn');
            if (hint) hint.style.display = 'none';
            if (btn) btn.style.opacity = '0.5';
            return;
        }
        
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        const hint = document.getElementById('dividendCurrentSharesHint');
        const btn = document.getElementById('dividendSharesAutoFillBtn');
        const sharesInput = document.getElementById('dividendSharesInput');
        
        if (stock && stock.shares > 0) {
            // 有持股，顯示提示和啟用按鈕
            if (hint) {
                hint.textContent = `💡 當前持股：${stock.shares.toLocaleString('zh-TW')} 股`;
                hint.style.display = 'block';
                hint.style.color = 'var(--color-primary)';
            }
            if (btn) {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.dataset.currentShares = stock.shares;
            }
        } else {
            // 沒有持股，隱藏提示和禁用按鈕
            if (hint) {
                hint.textContent = '💡 目前沒有此股票的持股';
                hint.style.display = 'block';
                hint.style.color = 'var(--text-tertiary)';
            }
            if (btn) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.dataset.currentShares = '0';
            }
        }
    }
    
    // 自動填入當前持股數按鈕（股息頁面）
    const dividendSharesAutoFillBtn = document.getElementById('dividendSharesAutoFillBtn');
    if (dividendSharesAutoFillBtn) {
        dividendSharesAutoFillBtn.addEventListener('click', () => {
            const stockCode = stockCodeInput ? stockCodeInput.value.trim() : '';
            if (!stockCode) {
                alert('請先輸入股票代碼');
                return;
            }
            
            const portfolio = getPortfolio();
            const stock = portfolio.find(s => s.stockCode === stockCode);
            
            if (stock && stock.shares > 0 && sharesInput) {
                sharesInput.value = stock.shares;
                sharesInput.placeholder = '已自動填入當前持股數';
                
                // 自動計算實收金額（如果已輸入每股股息）
                const perShare = parseFloat(perShareInput?.value) || 0;
                const historicalPerShare = parseFloat(historicalPerShareInput?.value) || null;
                if (perShare > 0 && amountInput) {
                    const amount = perShare * stock.shares;
                    amountInput.value = amount.toFixed(2);
                }
                
                // 添加視覺反饋
                sharesInput.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)';
                setTimeout(() => {
                    if (sharesInput) {
                        sharesInput.style.background = '';
                    }
                }, 1000);
            } else {
                alert('目前沒有此股票的持股');
            }
        });
    }
    
    // 股票代碼自動填充股票名稱（實時辨識）
    if (stockCodeInput) {
        let inputTimeout = null;
        
        // 實時自動辨識並填入股票名稱
        stockCodeInput.addEventListener('input', () => {
            const code = stockCodeInput.value.trim();
            
            // 清除之前的延遲
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            
            // 延遲一點時間，等用戶輸入完成
            inputTimeout = setTimeout(() => {
                if (code && stockNameInput) {
                    const stockName = findStockName(code);
                    if (stockName) {
                        // 自動填入找到的股票名稱
                        stockNameInput.value = stockName;
                        stockNameInput.placeholder = '例如: 台積電';
                    } else {
                        // 如果沒有找到，清空名稱欄位讓用戶手動輸入
                        if (!stockNameInput.value || stockNameInput.value === code) {
                            stockNameInput.value = '';
                            stockNameInput.placeholder = '未找到，請手動輸入';
                        }
                    }
                    // 更新當前持股數提示
                    updateDividendCurrentSharesHint(code);
                } else if (!code && stockNameInput) {
                    // 如果代碼為空，清空名稱
                    stockNameInput.value = '';
                    stockNameInput.placeholder = '例如: 台積電';
                    // 隱藏持股數提示
                    updateDividendCurrentSharesHint('');
                }
            }, 300); // 300ms 延遲，避免頻繁查找
        });
        
        // 失去焦點時也檢查一次（確保即時更新）
        stockCodeInput.addEventListener('blur', () => {
            // 清除延遲，立即執行
            if (inputTimeout) {
                clearTimeout(inputTimeout);
                inputTimeout = null;
            }
            
            const code = stockCodeInput.value.trim();
            if (code && stockNameInput) {
                const stockName = findStockName(code);
                if (stockName) {
                    stockNameInput.value = stockName;
                    stockNameInput.placeholder = '例如: 台積電';
                } else if (!stockNameInput.value) {
                    // 如果沒有找到且名稱為空，使用代碼作為名稱
                    stockNameInput.value = code;
                    stockNameInput.placeholder = '未找到，請手動輸入';
                }
                // 更新當前持股數提示
                updateDividendCurrentSharesHint(code);
            } else {
                // 如果代碼為空，隱藏持股數提示
                updateDividendCurrentSharesHint('');
            }
        });
    }
    
    // 自動計算實收金額（每股股息 × 股數）
    const calculateAmount = () => {
        const perShare = parseFloat(perShareInput?.value) || 0;
        const shares = parseInt(sharesInput?.value) || 0;
        if (perShare > 0 && shares > 0 && amountInput) {
            const amount = perShare * shares;
            amountInput.value = amount.toFixed(2);
        }
    };
    
    if (perShareInput) {
        perShareInput.addEventListener('input', calculateAmount);
    }
    if (sharesInput) {
        sharesInput.addEventListener('input', calculateAmount);
    }
    
    // 返回按鈕
    if (backBtn) {
        // 移除舊的事件監聽器，避免重複綁定
        backBtn.onclick = null;
        backBtn.addEventListener('click', () => {
            goBackToLedger();
        });
    }
    
    // 保存按鈕
    if (saveBtn) {
        saveBtn.onclick = () => {
            saveDividendRecord();
        };
    }
}

// 保存股息記錄
function saveDividendRecord() {
    const stockCodeInput = document.getElementById('dividendStockCodeInput');
    const stockNameInput = document.getElementById('dividendStockNameInput');
    const dateInput = document.getElementById('dividendDateInput');
    const perShareInput = document.getElementById('dividendPerShareInput');
    const historicalPerShareInput = document.getElementById('dividendHistoricalPerShareInput');
    const sharesInput = document.getElementById('dividendSharesInput');
    const amountInput = document.getElementById('dividendAmountInput');
    const feeInput = document.getElementById('dividendFeeInput');
    const reinvestInput = document.getElementById('dividendReinvestInput');
    const noteInput = document.getElementById('dividendNoteInput');
    
    const stockCode = stockCodeInput?.value.trim() || '';
    const stockName = stockNameInput?.value.trim() || findStockName(stockCode) || stockCode;
    const date = dateInput?.value || '';
    const perShare = parseFloat(perShareInput?.value) || 0;
    const shares = parseInt(sharesInput?.value) || 0;
    const amount = parseFloat(amountInput?.value) || 0;
    const fee = parseFloat(feeInput?.value) || 0;
    const reinvest = reinvestInput?.checked || false;
    const note = noteInput?.value.trim() || '';
    
    // 驗證
    if (!stockCode || !date || perShare <= 0 || shares <= 0 || amount <= 0) {
        alert('請填寫所有必填欄位');
        return;
    }
    
    // 創建記錄
    const record = {
        type: 'dividend',
        stockCode: stockCode,
        stockName: stockName,
        date: date,
        dividendType: window.dividendType || 'cash',
        perShare: perShare,
        shares: shares,
        amount: amount,
        fee: fee,
        reinvest: reinvest,
        note: note,
        timestamp: new Date().toISOString()
    };
    
    // 保存到 localStorage
    let records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    records.push(record);
    
    // 如果是現金股利且選擇再投入，自動創建買入記錄
    if (record.dividendType === 'cash' && reinvest && amount > 0) {
        // 優先使用現價，如果沒有現價則使用平均成本，都沒有則提示用戶輸入
        const savedPrice = getStockCurrentPrice(stockCode); // 獲取保存的現價
        const portfolio = getPortfolio();
        const stock = portfolio.find(s => s.stockCode === stockCode);
        const avgCost = stock && stock.avgCost > 0 ? stock.avgCost : 0;
        
        // 優先使用現價，其次使用平均成本
        let buyPrice = savedPrice || avgCost || 0;
        
        // 如果都沒有價格，提示用戶輸入
        if (buyPrice <= 0) {
            const userPrice = prompt(`請輸入 ${stockName} (${stockCode}) 的現價（用於計算股利再投入的股數）：`);
            if (userPrice && parseFloat(userPrice) > 0) {
                buyPrice = parseFloat(userPrice);
            } else {
                // 用戶取消或輸入無效，不創建買入記錄
                console.log('未輸入價格，跳過股利再投入買入記錄');
            }
        }
        
        // 如果有有效的買入價格，計算並創建買入記錄
        if (buyPrice > 0) {
            const fee = calculateInvestmentFee(amount, Math.floor(amount / buyPrice));
            const availableAmount = amount - fee; // 扣除手續費後可用金額
            const buyShares = Math.floor(availableAmount / buyPrice); // 向下取整
            
            if (buyShares > 0) {
                const buyRecord = {
                    type: 'buy',
                    stockCode: stockCode,
                    stockName: stockName,
                    date: date,
                    price: buyPrice,
                    shares: buyShares,
                    fee: fee,
                    isDividendReinvest: true, // 標記為股利再投入
                    dividendRecordId: record.timestamp, // 關聯的股利記錄ID
                    note: `股利再投入（來自 ${date} 現金股利，使用${savedPrice ? '現價' : avgCost ? '平均成本' : '手動輸入價格'}）${note ? ' - ' + note : ''}`,
                    timestamp: new Date().toISOString()
                };
                records.push(buyRecord);
                
                // 創建記帳本轉帳記錄（從現金帳戶轉到投資帳戶）
                try {
                    const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
                    const transferRecord = {
                        type: 'transfer',
                        category: '股票再投入', // 轉帳不顯示分類
                        amount: amount, // 股利金額
                        note: `股利再投入：${stockName} (${stockCode}) ${buyShares}股 @ NT$${buyPrice.toFixed(2)}`,
                        date: date,
                        fromAccount: '現金', // 從現金帳戶
                        toAccount: '投資', // 到投資帳戶
                        linkedInvestment: true,
                        investmentRecordId: buyRecord.timestamp,
                        timestamp: new Date().toISOString()
                    };
                    accountingRecords.push(transferRecord);
                    localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
                    console.log('已創建股利再投入轉帳記錄');
                } catch (e) {
                    console.warn('創建股利再投入轉帳記錄失敗:', e);
                }
            } else {
                // 顯示通知：不足以買入至少1股
                const availableAmount = amount - fee;
                alert(`⚠️ 股利再投入金額不足\n\n股利金額：NT$${amount.toLocaleString('zh-TW')}\n手續費：NT$${fee.toLocaleString('zh-TW')}\n可用金額：NT$${availableAmount.toLocaleString('zh-TW')}\n股票現價：NT$${buyPrice.toFixed(2)}\n\n可用金額不足以買入至少1股（需要至少 NT$${(buyPrice + fee).toLocaleString('zh-TW')}）`);
            }
        }
    }
    
    localStorage.setItem('investmentRecords', JSON.stringify(records));
    
    // 播放入帳音效（股息入帳）
    playIncomeSound();
    
    // 觸發小森對話系統（股息收入）
    // 創建一個記帳記錄格式的對象用於觸發對話
    const accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const dividendAccountingRecord = {
        type: 'income',
        category: '股息',
        amount: amount,
        date: date,
        timestamp: record.timestamp
    };
    if (typeof checkAndTriggerMoriDialog === 'function') {
        checkAndTriggerMoriDialog(dividendAccountingRecord, accountingRecords);
    }
    
    // 重置表單
    if (stockCodeInput) stockCodeInput.value = '';
    if (stockNameInput) stockNameInput.value = '';
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    if (perShareInput) perShareInput.value = '0';
    if (historicalPerShareInput) historicalPerShareInput.value = '';
    if (sharesInput) sharesInput.value = '0';
    if (amountInput) amountInput.value = '0';
    if (reinvestInput) reinvestInput.checked = false;
    if (noteInput) noteInput.value = '';
    
    // 返回投資總覽
    const dividendInputPage = document.getElementById('dividendInputPage');
    const dividendPage = document.getElementById('dividendPage');
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const inputPage = document.getElementById('investmentInputPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    // 隱藏所有投資相關頁面
    if (dividendInputPage) dividendInputPage.style.display = 'none';
    if (dividendPage) dividendPage.style.display = 'none';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) inputPage.style.display = 'none';
    
    // 顯示投資總覽
    if (overview) overview.style.display = 'block';
    
    // 顯示底部導航欄和操作按鈕
    if (bottomNav) bottomNav.style.display = 'flex';
    if (investmentActions) investmentActions.style.display = 'flex';
    
    // 更新顯示
    updateInvestmentOverview();
    alert('股息記錄已儲存！🎉');
}

// 顯示股息頁面
function showDividendPage() {
    const dividendPage = document.getElementById('dividendPage');
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const inputPage = document.getElementById('investmentInputPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    if (overview) overview.style.display = 'none';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) inputPage.style.display = 'none';
    if (dividendPage) {
        dividendPage.style.display = 'block';
        updateDividendPage();
        // 隱藏底部導航欄
        if (bottomNav) bottomNav.style.display = 'none';
        // 隱藏操作按鈕
        if (investmentActions) investmentActions.style.display = 'none';
        
        // 初始化返回按鈕（返回到投資專區）
        const dividendBackBtn = document.getElementById('dividendBackBtn');
        if (dividendBackBtn) {
            // 移除舊的事件監聽器，避免重複綁定
            dividendBackBtn.onclick = null;
            dividendBackBtn.addEventListener('click', () => {
                // 返回到投資專區總覽
                if (overview) overview.style.display = 'block';
                if (detailPage) detailPage.style.display = 'none';
                if (inputPage) inputPage.style.display = 'none';
                if (dividendPage) dividendPage.style.display = 'none';
                
                // 顯示底部導航欄和操作按鈕
                if (bottomNav) bottomNav.style.display = 'flex';
                if (investmentActions) investmentActions.style.display = 'flex';
                
                // 更新投資總覽
                if (typeof updateInvestmentOverview === 'function') {
                    updateInvestmentOverview();
                }
            });
        }
    }
}

// 更新股息頁面
function updateDividendPage() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // 計算本年累積股息
    let yearDividend = 0;
    records.filter(r => r.type === 'dividend' && r.dividendType === 'cash').forEach(record => {
        const recordYear = new Date(record.date).getFullYear();
        if (recordYear === currentYear) {
            yearDividend += record.amount || 0;
        }
    });
    
    // 計算本月已入帳
    let monthDividend = 0;
    records.filter(r => r.type === 'dividend' && r.dividendType === 'cash').forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth) {
            monthDividend += record.amount || 0;
        }
    });
    
    // 更新顯示
    const yearDividendEl = document.getElementById('yearDividendLarge');
    const monthDividendEl = document.getElementById('monthDividend');
    
    if (yearDividendEl) {
        yearDividendEl.textContent = `NT$${yearDividend.toLocaleString('zh-TW')}`;
    }
    if (monthDividendEl) {
        monthDividendEl.textContent = `NT$${monthDividend.toLocaleString('zh-TW')}`;
    }
    
    // 更新股息月曆
    updateDividendCalendar();
    
    // 更新年股息統計
    updateDividendYearStats();
    
    // 更新股息記錄列表
    updateDividendRecordsList();
}

// 更新股息月曆
function updateDividendCalendar() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const currentYear = new Date().getFullYear();
    const dividendRecords = records.filter(r => r.type === 'dividend' && r.dividendType === 'cash');
    
    // 按月份統計
    const monthlyDividend = {};
    dividendRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth() + 1;
        
        if (recordYear === currentYear) {
            const key = `${recordYear}-${String(recordMonth).padStart(2, '0')}`;
            if (!monthlyDividend[key]) {
                monthlyDividend[key] = {
                    month: recordMonth,
                    amount: 0,
                    count: 0
                };
            }
            monthlyDividend[key].amount += record.amount || 0;
            monthlyDividend[key].count += 1;
        }
    });
    
    const calendarGrid = document.getElementById('dividendCalendarGrid');
    if (!calendarGrid) return;
    
    let html = '';
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    for (let month = 1; month <= 12; month++) {
        const key = `${currentYear}-${String(month).padStart(2, '0')}`;
        const data = monthlyDividend[key] || { month, amount: 0, count: 0 };
        const isCurrentMonth = month === new Date().getMonth() + 1;
        
        html += `
            <div class="dividend-calendar-item ${isCurrentMonth ? 'current-month' : ''} ${data.amount > 0 ? 'has-dividend' : ''}">
                <div class="dividend-calendar-month">${monthNames[month - 1]}</div>
                <div class="dividend-calendar-amount">NT$${data.amount.toLocaleString('zh-TW')}</div>
                ${data.count > 0 ? `<div class="dividend-calendar-count">${data.count} 筆</div>` : '<div class="dividend-calendar-count empty">無記錄</div>'}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = html;
}

// 更新年股息統計
function updateDividendYearStats() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const dividendRecords = records.filter(r => r.type === 'dividend' && r.dividendType === 'cash');
    
    // 按年份統計
    const yearlyDividend = {};
    dividendRecords.forEach(record => {
        const recordYear = new Date(record.date).getFullYear();
        if (!yearlyDividend[recordYear]) {
            yearlyDividend[recordYear] = {
                year: recordYear,
                amount: 0,
                count: 0
            };
        }
        yearlyDividend[recordYear].amount += record.amount || 0;
        yearlyDividend[recordYear].count += 1;
    });
    
    const container = document.getElementById('dividendYearStatsContainer');
    if (!container) return;
    
    // 按年份降序排列
    const sortedYears = Object.values(yearlyDividend).sort((a, b) => b.year - a.year);
    
    if (sortedYears.length === 0) {
        container.innerHTML = `
            <div class="dividend-year-stats-empty">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📊</div>
                <div style="color: var(--text-tertiary);">尚無股息記錄</div>
            </div>
        `;
        return;
    }
    
    // 計算總計
    const totalAmount = sortedYears.reduce((sum, y) => sum + y.amount, 0);
    const totalCount = sortedYears.reduce((sum, y) => sum + y.count, 0);
    
    let html = '';
    sortedYears.forEach(yearData => {
        const percentage = totalAmount > 0 ? ((yearData.amount / totalAmount) * 100).toFixed(1) : 0;
        html += `
            <div class="dividend-year-stat-item">
                <div class="dividend-year-stat-header">
                    <div class="dividend-year-stat-year">${yearData.year} 年</div>
                    <div class="dividend-year-stat-amount">NT$${yearData.amount.toLocaleString('zh-TW')}</div>
                </div>
                <div class="dividend-year-stat-details">
                    <div class="dividend-year-stat-count">${yearData.count} 筆記錄</div>
                    <div class="dividend-year-stat-percentage">佔總股息 ${percentage}%</div>
                </div>
                <div class="dividend-year-stat-bar">
                    <div class="dividend-year-stat-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    // 添加總計
    html += `
        <div class="dividend-year-stat-total">
            <div class="dividend-year-stat-total-label">總計</div>
            <div class="dividend-year-stat-total-amount">NT$${totalAmount.toLocaleString('zh-TW')}</div>
            <div class="dividend-year-stat-total-count">共 ${totalCount} 筆記錄</div>
        </div>
    `;
    
    container.innerHTML = html;
}

// 更新股息記錄列表
function updateDividendRecordsList() {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const dividendRecords = records.filter(r => r.type === 'dividend').sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    const list = document.getElementById('dividendRecordsList');
    if (!list) return;
    
    let html = '';
    
    // 添加增加股息按鈕（無論是否有記錄都顯示）
    html += `
        <div class="dividend-add-btn-container">
            <button class="dividend-quick-add-btn" id="dividendQuickAddBtn">
                <span class="dividend-quick-add-icon">➕</span>
                <span class="dividend-quick-add-text">新增股息</span>
            </button>
        </div>
    `;
    
    if (dividendRecords.length === 0) {
        html += `
            <div class="dividend-empty-state">
                <div class="dividend-empty-icon">
                    <img src="./image/1.png" alt="股息" style="width: 83px; height: 83px; opacity: 0.5; object-fit: contain;">
                </div>
                <div class="dividend-empty-text">尚無股息記錄</div>
                <div class="dividend-empty-hint">點擊上方按鈕開始記錄股息</div>
            </div>
        `;
    } else {
        html += dividendRecords.map(r => createRecordCard(r)).join('');
    }
    
    list.innerHTML = html;
    
    // 綁定快捷按鈕事件
    const quickAddBtn = document.getElementById('dividendQuickAddBtn');
    if (quickAddBtn) {
        // 移除舊的事件監聽器，避免重複綁定
        const newQuickAddBtn = quickAddBtn.cloneNode(true);
        quickAddBtn.parentNode.replaceChild(newQuickAddBtn, quickAddBtn);
        
        newQuickAddBtn.addEventListener('click', () => {
            // 顯示股息輸入頁面
            const dividendInputPage = document.getElementById('dividendInputPage');
            const overview = document.getElementById('investmentOverview');
            const detailPage = document.getElementById('stockDetailPage');
            const inputPage = document.getElementById('investmentInputPage');
            const dividendPage = document.getElementById('dividendPage');
            const bottomNav = document.querySelector('.bottom-nav');
            const investmentActions = document.querySelector('.investment-actions');
            
            if (overview) overview.style.display = 'none';
            if (detailPage) detailPage.style.display = 'none';
            if (inputPage) inputPage.style.display = 'none';
            if (dividendPage) dividendPage.style.display = 'none';
            if (dividendInputPage) {
                dividendInputPage.style.display = 'block';
                // 隱藏底部導航欄
                if (bottomNav) bottomNav.style.display = 'none';
                // 隱藏操作按鈕
                if (investmentActions) investmentActions.style.display = 'none';
                // 初始化股息輸入頁面
                initDividendInput();
            }
        });
    }
    
    // 綁定新增股息按鈕事件（卡片上的）
    if (dividendRecords.length > 0) {
        bindRecordOverflowMenu(list);

        list.querySelectorAll('.record-add-dividend-fab').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const stockCode = newBtn.dataset.stockCode;
                const stockName = newBtn.dataset.stockName;
                const perShare = parseFloat(newBtn.dataset.perShare) || 0;
                const shares = parseInt(newBtn.dataset.shares) || 0;
                const dividendType = newBtn.dataset.dividendType || 'cash';
                quickAddDividend(stockCode, stockName, perShare, shares, dividendType);
            });
        });
    }
}

// 成功動畫
function showSuccessAnimation() {
    // 創建慶祝動畫
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '50%';
            confetti.style.background = ['#ff69b4', '#ff9ec7', '#ffc107', '#4caf50'][Math.floor(Math.random() * 4)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 2000);
        }, i * 50);
    }
}

// ========== 定期定額管理功能 ==========

// 定期定額計劃數據結構
// { id, stockCode, stockName, amount, day, enabled, createdAt, lastExecuted }

// 顯示定期定額管理頁面
function showDCAManagementPage() {
    const dcaPage = document.getElementById('dcaManagementPage');
    const overview = document.getElementById('investmentOverview');
    const detailPage = document.getElementById('stockDetailPage');
    const inputPage = document.getElementById('investmentInputPage');
    const dividendPage = document.getElementById('dividendPage');
    const dcaSetupPage = document.getElementById('dcaSetupPage');
    const bottomNav = document.querySelector('.bottom-nav');
    const investmentActions = document.querySelector('.investment-actions');
    
    if (overview) overview.style.display = 'none';
    if (detailPage) detailPage.style.display = 'none';
    if (inputPage) inputPage.style.display = 'none';
    if (dividendPage) dividendPage.style.display = 'none';
    if (dcaSetupPage) dcaSetupPage.style.display = 'none';
    
    if (dcaPage) {
        dcaPage.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'none';
        if (investmentActions) investmentActions.style.display = 'none';
        updateDCAList();
    }
    
    // 綁定返回按鈕（返回到投資專區）
    const backBtn = document.getElementById('dcaBackBtn');
    if (backBtn) {
        backBtn.onclick = null;
        backBtn.addEventListener('click', () => {
            // 返回到投資專區總覽
            if (overview) overview.style.display = 'block';
            if (detailPage) detailPage.style.display = 'none';
            if (inputPage) inputPage.style.display = 'none';
            if (dividendPage) dividendPage.style.display = 'none';
            if (dcaSetupPage) dcaSetupPage.style.display = 'none';
            if (dcaPage) dcaPage.style.display = 'none';
            
            // 顯示底部導航欄和操作按鈕
            if (bottomNav) bottomNav.style.display = 'flex';
            if (investmentActions) investmentActions.style.display = 'flex';
            
            // 更新投資總覽
            if (typeof updateInvestmentOverview === 'function') {
                updateInvestmentOverview();
            }
        });
    }
    
    // 綁定新增按鈕
    const addBtn = document.getElementById('dcaAddBtn');
    if (addBtn) {
        addBtn.onclick = () => {
            playClickSound(); // 播放點擊音效
            showDCASetupPage();
        };
    }
}

// 更新定期定額列表
function updateDCAList() {
    const dcaListContainer = document.getElementById('dcaListContainer');
    if (!dcaListContainer) return;
    
    const dcaPlans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    
    if (dcaPlans.length === 0) {
        dcaListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">尚無定期定額計劃</div>
                <div class="empty-hint">點擊右上角「➕」新增定期定額計劃</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    dcaPlans.forEach(plan => {
        const statusText = plan.enabled ? '啟用中' : '已停用';
        const statusClass = plan.enabled ? 'active' : 'inactive';
        const lastExecuted = plan.lastExecuted ? new Date(plan.lastExecuted).toLocaleDateString('zh-TW') : '尚未執行';

        const executedCount = parseInt(plan.executedCount, 10) || 0;
        const milestone = 12;
        const progressPercent = Math.min(100, Math.round((executedCount / milestone) * 100));
        const badgeHtml = executedCount >= milestone
            ? '<span class="dca-achievement-badge" title="成就達成：第 12 期">🏅</span>'
            : '';
        
        html += `
            <div class="dca-item-card">
                <div class="dca-item-header">
                    <div class="dca-item-icon">📈</div>
                    <div class="dca-item-info">
                        <div class="dca-item-name">${plan.stockName || plan.stockCode}</div>
                        <div class="dca-item-code">${plan.stockCode}</div>
                    </div>
                    <div class="dca-item-status ${statusClass}">${statusText}</div>
                </div>
                <div class="dca-item-body">
                    <div class="dca-item-row">
                        <span class="dca-item-label">每月金額</span>
                        <span class="dca-item-value">NT$${plan.amount.toLocaleString('zh-TW')}</span>
                    </div>
                    <div class="dca-item-row">
                        <span class="dca-item-label">扣款日期</span>
                        <span class="dca-item-value">每月 ${plan.day} 號</span>
                    </div>
                    <div class="dca-item-row">
                        <span class="dca-item-label">上次執行</span>
                        <span class="dca-item-value">${lastExecuted}</span>
                    </div>

                    <div class="dca-progress">
                        <div class="dca-progress-header">
                            <span class="dca-progress-text">累積期數：第 ${executedCount} 期 / ${milestone} 期</span>
                            ${badgeHtml}
                        </div>
                        <div class="dca-progress-bar" aria-label="定期定額進度條">
                            <div class="dca-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>
                <div class="dca-item-actions">
                    <button class="dca-edit-btn" onclick="editDCAPlan('${plan.id}')">編輯</button>
                    <button class="dca-execute-btn" onclick="executeDCAPlan('${plan.id}')">立即執行</button>
                </div>
            </div>
        `;
    });
    
    dcaListContainer.innerHTML = html;
}

// 顯示定期定額設定頁面
function showDCASetupPage(planId = null) {
    const dcaSetupPage = document.getElementById('dcaSetupPage');
    const dcaManagementPage = document.getElementById('dcaManagementPage');
    const titleEl = document.getElementById('dcaSetupTitle');
    const deleteBtn = document.getElementById('dcaDeleteBtn');

    const fromAccountSelect = document.getElementById('dcaFromAccountSelect');
    const settlementAccountSelect = document.getElementById('dcaSettlementAccountSelect');

    const accounts = typeof getAccounts === 'function' ? getAccounts() : [];
    const selectedAccount = typeof getSelectedAccount === 'function' ? getSelectedAccount() : null;

    const fillAccountSelect = (selectEl, selectedId) => {
        if (!selectEl) return;
        const optionsHtml = accounts.map(a => {
            const isSelected = selectedId && a.id === selectedId;
            return `<option value="${a.id}" ${isSelected ? 'selected' : ''}>${a.name || a.id}</option>`;
        }).join('');
        selectEl.innerHTML = optionsHtml;

        // 如果沒選到任何值，給預設
        if ((!selectEl.value || selectEl.value === '') && accounts.length > 0) {
            selectEl.value = selectedId || (selectedAccount ? selectedAccount.id : accounts[0].id);
        }
    };
    
    if (dcaManagementPage) dcaManagementPage.style.display = 'none';
    if (dcaSetupPage) {
        dcaSetupPage.style.display = 'block';
        
        if (planId) {
            // 編輯模式
            const plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
            const plan = plans.find(p => p.id === planId);
            if (plan) {
                document.getElementById('dcaStockCodeInput').value = plan.stockCode;
                document.getElementById('dcaStockNameInput').value = plan.stockName || '';
                document.getElementById('dcaAmountInput').value = plan.amount;
                document.getElementById('dcaDayInput').value = plan.day;
                document.getElementById('dcaFeeInput').value = plan.customFee || 0;
                document.getElementById('dcaAutoFeeCheckbox').checked = plan.autoFee || false;
                document.getElementById('dcaEnabledInput').checked = plan.enabled;

                // 方案 B：帳戶設定（舊資料若沒有，使用目前選擇帳戶作為預設）
                const defaultFrom = plan.fromAccountId || (selectedAccount ? selectedAccount.id : (accounts[0]?.id || ''));
                const defaultSettlement = plan.settlementAccountId || defaultFrom;
                fillAccountSelect(fromAccountSelect, defaultFrom);
                fillAccountSelect(settlementAccountSelect, defaultSettlement);

                if (titleEl) titleEl.textContent = '編輯定期定額';
                if (deleteBtn) deleteBtn.style.display = 'block';
                window.editingDCAPlanId = planId;
            }
        } else {
            // 新增模式
            document.getElementById('dcaStockCodeInput').value = '';
            document.getElementById('dcaStockNameInput').value = '';
            document.getElementById('dcaAmountInput').value = '';
            document.getElementById('dcaDayInput').value = '1';
            document.getElementById('dcaFeeInput').value = '0';
            document.getElementById('dcaAutoFeeCheckbox').checked = false;
            document.getElementById('dcaEnabledInput').checked = true;

            // 新增模式：預設用目前選擇帳戶（若存在）
            const defaultFrom = selectedAccount ? selectedAccount.id : (accounts[0]?.id || '');
            const defaultSettlement = defaultFrom;
            fillAccountSelect(fromAccountSelect, defaultFrom);
            fillAccountSelect(settlementAccountSelect, defaultSettlement);

            if (titleEl) titleEl.textContent = '新增定期定額';
            if (deleteBtn) deleteBtn.style.display = 'none';
            window.editingDCAPlanId = null;
        }
    }
    
    // 綁定返回按鈕（返回到定期定額管理頁面）
    const backBtn = document.getElementById('dcaSetupBackBtn');
    if (backBtn) {
        backBtn.onclick = null;
        backBtn.addEventListener('click', () => {
            // 返回到定期定額管理頁面
            showDCAManagementPage();
        });
    }
    
    // 綁定保存按鈕
    const saveBtn = document.getElementById('dcaSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            playClickSound(); // 播放點擊音效
            saveDCAPlan();
        };
    }
    
    // 綁定刪除按鈕
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm('確定要刪除此定期定額計劃嗎？')) {
                deleteDCAPlan(window.editingDCAPlanId);
            }
        };
    }
    
    // 股票代碼自動填入股票名稱（使用全局查找函數）
    const stockCodeInput = document.getElementById('dcaStockCodeInput');
    const stockNameInput = document.getElementById('dcaStockNameInput');
    if (stockCodeInput && stockNameInput) {
        // 失去焦點時查找並填入股票名稱
        stockCodeInput.addEventListener('blur', () => {
            const code = stockCodeInput.value.trim();
            if (code && stockNameInput) {
                const stockName = window.findStockName ? window.findStockName(code) : null;
                if (stockName) {
                    stockNameInput.value = stockName;
                } else if (!stockNameInput.value) {
                    // 如果沒有找到且名稱為空，使用代碼作為名稱
                    stockNameInput.value = code;
                }
            }
        });
        
        // 輸入時也實時查找（延遲填入，避免打斷用戶輸入）
        stockCodeInput.addEventListener('input', () => {
            const code = stockCodeInput.value.trim();
            if (code && stockNameInput && !stockNameInput.value) {
                // 如果股票名稱欄位為空，嘗試查找
                const stockName = window.findStockName ? window.findStockName(code) : null;
                if (stockName) {
                    // 使用setTimeout延遲填入，避免打斷用戶輸入
                    setTimeout(() => {
                        if (stockCodeInput.value.trim() === code && !stockNameInput.value) {
                            stockNameInput.value = stockName;
                        }
                    }, 500);
                }
            }
        });
    }
}

// 保存定期定額計劃
function saveDCAPlan() {
    const stockCode = document.getElementById('dcaStockCodeInput').value.trim();
    const stockName = document.getElementById('dcaStockNameInput').value.trim();
    const amount = parseFloat(document.getElementById('dcaAmountInput').value);
    const day = parseInt(document.getElementById('dcaDayInput').value);

    const fromAccountId = document.getElementById('dcaFromAccountSelect')?.value || '';
    const settlementAccountId = document.getElementById('dcaSettlementAccountSelect')?.value || '';
    const feeInput = document.getElementById('dcaFeeInput');
    const autoFeeCheckbox = document.getElementById('dcaAutoFeeCheckbox');
    const autoFee = autoFeeCheckbox?.checked || false;
    const customFee = parseFloat(feeInput?.value) || 0;
    const enabled = document.getElementById('dcaEnabledInput').checked;
    
    if (!stockCode || !amount || !day) {
        alert('請填寫所有必填欄位');
        return;
    }
    
    if (amount <= 0) {
        alert('投資金額必須大於0');
        return;
    }
    
    if (day < 1 || day > 28) {
        alert('扣款日期必須在1-28號之間');
        return;
    }

    if (!fromAccountId || !settlementAccountId) {
        alert('請選擇扣款銀行帳戶與交割帳戶');
        return;
    }
    
    let plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    
    if (window.editingDCAPlanId) {
        // 編輯模式
        const index = plans.findIndex(p => p.id === window.editingDCAPlanId);
        if (index !== -1) {
            plans[index] = {
                ...plans[index],
                stockCode,
                stockName: stockName || stockCode,
                amount,
                day,
                customFee,
                autoFee,
                enabled,
                fromAccountId,
                settlementAccountId
            };
        }
    } else {
        // 新增模式
        const newPlan = {
            id: Date.now().toString(),
            stockCode,
            stockName: stockName || stockCode,
            amount,
            day,
            customFee,
            autoFee,
            enabled,
            fromAccountId,
            settlementAccountId,
            createdAt: new Date().toISOString(),
            lastExecuted: null,
            executedCount: 0
        };
        plans.push(newPlan);
    }
    
    localStorage.setItem('dcaPlans', JSON.stringify(plans));
    showDCAManagementPage();
}

// 編輯定期定額計劃
function editDCAPlan(planId) {
    showDCASetupPage(planId);
}

// 刪除定期定額計劃
function deleteDCAPlan(planId) {
    let plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    const planToDelete = plans.find(p => p.id === planId);
    
    if (!planToDelete) {
        alert('找不到要刪除的定期定額計劃');
        return;
    }
    
    // 確認刪除
    if (!confirm(`確定要刪除此定期定額計劃嗎？\n\n股票：${planToDelete.stockName || planToDelete.stockCode} (${planToDelete.stockCode})\n金額：NT$${planToDelete.amount.toLocaleString('zh-TW')}\n\n⚠️ 注意：這將同時刪除所有相關的投資記錄和記帳支出記錄！`)) {
        return;
    }
    
    const stockCode = planToDelete.stockCode;
    
    // 1. 刪除所有相關的投資記錄（isDCA: true 且 stockCode 匹配）
    let investmentRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    const dcaInvestmentRecords = investmentRecords.filter(r => 
        r.type === 'buy' && 
        r.isDCA === true && 
        r.stockCode === stockCode
    );
    
    // 收集要刪除的投資記錄的 timestamp（用於匹配記帳記錄）
    // 統一轉換為字符串進行比較
    const investmentRecordIds = dcaInvestmentRecords.map(r => {
        const id = r.timestamp || r.id;
        return id ? String(id) : null;
    }).filter(id => id !== null);
    
    console.log('要刪除的投資記錄數量:', dcaInvestmentRecords.length);
    console.log('投資記錄 IDs:', investmentRecordIds);
    
    // 從投資記錄中刪除
    investmentRecords = investmentRecords.filter(r => 
        !(r.type === 'buy' && r.isDCA === true && r.stockCode === stockCode)
    );
    localStorage.setItem('investmentRecords', JSON.stringify(investmentRecords));
    
    // 2. 刪除所有相關的記帳記錄（現在是 transfer，舊資料可能仍是 expense）
    // 方法1：通過 investmentRecordId 匹配
    // 方法2：通過 note 中包含股票代碼和「定期定額」匹配（備用方案）
    let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    // 找出要刪除的記帳記錄
    const recordsToDelete = accountingRecords.filter(r => {
        // 方法1：通過 investmentRecordId 匹配
        if (r.linkedInvestment === true && r.investmentRecordId) {
            const recordId = String(r.investmentRecordId);
            if (investmentRecordIds.includes(recordId)) {
                return true;
            }
        }
        
        // 方法2：通過 note 匹配（如果 investmentRecordId 匹配失敗）
        if (r.note && r.note.includes('定期定額') && r.note.includes(stockCode)) {
            return true;
        }
        
        return false;
    });
    
    const deletedAccountingCount = recordsToDelete.length;
    console.log('找到要刪除的記帳記錄數量:', deletedAccountingCount);
    console.log('記帳記錄詳情:', recordsToDelete.map(r => ({
        id: r.investmentRecordId,
        note: r.note,
        amount: r.amount
    })));
    
    // 從記帳記錄中刪除
    accountingRecords = accountingRecords.filter(r => {
        // 方法1：通過 investmentRecordId 匹配
        if (r.linkedInvestment === true && r.investmentRecordId) {
            const recordId = String(r.investmentRecordId);
            if (investmentRecordIds.includes(recordId)) {
                return false; // 刪除
            }
        }
        
        // 方法2：通過 note 匹配
        if (r.note && r.note.includes('定期定額') && r.note.includes(stockCode)) {
            return false; // 刪除
        }
        
        return true; // 保留
    });
    
    localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
    
    // 3. 刪除定期定額計劃
    plans = plans.filter(p => p.id !== planId);
    localStorage.setItem('dcaPlans', JSON.stringify(plans));
    
    // 4. 更新所有相關顯示
    updateInvestmentSummary();
    updatePortfolioList();
    updateInvestmentRecords();
    updateInvestmentOverview();
    
    // 更新記帳本顯示
    if (typeof updateLedgerSummary === 'function') {
        updateLedgerSummary(accountingRecords);
    }
    if (typeof displayLedgerTransactions === 'function') {
        displayLedgerTransactions(accountingRecords);
    }
    
    // 如果正在查看該股票的詳情頁面，需要更新
    const stockDetailPage = document.getElementById('stockDetailPage');
    if (stockDetailPage && stockDetailPage.style.display !== 'none') {
        const currentStockCode = document.getElementById('stockDetailCode')?.textContent;
        if (currentStockCode === stockCode) {
            showStockDetailPage(stockCode);
        }
    }
    
    // 顯示刪除結果
    const deletedInvestmentCount = dcaInvestmentRecords.length;
    alert(`定期定額計劃已刪除！\n\n已刪除：\n- ${deletedInvestmentCount} 筆投資記錄\n- ${deletedAccountingCount} 筆記帳支出記錄`);
    
    // 返回管理頁面
    showDCAManagementPage();
}

// 執行定期定額計劃（手動觸發）
function executeDCAPlan(planId) {
    const plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
        alert('找不到此定期定額計劃');
        return;
    }
    
    if (!plan.enabled) {
        alert('此定期定額計劃已停用');
        return;
    }
    
    // 執行定期定額扣款
    executeDCATransaction(plan);
}

// 獲取股票參考價格（從投資記錄中查找最近一次的買入價格）
function getStockReferencePrice(stockCode) {
    const records = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    
    // 查找該股票最近的買入記錄
    const buyRecords = records
        .filter(r => r.type === 'buy' && r.stockCode === stockCode)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (buyRecords.length > 0) {
        // 返回最近一次的買入價格
        return buyRecords[0].price;
    }
    
    // 如果沒有買入記錄，從持股中查找平均成本
    const portfolio = getPortfolio();
    const stock = portfolio.find(s => s.stockCode === stockCode);
    if (stock && stock.avgCost > 0) {
        return stock.avgCost;
    }
    
    return null;
}

// 執行定期定額交易
function executeDCATransaction(plan) {
    // 獲取參考價格
    const referencePrice = getStockReferencePrice(plan.stockCode);
    
    // 顯示執行對話框
    const modal = document.getElementById('dcaExecuteModal');
    const stockNameEl = document.getElementById('dcaExecuteStockName');
    const stockCodeEl = document.getElementById('dcaExecuteStockCode');
    const referencePriceEl = document.getElementById('dcaExecuteReferencePrice');
    const referencePriceValueEl = document.getElementById('dcaExecuteReferencePriceValue');
    const priceInput = document.getElementById('dcaExecutePriceInput');
    const priceHintEl = document.getElementById('dcaExecutePriceHint');
    const previewEl = document.getElementById('dcaExecutePreview');
    const sharesEl = document.getElementById('dcaExecuteShares');
    const feeEl = document.getElementById('dcaExecuteFee');
    const totalEl = document.getElementById('dcaExecuteTotal');
    const confirmBtn = document.getElementById('dcaExecuteConfirm');
    const cancelBtn = document.getElementById('dcaExecuteCancel');
    const closeBtn = document.getElementById('dcaExecuteModalClose');
    const resetPriceHint = () => {
        if (!priceHintEl) return;
        priceHintEl.textContent = '';
        priceHintEl.classList.remove('hint-error', 'hint-success');
    };
    resetPriceHint();

    if (!modal) {
        // 如果沒有對話框，使用舊的 prompt 方式
        const referenceText = referencePrice 
            ? `（參考：最近買入價 NT$${referencePrice.toLocaleString('zh-TW')}）` 
            : '';
        const priceInput = prompt(
            `請輸入 ${plan.stockName || plan.stockCode} (${plan.stockCode}) 的當前股價：\n${referenceText}\n\n提示：可從券商APP或網站查詢當前股價`,
            referencePrice ? referencePrice.toString() : ''
        );
        
        if (!priceInput) {
            return;
        }
        
        const price = parseFloat(priceInput);
        if (isNaN(price) || price <= 0) {
            alert('請輸入有效的股價');
            return;
        }
        
        processDCATransaction(plan, price);
        return;
    }
    
    // 設置對話框內容
    if (stockNameEl) stockNameEl.textContent = plan.stockName || plan.stockCode;
    if (stockCodeEl) stockCodeEl.textContent = plan.stockCode;
    
    if (referencePrice) {
        if (referencePriceEl) referencePriceEl.style.display = 'block';
        if (referencePriceValueEl) referencePriceValueEl.textContent = referencePrice.toLocaleString('zh-TW');
        if (priceInput) priceInput.value = referencePrice.toString();
        if (priceHintEl) {
            priceHintEl.textContent = '已套用參考價，可再更新為最新市價';
        }
    } else {
        if (referencePriceEl) referencePriceEl.style.display = 'none';
        if (priceInput) priceInput.value = '';
    }
    
    // 顯示對話框
    modal.style.display = 'flex';
    
    // 計算預覽
    const updatePreview = () => {
        const price = parseFloat(priceInput.value) || 0;
        if (price > 0) {
            // 手續費：檢查是否設定自動計算
            const fee = plan.autoFee ? calculateInvestmentFee(plan.amount) : (plan.customFee || 0);
            const availableAmount = plan.amount - fee;
            const shares = Math.floor(availableAmount / price);
            // 金額無條件進位為整數
            const actualCost = Math.ceil(shares * price + fee);
            
            if (previewEl) previewEl.style.display = 'block';
            if (sharesEl) sharesEl.textContent = `${shares.toLocaleString('zh-TW')} 股`;
            if (feeEl) feeEl.textContent = `NT$${fee.toLocaleString('zh-TW')}`;
            if (totalEl) totalEl.textContent = `NT$${actualCost.toLocaleString('zh-TW')}`;
            
            if (confirmBtn) {
                confirmBtn.disabled = shares <= 0;
                confirmBtn.style.opacity = shares <= 0 ? '0.5' : '1';
            }
        } else {
            if (previewEl) previewEl.style.display = 'none';
            if (confirmBtn) confirmBtn.disabled = true;
        }
    };
    
    // 綁定輸入事件
    if (priceInput) {
        priceInput.oninput = () => {
            priceInput.dataset.userEdited = 'true';
            resetPriceHint();
            updatePreview();
        };
        priceInput.onfocus = () => priceInput.select();
    }

    const tryAutoFillCurrentPrice = async () => {
        if (!priceInput || priceInput.dataset.fetching === 'true') return;
        if (priceInput.dataset.userEdited === 'true') return;
        priceInput.dataset.fetching = 'true';
        if (priceHintEl) {
            priceHintEl.textContent = '自動讀取現價中…';
            priceHintEl.classList.remove('hint-error');
        }
        priceInput.disabled = true;
        priceInput.classList.add('is-loading');
        try {
            const autoPrice = await fetchStockPrice(plan.stockCode, {
                allowPrompt: false,
                maxAgeMs: 60 * 1000
            });
            if (priceInput.dataset.userEdited === 'true') {
                return;
            }
            if (autoPrice && !isNaN(autoPrice)) {
                const numericPrice = Number(autoPrice);
                const displayValue = Number.isFinite(numericPrice)
                    ? (numericPrice % 1 === 0 ? numericPrice.toString() : numericPrice.toFixed(2))
                    : autoPrice.toString();
                priceInput.value = displayValue;
                if (priceHintEl) {
                    priceHintEl.textContent = '已自動套用最新現價';
                    priceHintEl.classList.remove('hint-error');
                    priceHintEl.classList.add('hint-success');
                }
                updatePreview();
            } else if (priceHintEl) {
                priceHintEl.textContent = '無法取得現價，請手動輸入';
                priceHintEl.classList.remove('hint-success');
                priceHintEl.classList.add('hint-error');
            }
        } catch (error) {
            console.warn('自動取得定期定額現價失敗:', error);
            if (priceHintEl) {
                priceHintEl.textContent = '無法取得現價，請手動輸入';
                priceHintEl.classList.remove('hint-success');
                priceHintEl.classList.add('hint-error');
            }
        } finally {
            priceInput.disabled = false;
            priceInput.classList.remove('is-loading');
            delete priceInput.dataset.fetching;
        }
    };
    
    // 綁定確認按鈕
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            playClickSound(); // 播放點擊音效
            const price = parseFloat(priceInput.value) || 0;
            if (price <= 0) {
                alert('請輸入有效的股價');
                return;
            }
            modal.style.display = 'none';
            processDCATransaction(plan, price);
        };
    }
    
    // 綁定取消和關閉按鈕
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (modal.querySelector('.modal-overlay')) {
        modal.querySelector('.modal-overlay').onclick = closeModal;
    }
    
    // 初始化預覽
    updatePreview();
    tryAutoFillCurrentPrice();
}

// 處理定期定額交易（實際執行）
function processDCATransaction(plan, price) {
    
    // 計算可買入的股數（扣除手續費）
    // 手續費：檢查是否設定自動計算
    const fee = plan.autoFee ? calculateInvestmentFee(plan.amount) : (plan.customFee || 0);
    const availableAmount = plan.amount - fee;
    const shares = Math.floor(availableAmount / price);
    
    if (shares <= 0) {
        alert('投資金額不足以購買至少1股');
        return;
    }
    
    // 金額無條件進位為整數（例如 3999.7 → 4000）
    const actualCost = Math.ceil(shares * price + fee);
    const today = new Date().toISOString().split('T')[0];

    // 計算本次執行期數（以執行次數為準：第 N 期）
    const nextCycleNumber = (plan.executedCount || 0) + 1;
    
    // 創建投資記錄
    const investmentRecord = {
        type: 'buy',
        stockCode: plan.stockCode,
        stockName: plan.stockName || plan.stockCode,
        investmentType: 'stock',
        date: today,
        price: price,
        shares: shares,
        fee: fee,
        isDCA: true,
        dcaPlanId: plan.id,
        dcaCycleNumber: nextCycleNumber,
        settlementAccountId: plan.settlementAccountId || plan.fromAccountId || null,
        note: '定期定額自動扣款',
        timestamp: new Date().toISOString()
    };
    
    // 保存投資記錄
    let investmentRecords = JSON.parse(localStorage.getItem('investmentRecords') || '[]');
    investmentRecords.push(investmentRecord);
    localStorage.setItem('investmentRecords', JSON.stringify(investmentRecords));
    
    // 方案 B：在記帳本中記錄「轉帳」：銀行 → 交割帳戶（投資不算生活支出）
    const fromAccountId = plan.fromAccountId || (typeof getSelectedAccount === 'function' ? getSelectedAccount()?.id : null);
    const settlementAccountId = plan.settlementAccountId || fromAccountId;

    const accountingRecord = {
        type: 'transfer',
        category: plan.stockName ? `${plan.stockCode} ${plan.stockName}` : plan.stockCode,
        amount: actualCost,
        fromAccount: fromAccountId,
        toAccount: settlementAccountId,
        note: `定期定額：${plan.stockName || plan.stockCode} (${plan.stockCode}) ${shares}股・第 ${nextCycleNumber} 期`,
        date: today,
        timestamp: new Date().toISOString(),
        linkedInvestment: true,
        investmentRecordId: investmentRecord.timestamp
    };
    
    let accountingRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    accountingRecords.push(accountingRecord);
    localStorage.setItem('accountingRecords', JSON.stringify(accountingRecords));
    
    // 更新定期定額計劃的最後執行時間
    let dcaPlans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    const planIndex = dcaPlans.findIndex(p => p.id === plan.id);
    if (planIndex !== -1) {
        dcaPlans[planIndex].lastExecuted = new Date().toISOString();
        dcaPlans[planIndex].executedCount = nextCycleNumber;
        localStorage.setItem('dcaPlans', JSON.stringify(dcaPlans));
    }

    // 小撒花（每期成功）
    if (typeof showSuccessAnimation === 'function') {
        showSuccessAnimation();
    }
    
    // 更新顯示
    updateInvestmentOverview();
    if (typeof updateDCAList === 'function') {
        updateDCAList();
    }
    if (typeof updateLedgerSummary === 'function') {
        updateLedgerSummary(accountingRecords);
    }
    if (typeof displayLedgerTransactions === 'function') {
        displayLedgerTransactions(accountingRecords);
    }
    
    setTimeout(() => {
        alert(`定期定額扣款成功！\n${plan.stockName || plan.stockCode} (${plan.stockCode})\n${shares}股 @ NT$${price.toLocaleString('zh-TW')}\n總金額：NT$${actualCost.toLocaleString('zh-TW')}\n\n✓ 已自動記錄為「轉帳」（銀行 → 交割）`);
    }, 250);
    
    // 如果是在管理頁面，更新列表
    const dcaPage = document.getElementById('dcaManagementPage');
    if (dcaPage && dcaPage.style.display !== 'none') {
        updateDCAList();
    }
}

// 檢查並執行到期的定期定額計劃（在頁面載入時調用）
function checkAndExecuteDCAPlans() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    const plans = JSON.parse(localStorage.getItem('dcaPlans') || '[]');
    const enabledPlans = plans.filter(p => p.enabled);

    const promptedKey = 'dcaMonthlyPrompted';
    const promptedMap = JSON.parse(localStorage.getItem(promptedKey) || '{}');
    if (!promptedMap[currentMonthKey]) promptedMap[currentMonthKey] = {};
    
    enabledPlans.forEach(plan => {
        // 檢查是否應該執行（扣款日期已到）
        if (currentDay >= plan.day) {
            // 檢查本月是否已執行
            const lastExecuted = plan.lastExecuted ? new Date(plan.lastExecuted) : null;
            const shouldExecute = !lastExecuted || 
                lastExecuted.getFullYear() !== currentYear || 
                lastExecuted.getMonth() + 1 !== currentMonth;
            
            if (shouldExecute) {
                // 避免同一方案同月反覆跳提醒（例如使用者重整頁面）
                const planId = String(plan.id || '');
                if (planId && promptedMap[currentMonthKey] && promptedMap[currentMonthKey][planId]) {
                    return;
                }
                if (planId) {
                    promptedMap[currentMonthKey][planId] = true;
                    localStorage.setItem(promptedKey, JSON.stringify(promptedMap));
                }

                // 提示用戶執行定期定額
                if (confirm(`定期定額計劃提醒：\n${plan.stockName || plan.stockCode} (${plan.stockCode})\n每月 ${plan.day} 號扣款 NT$${plan.amount.toLocaleString('zh-TW')}\n\n是否現在執行？`)) {
                    executeDCATransaction(plan);
                }
            }
        }
    });
}

// 頁面載入時檢查定期定額計劃（在現有的 DOMContentLoaded 中調用）
// 這個函數會在 initInvestmentPage 或其他初始化函數中調用

// ========== 帳戶管理功能 ==========

// 帳戶數據結構
// { id, name, currency, initialBalance, createdAt }

// 獲取所有帳戶
function getAccounts() {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
}

// 保存帳戶列表
function saveAccounts(accounts) {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

// 獲取當前選中的帳戶
function getSelectedAccount() {
    return window.selectedAccount || getDefaultAccount();
}

// 獲取默認帳戶
function getDefaultAccount() {
    const accounts = getAccounts();
    if (accounts.length === 0) {
        // 如果沒有帳戶，返回 null，讓調用者處理
        return null;
    }
    // 返回第一個帳戶作為默認
    return accounts[0];
}

// 計算帳戶餘額
function calculateAccountBalance(accountId) {
    const account = getAccounts().find(a => a.id === accountId);
    if (!account) return 0;
    
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    let balance = account.initialBalance || 0;
    
    records.forEach(record => {
        if (record.type === 'transfer') {
            // 轉帳：不依賴 record.account
            if (record.fromAccount === accountId) {
                balance -= record.amount;
            } else if (record.toAccount === accountId) {
                balance += record.amount;
            }
            return;
        }

        if (record.account === accountId) {
            if (record.type === 'income') {
                balance += record.amount;
            } else if (record.type === 'expense' || !record.type) {
                balance -= record.amount;
            }
        }
    });
    
    return balance;
}

// 顯示帳戶選擇對話框
function showAccountSelectModal() {
    const modal = document.getElementById('accountSelectModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    updateAccountList();
    
    // 綁定關閉按鈕
    const closeBtn = document.getElementById('accountModalClose');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 綁定遮罩點擊關閉
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 綁定新增帳戶按鈕
    const addBtn = document.getElementById('accountAddBtn');
    if (addBtn) {
        addBtn.onclick = () => {
            modal.style.display = 'none';
            showAccountManageModal();
        };
    }
    
    // 綁定帳戶選擇事件
    const accountList = document.getElementById('accountList');
    if (accountList) {
        // 綁定詳情按鈕事件
        accountList.querySelectorAll('.account-detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                e.preventDefault(); // 阻止默認行為
                const accountId = btn.dataset.accountId || btn.closest('.account-item')?.dataset.accountId;
                if (accountId && typeof showAccountDetail === 'function') {
                    showAccountDetail(accountId);
                }
            });
        });
        
        // 綁定編輯按鈕事件
        accountList.querySelectorAll('.account-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                e.preventDefault(); // 阻止默認行為
                const accountId = btn.dataset.accountId || btn.closest('.account-item')?.dataset.accountId;
                if (accountId) {
                    editAccount(accountId);
                }
            });
        });
        
        // 綁定帳戶選擇事件
        accountList.querySelectorAll('.account-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 如果點擊的是編輯或詳情按鈕，不觸發選擇
                if (e.target.classList.contains('account-edit-btn') || e.target.closest('.account-edit-btn') ||
                    e.target.classList.contains('account-detail-btn') || e.target.closest('.account-detail-btn')) {
                    return;
                }
                
                const accountId = item.dataset.accountId;
                const accounts = getAccounts();
                const account = accounts.find(a => a.id === accountId);
                
                if (account) {
                    window.selectedAccount = account;
                    // 更新所有相關顯示
                    updateAllAccountRelatedDisplays();
                    modal.style.display = 'none';
                }
            });
        });
    }
}

// 更新帳戶列表顯示
function updateAccountList() {
    const accountList = document.getElementById('accountList');
    if (!accountList) return;
    
    const accounts = getAccounts();
    const selectedAccount = getSelectedAccount();
    
    if (accounts.length === 0) {
        accountList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 16px;">💳</div>
                <div>尚無帳戶</div>
                <div style="font-size: 12px; margin-top: 8px; color: #ccc;">點擊下方「新增帳戶」開始</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    accounts.forEach(account => {
        const balance = calculateAccountBalance(account.id);
        const isSelected = selectedAccount && selectedAccount.id === account.id;
        
        // 顯示帳戶圖片或默認圖標
        const accountIcon = account.image 
            ? `<img src="${account.image}" alt="${account.name}" class="account-item-icon-image">`
            : '<div class="account-item-icon">💳</div>';
        
        html += `
            <div class="account-item ${isSelected ? 'selected' : ''}" data-account-id="${account.id}">
                ${accountIcon}
                <div class="account-item-info">
                    <div class="account-item-name">${account.name}</div>
                    <div class="account-item-currency">${account.currency}</div>
                </div>
                <div class="account-item-balance">
                    <div class="account-balance-value">${account.currency} $${balance.toLocaleString('zh-TW')}</div>
                </div>
                <button class="account-detail-btn" data-account-id="${account.id}" title="詳情">👁️</button>
                <button class="account-edit-btn" data-account-id="${account.id}" title="編輯">✏️</button>
            </div>
        `;
    });
    
    accountList.innerHTML = html;
}

// 更新所有帳戶相關的顯示
function updateAllAccountRelatedDisplays() {
    // 1. 更新帳戶顯示（記帳輸入頁面）
    updateAccountDisplay();
    
    // 2. 更新帳戶列表（帳戶選擇對話框）
    updateAccountList();
    
    // 3. 更新帳本標題
    updateLedgerTitle();
    
    // 4. 如果記帳本頁面可見，重新初始化
    const pageLedger = document.getElementById('pageLedger');
    if (pageLedger && pageLedger.style.display !== 'none') {
        if (typeof initLedger === 'function') {
            initLedger();
        }
    }
    
    // 4. 如果圖表頁面可見，更新圖表
    const pageChart = document.getElementById('pageChart');
    if (pageChart && pageChart.style.display !== 'none') {
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
    }
    
    // 5. 如果預算頁面可見，重新初始化
    const pageBudget = document.getElementById('pageBudget');
    if (pageBudget && pageBudget.style.display !== 'none') {
        if (typeof initBudget === 'function') {
            initBudget();
        }
    }
}

// 更新帳戶顯示
function updateAccountDisplay() {
    const accountInfo = document.querySelector('.account-info');
    const selectedAccount = getSelectedAccount();
    
    if (accountInfo) {
        if (selectedAccount) {
            const balance = calculateAccountBalance(selectedAccount.id);
            // 美化帳戶信息顯示
            accountInfo.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, rgba(255, 182, 217, 0.15) 0%, rgba(255, 158, 199, 0.1) 100%); border-radius: 8px; border: 1px solid rgba(255, 182, 217, 0.3);">
                    <span style="font-size: 14px;">💳</span>
                    <span style="font-size: 13px; font-weight: 600; color: #333;">${selectedAccount.name}</span>
                    <span style="font-size: 12px; color: #666; background: rgba(255, 182, 217, 0.2); padding: 2px 6px; border-radius: 4px; font-weight: 500;">${selectedAccount.currency}</span>
                    <span style="font-size: 14px; font-weight: 700; color: #ff69b4; margin-left: 4px;">${balance >= 0 ? '+' : ''}${balance.toLocaleString('zh-TW')}</span>
                </span>
            `;
            accountInfo.style.cursor = '';
            accountInfo.onclick = null;
        } else {
            accountInfo.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, rgba(255, 105, 180, 0.1) 0%, rgba(255, 182, 217, 0.1) 100%); border-radius: 8px; border: 1px dashed #ff69b4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 105, 180, 0.15) 0%, rgba(255, 182, 217, 0.15) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 105, 180, 0.1) 0%, rgba(255, 182, 217, 0.1) 100%)'">
                    <span style="font-size: 14px;">➕</span>
                    <span style="font-size: 13px; font-weight: 600; color: #ff69b4;">點擊創建帳戶</span>
                </span>
            `;
            accountInfo.style.cursor = 'pointer';
            accountInfo.onclick = () => {
                showAccountManageModal();
            };
        }
    }
}

// 顯示帳戶管理對話框
function showAccountManageModal(accountId = null) {
    const modal = document.getElementById('accountManageModal');
    const titleEl = document.getElementById('accountManageTitle');
    const deleteBtn = document.getElementById('accountDeleteBtn');
    
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // 初始化圖片上傳功能
    initAccountImageUpload();
    
    if (accountId) {
        // 編輯模式
        const accounts = getAccounts();
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            document.getElementById('accountNameInput').value = account.name;
            document.getElementById('accountCurrencyInput').value = account.currency;
            document.getElementById('accountBalanceInput').value = account.initialBalance || 0;
            
            // 顯示帳戶圖片
            if (account.image) {
                const previewImg = document.getElementById('accountImagePreviewImg');
                const placeholder = document.getElementById('accountImagePlaceholder');
                const removeBtn = document.getElementById('accountImageRemoveBtn');
                if (previewImg) {
                    previewImg.src = account.image;
                    previewImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (removeBtn) removeBtn.style.display = 'block';
            }
            
            if (titleEl) titleEl.textContent = '編輯帳戶';
            if (deleteBtn) deleteBtn.style.display = 'block';
            window.editingAccountId = accountId;
        }
    } else {
        // 新增模式
        document.getElementById('accountNameInput').value = '';
        document.getElementById('accountCurrencyInput').value = 'TWD';
        document.getElementById('accountBalanceInput').value = '0';
        
        // 重置圖片
        const previewImg = document.getElementById('accountImagePreviewImg');
        const placeholder = document.getElementById('accountImagePlaceholder');
        const removeBtn = document.getElementById('accountImageRemoveBtn');
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'none';
        
        if (titleEl) titleEl.textContent = '新增帳戶';
        if (deleteBtn) deleteBtn.style.display = 'none';
        window.editingAccountId = null;
    }
    
    // 綁定返回按鈕
    const backBtn = document.getElementById('accountManageBackBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            goBackToLedger();
        };
    }
    
    // 綁定關閉按鈕
    const closeBtn = document.getElementById('accountManageClose');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 綁定保存按鈕
    const saveBtn = document.getElementById('accountSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            playClickSound(); // 播放點擊音效
            saveAccount();
        };
    }
    
    // 綁定刪除按鈕
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm('確定要刪除此帳戶嗎？\n注意：刪除帳戶不會刪除相關的記帳記錄。')) {
                deleteAccount(window.editingAccountId);
            }
        };
    }
    
    // 綁定遮罩點擊關閉
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = () => {
            modal.style.display = 'none';
        };
    }
}

// 保存帳戶
function saveAccount() {
    const name = document.getElementById('accountNameInput').value.trim();
    const currency = document.getElementById('accountCurrencyInput').value;
    const balance = parseFloat(document.getElementById('accountBalanceInput').value) || 0;
    
    // 獲取帳戶圖片
    const previewImg = document.getElementById('accountImagePreviewImg');
    const accountImage = previewImg && previewImg.style.display !== 'none' ? previewImg.src : null;
    
    if (!name) {
        alert('請輸入帳戶名稱');
        return;
    }
    
    let accounts = getAccounts();
    
    if (window.editingAccountId) {
        // 編輯模式
        const index = accounts.findIndex(a => a.id === window.editingAccountId);
        if (index !== -1) {
            accounts[index] = {
                ...accounts[index],
                name,
                currency,
                initialBalance: balance,
                image: accountImage
            };
        }
    } else {
        // 新增模式
        const newAccount = {
            id: Date.now().toString(),
            name,
            currency,
            initialBalance: balance,
            image: accountImage,
            createdAt: new Date().toISOString()
        };
        accounts.push(newAccount);
    }
    
    saveAccounts(accounts);
    
    // 如果是新增帳戶，自動選中
    if (!window.editingAccountId) {
        const newAccount = accounts[accounts.length - 1];
        window.selectedAccount = newAccount;
    } else {
        // 編輯模式，更新選中的帳戶信息
        if (window.selectedAccount && window.selectedAccount.id === window.editingAccountId) {
            const updatedAccount = accounts.find(a => a.id === window.editingAccountId);
            if (updatedAccount) {
                window.selectedAccount = updatedAccount;
            }
        }
    }
    
    // 關閉對話框
    document.getElementById('accountManageModal').style.display = 'none';
    
    // 更新所有相關顯示
    updateAllAccountRelatedDisplays();
    
    // 顯示選擇對話框
    showAccountSelectModal();
}

// 顯示帳戶詳情
function showAccountDetail(accountId) {
    const modal = document.getElementById('accountDetailModal');
    const content = document.getElementById('accountDetailContent');
    if (!modal || !content) return;
    
    const accounts = getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    // 計算當前餘額
    const currentBalance = calculateAccountBalance(accountId);
    const initialBalance = account.initialBalance || 0;
    
    // 獲取相關交易記錄
    const records = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    const accountRecords = records.filter(r => r.account === accountId);
    
    // 統計數據
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let monthIncome = 0;
    let monthExpense = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;
    
    accountRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (record.type === 'income') {
            totalIncome += record.amount || 0;
            if (recordMonth === currentMonth) {
                monthIncome += record.amount || 0;
            }
        } else if (record.type === 'expense' || !record.type) {
            totalExpense += record.amount || 0;
            if (recordMonth === currentMonth) {
                monthExpense += record.amount || 0;
            }
        }
        transactionCount++;
    });
    
    // 格式化創建時間
    const createdAt = account.createdAt ? new Date(account.createdAt) : null;
    const createdDateStr = createdAt ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}` : '未知';
    
    // 生成詳情內容
    const accountIcon = account.image 
        ? `<img src="${account.image}" alt="${account.name}" class="account-detail-icon-image">`
        : '<div class="account-detail-icon">💳</div>';
    
    content.innerHTML = `
        <div class="account-detail-section">
            <div class="account-detail-header">
                ${accountIcon}
                <div class="account-detail-name">${account.name}</div>
            </div>
            <div class="account-detail-balance">
                <div class="balance-label">當前餘額</div>
                <div class="balance-value">${account.currency} $${currentBalance.toLocaleString('zh-TW')}</div>
            </div>
        </div>
        
        <div class="account-detail-section">
            <div class="detail-section-title">基本信息</div>
            <div class="detail-item">
                <span class="detail-label">帳戶名稱</span>
                <span class="detail-value">${account.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">幣別</span>
                <span class="detail-value">${account.currency}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">初始餘額</span>
                <span class="detail-value">${account.currency} $${initialBalance.toLocaleString('zh-TW')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">創建時間</span>
                <span class="detail-value">${createdDateStr}</span>
            </div>
        </div>
        
        <div class="account-detail-section">
            <div class="detail-section-title">本月統計</div>
            <div class="detail-item">
                <span class="detail-label">本月收入</span>
                <span class="detail-value income">+${account.currency} $${monthIncome.toLocaleString('zh-TW')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">本月支出</span>
                <span class="detail-value expense">-${account.currency} $${monthExpense.toLocaleString('zh-TW')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">本月淨額</span>
                <span class="detail-value ${(monthIncome - monthExpense) >= 0 ? 'income' : 'expense'}">${(monthIncome - monthExpense) >= 0 ? '+' : ''}${account.currency} $${(monthIncome - monthExpense).toLocaleString('zh-TW')}</span>
            </div>
        </div>
        
        <div class="account-detail-section">
            <div class="detail-section-title">總計統計</div>
            <div class="detail-item">
                <span class="detail-label">總收入</span>
                <span class="detail-value income">+${account.currency} $${totalIncome.toLocaleString('zh-TW')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">總支出</span>
                <span class="detail-value expense">-${account.currency} $${totalExpense.toLocaleString('zh-TW')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">交易次數</span>
                <span class="detail-value">${transactionCount} 筆</span>
            </div>
        </div>
        
        <div class="account-detail-actions">
            <button class="account-detail-edit-btn" onclick="editAccountFromDetail('${accountId}')">✏️ 編輯帳戶</button>
        </div>
    `;
    
    // 顯示對話框
    modal.style.display = 'flex';
    
    // 綁定關閉按鈕
    const closeBtn = document.getElementById('accountDetailClose');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 綁定返回按鈕
    const backBtn = document.getElementById('accountDetailBackBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            goBackToLedger();
        };
    }
    
    // 綁定遮罩點擊關閉
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = () => {
            modal.style.display = 'none';
        };
    }
}

// 從詳情頁面編輯帳戶
function editAccountFromDetail(accountId) {
    const detailModal = document.getElementById('accountDetailModal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
    showAccountManageModal(accountId);
}

// 編輯帳戶
function editAccount(accountId) {
    const selectModal = document.getElementById('accountSelectModal');
    if (selectModal) {
        selectModal.style.display = 'none';
    }
    showAccountManageModal(accountId);
}

// 刪除帳戶
function deleteAccount(accountId) {
    let accounts = getAccounts();
    accounts = accounts.filter(a => a.id !== accountId);
    saveAccounts(accounts);
    
    // 如果刪除的是當前選中的帳戶，切換到默認帳戶
    if (window.selectedAccount && window.selectedAccount.id === accountId) {
        if (accounts.length > 0) {
            window.selectedAccount = accounts[0];
        } else {
            window.selectedAccount = null;
        }
    }
    
    // 關閉對話框並更新所有相關顯示
    document.getElementById('accountManageModal').style.display = 'none';
    updateAllAccountRelatedDisplays();
    showAccountSelectModal();
}

// 初始化帳戶管理
function initAccountManagement() {
    // 檢查是否為第一次使用
    const accounts = getAccounts();
    const isFirstTime = accounts.length === 0;
    
    if (isFirstTime) {
        // 第一次使用，直接設置默認選中為空
        window.selectedAccount = null;
        updateAccountDisplay();
    } else {
        // 已有帳戶，設置默認選中
        window.selectedAccount = accounts[0];
        updateAccountDisplay();
    }
}


// ========== 表情選擇功能 ==========

// 常用表情列表
const commonEmojis = [
    '😊', '😄', '😃', '😁', '😆', '😅', '😂', '🤣',
    '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
    '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
    '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
    '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
    '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
    '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
    '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
    '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
    '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
    '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀',
    '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹',
    '😻', '😼', '😽', '🙀', '😿', '😾'
];

// 初始化表情選擇器
function initEmojiSelector() {
    const emojiModal = document.getElementById('emojiSelectModal');
    const emojiGrid = document.getElementById('emojiGrid');
    const emojiModalClose = document.getElementById('emojiModalClose');
    const modalOverlay = emojiModal?.querySelector('.modal-overlay');
    
    if (!emojiModal || !emojiGrid) return;
    
    // 生成表情網格
    emojiGrid.innerHTML = '';
    
    // 添加常用表情
    commonEmojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-item';
        emojiBtn.textContent = emoji;
        emojiBtn.setAttribute('data-emoji', emoji);
        emojiBtn.setAttribute('data-type', 'emoji');
        emojiBtn.addEventListener('click', () => {
            selectEmoji(emoji, 'emoji');
        });
        emojiGrid.appendChild(emojiBtn);
    });
    
    // 添加圖片表情區域
    const imageEmojiSection = document.createElement('div');
    imageEmojiSection.className = 'emoji-section';
    imageEmojiSection.innerHTML = '<div class="emoji-section-title">圖片表情</div>';
    const imageEmojiGrid = document.createElement('div');
    imageEmojiGrid.className = 'emoji-grid image-emoji-grid';
    imageEmojiSection.appendChild(imageEmojiGrid);
    emojiGrid.parentElement.appendChild(imageEmojiSection);
    
    // 載入已保存的圖片表情
    loadImageEmojis(imageEmojiGrid);
    
    // 添加上傳按鈕
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'emoji-upload-btn';
    uploadBtn.innerHTML = '📷 上傳圖片表情';
    uploadBtn.addEventListener('click', () => {
        uploadImageEmoji(imageEmojiGrid);
    });
    imageEmojiSection.appendChild(uploadBtn);
    
    // 關閉對話框
    if (emojiModalClose) {
        emojiModalClose.addEventListener('click', () => {
            hideEmojiSelectModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            hideEmojiSelectModal();
        });
    }
}

// 顯示表情選擇對話框
function showEmojiSelectModal() {
    const emojiModal = document.getElementById('emojiSelectModal');
    if (emojiModal) {
        emojiModal.style.display = 'block';
    }
}

// 隱藏表情選擇對話框
function hideEmojiSelectModal() {
    const emojiModal = document.getElementById('emojiSelectModal');
    if (emojiModal) {
        emojiModal.style.display = 'none';
    }
}

// 選擇表情
function selectEmoji(emoji, type) {
    const emojiBtn = document.querySelector('.emoji-btn');
    if (emojiBtn) {
        if (type === 'emoji') {
            emojiBtn.textContent = emoji;
            window.selectedEmoji = { type: 'emoji', value: emoji };
        } else if (type === 'image') {
            // 對於圖片，顯示一個圖標或縮略圖
            emojiBtn.innerHTML = `<img src="${emoji}" alt="表情" class="emoji-btn-image">`;
            window.selectedEmoji = { type: 'image', value: emoji };
        }
    }
    hideEmojiSelectModal();
}

// 載入已保存的圖片表情
function loadImageEmojis(container) {
    const savedEmojis = JSON.parse(localStorage.getItem('imageEmojis') || '[]');
    savedEmojis.forEach((emojiData, index) => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-item image-emoji-item';
        emojiBtn.innerHTML = `<img src="${emojiData.url}" alt="表情" class="emoji-preview-image">`;
        emojiBtn.setAttribute('data-emoji', emojiData.url);
        emojiBtn.setAttribute('data-type', 'image');
        emojiBtn.addEventListener('click', () => {
            selectEmoji(emojiData.url, 'image');
        });
        container.appendChild(emojiBtn);
    });
}

// 上傳圖片表情
function uploadImageEmoji(container) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // 直接使用原始圖片，不進行裁切
                const imageData = event.target.result;
                
                // 保存圖片表情
                const savedEmojis = JSON.parse(localStorage.getItem('imageEmojis') || '[]');
                const emojiData = {
                    id: Date.now().toString(),
                    url: imageData,
                    createdAt: new Date().toISOString()
                };
                savedEmojis.push(emojiData);
                localStorage.setItem('imageEmojis', JSON.stringify(savedEmojis));
                
                // 添加到表情容器
                if (container) {
                    const emojiBtn = document.createElement('button');
                    emojiBtn.className = 'emoji-item image-emoji-item';
                    emojiBtn.innerHTML = `<img src="${imageData}" alt="表情" class="emoji-preview-image">`;
                    emojiBtn.setAttribute('data-emoji', imageData);
                    emojiBtn.setAttribute('data-type', 'image');
                    emojiBtn.addEventListener('click', () => {
                        selectEmoji(imageData, 'image');
                    });
                    container.appendChild(emojiBtn);
                }
            };
            reader.readAsDataURL(file);
        }
    });
    input.click();
}

// ========== 成員選擇功能 ==========

// 獲取成員列表
function getMembers() {
    return JSON.parse(localStorage.getItem('members') || '[]');
}

// 保存成員列表
function saveMembers(members) {
    localStorage.setItem('members', JSON.stringify(members));
}

// 顯示成員選擇模態框
function showMemberSelectModal() {
    const modal = document.createElement('div');
    modal.className = 'member-select-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10004; display: flex; align-items: center; justify-content: center; overflow-y: auto;';
    
    const members = getMembers();
    const selectedMember = window.selectedMember || null;
    
    let memberListHtml = '';
    if (members.length === 0) {
        memberListHtml = '<div style="text-align: center; padding: 40px; color: #999;">尚無成員<br><small style="font-size: 12px; margin-top: 8px; display: block;">點擊「新增成員」按鈕添加</small></div>';
    } else {
        members.forEach(member => {
            const isSelected = selectedMember === member.name;
            memberListHtml += `
                <div class="member-item ${isSelected ? 'selected' : ''}" data-member-name="${member.name}">
                    <div class="member-item-icon">${member.icon || '👤'}</div>
                    <div class="member-item-name">${member.name}</div>
                    ${isSelected ? '<div class="member-item-check">✓</div>' : ''}
                </div>
            `;
        });
    }
    
    modal.innerHTML = `
        <div class="member-select-content" style="background: white; border-radius: 20px; padding: 24px; max-width: 400px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #333; margin: 0;">👤 選擇成員</h2>
                <button class="member-select-close-btn" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">✕</button>
            </div>
            
            <div class="member-list" style="max-height: 50vh; overflow-y: auto; margin-bottom: 16px;">
                ${memberListHtml}
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button id="addMemberBtn" style="flex: 1; padding: 12px; border: 2px dashed #ffb6d9; border-radius: 12px; background: #fff5f9; color: #ff69b4; font-size: 14px; font-weight: 500; cursor: pointer;">
                    ➕ 新增成員
                </button>
                ${selectedMember ? '<button id="removeMemberBtn" style="padding: 12px 20px; border: 2px solid #f0f0f0; border-radius: 12px; background: #ffffff; color: #666; font-size: 14px; font-weight: 500; cursor: pointer;">清除</button>' : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕
    const closeBtn = modal.querySelector('.member-select-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f5f5f5';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
    }
    
    // 綁定成員選擇
    modal.querySelectorAll('.member-item').forEach(item => {
        item.addEventListener('click', () => {
            const memberName = item.dataset.memberName;
            selectMember(memberName);
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    });
    
    // 綁定新增成員按鈕
    const addMemberBtn = modal.querySelector('#addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            showAddMemberDialog();
        });
    }
    
    // 綁定清除按鈕
    const removeMemberBtn = modal.querySelector('#removeMemberBtn');
    if (removeMemberBtn) {
        removeMemberBtn.addEventListener('click', () => {
            selectMember(null);
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}

// 選擇成員
function selectMember(memberName) {
    window.selectedMember = memberName;
    
    // 更新成員顯示
    const memberDisplay = document.getElementById('memberDisplay');
    const memberInfo = document.getElementById('memberInfo');
    const memberBtn = document.getElementById('memberBtn');
    
    if (memberName) {
        const members = getMembers();
        const member = members.find(m => m.name === memberName);
        if (member) {
            if (memberInfo) memberInfo.textContent = `${member.icon || '👤'} ${member.name}`;
            if (memberDisplay) memberDisplay.style.display = 'block';
            if (memberBtn) memberBtn.style.background = 'linear-gradient(135deg, #ffb6d9 0%, #ff9ec7 100%)';
        }
    } else {
        if (memberInfo) memberInfo.textContent = '未選擇成員';
        if (memberDisplay) memberDisplay.style.display = 'none';
        if (memberBtn) memberBtn.style.background = '#f5f5f5';
    }
}

// 顯示新增成員對話框
function showAddMemberDialog() {
    const memberName = prompt('請輸入成員名稱：', '');
    if (!memberName || !memberName.trim()) {
        return;
    }
    
    const members = getMembers();
    
    // 檢查是否已存在
    if (members.some(m => m.name === memberName.trim())) {
        alert('該成員已存在');
        return;
    }
    
    // 常用圖標列表
    const commonIcons = ['👤', '👨', '👩', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👪', '👨‍👨‍👦', '👩‍👩‍👦', '👨‍👨‍👧', '👩‍👩‍👧', '👨‍👨‍👧‍👦', '👩‍👩‍👧‍👦', '👨‍👨‍👦‍👦', '👩‍👩‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👧‍👧', '👴', '👵', '👶', '👦', '👧', '👨‍🦱', '👩‍🦱', '👨‍🦰', '👩‍🦰', '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲'];
    
    const iconList = commonIcons.map((icon, index) => `${index + 1}. ${icon}`).join('\n');
    const iconInput = prompt(`請選擇成員圖標（輸入編號）：\n\n${iconList}\n\n或直接輸入圖標：`, '👤');
    
    let selectedIcon = '👤';
    if (iconInput) {
        const iconIndex = parseInt(iconInput) - 1;
        if (!isNaN(iconIndex) && iconIndex >= 0 && iconIndex < commonIcons.length) {
            selectedIcon = commonIcons[iconIndex];
        } else if (iconInput.trim().length > 0) {
            selectedIcon = iconInput.trim();
        }
    }
    
    // 添加新成員
    members.push({
        name: memberName.trim(),
        icon: selectedIcon,
        createdAt: new Date().toISOString()
    });
    
    saveMembers(members);
    
    // 顯示成員選擇模態框
    showMemberSelectModal();
}

// ========== 收據圖片查看大圖功能 ==========

// 顯示收據圖片大圖
function showReceiptImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'receipt-image-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10010; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%; display: flex; align-items: center; justify-content: center;">
            <img src="${imageUrl}" alt="收據" style="max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <button class="receipt-image-close-btn" style="position: absolute; top: -40px; right: 0; background: getComputedStyle(document.documentElement).getPropertyValue('--bg-white').trim() || 'var(--bg-white)'; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">✕</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 點擊關閉
    const closeBtn = modal.querySelector('.receipt-image-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
    
    // ESC 鍵關閉
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ========== 帳戶圖片上傳功能 ==========

// 初始化帳戶圖片上傳功能
function initAccountImageUpload() {
    const uploadBtn = document.getElementById('accountImageUploadBtn');
    const imageInput = document.getElementById('accountImageInput');
    const removeBtn = document.getElementById('accountImageRemoveBtn');
    const previewImg = document.getElementById('accountImagePreviewImg');
    const placeholder = document.getElementById('accountImagePlaceholder');
    
    if (!uploadBtn || !imageInput) return;
    
    // 上傳按鈕點擊
    uploadBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    // 文件選擇 - 直接使用原始圖片
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // 直接使用原始圖片，不進行裁切
                const imageData = event.target.result;
                
                // 顯示圖片預覽
                if (previewImg) {
                    previewImg.src = imageData;
                    previewImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (removeBtn) removeBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 移除圖片
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            if (previewImg) {
                previewImg.src = '';
                previewImg.style.display = 'none';
            }
            if (placeholder) placeholder.style.display = 'block';
            removeBtn.style.display = 'none';
        });
    }
}

// 通用模態框控制
const FOCUSABLE_SELECTOR = [
    '[data-autofocus]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

function openModal(modal) {
    if (!modal) return;

    const activeEl = document.activeElement;
    if (activeEl && typeof activeEl.focus === 'function' && !modal.contains(activeEl)) {
        modal._previouslyFocusedElement = activeEl;
    }

    modal.style.display = 'flex';
    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    requestAnimationFrame(() => {
        const focusTarget = modal.querySelector(FOCUSABLE_SELECTOR);
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }
    });
}

function closeModal(modal) {
    if (!modal) return;

    if (modal.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');

    // 如果沒有其他開啟的模態框，移除 body 狀態
    const anyVisibleModal = Array.from(document.querySelectorAll('.modal-overlay'))
        .some(overlay => overlay.style.display === 'flex');
    if (!anyVisibleModal) {
        document.body.classList.remove('modal-open');
    }

    const previousFocus = modal._previouslyFocusedElement;
    if (previousFocus && typeof previousFocus.focus === 'function') {
        requestAnimationFrame(() => previousFocus.focus());
    }
}

// ========== 想買的東西 / 存錢目標功能 ==========

// 數據存儲管理
class WishlistSavingsManager {
    constructor() {
        this.wishlistData = this.loadWishlistData();
        this.savingsData = this.loadSavingsData();
        this.currentEditingItem = null;
        this.currentEditingGoal = null;
        this.currentTab = 'wishlist';
    }

    // 載入想買的東西數據
    loadWishlistData() {
        const data = localStorage.getItem('wishlistData');
        return data ? JSON.parse(data) : [];
    }

    // 載入存錢目標數據
    loadSavingsData() {
        const data = localStorage.getItem('savingsData');
        return data ? JSON.parse(data) : [];
    }

    // 保存想買的東西數據
    saveWishlistData() {
        localStorage.setItem('wishlistData', JSON.stringify(this.wishlistData));
    }

    // 保存存錢目標數據
    saveSavingsData() {
        localStorage.setItem('savingsData', JSON.stringify(this.savingsData));
    }

    // 新增想買的東西項目
    addWishlistItem(item) {
        item.id = Date.now().toString();
        item.createdAt = new Date().toISOString();
        this.wishlistData.push(item);
        this.saveWishlistData();
        return item;
    }

    // 更新想買的東西項目
    updateWishlistItem(id, updates) {
        const index = this.wishlistData.findIndex(item => item.id === id);
        if (index !== -1) {
            this.wishlistData[index] = { ...this.wishlistData[index], ...updates };
            this.saveWishlistData();
            return this.wishlistData[index];
        }
        return null;
    }

    // 刪除想買的東西項目
    deleteWishlistItem(id) {
        this.wishlistData = this.wishlistData.filter(item => item.id !== id);
        this.saveWishlistData();
    }

    // 新增存錢目標
    addSavingsGoal(goal) {
        goal.id = Date.now().toString();
        goal.createdAt = new Date().toISOString();
        goal.currentAmount = parseFloat(goal.currentAmount) || 0;
        goal.monthlyAmount = parseFloat(goal.monthlyAmount) || 0;
        this.savingsData.push(goal);
        this.saveSavingsData();
        return goal;
    }

    // 更新存錢目標
    updateSavingsGoal(id, updates) {
        const index = this.savingsData.findIndex(goal => goal.id === id);
        if (index !== -1) {
            this.savingsData[index] = { ...this.savingsData[index], ...updates };
            this.savingsData[index].currentAmount = parseFloat(this.savingsData[index].currentAmount) || 0;
            this.savingsData[index].monthlyAmount = parseFloat(this.savingsData[index].monthlyAmount) || 0;
            this.saveSavingsData();
            return this.savingsData[index];
        }
        return null;
    }

    // 刪除存錢目標
    deleteSavingsGoal(id) {
        this.savingsData = this.savingsData.filter(goal => goal.id !== id);
        this.saveSavingsData();
    }

    // 計算存錢目標進度
    calculateSavingsProgress(goal) {
        const target = parseFloat(goal.targetAmount) || 0;
        const current = parseFloat(goal.currentAmount) || 0;
        const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const remaining = Math.max(target - current, 0);
        const monthly = parseFloat(goal.monthlyAmount) || 0;
        const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
        
        return {
            percentage,
            remaining,
            monthsNeeded,
            current,
            target
        };
    }
}

// 創建管理器實例
const wishlistSavingsManager = new WishlistSavingsManager();

// 渲染想買的東西列表
function renderWishlistList() {
    const listContainer = document.getElementById('wishlistList');
    if (!listContainer) return;

    const items = wishlistSavingsManager.wishlistData;
    
    if (items.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛍️</div>
                <div class="empty-state-text">還沒有想買的東西</div>
                <div class="empty-state-subtext">點擊上方「➕ 新增項目」開始添加</div>
            </div>
        `;
        return;
    }

    // 按重要性排序
    items.sort((a, b) => (b.importance || 0) - (a.importance || 0));

    listContainer.innerHTML = items.map(item => {
        const importance = item.importance || 0;
        const importanceLabel = importance >= 5
            ? '必買清單'
            : importance >= 4
                ? '超想要'
                : importance >= 3
                    ? '想考慮'
                    : importance > 0
                        ? '靈感收藏'
                        : '尚未評分';
        const importanceTone = importance >= 4 ? 'high' : (importance >= 3 ? 'medium' : 'low');
        const stars = [1, 2, 3, 4, 5].map(i => `<span class="star ${i <= importance ? 'filled' : ''}">★</span>`).join('');
        
        return `
        <div class="wishlist-item" data-id="${item.id}" data-importance="${importance}">
            <div class="wishlist-item-top">
                <div class="wishlist-item-title-group">
                    <span class="wishlist-item-type">${item.type || '生活'}</span>
                    <h3 class="wishlist-item-title">${item.name || '未命名'}</h3>
                    <div class="wishlist-item-meta">
                        <span class="wishlist-chip importance ${importanceTone}">
                            ${importanceLabel}
                        </span>
                        <span class="wishlist-chip wishlist-item-necessary ${item.necessary === '是' ? 'yes' : 'no'}">
                            ${item.necessary === '是' ? '必要' : '非必要'}
                        </span>
                    </div>
                </div>
                <div class="wishlist-item-amount-block">
                    <span class="wishlist-amount-label">預估金額</span>
                    <span class="wishlist-item-amount">NT$${(item.amount || 0).toLocaleString('zh-TW')}</span>
                </div>
            </div>
            
            <div class="wishlist-item-body">
                <div class="wishlist-item-importance" aria-label="重要性 ${importance} 星">
                    ${stars}
                </div>
                ${item.reason ? `
                    <div class="wishlist-info-row">
                        <span class="wishlist-info-label">💡 想買原因</span>
                        <p>${item.reason}</p>
                    </div>
                ` : ''}
                ${item.note ? `
                    <div class="wishlist-info-row">
                        <span class="wishlist-info-label">📝 備註</span>
                        <p>${item.note}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="wishlist-item-actions">
                <button class="wishlist-item-action-btn edit" onclick="editWishlistItem('${item.id}')">編輯</button>
                <button class="wishlist-item-action-btn delete" onclick="deleteWishlistItem('${item.id}')">刪除</button>
            </div>
        </div>
        `;
    }).join('');
}

// 渲染存錢目標列表
function renderSavingsList() {
    const listContainer = document.getElementById('savingsList');
    if (!listContainer) return;

    // 先清理錯誤的資料
    cleanupSavingsData();
    
    const goals = wishlistSavingsManager.loadSavingsData();
    
    if (goals.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <div class="empty-state-text">還沒有存錢目標</div>
                <div class="empty-state-subtext">點擊上方「➕ 新增目標」開始設定</div>
            </div>
        `;
        return;
    }

    // 按優先順序排序
    const priorityOrder = { '高': 3, '中': 2, '低': 1 };
    goals.sort((a, b) => {
        const cleanPriorityA = a.priority || '低';
        const cleanPriorityB = b.priority || '低';
        return (priorityOrder[cleanPriorityB] || 0) - (priorityOrder[cleanPriorityA] || 0);
    });

    listContainer.innerHTML = goals.map(goal => {
        const progress = wishlistSavingsManager.calculateSavingsProgress(goal);
        const statusClass = goal.status === '進行中' ? 'active' : (goal.status === '暫停' ? 'paused' : 'completed');
        
        return `
            <div class="savings-item" data-id="${goal.id}">
                <div class="savings-item-header">
                    <div>
                        <h3 class="savings-item-title">${goal.name || '未命名'}</h3>
                        <div class="savings-item-priority ${(goal.priority || '低').toLowerCase()}">${goal.priority || '低'}</div>
                    </div>
                    <div class="savings-status ${statusClass}">${goal.status || '進行中'}</div>
                </div>
                
                <div class="savings-item-amounts">
                    <div class="savings-amount-item">
                        <div class="savings-amount-label">目標金額</div>
                        <div class="savings-amount-value target">NT$${progress.target.toLocaleString('zh-TW')}</div>
                    </div>
                    <div class="savings-amount-item">
                        <div class="savings-amount-label">目前已存</div>
                        <div class="savings-amount-value current">NT$${progress.current.toLocaleString('zh-TW')}</div>
                    </div>
                </div>
                
                <div class="savings-progress">
                    <div class="savings-progress-bar">
                        <div class="savings-progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                    <div class="savings-progress-text">
                        <span>進度：${progress.percentage.toFixed(1)}%</span>
                        <span>尚差：NT$${progress.remaining.toLocaleString('zh-TW')}</span>
                    </div>
                </div>
                
                ${goal.monthlyAmount > 0 ? `
                    <div class="savings-monthly-info">
                        💳 每月存 NT$${goal.monthlyAmount.toLocaleString('zh-TW')}，預計 ${progress.monthsNeeded} 個月完成
                    </div>
                ` : ''}
                
                ${goal.note ? `<div class="wishlist-item-note"><strong>備註：</strong>${goal.note}</div>` : ''}
                
                <div class="savings-item-actions">
                    <button class="savings-item-action-btn edit" onclick="editSavingsGoal('${goal.id}')">編輯</button>
                    <button class="savings-item-action-btn delete" onclick="deleteSavingsGoal('${goal.id}')">刪除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 顯示想買的東西表單頁面
function showWishlistForm(item = null) {
    const page = document.getElementById('pageWishlistForm');
    const title = document.getElementById('wishlistFormPageTitle');
    
    if (!page || !title) return;
    
    title.textContent = item ? '編輯想買的東西' : '新增想買的東西';
    
    // 重置表單
    document.getElementById('wishlistItemName').value = item ? item.name || '' : '';
    document.getElementById('wishlistItemType').value = item ? item.type || '生活' : '生活';
    document.getElementById('wishlistItemAmount').value = item ? item.amount || '' : '';
    document.getElementById('wishlistItemReason').value = item ? item.reason || '' : '';
    document.getElementById('wishlistItemNote').value = item ? item.note || '' : '';
    
    // 設置重要性
    const importance = item ? item.importance || 0 : 0;
    document.querySelectorAll('.star-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index < importance);
    });
    
    // 設置必要性
    const necessary = item ? item.necessary || '否' : '否';
    const necessaryInput = document.querySelector(`input[name="wishlistItemNecessary"][value="${necessary}"]`);
    if (necessaryInput) necessaryInput.checked = true;
    
    wishlistSavingsManager.currentEditingItem = item;
    
    // 顯示表單頁面，隱藏願望清單頁面
    document.getElementById('pageWishlistSavings').style.display = 'none';
    page.style.display = 'block';
}

// 關閉想買的東西表單頁面
function closeWishlistForm() {
    const page = document.getElementById('pageWishlistForm');
    const wishlistPage = document.getElementById('pageWishlistSavings');
    
    if (page) page.style.display = 'none';
    if (wishlistPage) wishlistPage.style.display = 'block';
    
    wishlistSavingsManager.currentEditingItem = null;
}

// 顯示存錢目標表單
function showSavingsForm(goal = null) {
    const modal = document.getElementById('savingsModal');
    const title = document.getElementById('savingsModalTitle');
    
    if (!modal || !title) return;
    
    title.textContent = goal ? '編輯存錢目標' : '新增存錢目標';
    
    // 重置表單
    document.getElementById('savingsGoalName').value = goal ? goal.name || '' : '';
    document.getElementById('savingsGoalAmount').value = goal ? goal.targetAmount || '' : '';
    document.getElementById('savingsGoalCurrent').value = goal ? goal.currentAmount || '' : '';
    document.getElementById('savingsGoalMonthly').value = goal ? goal.monthlyAmount || '' : '';
    // 載入存錢目標表單時，確保優先順序是正確的值
    const priorityValue = goal ? goal.priority || '中' : '中';
    // 如果優先順序包含日期格式，則重置為預設值
    const cleanPriority = (priorityValue.includes('星期') || priorityValue.match(/^\d{2}-\d{2}/)) ? '中' : priorityValue;
    document.getElementById('savingsGoalPriority').value = cleanPriority;
    document.getElementById('savingsGoalStatus').value = goal ? goal.status || '進行中' : '進行中';
    document.getElementById('savingsGoalNote').value = goal ? goal.note || '' : '';
    
    wishlistSavingsManager.currentEditingGoal = goal;
    
    openModal(modal);
}

// 保存想買的東西
function saveWishlistItem() {
    const name = document.getElementById('wishlistItemName').value.trim();
    const type = document.getElementById('wishlistItemType').value;
    const amount = parseFloat(document.getElementById('wishlistItemAmount').value) || 0;
    const reason = document.getElementById('wishlistItemReason').value.trim();
    const note = document.getElementById('wishlistItemNote').value.trim();
    const importance = document.querySelectorAll('.star-btn.active').length;
    const necessary = document.querySelector('input[name="wishlistItemNecessary"]:checked').value;
    
    if (!name) {
        alert('請輸入項目名稱');
        return;
    }
    
    const itemData = { name, type, amount, reason, note, importance, necessary };
    
    if (wishlistSavingsManager.currentEditingItem) {
        wishlistSavingsManager.updateWishlistItem(wishlistSavingsManager.currentEditingItem.id, itemData);
    } else {
        wishlistSavingsManager.addWishlistItem(itemData);
    }
    
    closeWishlistForm();
    renderWishlistList();
}

// 保存存錢目標
function saveSavingsGoal() {
    const name = document.getElementById('savingsGoalName').value.trim();
    const targetAmount = parseFloat(document.getElementById('savingsGoalAmount').value) || 0;
    const currentAmount = parseFloat(document.getElementById('savingsGoalCurrent').value) || 0;
    const monthlyAmount = parseFloat(document.getElementById('savingsGoalMonthly').value) || 0;
    let priority = document.getElementById('savingsGoalPriority').value;
    // 確保優先順序是有效值，如果包含日期格式則重置為中
    if (priority.includes('星期') || priority.match(/^\d{2}-\d{2}/)) {
        priority = '中';
    }
    const status = document.getElementById('savingsGoalStatus').value;
    const note = document.getElementById('savingsGoalNote').value.trim();
    
    if (!name) {
        alert('請輸入目標名稱');
        return;
    }
    
    if (targetAmount <= 0) {
        alert('請輸入有效的目標金額');
        return;
    }
    
    const goalData = { name, targetAmount, currentAmount, monthlyAmount, priority, status, note };
    
    if (wishlistSavingsManager.currentEditingGoal) {
        wishlistSavingsManager.updateSavingsGoal(wishlistSavingsManager.currentEditingGoal.id, goalData);
    } else {
        wishlistSavingsManager.addSavingsGoal(goalData);
    }
    
    closeSavingsForm();
    renderSavingsList();
}

// 關閉存錢目標表單
function closeSavingsForm() {
    const modal = document.getElementById('savingsModal');
    closeModal(modal);
    wishlistSavingsManager.currentEditingGoal = null;
}

// 編輯想買的東西項目
function editWishlistItem(id) {
    const item = wishlistSavingsManager.wishlistData.find(item => item.id === id);
    if (item) {
        showWishlistForm(item);
    }
}

// 編輯存錢目標
function editSavingsGoal(id) {
    const goal = wishlistSavingsManager.savingsData.find(goal => goal.id === id);
    if (goal) {
        showSavingsForm(goal);
    }
}

// 刪除想買的東西項目
function deleteWishlistItem(id) {
    if (confirm('確定要刪除這個項目嗎？')) {
        wishlistSavingsManager.deleteWishlistItem(id);
        renderWishlistList();
    }
}

// 清理存錢目標資料中的錯誤優先順序值
function cleanupSavingsData() {
    const savingsData = wishlistSavingsManager.loadSavingsData();
    let hasChanges = false;
    
    savingsData.forEach(goal => {
        if (goal.priority && (goal.priority.includes('星期') || goal.priority.match(/^\d{2}-\d{2}/))) {
            goal.priority = '中';
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        wishlistSavingsManager.saveSavingsData();
        console.log('已清理存錢目標資料中的錯誤優先順序值');
    }
}

// 刪除存錢目標
function deleteSavingsGoal(id) {
    if (confirm('確定要刪除這個存錢目標嗎？')) {
        wishlistSavingsManager.deleteSavingsGoal(id);
        renderSavingsList();
    }
}

function switchTab(tabName) {
    // 更新選項卡按鈕狀態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 更新內容顯示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Content`);
    });
    
    wishlistSavingsManager.currentTab = tabName;
    
    // 重新渲染對應的列表
    if (tabName === 'wishlist') {
        renderWishlistList();
    } else {
        renderSavingsList();
    }
}

// 初始化想買的東西/存錢目標頁面
function initWishlistSavingsPage() {
    // 綁定事件監聽器
    const wishlistBackBtn = document.getElementById('wishlistSavingsBackBtn');
    const pageWishlist = document.getElementById('pageWishlistSavings');
    const pageLedger = document.getElementById('pageLedger');
    if (wishlistBackBtn && pageWishlist && pageLedger) {
        wishlistBackBtn.addEventListener('click', () => {
            pageWishlist.style.display = 'none';
            pageLedger.style.display = 'block';
        });
    }
    
    // 選項卡切換
    document.getElementById('wishlistTab')?.addEventListener('click', () => switchTab('wishlist'));
    document.getElementById('savingsTab')?.addEventListener('click', () => switchTab('savings'));
    
    // 新增按鈕
    document.getElementById('addWishlistBtn')?.addEventListener('click', () => showWishlistForm());
    document.getElementById('addSavingsBtn')?.addEventListener('click', () => showSavingsForm());
    
    // 想買的東西表單事件
    document.getElementById('wishlistFormBackBtn')?.addEventListener('click', closeWishlistForm);
    document.getElementById('wishlistFormCancelBtn')?.addEventListener('click', closeWishlistForm);
    document.getElementById('wishlistFormSaveBtn')?.addEventListener('click', saveWishlistItem);
    
    // 存錢目標表單事件
    document.getElementById('savingsModalCloseBtn')?.addEventListener('click', closeSavingsForm);
    document.getElementById('savingsFormCancelBtn')?.addEventListener('click', closeSavingsForm);
    document.getElementById('savingsFormSaveBtn')?.addEventListener('click', saveSavingsGoal);
    const savingsModal = document.getElementById('savingsModal');
    if (savingsModal) {
        savingsModal.addEventListener('click', (e) => {
            if (e.target === savingsModal) {
                closeSavingsForm();
            }
        });
    }
    
    // 星級評分事件
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rating = parseInt(e.target.dataset.rating);
            document.querySelectorAll('.star-btn').forEach((star, index) => {
                star.classList.toggle('active', index < rating);
            });
        });
    });
    
    // 初始渲染
    switchTab('wishlist');
}

// 在頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    initWishlistSavingsPage();
});

// ========== 上傳所有資料到 Google Sheet ==========

// 上傳完整數據到 Google Sheet
function uploadAllDataToGoogleSheet() {
    const uploadUrl = localStorage.getItem('googleSheetUploadUrl');
    const uploadKey = localStorage.getItem('googleCloudBackupKey');
    
    if (!uploadUrl) {
        alert('請先設定 Google Sheet 上傳 URL');
        setGoogleSheetUploadUrl();
        return;
    }
    
    if (!uploadKey) {
        alert('請先設定 Google Cloud 備份金鑰');
        setGoogleCloudBackupKey();
        return;
    }
    
    try {
        // 收集所有數據
        const allData = collectAllData();
        
        // 準備上傳數據
        const uploadData = {
            uploadKey: uploadKey,
            timestamp: new Date().toISOString(),
            dataType: 'completeBackup',
            data: allData
        };
        
        // 顯示上傳進度
        showUploadProgress('正在上傳所有資料...');
        
        // 嘗試多種上傳方法
        attemptMultipleUploadMethods(uploadUrl, uploadData);
        
    } catch (error) {
        hideUploadProgress();
        showUploadError('準備上傳資料時發生錯誤：' + error.message);
    }
}

// 嘗試多種上傳方法
function attemptMultipleUploadMethods(uploadUrl, uploadData) {
    // 方法1：使用 CORS 模式的 fetch
    tryFetchWithCORS(uploadUrl, uploadData)
        .then(() => {
            // 如果成功，結束
        })
        .catch(() => {
            // 方法2：使用表單提交
            tryFormSubmission(uploadUrl, uploadData)
                .then(() => {
                    // 如果成功，結束
                })
                .catch(() => {
                    // 方法3：使用 JSONP 風格
                    tryJSONPStyle(uploadUrl, uploadData)
                        .then(() => {
                            // 如果成功，結束
                        })
                        .catch(() => {
                            // 所有方法都失敗，顯示替代方案
                            hideUploadProgress();
                            showUploadError('所有上傳方法都失敗了，請使用替代方案');
                            showFallbackOptions();
                        });
                });
        });
}

// 方法1：使用 CORS 模式的 fetch
function tryFetchWithCORS(uploadUrl, uploadData) {
    return new Promise((resolve, reject) => {
        fetch(uploadUrl, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(uploadData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP 錯誤！狀態碼：${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            hideUploadProgress();
            if (result.success) {
                showUploadSuccess('所有資料已成功上傳到 Google Sheet！');
                saveBackupHistory('success', '完整備份上傳成功 (CORS)');
                resolve();
            } else {
                showUploadError('上傳失敗：' + (result.error || '未知錯誤'));
                saveBackupHistory('error', result.error || '未知錯誤');
                reject();
            }
        })
        .catch(error => {
            console.warn('CORS 方法失敗：', error);
            reject(error);
        });
    });
}

// 方法2：使用表單提交
function tryFormSubmission(uploadUrl, uploadData) {
    return new Promise((resolve, reject) => {
        try {
            // 創建隱藏的表單
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = uploadUrl;
            form.style.display = 'none';
            form.enctype = 'application/json'; // 設定為 JSON
            
            // 添加數據字段 - 直接作為 JSON 字符串
            const dataField = document.createElement('input');
            dataField.type = 'hidden';
            dataField.name = 'data';
            dataField.value = JSON.stringify(uploadData);
            form.appendChild(dataField);
            
            // 定義回調函數
            window.handleUploadResponse = function(response) {
                hideUploadProgress();
                if (response.success) {
                    showUploadSuccess('所有資料已成功上傳到 Google Sheet！');
                    saveBackupHistory('success', '完整備份上傳成功 (表單)');
                    resolve();
                } else {
                    showUploadError('上傳失敗：' + (response.error || '未知錯誤'));
                    saveBackupHistory('error', response.error || '未知錯誤');
                    reject();
                }
                // 清理回調函數
                delete window.handleUploadResponse;
            };
            
            // 設置超時
            setTimeout(() => {
                if (window.handleUploadResponse) {
                    delete window.handleUploadResponse;
                    reject(new Error('表單提交超時'));
                }
            }, 30000);
            
            // 提交表單
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            
        } catch (error) {
            console.warn('表單提交方法失敗：', error);
            reject(error);
        }
    });
}

// 方法3：使用 JSONP 風格（通過 iframe）
function tryJSONPStyle(uploadUrl, uploadData) {
    return new Promise((resolve, reject) => {
        try {
            // 創建 iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'uploadFrame';
            
            // 創建表單，目標指向 iframe
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = uploadUrl;
            form.target = 'uploadFrame';
            form.style.display = 'none';
            
            // 添加數據
            const dataField = document.createElement('input');
            dataField.type = 'hidden';
            dataField.name = 'data';
            dataField.value = JSON.stringify(uploadData);
            form.appendChild(dataField);
            
            // 監聽 iframe 載入
            iframe.onload = function() {
                try {
                    // 嘗試讀取 iframe 內容
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const content = iframeDoc.body.textContent || iframeDoc.body.innerText;
                    
                    if (content) {
                        const result = JSON.parse(content);
                        hideUploadProgress();
                        if (result.success) {
                            showUploadSuccess('所有資料已成功上傳到 Google Sheet！');
                            saveBackupHistory('success', '完整備份上傳成功 (iframe)');
                            resolve();
                        } else {
                            showUploadError('上傳失敗：' + (result.error || '未知錯誤'));
                            saveBackupHistory('error', result.error || '未知錯誤');
                            reject();
                        }
                    } else {
                        reject(new Error('iframe 無法讀取回應'));
                    }
                } catch (error) {
                    reject(new Error('解析 iframe 回應失敗'));
                } finally {
                    document.body.removeChild(iframe);
                    document.body.removeChild(form);
                }
            };
            
            // 設置超時
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                    document.body.removeChild(form);
                }
                reject(new Error('iframe 方法超時'));
            }, 30000);
            
            // 添加到頁面並提交
            document.body.appendChild(iframe);
            document.body.appendChild(form);
            form.submit();
            
        } catch (error) {
            console.warn('iframe 方法失敗：', error);
            reject(error);
        }
    });
}

// 保存備份歷史
function saveBackupHistory(status, message) {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    history.unshift({
        timestamp: new Date().toISOString(),
        status: status,
        message: message,
        type: 'completeBackup'
    });
    
    // 只保留最近 50 條記錄
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('backupHistory', JSON.stringify(history));
}

// 顯示替代方案
function showFallbackOptions() {
    const fallbackModal = document.createElement('div');
    fallbackModal.id = 'fallbackModal';
    fallbackModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10007;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    fallbackModal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: #333;">🔄 替代備份方案</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                由於雲端上傳失敗，您可以嘗試以下替代方案：
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="downloadBackupFile()" style="
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">
                    💾 下載備份檔案到本機
                </button>
                
                <button onclick="copyDataToClipboard()" style="
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">
                    📋 複製數據到剪貼簿
                </button>
                
                <button onclick="retryUpload()" style="
                    background: linear-gradient(135deg, #4facfe, #00f2fe);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">
                    🔄 重新嘗試上傳
                </button>
                
                <button onclick="checkGoogleScriptSettings()" style="
                    background: linear-gradient(135deg, #43e97b, #38f9d7);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">
                    ⚙️ 檢查 Google Script 設定
                </button>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 14px;">📝 Google Script 設定檢查清單：</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 13px; line-height: 1.4;">
                    <li>Web App 是否已正確部署？</li>
                    <li>權限是否設為 "Anyone" 可以存取？</li>
                    <li>執行權限是否設為 "Execute as me"？</li>
                    <li>URL 是否正確複製？</li>
                    <li>是否有網路連線問題？</li>
                </ul>
            </div>
            
            <button onclick="closeFallbackModal()" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 20px;
                width: 100%;
            ">
                關閉
            </button>
        </div>
    `;
    
    document.body.appendChild(fallbackModal);
}

// 下載備份檔案
function downloadBackupFile() {
    try {
        const allData = collectAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('備份檔案已下載到本機！', 'success');
        closeFallbackModal();
        saveBackupHistory('success', '本機備份檔案下載成功');
    } catch (error) {
        showNotification('下載失敗：' + error.message, 'error');
    }
}

// 複製數據到剪貼簿
function copyDataToClipboard() {
    try {
        const allData = collectAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        
        navigator.clipboard.writeText(dataStr).then(() => {
            showNotification('數據已複製到剪貼簿！', 'success');
            closeFallbackModal();
            saveBackupHistory('success', '數據複製到剪貼簿成功');
        }).catch(err => {
            showNotification('複製失敗：' + err.message, 'error');
        });
    } catch (error) {
        showNotification('複製失敗：' + error.message, 'error');
    }
}

// 重新嘗試上傳
function retryUpload() {
    closeFallbackModal();
    setTimeout(() => {
        uploadAllDataToGoogleSheet();
    }, 500);
}

// 檢查 Google Script 設定
function checkGoogleScriptSettings() {
    const currentUrl = localStorage.getItem('googleSheetUploadUrl');
    const currentKey = localStorage.getItem('googleCloudBackupKey');
    
    let message = '📋 目前設定狀態：\n\n';
    message += `Google Sheet URL：${currentUrl ? '已設定' : '未設定'}\n`;
    message += `備份金鑰：${currentKey ? '已設定' : '未設定'}\n\n`;
    
    if (!currentUrl || !currentKey) {
        message += '❌ 設定不完整，請先完成設定：\n';
        if (!currentUrl) message += '1. 設定 Google Sheet URL\n';
        if (!currentKey) message += '2. 設定備份金鑰\n';
    } else {
        message += '✅ 設定完整\n\n';
        message += '如果仍然失敗，請檢查：\n';
        message += '1. Google Script Web App 是否正確部署\n';
        message += '2. 權限設定是否正確\n';
        message += '3. 網路連線是否正常\n';
        message += '4. URL 是否正確複製\n\n';
        message += '建議：\n';
        message += '- 重新部署 Google Script Web App\n';
        message += '- 檢查執行紀錄中的錯誤訊息';
    }
    
    alert(message);
    
    if (!currentUrl) {
        setGoogleSheetUploadUrl();
    } else if (!currentKey) {
        setGoogleCloudBackupKey();
    }
}

// 關閉替代方案模態框
function closeFallbackModal() {
    const modal = document.getElementById('fallbackModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// 刪除 Google Sheet 中的所有數據
function deleteAllDataFromGoogleSheet() {
    const uploadUrl = localStorage.getItem('googleSheetUploadUrl');
    const uploadKey = localStorage.getItem('googleCloudBackupKey');
    
    if (!uploadUrl) {
        alert('請先設定 Google Sheet 上傳 URL');
        setGoogleSheetUploadUrl();
        return;
    }
    
    if (!uploadKey) {
        alert('請先設定 Google Cloud 備份金鑰');
        setGoogleCloudBackupKey();
        return;
    }
    
    // 確認對話框
    const confirmMessage = `⚠️ 警告：此操作將永久刪除 Google Sheet 中的所有備份數據！

刪除的數據包括：
• 所有記帳記錄
• 想買的東西清單
• 存錢目標
• 分類設定
• 所有備份歷史

此操作無法復原！

確認要繼續嗎？`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 二次確認
    const finalConfirm = prompt('請輸入 "DELETE" 以確認刪除操作：');
    if (finalConfirm !== 'DELETE') {
        alert('刪除操作已取消');
        return;
    }
    
    try {
        // 準備清除數據請求
        const clearData = {
            clearKey: 'CLEAR_ALL_DATA_2026',
            uploadKey: uploadKey,
            timestamp: new Date().toISOString(),
            dataType: 'clearAllData'
        };
        
        // 顯示清除進度
        showClearProgress('正在清除所有資料...');
        
        // 執行清除請求
        fetch(uploadUrl, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(clearData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP 錯誤！狀態碼：${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            hideClearProgress();
            if (result.success) {
                showClearSuccess('所有資料已成功清除！');
                // 記錄清除歷史
                saveBackupHistory('cleared', 'Google Sheet 數據清除成功');
                
                // 顯示詳細結果
                if (result.deletedItems && result.deletedItems.length > 0) {
                    const details = result.deletedItems.join('\n• ');
                    alert(`清除完成！\n\n已處理項目：\n• ${details}`);
                }
            } else {
                showClearError('清除失敗：' + (result.error || '未知錯誤'));
                saveBackupHistory('error', '數據清除失敗: ' + (result.error || '未知錯誤'));
            }
        })
        .catch(error => {
            hideClearProgress();
            console.error('清除詳細錯誤：', error);
            showClearError('清除失敗：' + error.message);
            saveBackupHistory('error', '數據清除失敗: ' + error.message);
        });
        
    } catch (error) {
        hideClearProgress();
        showClearError('準備清除資料時發生錯誤：' + error.message);
    }
}

// 顯示清除進度
function showClearProgress(message) {
    const progressModal = document.createElement('div');
    progressModal.id = 'clearProgressModal';
    progressModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10008;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    progressModal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🗑️</div>
            <h3 style="margin: 0 0 16px 0; color: #dc3545;">清除中</h3>
            <p style="margin: 0; color: #666;">${message}</p>
            <div style="margin-top: 20px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #dc3545, #ff6b6b); animation: loading 1.5s ease-in-out infinite;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;
    
    document.body.appendChild(progressModal);
}

// 隱藏清除進度
function hideClearProgress() {
    const progressModal = document.getElementById('clearProgressModal');
    if (progressModal) {
        document.body.removeChild(progressModal);
    }
}

// 顯示清除成功
function showClearSuccess(message) {
    showNotification(message, 'success');
}

// 顯示清除錯誤
function showClearError(message) {
    showNotification(message, 'error');
}

// 收集所有數據
function collectAllData() {
    return {
        // 記帳記錄
        records: getAllRecords(),
        
        // 想買的東西
        wishlist: wishlistSavingsManager.wishlistData,
        
        // 存錢目標
        savings: wishlistSavingsManager.savingsData,
        
        // 分類設定
        categories: {
            expense: JSON.parse(localStorage.getItem('expenseCategories') || '[]'),
            income: JSON.parse(localStorage.getItem('incomeCategories') || '[]')
        },
        
        // 帳戶設定
        accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
        
        // 設定資料
        settings: {
            theme: localStorage.getItem('theme') || 'default',
            fontSize: localStorage.getItem('fontSize') || 'medium',
            currency: localStorage.getItem('currency') || 'NT$'
        },
        
        // 分期規則
        installmentRules: JSON.parse(localStorage.getItem('installmentRules') || '[]'),
        
        // 常用項目
        frequentItems: JSON.parse(localStorage.getItem('frequentItems') || '[]'),
        
        // 備份歷史
        backupHistory: JSON.parse(localStorage.getItem('backupHistory') || '[]')
    };
}

// 獲取所有記帳記錄
function getAllRecords() {
    const allRecords = [];
    const monthKeys = Object.keys(localStorage).filter(key => key.match(/^\d{4}-\d{2}$/));
    
    monthKeys.forEach(monthKey => {
        try {
            const monthData = JSON.parse(localStorage.getItem(monthKey) || '{}');
            if (monthData.records && Array.isArray(monthData.records)) {
                allRecords.push(...monthData.records.map(record => ({
                    ...record,
                    monthKey: monthKey
                })));
            }
        } catch (error) {
            console.warn('無法解析月份資料：', monthKey, error);
        }
    });
    
    return allRecords;
}

// 顯示上傳進度
function showUploadProgress(message) {
    const progressModal = document.createElement('div');
    progressModal.id = 'uploadProgressModal';
    progressModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10005;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    progressModal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
            <h3 style="margin: 0 0 16px 0; color: #333;">上傳中</h3>
            <p style="margin: 0; color: #666;">${message}</p>
            <div style="margin-top: 20px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #4facfe, #00f2fe); animation: loading 1.5s ease-in-out infinite;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;
    
    document.body.appendChild(progressModal);
}

// 隱藏上傳進度
function hideUploadProgress() {
    const progressModal = document.getElementById('uploadProgressModal');
    if (progressModal) {
        document.body.removeChild(progressModal);
    }
}

// 顯示上傳成功
function showUploadSuccess(message) {
    showNotification(message, 'success');
}

// 顯示上傳錯誤
function showUploadError(message) {
    showNotification(message, 'error');
}

// 顯示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10006;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 自動移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

// 在設置頁面添加上傳所有資料的選項
function addUploadAllDataOption() {
    const settingsSections = [
        {
            title: '🎨 個人化設定',
            items: [
                { icon: '🎨', title: '主題顏色', description: '選擇您喜歡的主題顏色', action: 'theme', accent: 'linear-gradient(135deg, #667eea, #764ba2)', iconGradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                { icon: '📝', title: '字體大小', description: '調整介面字體大小', action: 'fontSize', accent: 'linear-gradient(135deg, #f093fb, #f5576c)', iconGradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                { icon: '🗂️', title: '分類管理', description: '管理收支分類', action: 'categoryManage', accent: 'linear-gradient(135deg, #4facfe, #00f2fe)', iconGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
                            ]
        },
        {
            title: '💾 資料備份',
            items: [
                { icon: '☁️', title: '上傳所有資料', description: '將所有數據上傳到 Google Sheet', action: 'uploadAllData', accent: 'linear-gradient(135deg, #fa709a, #fee140)', iconGradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
                { icon: '💾', title: '本機備份', description: '下載資料到本機', action: 'backup', accent: 'linear-gradient(135deg, #30cfd0, #330867)', iconGradient: 'linear-gradient(135deg, #30cfd0, #330867)' },
                { icon: '📂', title: '本機還原', description: '從本機檔案還原資料', action: 'restore', accent: 'linear-gradient(135deg, #a8edea, #fed6e3)', iconGradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
                { icon: '🔗', title: '設定 Google Sheet URL', description: '設定 Google Sheet 上傳位址', action: 'setGoogleSheetUploadUrl', accent: 'linear-gradient(135deg, #ffecd2, #fcb69f)', iconGradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
                { icon: '🔐', title: '設定雲端備份金鑰', description: '設定 Google Cloud 備份金鑰', action: 'setGoogleCloudBackupKey', accent: 'linear-gradient(135deg, #ff9a9e, #fecfef)', iconGradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' }
            ]
        },
        {
            title: '📊 分析工具',
            items: [
                { icon: '📈', title: '年報', description: '生成年度分析報告', action: 'annualReport', accent: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', iconGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
                { icon: '📑', title: '分期', description: '管理分期與長期支出', action: 'installmentRules', accent: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', iconGradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' }
            ]
        },
        {
            title: '📚 說明與支援',
            items: [
                { icon: '🛍️', title: '想買的東西/存錢目標', description: '管理願望清單和儲蓄計劃', action: 'wishlistSavings', accent: 'linear-gradient(135deg, #667eea, #764ba2)', iconGradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                { icon: '👨‍💻', title: '關於', description: '創作者與版本資訊', action: 'creator', accent: 'linear-gradient(135deg, #d299c2, #fef9d7)', iconGradient: 'linear-gradient(135deg, #d299c2, #fef9d7)' }
            ]
        }
    ];
    
    return settingsSections;
}

// 更新設置頁面事件處理
function updateSettingsEventHandlers() {
    document.querySelectorAll('.settings-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'uploadAllData') {
                uploadAllDataToGoogleSheet();
            } else if (action === 'backup') {
                backupData();
            } else if (action === 'restore') {
                restoreData();
            } else if (action === 'setGoogleSheetUploadUrl') {
                setGoogleSheetUploadUrl();
            } else if (action === 'setGoogleCloudBackupKey') {
                setGoogleCloudBackupKey();
            } else if (action === 'cloudBackupFull') {
                cloudBackupToGoogleSheet();
            } else if (action === 'cloudRestoreFull') {
                cloudRestoreFromGoogleSheet();
            } else if (action === 'uploadAllRecordsDetailsToGoogleSheet') {
                uploadAllRecordsDetailsToGoogleSheet();
            } else if (action === 'uploadRecordsByAccountToGoogleSheet') {
                uploadRecordsByAccountToGoogleSheet();
            } else if (action === 'uploadIncomeExpenseCategorySummaryToGoogleSheet') {
                uploadIncomeExpenseCategorySummaryToGoogleSheet();
            } else if (action === 'creator') {
                showCreatorInfo();
            } else if (action === 'theme') {
                showThemeSelector();
            } else if (action === 'fontSize') {
                showFontSizeSelector();
                        } else if (action === 'annualReport') {
                showAnnualReport();
            } else if (action === 'installmentRules') {
                showInstallmentManagementPage();
            }
        });
    });

}