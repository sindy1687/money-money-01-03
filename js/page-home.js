// 記帳首頁邏輯（由 script.js 拆出）

// 當前月份記錄
let currentMonthRecords = [];
let currentMonth = '';

// 初始化記帳首頁
function initHomePage() {
    updateCurrentMonth();
    renderRecords();
    updateSummary();
    bindHomeEvents();
}

// 更新當前月份
function updateCurrentMonth() {
    const now = new Date();
    currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 載入當月記錄
    const monthData = JSON.parse(localStorage.getItem(currentMonth) || '{}');
    currentMonthRecords = monthData.records || [];
}

// 渲染記錄列表
function renderRecords() {
    const recordsList = document.getElementById('ledgerList');
    if (!recordsList) return;

    if (currentMonthRecords.length === 0) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                <div>本月尚無記錄</div>
                <div style="font-size: 12px; margin-top: 8px; color: #ccc;">點擊下方按鈕開始記帳</div>
            </div>
        `;
        return;
    }

    // 按日期排序（最新的在前）
    const sortedRecords = [...currentMonthRecords].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return dateB - dateA;
    });

    let html = '';
    sortedRecords.forEach(record => {
        html += renderRecordItem(record);
    });

    recordsList.innerHTML = html;
    bindRecordEvents();
}

// 渲染單筆記錄
function renderRecordItem(record) {
    const isIncome = record.type === 'income';
    const amountClass = isIncome ? 'income' : 'expense';
    const amountPrefix = isIncome ? '+' : '-';
    
    return `
        <div class="record-item" data-id="${record.id}">
            <div class="record-date">${record.date}</div>
            <div class="record-category">${record.category || '未分類'}</div>
            <div class="record-description">${record.description || ''}</div>
            <div class="record-amount ${amountClass}">${amountPrefix}NT$${(record.amount || 0).toLocaleString('zh-TW')}</div>
            <div class="record-actions">
                <button class="record-edit-btn" data-id="${record.id}">✏️</button>
                <button class="record-delete-btn" data-id="${record.id}">🗑️</button>
            </div>
        </div>
    `;
}

// 綁定記錄事件
function bindRecordEvents() {
    // 編輯按鈕
    document.querySelectorAll('.record-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recordId = btn.dataset.id;
            editRecord(recordId);
        });
    });

    // 刪除按鈕
    document.querySelectorAll('.record-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recordId = btn.dataset.id;
            deleteRecord(recordId);
        });
    });

    // 記錄項目點擊
    document.querySelectorAll('.record-item').forEach(item => {
        item.addEventListener('click', () => {
            // 可以展開詳細資訊或執行其他操作
        });
    });
}

// 更新統計資訊
function updateSummary() {
    const totalIncome = currentMonthRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const totalExpense = currentMonthRecords
        .filter(r => r.type === 'expense' || !r.type)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const balance = totalIncome - totalExpense;

    // 更新顯示
    const incomeEl = document.getElementById('totalIncome');
    const expenseEl = document.getElementById('totalExpense');
    const balanceEl = document.getElementById('summaryLine');

    if (incomeEl) incomeEl.textContent = `NT$${totalIncome.toLocaleString('zh-TW')}`;
    if (expenseEl) expenseEl.textContent = `NT$${totalExpense.toLocaleString('zh-TW')}`;
    if (balanceEl) {
        balanceEl.textContent = `收入:NT$${totalIncome.toLocaleString('zh-TW')} 支出:NT$${totalExpense.toLocaleString('zh-TW')}`;
    }
}

// 綁定首頁事件
function bindHomeEvents() {
    // 新增記錄按鈕 - 使用浮動按鈕
    const addBtn = document.getElementById('fabBtn');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            // 顯示記帳輸入頁面
            const pageInput = document.getElementById('pageInput');
            const pageLedger = document.getElementById('pageLedger');
            const bottomNav = document.querySelector('.bottom-nav');
            
            if (pageInput) {
                pageInput.style.display = 'block';
                expandInputSection();
            }
            if (pageLedger) pageLedger.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
        });
    }

    // 月份切換
    const prevMonthBtn = document.getElementById('ledgerPrevMonthBtn');
    const nextMonthBtn = document.getElementById('ledgerNextMonthBtn');
    const currentMonthEl = document.getElementById('summaryMonth');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }

    updateCurrentMonthDisplay();
}

// 切換月份
function changeMonth(direction) {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;

    if (newMonth > 12) {
        newYear++;
        newMonth = 1;
    } else if (newMonth < 1) {
        newYear--;
        newMonth = 12;
    }

    currentMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    updateCurrentMonth();
    renderRecords();
    updateSummary();
    updateCurrentMonthDisplay();
}

// 更新月份顯示
function updateCurrentMonthDisplay() {
    const currentMonthEl = document.getElementById('summaryMonth');
    if (!currentMonthEl) return;

    const [year, month] = currentMonth.split('-');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentMonthEl.textContent = `${year}-${String(month).padStart(2, '0')}`;
}

// 顯示新增記錄模態框
function showAddRecordModal() {
    const modal = createModal({
        title: '📝 新增記錄',
        content: `
            <form id="addRecordForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">類型</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                            <input type="radio" name="type" value="income" required>
                            <span>💰 收入</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                            <input type="radio" name="type" value="expense" checked required>
                            <span>💸 支出</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">金額</label>
                    <input type="number" name="amount" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="請輸入金額">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">分類</label>
                    <select name="category" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">請選擇分類</option>
                        ${getCategoryOptions()}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">描述</label>
                    <input type="text" name="description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="選填">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">日期</label>
                    <input type="date" name="date" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">儲存</button>
                </div>
            </form>
        `
    });

    // 設定預設日期為今天
    const dateInput = modal.element.querySelector('input[name="date"]');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // 綁定表單提交
    const form = modal.element.querySelector('#addRecordForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecord(collectForm('#addRecordForm'));
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 獲得分類選項
function getCategoryOptions() {
    const categories = JSON.parse(localStorage.getItem('expenseCategories') || '[]');
    const incomeCategories = JSON.parse(localStorage.getItem('incomeCategories') || '[]');
    
    let html = '<optgroup label="支出分類">';
    categories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    html += '</optgroup><optgroup label="收入分類">';
    incomeCategories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    html += '</optgroup>';
    
    return html;
}

// 儲存記錄
function saveRecord(data) {
    const record = {
        id: Date.now().toString(),
        ...data,
        timestamp: new Date().toISOString()
    };

    currentMonthRecords.push(record);
    
    // 儲存到 localStorage
    const monthData = {
        month: currentMonth,
        records: currentMonthRecords,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(currentMonth, JSON.stringify(monthData));
    
    // 重新渲染
    renderRecords();
    updateSummary();
    
    // 播放音效
    if (record.type === 'income') {
        playIncomeSound();
    } else {
        playClickSound();
    }
    
    showNotification('記錄已儲存', 'success');
}

// 編輯記錄
function editRecord(recordId) {
    const record = currentMonthRecords.find(r => r.id === recordId);
    if (!record) return;

    const modal = createModal({
        title: '✏️ 編輯記錄',
        content: `
            <form id="editRecordForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">類型</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                            <input type="radio" name="type" value="income" ${record.type === 'income' ? 'checked' : ''} required>
                            <span>💰 收入</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                            <input type="radio" name="type" value="expense" ${record.type !== 'income' ? 'checked' : ''} required>
                            <span>💸 支出</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">金額</label>
                    <input type="number" name="amount" min="0" step="1" required value="${record.amount || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">分類</label>
                    <select name="category" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        ${getCategoryOptions(record.category)}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">描述</label>
                    <input type="text" name="description" value="${record.description || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="選填">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">日期</label>
                    <input type="date" name="date" required value="${record.date}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editRecordForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateRecord(recordId, collectForm('#editRecordForm'));
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 更新記錄
function updateRecord(recordId, data) {
    const index = currentMonthRecords.findIndex(r => r.id === recordId);
    if (index === -1) return;

    currentMonthRecords[index] = {
        ...currentMonthRecords[index],
        ...data,
        lastUpdated: new Date().toISOString()
    };

    // 儲存到 localStorage
    const monthData = {
        month: currentMonth,
        records: currentMonthRecords,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(currentMonth, JSON.stringify(monthData));
    
    // 重新渲染
    renderRecords();
    updateSummary();
    
    showNotification('記錄已更新', 'success');
}

// 刪除記錄
function deleteRecord(recordId) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;

    const index = currentMonthRecords.findIndex(r => r.id === recordId);
    if (index === -1) return;

    currentMonthRecords.splice(index, 1);

    // 儲存到 localStorage
    const monthData = {
        month: currentMonth,
        records: currentMonthRecords,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(currentMonth, JSON.stringify(monthData));
    
    // 重新渲染
    renderRecords();
    updateSummary();
    
    showNotification('記錄已刪除', 'success');
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 延遲初始化，確保其他模組已載入
        setTimeout(initHomePage, 100);
    });
} else {
    setTimeout(initHomePage, 100);
}
