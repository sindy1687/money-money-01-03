// ========== 理財顧問功能模組 ==========

// 小森對話系統
let advisorDialogs = null;

const ADVISOR_CHAT_HISTORY_KEY = 'advisor_chat_history_v1';
const ADVISOR_CHAT_HISTORY_LIMIT = 80;

function getAdvisorChatHistory() {
    try {
        const raw = localStorage.getItem(ADVISOR_CHAT_HISTORY_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function setAdvisorChatHistory(history) {
    try {
        const safe = Array.isArray(history) ? history.slice(-ADVISOR_CHAT_HISTORY_LIMIT) : [];
        localStorage.setItem(ADVISOR_CHAT_HISTORY_KEY, JSON.stringify(safe));
    } catch (e) {
        // ignore
    }
}

function pushAdvisorChatHistoryItem(item) {
    const history = getAdvisorChatHistory();
    history.push(item);
    setAdvisorChatHistory(history);
}

function clearAdvisorChatHistory() {
    try {
        localStorage.removeItem(ADVISOR_CHAT_HISTORY_KEY);
    } catch (e) {
        // ignore
    }
}

function scrollChatToBottom(container) {
    if (!container) return;
    container.scrollTop = container.scrollHeight;
}

// 載入對話資料庫
async function loadAdvisorDialogs() {
    try {
        const response = await fetch('js/advisor-dialogs.json');
        advisorDialogs = await response.json();
    } catch (error) {
        console.error('載入對話資料庫失敗:', error);
        // 使用預設對話
        advisorDialogs = {
            advisor_profile: {
                id: "mori",
                name: "小森",
                tone: "calm_warm",
                principles: ["no_judgement", "fact_based", "user_respect"]
            },
            dialogs: {
                daily_open_normal: ["今天的花費還不多，狀況穩定。"],
                entry_small: ["已記錄。"],
                entry_medium: ["這筆金額我已標記。"],
                entry_large: ["這是本月目前最大的一筆支出。"],
                budget_80: ["這個分類本月剩餘不多。"],
                budget_over: ["已超過原先設定的預算。"],
                income_normal: ["收入已記錄。"],
                income_dividend: ["股息已入帳。"],
                monthly_good: ["這個月整體控制得不錯。"],
                monthly_high: ["本月支出比上月高。"],
                no_entry_today: ["今天還沒有記帳紀錄。"]
            }
        };
    }
}

// 獲取今天已使用的對話 key
function getTodayUsedDialogKeys() {
    const today = new Date().toISOString().split('T')[0];
    const key = `advisor_dialogs_${today}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

// 標記對話 key 為已使用
function markDialogKeyAsUsed(dialogKey) {
    const today = new Date().toISOString().split('T')[0];
    const key = `advisor_dialogs_${today}`;
    const used = getTodayUsedDialogKeys();
    if (!used.includes(dialogKey)) {
        used.push(dialogKey);
        localStorage.setItem(key, JSON.stringify(used));
    }
}

// 獲取隨機對話
function getRandomDialog(dialogKey) {
    if (!advisorDialogs || !advisorDialogs.dialogs || !advisorDialogs.dialogs[dialogKey]) {
        return null;
    }
    
    const messages = advisorDialogs.dialogs[dialogKey];
    if (messages.length === 0) return null;
    
    return messages[Math.floor(Math.random() * messages.length)];
}

// 顯示小森對話（不搭配音效）
function showMoriDialog(message) {
    if (!message) return;
    
    // 創建對話提示框
    const dialogBox = document.createElement('div');
    dialogBox.className = 'mori-dialog-box';
    dialogBox.innerHTML = `
        <div class="mori-dialog-content">
            <div class="mori-avatar">
                <img src="./image/7.png" alt="小森" class="mori-avatar-image" onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
            </div>
            <div class="mori-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(dialogBox);
    
    // 觸發動畫顯示
    setTimeout(() => {
        dialogBox.style.opacity = '1';
    }, 10);
    
    // 3秒後自動消失
    setTimeout(() => {
        if (document.body.contains(dialogBox)) {
            dialogBox.style.opacity = '0';
            dialogBox.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
            dialogBox.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 1, 1)';
            setTimeout(() => {
                if (document.body.contains(dialogBox)) {
                    document.body.removeChild(dialogBox);
                }
            }, 300);
        }
    }, 3000);
}

// 檢查並觸發小森對話（保存記錄時調用）
function checkAndTriggerMoriDialog(record) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkAndTriggerMoriDialog(record);
        });
        return;
    }
    
    // 從 localStorage 獲取所有記錄
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    const usedKeys = getTodayUsedDialogKeys();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 計算平均支出
    const monthlyExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === now.getMonth() && 
               recordDate.getFullYear() === now.getFullYear();
    });
    
    const totalExpense = monthlyExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    const avgExpense = monthlyExpenses.length > 0 ? totalExpense / monthlyExpenses.length : 0;
    
    // 1. 收入相關對話
    if (record.type === 'income') {
        // 檢查是否為股息
        if (record.category && (record.category.includes('股息') || record.category.includes('股利') || record.category.includes('配息'))) {
            if (!usedKeys.includes('income_dividend')) {
                const message = getRandomDialog('income_dividend');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('income_dividend');
                    return;
                }
            }
        } else {
            if (!usedKeys.includes('income_normal')) {
                const message = getRandomDialog('income_normal');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('income_normal');
                    return;
                }
            }
        }
    }
    
    // 2. 支出相關對話（根據金額大小）
    if (record.type === 'expense' || !record.type) {
        const amount = record.amount || 0;
        
        // 檢查預算狀態
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        const categoryBudget = budgets.find(b => b.category === record.category);
        
        if (categoryBudget) {
            const categoryExpenses = monthlyExpenses
                .filter(r => (r.category || '未分類') === record.category)
                .reduce((sum, r) => sum + (r.amount || 0), 0);
            
            const percentage = (categoryExpenses / categoryBudget.amount) * 100;
            
            // 預算超支
            if (percentage >= 100 && !usedKeys.includes('budget_over')) {
                const message = getRandomDialog('budget_over');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('budget_over');
                    return;
                }
            }
            
            // 預算接近上限
            if (percentage >= 80 && percentage < 100 && !usedKeys.includes('budget_80')) {
                const message = getRandomDialog('budget_80');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('budget_80');
                    return;
                }
            }
        }
        
        // 根據金額大小觸發對話
        if (avgExpense > 0) {
            if (amount >= avgExpense * 2 && !usedKeys.includes('entry_large')) {
                const message = getRandomDialog('entry_large');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('entry_large');
                    return;
                }
            } else if (amount >= avgExpense * 0.5 && amount < avgExpense * 2 && !usedKeys.includes('entry_medium')) {
                const message = getRandomDialog('entry_medium');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('entry_medium');
                    return;
                }
            } else if (amount < avgExpense * 0.5 && !usedKeys.includes('entry_small')) {
                const message = getRandomDialog('entry_small');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('entry_small');
                    return;
                }
            }
        } else {
            // 如果沒有平均支出數據，使用 entry_small
            if (!usedKeys.includes('entry_small')) {
                const message = getRandomDialog('entry_small');
                if (message) {
                    showMoriDialog(message);
                    markDialogKeyAsUsed('entry_small');
                    return;
                }
            }
        }
    }
}

// 檢查每日開啟對話
function checkDailyOpenDialog(allRecords) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkDailyOpenDialog(allRecords);
        });
        return;
    }
    
    const usedKeys = getTodayUsedDialogKeys();
    if (usedKeys.includes('daily_open_normal')) return;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 檢查今日支出
    const todayExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        const recordDateStr = recordDate.toISOString().split('T')[0];
        return (r.type === 'expense' || !r.type) && recordDateStr === today;
    });
    
    const todayTotal = todayExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 今日首次開啟 AND 今日支出 = 0
    if (todayTotal === 0) {
        const message = getRandomDialog('daily_open_normal');
        if (message) {
            showMoriDialog(message);
            markDialogKeyAsUsed('daily_open_normal');
        }
    }
}

// 檢查無記帳提醒（21:00前無任何記帳）
function checkNoEntryTodayDialog(allRecords) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkNoEntryTodayDialog(allRecords);
        });
        return;
    }
    
    const usedKeys = getTodayUsedDialogKeys();
    if (usedKeys.includes('no_entry_today')) return;
    
    const now = new Date();
    const hour = now.getHours();
    
    // 21:00 前
    if (hour < 21) {
        const today = now.toISOString().split('T')[0];
        const todayRecords = allRecords.filter(r => {
            const recordDate = new Date(r.date);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === today;
        });
        
        if (todayRecords.length === 0) {
            const message = getRandomDialog('no_entry_today');
            if (message) {
                showMoriDialog(message);
                markDialogKeyAsUsed('no_entry_today');
            }
        }
    }
}

// 檢查月度對話
function checkMonthlyDialogs(allRecords) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkMonthlyDialogs(allRecords);
        });
        return;
    }
    
    const usedKeys = getTodayUsedDialogKeys();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 計算本月支出
    const monthlyExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 計算上月支出
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === lastMonth && 
               recordDate.getFullYear() === lastMonthYear;
    });
    
    const lastMonthTotal = lastMonthExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 檢查預算
    const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    // monthly_good: 月支出 ≤ 預算 AND ≤ 上月
    if (totalBudget > 0 && monthlyTotal <= totalBudget && monthlyTotal <= lastMonthTotal && !usedKeys.includes('monthly_good')) {
        const message = getRandomDialog('monthly_good');
        if (message) {
            showMoriDialog(message);
            markDialogKeyAsUsed('monthly_good');
            return;
        }
    }
    
    // monthly_high: 月支出 > 上月 OR 超過預算
    if ((monthlyTotal > lastMonthTotal || (totalBudget > 0 && monthlyTotal > totalBudget)) && !usedKeys.includes('monthly_high')) {
        const message = getRandomDialog('monthly_high');
        if (message) {
            showMoriDialog(message);
            markDialogKeyAsUsed('monthly_high');
        }
    }
}

// 檢查月結算評語（每月1號觸發）
function checkMonthlySummaryDialog(allRecords) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkMonthlySummaryDialog(allRecords);
        });
        return;
    }
    
    const now = new Date();
    const today = now.getDate();
    
    // 只在每月1號觸發
    if (today !== 1) return;
    
    // 檢查今天是否已經顯示過
    const usedKeys = getTodayUsedDialogKeys();
    if (usedKeys.includes('monthly_summary_excellent') || 
        usedKeys.includes('monthly_summary_good') || 
        usedKeys.includes('monthly_summary_warning') || 
        usedKeys.includes('monthly_summary_over')) {
        return;
    }
    
    // 計算上個月的數據
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const lastMonthExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === lastMonth && 
               recordDate.getFullYear() === lastMonthYear;
    });
    
    const lastMonthTotal = lastMonthExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 計算上上個月的支出（用於比較）
    const twoMonthsAgo = lastMonth === 0 ? 11 : lastMonth - 1;
    const twoMonthsAgoYear = lastMonth === 0 ? lastMonthYear - 1 : lastMonthYear;
    const twoMonthsAgoExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === twoMonthsAgo && 
               recordDate.getFullYear() === twoMonthsAgoYear;
    });
    const twoMonthsAgoTotal = twoMonthsAgoExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 檢查預算
    const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    // 計算上個月的收入
    const lastMonthIncomes = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return r.type === 'income' && 
               recordDate.getMonth() === lastMonth && 
               recordDate.getFullYear() === lastMonthYear;
    });
    const lastMonthIncome = lastMonthIncomes.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 計算儲蓄率
    const savingsRate = lastMonthIncome > 0 ? ((lastMonthIncome - lastMonthTotal) / lastMonthIncome * 100) : 0;
    
    let dialogKey = null;
    
    // 判斷評語等級
    if (totalBudget > 0) {
        const budgetRatio = (lastMonthTotal / totalBudget) * 100;
        
        if (budgetRatio <= 80 && savingsRate >= 20) {
            dialogKey = 'monthly_summary_excellent';
        } else if (budgetRatio <= 100 && savingsRate >= 10) {
            dialogKey = 'monthly_summary_good';
        } else if (budgetRatio <= 120) {
            dialogKey = 'monthly_summary_warning';
        } else {
            dialogKey = 'monthly_summary_over';
        }
    } else {
        // 沒有預算時，根據與上上個月的比較和儲蓄率判斷
        if (lastMonthTotal <= twoMonthsAgoTotal && savingsRate >= 20) {
            dialogKey = 'monthly_summary_excellent';
        } else if (lastMonthTotal <= twoMonthsAgoTotal * 1.1 && savingsRate >= 10) {
            dialogKey = 'monthly_summary_good';
        } else if (lastMonthTotal <= twoMonthsAgoTotal * 1.2) {
            dialogKey = 'monthly_summary_warning';
        } else {
            dialogKey = 'monthly_summary_over';
        }
    }
    
    if (dialogKey) {
        const message = getRandomDialog(dialogKey);
        if (message) {
            // 延遲顯示，讓用戶先看到頁面
            setTimeout(() => {
                showMoriDialog(message);
                markDialogKeyAsUsed(dialogKey);
            }, 2000);
        }
    }
}

// 檢查超支原因並提示
function checkOverspendReasonDialog() {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkOverspendReasonDialog();
        });
        return;
    }
    
    // 從 localStorage 獲取所有記錄
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    const usedKeys = getTodayUsedDialogKeys();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 計算本月支出
    const monthlyExpenses = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 檢查預算
    const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    // 如果沒有超支，不顯示
    if (totalBudget === 0 || monthlyTotal <= totalBudget) return;
    
    // 檢查是否已經顯示過
    if (usedKeys.includes('overspend_reason_category') || usedKeys.includes('overspend_reason_large')) {
        return;
    }
    
    // 分析超支原因
    // 1. 檢查哪些分類超支最多
    const categoryExpenses = {};
    monthlyExpenses.forEach(r => {
        const category = r.category || '未分類';
        if (!categoryExpenses[category]) {
            categoryExpenses[category] = 0;
        }
        categoryExpenses[category] += r.amount || 0;
    });
    
    // 找出超支最多的分類
    let maxOverspendCategory = null;
    let maxOverspendAmount = 0;
    
    budgets.forEach(budget => {
        const categoryExpense = categoryExpenses[budget.category] || 0;
        if (categoryExpense > budget.amount) {
            const overspend = categoryExpense - budget.amount;
            if (overspend > maxOverspendAmount) {
                maxOverspendAmount = overspend;
                maxOverspendCategory = budget.category;
            }
        }
    });
    
    // 2. 檢查是否有大額支出
    const avgExpense = monthlyExpenses.length > 0 ? monthlyTotal / monthlyExpenses.length : 0;
    const largeExpenses = monthlyExpenses.filter(r => (r.amount || 0) >= avgExpense * 3);
    
    // 優先顯示分類超支原因
    if (maxOverspendCategory && !usedKeys.includes('overspend_reason_category')) {
        const message = getRandomDialog('overspend_reason_category');
        if (message) {
            showMoriDialog(`${message}「${maxOverspendCategory}」本月已超支 NT$${Math.round(maxOverspendAmount).toLocaleString('zh-TW')}。`);
            markDialogKeyAsUsed('overspend_reason_category');
            return;
        }
    }
    
    // 如果有大額支出，顯示大額支出原因
    if (largeExpenses.length >= 2 && !usedKeys.includes('overspend_reason_large')) {
        const message = getRandomDialog('overspend_reason_large');
        if (message) {
            const largeTotal = largeExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
            showMoriDialog(`${message}本月有 ${largeExpenses.length} 筆大額支出，共計 NT$${Math.round(largeTotal).toLocaleString('zh-TW')}。`);
            markDialogKeyAsUsed('overspend_reason_large');
            return;
        }
    }
}

// 追蹤連續記帳天數
function updateAccountingStreak(allRecords) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 獲取連續記帳天數
    let streak = parseInt(localStorage.getItem('accounting_streak') || '0');
    const lastRecordDate = localStorage.getItem('accounting_last_record_date');
    
    if (lastRecordDate) {
        const lastDate = new Date(lastRecordDate);
        lastDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // 連續記帳
            streak += 1;
        } else if (daysDiff > 1) {
            // 記帳中斷
            streak = 1;
        }
        // daysDiff === 0 表示今天已經記過帳，不更新
    } else {
        // 第一次記帳
        streak = 1;
    }
    
    // 保存連續記帳天數和最後記帳日期
    localStorage.setItem('accounting_streak', streak.toString());
    localStorage.setItem('accounting_last_record_date', today.toISOString());
    
    return streak;
}

// 檢查連續記帳鼓勵對話
function checkStreakEncouragementDialog() {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkStreakEncouragementDialog();
        });
        return;
    }
    
    // 從 localStorage 獲取所有記錄
    const allRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    
    const usedKeys = getTodayUsedDialogKeys();
    const streak = updateAccountingStreak(allRecords);
    
    // 檢查是否已經顯示過今天的鼓勵
    const streakKey = `streak_${streak}`;
    if (usedKeys.includes(streakKey)) return;
    
    // 檢查里程碑
    let dialogKey = null;
    if (streak === 3) {
        dialogKey = 'streak_3';
    } else if (streak === 7) {
        dialogKey = 'streak_7';
    } else if (streak === 14) {
        dialogKey = 'streak_14';
    } else if (streak === 30) {
        dialogKey = 'streak_30';
    } else if (streak === 1) {
        // 檢查是否中斷後重新開始
        const lastStreak = parseInt(localStorage.getItem('accounting_last_streak') || '0');
        if (lastStreak > 1) {
            dialogKey = 'streak_break';
        }
    }
    
    if (dialogKey) {
        const message = getRandomDialog(dialogKey);
        if (message) {
            showMoriDialog(message);
            markDialogKeyAsUsed(streakKey);
            // 保存上次的連續天數
            localStorage.setItem('accounting_last_streak', streak.toString());
        }
    }
}

// 檢查記帳中斷提醒
function checkStreakBreakReminder(allRecords) {
    if (!advisorDialogs) {
        loadAdvisorDialogs().then(() => {
            checkStreakBreakReminder(allRecords);
        });
        return;
    }
    
    const usedKeys = getTodayUsedDialogKeys();
    if (usedKeys.includes('streak_break')) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastRecordDate = localStorage.getItem('accounting_last_record_date');
    if (!lastRecordDate) return;
    
    const lastDate = new Date(lastRecordDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    // 如果超過1天沒有記帳，且之前有連續記帳記錄
    const lastStreak = parseInt(localStorage.getItem('accounting_last_streak') || '0');
    if (daysDiff > 1 && lastStreak > 0) {
        const message = getRandomDialog('streak_break');
        if (message) {
            showMoriDialog(message);
            markDialogKeyAsUsed('streak_break');
        }
    }
}

// 初始化時載入對話資料庫
loadAdvisorDialogs();

// 初始化理財顧問聊天
function initAdvisorChat(records, modal) {
    const chatMessages = modal.querySelector('#advisorChatMessages');
    const chatInput = modal.querySelector('#advisorChatInput');
    const sendBtn = modal.querySelector('#advisorSendBtn');
    const advisorStatus = modal.querySelector('.advisor-status');

    // 重新取得最新記錄（聊天開啟時用最新資料回答）
    let latestRecords = records;
    try {
        latestRecords = JSON.parse(localStorage.getItem('accountingRecords') || '[]');
    } catch (e) {
        latestRecords = records;
    }

    // 防止重複綁定：clone input 與 button
    const newChatInput = chatInput ? chatInput.cloneNode(true) : null;
    if (chatInput && chatInput.parentNode && newChatInput) {
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
    }

    const newSendBtn = sendBtn ? sendBtn.cloneNode(true) : null;
    if (sendBtn && sendBtn.parentNode && newSendBtn) {
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    }
    
    // 建立快捷問題列（若已存在則不重複建立）
    if (chatMessages && !chatMessages.querySelector('.advisor-quick-actions')) {
        const quick = document.createElement('div');
        quick.className = 'advisor-quick-actions';
        quick.innerHTML = `
            <button type="button" class="advisor-quick-btn" data-q="本月支出分析">本月支出</button>
            <button type="button" class="advisor-quick-btn" data-q="最大支出分類是什麼">最大分類</button>
            <button type="button" class="advisor-quick-btn" data-q="預算狀況">預算狀況</button>
            <button type="button" class="advisor-quick-btn" data-q="這個月和上個月比較">月比較</button>
            <button type="button" class="advisor-quick-btn advisor-quick-btn-secondary" data-action="clear_chat">清空對話</button>
        `;
        chatMessages.appendChild(quick);
    }

    // 載入歷史對話（若有）
    if (chatMessages) {
        const history = getAdvisorChatHistory();
        if (history.length > 0) {
            history.forEach(item => {
                if (!item || !item.type || !item.message) return;
                addAdvisorMessage(chatMessages, item.type, item.message);
            });
            scrollChatToBottom(chatMessages);
        } else {
            // 沒有歷史才送歡迎消息（使用打字效果）
            const welcomeMessage = generateAdvisorWelcomeMessage(latestRecords);
            setTimeout(() => {
                addAdvisorMessageTyping(chatMessages, 'advisor', welcomeMessage, () => {
                    pushAdvisorChatHistoryItem({ type: 'advisor', message: welcomeMessage });
                });
            }, 500);
        }
    }

    // 快捷按鈕事件
    if (chatMessages) {
        chatMessages.querySelectorAll('.advisor-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.action === 'clear_chat') {
                    if (confirm('要清空小森的對話記錄嗎？')) {
                        clearAdvisorChatHistory();
                        if (chatMessages) {
                            chatMessages.innerHTML = '';
                        }
                        // 重新建立快捷列
                        initAdvisorChat(latestRecords, modal);
                    }
                    return;
                }
                const q = btn.dataset.q || '';
                if (!q || !newChatInput) return;
                newChatInput.value = q;
                newChatInput.focus();
                // 直接送出
                if (newSendBtn && !newSendBtn.disabled) {
                    newSendBtn.click();
                }
            });
        });
    }
    
    // 發送按鈕事件
    const sendMessage = () => {
        if (!newChatInput) return;
        const userMessage = newChatInput.value.trim();
        if (!userMessage) return;

        // 禁用輸入框和按鈕 + loading
        if (newChatInput) newChatInput.disabled = true;
        const originalBtnText = newSendBtn ? newSendBtn.textContent : '';
        if (newSendBtn) {
            newSendBtn.disabled = true;
            newSendBtn.classList.add('is-loading');
            newSendBtn.textContent = '回覆中...';
        }
        
        // 添加用戶消息
        if (chatMessages) {
            addAdvisorMessage(chatMessages, 'user', userMessage);
            pushAdvisorChatHistoryItem({ type: 'user', message: userMessage });
        }
        newChatInput.value = '';
        
        // 顯示"正在輸入..."狀態
        showTypingIndicator(chatMessages, advisorStatus);
        
        // 根據問題複雜度計算思考時間（300-1500ms）
        const questionComplexity = calculateQuestionComplexity(userMessage);
        const thinkingTime = 300 + (questionComplexity * 200);
        
        // 模擬思考後生成回應
        setTimeout(() => {
            const advisorResponse = generateAdvisorResponse(userMessage, latestRecords);
            hideTypingIndicator(chatMessages, advisorStatus);
            
            // 使用打字效果顯示回應
            if (chatMessages) {
                addAdvisorMessageTyping(chatMessages, 'advisor', advisorResponse, () => {
                    pushAdvisorChatHistoryItem({ type: 'advisor', message: advisorResponse });
                    // 回應完成後重新啟用輸入
                    if (newChatInput) newChatInput.disabled = false;
                    if (newSendBtn) {
                        newSendBtn.disabled = false;
                        newSendBtn.classList.remove('is-loading');
                        newSendBtn.textContent = originalBtnText || '發送';
                    }
                    if (newChatInput) newChatInput.focus();
                });
            }
        }, thinkingTime);
    };
    
    if (newSendBtn) {
        newSendBtn.addEventListener('click', sendMessage);
    }
    
    if (newChatInput) {
        newChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !newChatInput.disabled) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// 計算問題複雜度（0-6）
function calculateQuestionComplexity(userMessage) {
    let complexity = 0;
    const message = userMessage.toLowerCase();
    
    // 日期查詢 +1
    if (message.match(/\d{1,2}[\/\-月]\d{1,2}/)) complexity += 1;
    
    // 金額查詢 +1
    if (message.match(/\d+/)) complexity += 1;
    
    // 分類查詢 +1
    if (message.includes('分類') || message.includes('類別')) complexity += 1;
    
    // 趨勢分析 +2
    if (message.includes('趨勢') || message.includes('變化')) complexity += 2;
    
    // 預算分析 +1
    if (message.includes('預算')) complexity += 1;
    
    // 理財建議 +2
    if (message.includes('建議') || message.includes('理財')) complexity += 2;
    
    // 多個條件查詢 +1
    const conditions = (message.match(/\d+/g) || []).length;
    if (conditions > 1) complexity += 1;
    
    return Math.min(complexity, 6);
}

// 顯示"正在輸入..."指示器
function showTypingIndicator(container, statusElement) {
    // 更新狀態為"正在輸入..."
    if (statusElement) {
        statusElement.textContent = '正在輸入...';
        statusElement.style.color = 'var(--color-primary)';
    }
    
    // 創建打字指示器消息
    const typingDiv = document.createElement('div');
    typingDiv.className = 'advisor-message advisor-message-typing';
    typingDiv.id = 'advisorTypingIndicator';
    typingDiv.innerHTML = `
        <div class="advisor-message-avatar">
            <img src="./image/7.png" alt="小森" class="advisor-message-avatar-image" onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
        </div>
        <div class="advisor-message-content">
            <div class="advisor-typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

// 隱藏"正在輸入..."指示器
function hideTypingIndicator(container, statusElement) {
    // 移除打字指示器
    const typingIndicator = container.querySelector('#advisorTypingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    // 恢復狀態為"在線"
    if (statusElement) {
        statusElement.textContent = '在線';
        statusElement.style.color = 'var(--text-secondary)';
    }
}

// 使用打字效果添加消息
function addAdvisorMessageTyping(container, type, message, onComplete) {
    // 先創建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = `advisor-message advisor-message-${type}`;
    
    if (type === 'advisor') {
        messageDiv.innerHTML = `
            <div class="advisor-message-avatar">
                <img src="./image/7.png" alt="小森" class="advisor-message-avatar-image" onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
            </div>
            <div class="advisor-message-content">
                <div class="advisor-message-text"></div>
                <div class="advisor-message-time">${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="advisor-message-content">
                <div class="advisor-message-text"></div>
                <div class="advisor-message-time">${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    }
    
    container.appendChild(messageDiv);
    const textElement = messageDiv.querySelector('.advisor-message-text');
    
    // 打字效果參數
    const typingSpeed = 20 + Math.random() * 30; // 20-50ms per character，模擬真人打字速度變化
    let currentIndex = 0;
    const fullText = message;
    
    // 打字函數
    const typeNextChar = () => {
        if (currentIndex < fullText.length) {
            // 處理換行符
            if (fullText[currentIndex] === '\n') {
                textElement.innerHTML += '<br>';
            } else {
                textElement.textContent += fullText[currentIndex];
            }
            currentIndex++;
            
            // 隨機速度變化，讓打字更自然
            const nextDelay = typingSpeed + (Math.random() * 20 - 10);
            setTimeout(typeNextChar, Math.max(10, nextDelay));
            
            // 自動滾動到底部
            container.scrollTop = container.scrollHeight;
        } else {
            // 打字完成
            if (onComplete) {
                onComplete();
            }
        }
    };
    
    // 開始打字
    setTimeout(() => {
        typeNextChar();
    }, 100);
}

// 添加消息到聊天界面
function addAdvisorMessage(container, type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `advisor-message advisor-message-${type}`;
    
    // 將換行符轉換為 <br>
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    if (type === 'advisor') {
        messageDiv.innerHTML = `
            <div class="advisor-message-avatar">
                <img src="./image/7.png" alt="小森" class="advisor-message-avatar-image" onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
            </div>
            <div class="advisor-message-content">
                <div class="advisor-message-text">${formattedMessage}</div>
                <div class="advisor-message-time">${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="advisor-message-content">
                <div class="advisor-message-text">${formattedMessage}</div>
                <div class="advisor-message-time">${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 生成理財顧問歡迎消息
function generateAdvisorWelcomeMessage(records) {
    if (records.length === 0) {
        return '您好，我是小森。\n\n看起來您還沒有任何記錄。開始記帳是理財的第一步，加油！';
    }
    
    // 分析記錄
    const now = new Date();
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
    
    // 分類統計
    const categoryStats = {};
    expenses.forEach(r => {
        const category = r.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + (r.amount || 0);
    });
    
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
    
    let message = `您好，我是小森。\n\n`;
    
    if (monthlyRecords.length > 0) {
        message += `本月統計：\n`;
        message += `總支出：NT$ ${totalExpense.toLocaleString('zh-TW')}\n`;
        if (totalIncome > 0) {
            message += `總收入：NT$ ${totalIncome.toLocaleString('zh-TW')}\n`;
            const balance = totalIncome - totalExpense;
            if (balance > 0) {
                message += `本月結餘：NT$ ${balance.toLocaleString('zh-TW')}\n`;
            } else {
                message += `本月超支：NT$ ${Math.abs(balance).toLocaleString('zh-TW')}\n`;
            }
        }
        
        if (topCategory) {
            message += `最大支出分類：${topCategory[0]} (NT$ ${topCategory[1].toLocaleString('zh-TW')})\n`;
        }
    }
    
    message += `\n我可以幫您分析支出趨勢、回答記帳相關問題。有什麼想問的嗎？`;
    
    return message;
}

// 添加口語化前綴（隨機）
function addConversationalPrefix(response) {
    const prefixes = [
        '讓我幫您查一下...',
        '好的，我來看看...',
        '嗯...讓我分析一下...',
        '我來幫您找找...',
        '讓我整理一下...',
        '好的，我馬上幫您查...',
        '讓我看看您的記錄...',
        '稍等一下，我來整理...',
        '我來幫您分析...'
    ];
    
    // 40% 機率添加前綴（讓對話更自然）
    if (Math.random() < 0.4 && response.length > 30) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + '\n\n' + response;
    }
    
    return response;
}

// 智能理解問題（fallback）
// 避免 getSmartResponse 未定義導致聊天系統報錯。
function getSmartResponse(userMessage, records) {
    const message = (userMessage || '').trim();
    if (!message) {
        return '可以跟我說你想查「支出 / 收入 / 預算 / 分類 / 趨勢」其中一項，我會幫你整理。';
    }

    const lower = message.toLowerCase();
    if (lower.includes('幫我') || lower.includes('請') || lower.includes('怎麼')) {
        return '我可以幫你分析記帳資料。\n\n你可以試著問：\n• 本月支出分析\n• 最大支出分類\n• 預算狀況\n• 這個月和上個月比較';
    }

    // 若使用者只輸入分類名稱，嘗試當作分類查詢
    const trimmed = message.replace(/\s+/g, '');
    if (trimmed.length <= 6 && records && Array.isArray(records)) {
        return `你是想問「${message}」這個分類的花費嗎？\n\n你可以這樣問我：\n• ${message} 花了多少\n• 本月 ${message} 花了多少`;
    }

    return '我還不太確定你的問題想查哪一種統計。\n\n你可以換個問法，例如：\n• 本月支出分析\n• 午餐花了多少\n• 12/7 買了什麼\n• 預算狀況';
}

function queryCategorySpending(records, categoryKeyword) {
    if (!Array.isArray(records) || !categoryKeyword) {
        return '我需要一些記帳資料才能幫你查分類支出。';
    }
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const expenses = records.filter(r => {
        const d = new Date(r.date);
        return (r.type === 'expense' || !r.type) && d.getMonth() === m && d.getFullYear() === y;
    });
    const matched = expenses.filter(r => (r.category || '').includes(categoryKeyword));
    const total = matched.reduce((s, r) => s + (r.amount || 0), 0);
    return `本月「${categoryKeyword}」相關支出：NT$ ${total.toLocaleString('zh-TW')}（${matched.length} 筆）`;
}

function queryTopSpending(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return '目前沒有足夠的記錄可以分析最大支出。';
    }
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const expenses = records.filter(r => {
        const d = new Date(r.date);
        return (r.type === 'expense' || !r.type) && d.getMonth() === m && d.getFullYear() === y;
    });
    if (expenses.length === 0) return '本月目前沒有支出記錄。';

    const categoryStats = {};
    expenses.forEach(r => {
        const cat = r.category || '未分類';
        categoryStats[cat] = (categoryStats[cat] || 0) + (r.amount || 0);
    });
    const [topCat, topAmt] = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
    return `本月支出最多的分類是「${topCat}」，累計 NT$ ${Math.round(topAmt).toLocaleString('zh-TW')}。`;
}

function queryLowestSpending(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return '目前沒有足夠的記錄可以分析最低支出。';
    }
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const expenses = records.filter(r => {
        const d = new Date(r.date);
        return (r.type === 'expense' || !r.type) && d.getMonth() === m && d.getFullYear() === y;
    });
    if (expenses.length === 0) return '本月目前沒有支出記錄。';

    const minRecord = expenses.slice().sort((a, b) => (a.amount || 0) - (b.amount || 0))[0];
    return `本月最小的一筆支出是「${minRecord.category || '未分類'}」NT$ ${(minRecord.amount || 0).toLocaleString('zh-TW')}。`;
}

function compareMonths(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return '目前沒有足夠的記錄可以做月份比較。';
    }
    const now = new Date();
    const curM = now.getMonth();
    const curY = now.getFullYear();
    const lastM = curM === 0 ? 11 : curM - 1;
    const lastY = curM === 0 ? curY - 1 : curY;

    const sumMonth = (m, y) => records
        .filter(r => {
            const d = new Date(r.date);
            return (r.type === 'expense' || !r.type) && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((s, r) => s + (r.amount || 0), 0);

    const cur = sumMonth(curM, curY);
    const last = sumMonth(lastM, lastY);
    const diff = cur - last;
    const sign = diff >= 0 ? '增加' : '減少';
    return `本月支出 NT$ ${Math.round(cur).toLocaleString('zh-TW')}，上月 NT$ ${Math.round(last).toLocaleString('zh-TW')}，本月較上月${sign} NT$ ${Math.abs(Math.round(diff)).toLocaleString('zh-TW')}。`;
}

function getTotalSummary(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return '目前沒有足夠的記錄可以做總計。';
    }
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const month = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === m && d.getFullYear() === y;
    });
    const expense = month.filter(r => r.type === 'expense' || !r.type).reduce((s, r) => s + (r.amount || 0), 0);
    const income = month.filter(r => r.type === 'income').reduce((s, r) => s + (r.amount || 0), 0);
    const balance = income - expense;
    return `本月總計：\n• 總支出：NT$ ${Math.round(expense).toLocaleString('zh-TW')}\n• 總收入：NT$ ${Math.round(income).toLocaleString('zh-TW')}\n• 結餘：NT$ ${Math.round(balance).toLocaleString('zh-TW')}`;
}

function getAverageAnalysis(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return '目前沒有足夠的記錄可以做平均分析。';
    }
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const expenses = records.filter(r => {
        const d = new Date(r.date);
        return (r.type === 'expense' || !r.type) && d.getMonth() === m && d.getFullYear() === y;
    });
    if (expenses.length === 0) return '本月目前沒有支出記錄，無法計算平均。';
    const total = expenses.reduce((s, r) => s + (r.amount || 0), 0);
    const avg = total / expenses.length;
    return `本月支出平均每筆約 NT$ ${Math.round(avg).toLocaleString('zh-TW')}（共 ${expenses.length} 筆）。`;
}

// 生成理財顧問回應
function generateAdvisorResponse(userMessage, records) {
    try {
        const message = userMessage.toLowerCase();
        const originalMessage = userMessage; // 保留原始大小寫用於分類匹配
    
    // 提取金額（支持多種格式：1500、1500元、NT$1500等）
    const amountPattern = /(\d+(?:\.\d+)?)\s*(?:元|塊|NT\$|萬|千)?/g;
    const amountMatches = [...message.matchAll(amountPattern)];
    let amounts = amountMatches.map(m => {
        let num = parseFloat(m[1]);
        // 處理"萬"和"千"
        if (m[0].includes('萬')) num *= 10000;
        else if (m[0].includes('千')) num *= 1000;
        return num;
    }).filter(a => a > 0);
    
    // 提取日期（支持多種格式：12/7、12-7、12月7號等）
    const datePattern = /(\d{1,2})\s*[\/\-月]\s*(\d{1,2})/g;
    const dateMatches = [...message.matchAll(datePattern)];
    
    // 優先處理：日期+金額查詢（例如：12/7花了1500）
    if (dateMatches.length > 0 && amounts.length > 0) {
        return addConversationalPrefix(queryDateAndAmount(userMessage, records, dateMatches[0], amounts[0]));
    }
    
    // 金額查詢（例如：1500是買了什麼、1500買了什麼）
    if (amounts.length > 0) {
        const amountKeywords = ['是買了', '買了什麼', '是花了', '花了什麼', '買了', '花了', '用了', '付了', '花了多少', '買了多少'];
        if (amountKeywords.some(kw => message.includes(kw))) {
            return addConversationalPrefix(queryAmountOnly(userMessage, records, amounts[0]));
        }
    }
    
    // 時間+金額+分類查詢（例如：什麼時候買午餐花了170）
    if ((message.includes('什麼時候') || message.includes('哪天') || message.includes('幾號') || 
         message.includes('何時') || message.includes('何日')) && 
        (message.includes('花了') || message.includes('買了') || message.includes('用了') || 
         message.includes('付了')) && amounts.length > 0) {
        return addConversationalPrefix(queryAmountAndCategory(userMessage, records));
    }
    
    // 日期查詢（例如：12/7買了什麼、12月7號買了什麼）
    if (dateMatches.length > 0) {
        const dateKeywords = ['買了什麼', '花了什麼', '買了', '花了', '記錄', '交易', '做了什麼'];
        if (dateKeywords.some(kw => message.includes(kw))) {
            return addConversationalPrefix(queryDateRecords(userMessage, records));
        }
    }
    
    // 分類查詢（例如：午餐花了多少、交通費多少）
    const categoryKeywords = ['午餐', '早餐', '晚餐', '宵夜', '食物', '餐', '飯', '交通', '車', '購物', 
                              '娛樂', '醫療', '房租', '水電', '電費', '網路', '電話', '手機'];
    const foundCategory = categoryKeywords.find(cat => originalMessage.includes(cat));
    if (foundCategory && (message.includes('多少') || message.includes('花了') || message.includes('支出'))) {
        return addConversationalPrefix(queryCategorySpending(records, foundCategory));
    }
    
    // 統計類查詢（例如：最多、最少、最大、最小）
    if (message.includes('最多') || message.includes('最大') || message.includes('最高')) {
        return addConversationalPrefix(queryTopSpending(records, message));
    }
    if (message.includes('最少') || message.includes('最小') || message.includes('最低')) {
        return addConversationalPrefix(queryLowestSpending(records, message));
    }
    
    // 比較查詢（例如：這個月比上個月、這個月和上個月）
    if (message.includes('比') || message.includes('比較') || message.includes('對比')) {
        return addConversationalPrefix(compareMonths(records));
    }
    
    // 分析關鍵詞（擴展更多變體）
    let response = '';
    if (message.includes('支出') || message.includes('花費') || message.includes('花錢') || 
        message.includes('開銷') || message.includes('消費') || message.includes('花掉')) {
        response = analyzeExpenses(records);
    } else if (message.includes('收入') || message.includes('賺') || message.includes('薪水') || 
               message.includes('工資') || message.includes('薪資') || message.includes('進帳')) {
        response = analyzeIncome(records);
    } else if (message.includes('建議') || message.includes('理財') || message.includes('省錢') || 
               message.includes('如何') || message.includes('怎麼') || message.includes('應該')) {
        response = provideFinancialAdvice(records);
    } else if (message.includes('分類') || message.includes('類別') || message.includes('項目')) {
        response = analyzeCategories(records);
    } else if (message.includes('趨勢') || message.includes('變化') || message.includes('走勢') || 
               message.includes('成長') || message.includes('下降')) {
        response = analyzeTrends(records);
    } else if (message.includes('預算') || message.includes('上限') || message.includes('限制')) {
        response = analyzeBudget(records);
    } else if (message.includes('總計') || message.includes('總和') || message.includes('加總')) {
        response = getTotalSummary(records);
    } else if (message.includes('平均') || message.includes('均值')) {
        response = getAverageAnalysis(records);
    } else {
        // 嘗試智能理解問題
        response = getSmartResponse(userMessage, records);
    }
    
        // 為所有回應添加口語化前綴（隨機）
        return addConversationalPrefix(response);
    } catch (e) {
        console.error('generateAdvisorResponse failed:', e);
        return '我剛剛整理資料時遇到一點問題，請你再問一次，或試試看「本月支出分析 / 最大支出分類 / 預算狀況」。';
    }
}

// 分析支出
function analyzeExpenses(records) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyExpenses = records.filter(r => {
        const recordDate = new Date(r.date);
        return (r.type === 'expense' || !r.type) && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    const total = monthlyExpenses.reduce((sum, r) => sum + (r.amount || 0), 0);
    const avg = monthlyExpenses.length > 0 ? total / monthlyExpenses.length : 0;
    
    let response = `📊 本月支出分析：\n\n`;
    response += `• 總支出：NT$ ${total.toLocaleString('zh-TW')}\n`;
    response += `• 交易筆數：${monthlyExpenses.length} 筆\n`;
    response += `• 平均每筆：NT$ ${Math.round(avg).toLocaleString('zh-TW')}\n\n`;
    
    // 分類統計
    const categoryStats = {};
    monthlyExpenses.forEach(r => {
        const category = r.category || '未分類';
        categoryStats[category] = (categoryStats[category] || 0) + (r.amount || 0);
    });
    
    const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
        response += `💰 支出分類排行：\n`;
        sortedCategories.slice(0, 5).forEach(([cat, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            response += `${index + 1}. ${cat}：NT$ ${amount.toLocaleString('zh-TW')} (${percentage}%)\n`;
        });
    }
    
    return response;
}

// 分析收入
function analyzeIncome(records) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyIncomes = records.filter(r => {
        const recordDate = new Date(r.date);
        return r.type === 'income' && 
               recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    const total = monthlyIncomes.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    let response = `💰 本月收入分析：\n\n`;
    response += `• 總收入：NT$ ${total.toLocaleString('zh-TW')}\n`;
    response += `• 收入筆數：${monthlyIncomes.length} 筆\n`;
    
    if (total > 0) {
        const avg = total / monthlyIncomes.length;
        response += `• 平均每筆：NT$ ${Math.round(avg).toLocaleString('zh-TW')}\n`;
    }
    
    return response;
}

// 提供理財建議
function provideFinancialAdvice(records) {
    const now = new Date();
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
    // 解析日期 - 優先匹配 12/7、12-7 這種格式
    const datePatterns = [
        /(\d{1,2})\s*[\/\-]\s*(\d{1,2})/g,  // 例如：12/7、12-7（優先）
        /(\d{1,2})\s*月\s*(\d{1,2})\s*號/g,  // 例如：12月7號
        /(\d{1,2})\s*[月\/\-]\s*(\d{1,2})/g,  // 例如：12月5、12/5、12-5
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
                // 解析月日格式（支持 12/7、12-7、12月7號等）
                const numbers = matchStr.match(/\d+/g);
                if (numbers && numbers.length >= 2) {
                    const month = parseInt(numbers[0]);
                    const day = parseInt(numbers[1]);
                    // 如果月份大於12，可能是 日/月 格式（如 7/12 表示12月7日）
                    if (month > 12 && day <= 12) {
                        targetDate = new Date(now.getFullYear(), day - 1, month);
                    } else {
                        targetDate = new Date(now.getFullYear(), month - 1, day);
                    }
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

