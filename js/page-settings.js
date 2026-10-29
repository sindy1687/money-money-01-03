// 設定頁面邏輯（由 script.js 拆出）

// 初始化設置頁面
function initSettingsPage() {
    const settingsList = document.getElementById('settingsList');
    if (!settingsList) return;

    // 基本設定選項
    const sections = [
        {
            title: '🎨 個人化',
            items: [
                { icon: '🎨', title: '主題', description: '選擇介面主題', action: 'theme' },
                { icon: '📝', title: '字體大小', description: '調整字體大小', action: 'fontSize' }
            ]
        },
        {
            title: '📊 分析工具',
            items: [
                { icon: '📈', title: '年報', description: '生成年度分析報告', action: 'annualReport' },
                { icon: '📑', title: '分期', description: '管理分期與長期支出', action: 'installmentRules' }
            ]
        },
        {
            title: '☁️ 雲端備份',
            items: [
                { icon: '📤', title: '上傳到 Google Sheet', description: '備份資料到 Google 雲端', action: 'uploadAllData' },
                { icon: '📥', title: '從 Google Sheet 下載', description: '從雲端還原資料', action: 'downloadAllData' },
                { icon: '🗑️', title: '清除 Google Sheet', description: '清除雲端所有資料', action: 'clearAllData' }
            ]
        },
        {
            title: '💾 本地備份',
            items: [
                { icon: '💾', title: '下載備份檔案', description: '匯出本地備份檔案', action: 'downloadBackup' },
                { icon: '📋', title: '複製到剪貼簿', description: '複製資料到剪貼簿', action: 'copyToClipboard' }
            ]
        },
        {
            title: '⚙️ 系統',
            items: [
                { icon: '👨‍💻', title: '關於', description: '應用程式資訊', action: 'about' }
            ]
        }
    ];

    let html = '';
    sections.forEach(section => {
        html += `
            <div class="settings-section">
                <h3 class="settings-section-title">${section.title}</h3>
                <div class="settings-grid">
        `;
        section.items.forEach(item => {
            html += `
                <div class="settings-item" data-action="${item.action}">
                    <div class="settings-item-icon" style="background: ${item.iconGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};">
                        <span style="font-size: 24px;">${item.icon}</span>
                    </div>
                    <div class="settings-item-content">
                        <div class="settings-item-title">${item.title}</div>
                        <div class="settings-item-description">${item.description}</div>
                    </div>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    });
    settingsList.innerHTML = html;
    bindSettingsEvents();
}

// 綁定設定事件
function bindSettingsEvents() {
    document.querySelectorAll('.settings-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            handleSettingsAction(action);
        });
    });
}

// 處理設定動作
function handleSettingsAction(action) {
    switch (action) {
        case 'theme':
            if (typeof showThemeSelector === 'function') {
                showThemeSelector();
            }
            break;
        case 'fontSize':
            if (typeof showFontSizeSelector === 'function') {
                showFontSizeSelector();
            }
            break;
        case 'annualReport':
            if (typeof showAnnualReport === 'function') {
                showAnnualReport();
            }
            break;
        case 'installmentRules':
            showInstallmentManagementPage();
            break;
        case 'uploadAllData':
            if (typeof uploadAllDataToGoogleSheet === 'function') {
                uploadAllDataToGoogleSheet();
            }
            break;
        case 'downloadAllData':
            if (typeof downloadAllDataFromGoogleSheet === 'function') {
                downloadAllDataFromGoogleSheet();
            }
            break;
        case 'clearAllData':
            if (typeof deleteAllDataFromGoogleSheet === 'function') {
                deleteAllDataFromGoogleSheet();
            }
            break;
        case 'downloadBackup':
            if (typeof downloadBackupFile === 'function') {
                downloadBackupFile();
            }
            break;
        case 'copyToClipboard':
            if (typeof copyDataToClipboard === 'function') {
                copyDataToClipboard();
            }
            break;
        case 'about':
            showCreatorInfo();
            break;
        default:
            console.warn('未知的設定動作:', action);
    }
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

// 顯示分期管理頁面
function showInstallmentManagementPage() {
    const pageSettings = document.getElementById('pageSettings');
    const installmentManagementPage = document.getElementById('installmentManagementPage');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (pageSettings) pageSettings.style.display = 'none';
    if (installmentManagementPage) installmentManagementPage.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'none';
    
    // 初始化分期管理（如果有相關函數）
    if (typeof initInstallmentManagement === 'function') {
        initInstallmentManagement();
    }
}
function getAssetAllocationSettings() {
    try {
        const raw = localStorage.getItem('assetAllocationSettings');
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            targetStockRatio: 80,
            targetBondRatio: 20,
            rebalanceMonth: '12',
            rebalanceDay: '20',
            enableRebalanceReminder: true,
            ...parsed
        };
    } catch (error) {
        console.error('Failed to load asset allocation settings:', error);
        return {
            targetStockRatio: 80,
            targetBondRatio: 20,
            rebalanceMonth: '12',
            rebalanceDay: '20',
            enableRebalanceReminder: true
        };
    }
}

function saveAssetAllocationSettings(settings) {
    try {
        localStorage.setItem('assetAllocationSettings', JSON.stringify(settings || {}));
    } catch (error) {
        console.error('Failed to save asset allocation settings:', error);
    }
}

function showAssetAllocationSettings() {
    const settings = getAssetAllocationSettings();
    
    const modal = createModal({
        title: '📊 資產配置設定',
        content: `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">目標股債比（%）</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <input type="number" id="stockRatioInput" min="0" max="100" value="${settings.targetStockRatio}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            <small style="color: #666;">股票</small>
                        </div>
                        <div>
                            <input type="number" id="bondRatioInput" min="0" max="100" value="${settings.targetBondRatio}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            <small style="color: #666;">債券</small>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">年度再平衡日期</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <select id="rebalanceMonthSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                                ${Array.from({length: 12}, (_, i) => `<option value="${i + 1}" ${settings.rebalanceMonth == String(i + 1) ? 'selected' : ''}>${i + 1}月</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <select id="rebalanceDaySelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                                ${Array.from({length: 31}, (_, i) => `<option value="${i + 1}" ${settings.rebalanceDay == String(i + 1) ? 'selected' : ''}>${i + 1}日</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label style="flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="enableReminderCheckbox" ${settings.enableRebalanceReminder ? 'checked' : ''} style="margin-right: 8px;">
                        <span>啟用再平衡提醒</span>
                    </label>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn btn-secondary" data-action="cancel">取消</button>
                <button class="btn btn-primary" data-action="save">儲存</button>
            </div>
        `
    });

    modal.element.querySelector('[data-action="save"]').addEventListener('click', () => {
        const stockRatio = Math.max(0, Math.min(100, parseFloat(modal.element.querySelector('#stockRatioInput').value) || 0));
        const bondRatio = Math.max(0, Math.min(100, parseFloat(modal.element.querySelector('#bondRatioInput').value) || 0));
        
        if (Math.abs(stockRatio + bondRatio - 100) > 0.1) {
            alert('股債比總和必須等於 100%');
            return;
        }

        const newSettings = {
            targetStockRatio: stockRatio,
            targetBondRatio: bondRatio,
            rebalanceMonth: modal.element.querySelector('#rebalanceMonthSelect').value,
            rebalanceDay: modal.element.querySelector('#rebalanceDaySelect').value,
            enableRebalanceReminder: modal.element.querySelector('#enableReminderCheckbox').checked
        };

        saveAssetAllocationSettings(newSettings);
        showNotification('資產配置設定已更新', 'success');
        modal.close();
    });

    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

function updateAssetAllocationStatus() {
    const statusEl = document.getElementById('assetAllocationStatus');
    if (!statusEl) return;

    const settings = getAssetAllocationSettings();
    const portfolio = getPortfolio();
    
    if (!portfolio || portfolio.length === 0) {
        statusEl.textContent = '尚無持股資料';
        return;
    }

    let totalStockValue = 0;
    let totalBondValue = 0;

    portfolio.forEach(stock => {
        const price = getStockCurrentPrice(stock.stockCode) || stock.avgCost || 0;
        const value = price * (stock.shares || 0);
        
        // 簡單判斷：假設股票代碼為數字或包含常見股票關鍵字為股票，其餘為債券
        if (stock.stockCode.match(/^\d+$/) || ['0056', '0050', '006208', '006203'].includes(stock.stockCode)) {
            totalStockValue += value;
        } else {
            totalBondValue += value;
        }
    });

    const totalValue = totalStockValue + totalBondValue;
    const stockPct = totalValue > 0 ? (totalStockValue / totalValue) * 100 : 0;
    const bondPct = totalValue > 0 ? (totalBondValue / totalValue) * 100 : 0;

    statusEl.textContent = `目前：股 ${stockPct.toFixed(1)}% / 債 ${bondPct.toFixed(1)}%`;
}

function maybePromptAnnualRebalance(settings) {
    try {
        const month = parseInt(settings.rebalanceMonth, 10);
        const day = parseInt(settings.rebalanceDay, 10);
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        if (currentMonth === month && currentDay === day && settings.enableRebalanceReminder) {
            const shouldGo = confirm(`今天是${month}月${day}日，建議檢查資產配置並進行再平衡！\n\n要現在查看投資專區嗎？`);
            if (shouldGo) {
                const investmentNav = document.querySelector('.nav-item[data-page="investment"]');
                if (investmentNav) {
                    investmentNav.click();
                }
            }
        }
    } catch (error) {
        console.error('Annual rebalance check failed:', error);
    }
}

function fillAllocationInputsFromSettings(settings) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
    };
    setVal('stockRatioInput', settings.targetStockRatio);
    setVal('bondRatioInput', settings.targetBondRatio);
    setVal('rebalanceMonthSelect', settings.rebalanceMonth);
    setVal('rebalanceDaySelect', settings.rebalanceDay);
    const checkbox = document.getElementById('enableReminderCheckbox');
    if (checkbox) checkbox.checked = settings.enableRebalanceReminder;
}

// 創作者資訊
function showCreatorInfo() {
    const modal = createModal({
        title: '👨‍💻 關於記帳本',
        content: `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
                <h3 style="margin: 0 0 8px 0; color: #333;">記帳本 App</h3>
                <p style="margin: 0 0 16px 0; color: #666;">版本 1.0.0</p>
                
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                    <h4 style="margin: 0 0 12px 0; color: #333;">功能特色：</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
                        <li>📝 記帳管理：收支記錄、分類管理</li>
                        <li>💰 投資追蹤：股票買賣、股利記錄、圖表分析</li>
                        <li>📊 報表分析：年度報告、支出統計</li>
                        <li>🎨 主題客製化：多種主題、字體大小調整</li>
                        <li>☁️ 雲端備份：Google Sheet 整合</li>
                        <li>📱 響應式設計：支援手機、平板、桌面</li>
                    </ul>
                </div>
                
                <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 8px 0; color: #856404;">🔒 隱私聲明</h4>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                        所有資料均儲存在您的裝置本地，<br>
                        雲端備份功能僅在您主動啟用時使用。<br>
                        我們不會收集或儲存任何個人資料。
                    </p>
                </div>
                
                <p style="margin: 0; color: #999; font-size: 14px;">
                    © 2026 記帳本 App<br>
                    Made with ❤️
                </p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn btn-primary" data-action="close">關閉</button>
            </div>
        `
    });

    modal.element.querySelector('[data-action="close"]').addEventListener('click', () => {
        modal.close();
    });
}

// 初始化設定頁面事件
function initSettingsPageEvents() {
    // 綁定返回按鈕
    const installmentBackBtn = document.getElementById('installmentBackBtn');
    if (installmentBackBtn) {
        installmentBackBtn.addEventListener('click', () => {
            showSettingsPage();
        });
    }

    // 初始化資產配置狀態
    updateAssetAllocationStatus();
    
    // 檢查年度再平衡提醒
    const settings = getAssetAllocationSettings();
    maybePromptAnnualRebalance(settings);
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsPageEvents);
} else {
    initSettingsPageEvents();
}
