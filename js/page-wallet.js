// 錢包/預算頁面（由 script.js 拆出）

// 初始化錢包/預算頁面
function initBudget() {
    loadAccounts();
    loadBudgetData();
    updateBudgetSummary();
    bindBudgetEvents();
}

// 載入帳戶資料
function loadAccounts() {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const accountList = document.getElementById('accountList');
    if (!accountList) return;

    if (accounts.length === 0) {
        accountList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 16px;">💳</div>
                <div>尚無帳戶</div>
                <div style="font-size: 12px; margin-top: 8px; color: #ccc;">點擊下方按鈕新增帳戶</div>
                <button class="btn btn-primary" onclick="showAddAccountModal()" style="margin-top: 16px;">新增帳戶</button>
            </div>
        `;
        return;
    }

    let html = '';
    accounts.forEach(account => {
        const balance = account.balance || 0;
        html += `
            <div class="account-item" data-id="${account.id}">
                <div class="account-info">
                    <div class="account-name">${account.name}</div>
                    <div class="account-type">${account.type || '一般帳戶'}</div>
                </div>
                <div class="account-balance ${balance >= 0 ? 'positive' : 'negative'}">
                    NT$${balance.toLocaleString('zh-TW')}
                </div>
                <div class="account-actions">
                    <button class="account-edit-btn" data-id="${account.id}">✏️</button>
                    <button class="account-delete-btn" data-id="${account.id}">🗑️</button>
                </div>
            </div>
        `;
    });

    accountList.innerHTML = html;
    bindAccountEvents();
}

// 載入預算資料
function loadBudgetData() {
    const monthKey = getSelectedMonthKey();
    const budgetData = JSON.parse(localStorage.getItem(`budget_${monthKey}`) || '{}');
    
    // 載入分類預算
    const categoryBudgets = budgetData.categories || {};
    const categoryBudgetList = document.getElementById('categoryBudgetList');
    if (categoryBudgetList) {
        renderCategoryBudgets(categoryBudgets);
    }

    // 載入總預算
    const totalBudget = budgetData.total || 0;
    const totalBudgetInput = document.getElementById('totalBudgetInput');
    if (totalBudgetInput) {
        totalBudgetInput.value = totalBudget;
    }
}

// 渲染分類預算
function renderCategoryBudgets(categoryBudgets) {
    const categoryBudgetList = document.getElementById('categoryBudgetList');
    if (!categoryBudgetList) return;

    const categories = JSON.parse(localStorage.getItem('expenseCategories') || '[]');
    
    if (categories.length === 0) {
        categoryBudgetList.innerHTML = '<div class="empty-state">尚無分類</div>';
        return;
    }

    let html = '';
    categories.forEach(category => {
        const budget = categoryBudgets[category] || 0;
        const spent = getCategorySpent(category);
        const remaining = budget - spent;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        html += `
            <div class="category-budget-item" data-category="${category}">
                <div class="category-budget-header">
                    <div class="category-name">${category}</div>
                    <div class="category-budget-amount">
                        NT$${budget.toLocaleString('zh-TW')}
                    </div>
                </div>
                <div class="category-budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${percentage > 100 ? 'over' : percentage > 80 ? 'warning' : ''}" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        已用 NT$${spent.toLocaleString('zh-TW')} (${percentage.toFixed(1)}%)
                    </div>
                </div>
                <div class="category-budget-remaining ${remaining < 0 ? 'over' : ''}">
                    剩餘 NT$${remaining.toLocaleString('zh-TW')}
                </div>
                <div class="category-budget-actions">
                    <button class="budget-edit-btn" data-category="${category}">編輯</button>
                </div>
            </div>
        `;
    });

    categoryBudgetList.innerHTML = html;
    bindCategoryBudgetEvents();
}

// 取得分類支出
function getCategorySpent(category) {
    const monthKey = getSelectedMonthKey();
    const monthData = JSON.parse(localStorage.getItem(monthKey) || '{}');
    const records = monthData.records || [];
    
    return records
        .filter(r => r.category === category && (r.type === 'expense' || !r.type))
        .reduce((sum, r) => sum + (r.amount || 0), 0);
}

// 更新預算摘要
function updateBudgetSummary() {
    const monthKey = getSelectedMonthKey();
    const budgetData = JSON.parse(localStorage.getItem(`budget_${monthKey}`) || '{}');
    const totalBudget = budgetData.total || 0;
    
    // 計算總支出
    const monthData = JSON.parse(localStorage.getItem(monthKey) || '{}');
    const records = monthData.records || [];
    const totalSpent = records
        .filter(r => r.type === 'expense' || !r.type)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // 更新顯示
    const totalBudgetEl = document.getElementById('totalBudgetDisplay');
    const totalSpentEl = document.getElementById('totalSpentDisplay');
    const remainingEl = document.getElementById('remainingDisplay');
    const progressEl = document.getElementById('totalBudgetProgress');

    if (totalBudgetEl) totalBudgetEl.textContent = `NT$${totalBudget.toLocaleString('zh-TW')}`;
    if (totalSpentEl) totalSpentEl.textContent = `NT$${totalSpent.toLocaleString('zh-TW')}`;
    if (remainingEl) {
        remainingEl.textContent = `NT$${remaining.toLocaleString('zh-TW')}`;
        remainingEl.className = remaining < 0 ? 'budget-remaining over' : 'budget-remaining';
    }
    if (progressEl) {
        progressEl.style.width = `${Math.min(percentage, 100)}%`;
        progressEl.className = `progress-fill ${percentage > 100 ? 'over' : percentage > 80 ? 'warning' : ''}`;
    }
}

// 綁定預算頁面事件
function bindBudgetEvents() {
    // 新增帳戶按鈕
    const addAccountBtn = document.getElementById('addAccountBtn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', showAddAccountModal);
    }

    // 總預算設定
    const totalBudgetInput = document.getElementById('totalBudgetInput');
    if (totalBudgetInput) {
        totalBudgetInput.addEventListener('change', (e) => {
            const totalBudget = parseFloat(e.target.value) || 0;
            saveTotalBudget(totalBudget);
            updateBudgetSummary();
        });
    }

    // 新增分類預算按鈕
    const addCategoryBudgetBtn = document.getElementById('addCategoryBudgetBtn');
    if (addCategoryBudgetBtn) {
        addCategoryBudgetBtn.addEventListener('click', showAddCategoryBudgetModal);
    }
}

// 綁定帳戶事件
function bindAccountEvents() {
    // 編輯按鈕
    document.querySelectorAll('.account-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const accountId = btn.dataset.id;
            editAccount(accountId);
        });
    });

    // 刪除按鈕
    document.querySelectorAll('.account-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const accountId = btn.dataset.id;
            deleteAccount(accountId);
        });
    });
}

// 綁定分類預算事件
function bindCategoryBudgetEvents() {
    document.querySelectorAll('.budget-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = btn.dataset.category;
            editCategoryBudget(category);
        });
    });
}

// 顯示新增帳戶模態框
function showAddAccountModal() {
    const modal = createModal({
        title: '💳 新增帳戶',
        content: `
            <form id="addAccountForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">帳戶名稱</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="例如：郵局帳戶">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">帳戶類型</label>
                    <select name="type" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="一般帳戶">一般帳戶</option>
                        <option value="信用卡">信用卡</option>
                        <option value="儲蓄帳戶">儲蓄帳戶</option>
                        <option value="投資帳戶">投資帳戶</option>
                        <option value="現金">現金</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">初始餘額</label>
                    <input type="number" name="balance" step="1" value="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="0">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">新增</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#addAccountForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAccount(collectForm('#addAccountForm'));
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 儲存帳戶
function saveAccount(data) {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const account = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString()
    };

    accounts.push(account);
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    loadAccounts();
    showNotification('帳戶已新增', 'success');
    playClickSound();
}

// 編輯帳戶
function editAccount(accountId) {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const modal = createModal({
        title: '✏️ 編輯帳戶',
        content: `
            <form id="editAccountForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">帳戶名稱</label>
                    <input type="text" name="name" required value="${account.name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">帳戶類型</label>
                    <select name="type" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="一般帳戶" ${account.type === '一般帳戶' ? 'selected' : ''}>一般帳戶</option>
                        <option value="信用卡" ${account.type === '信用卡' ? 'selected' : ''}>信用卡</option>
                        <option value="儲蓄帳戶" ${account.type === '儲蓄帳戶' ? 'selected' : ''}>儲蓄帳戶</option>
                        <option value="投資帳戶" ${account.type === '投資帳戶' ? 'selected' : ''}>投資帳戶</option>
                        <option value="現金" ${account.type === '現金' ? 'selected' : ''}>現金</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">餘額</label>
                    <input type="number" name="balance" step="1" value="${account.balance || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editAccountForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateAccount(accountId, collectForm('#editAccountForm'));
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 更新帳戶
function updateAccount(accountId, data) {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) return;

    accounts[index] = {
        ...accounts[index],
        ...data,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    loadAccounts();
    showNotification('帳戶已更新', 'success');
}

// 刪除帳戶
function deleteAccount(accountId) {
    if (!confirm('確定要刪除這個帳戶嗎？')) return;

    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const filteredAccounts = accounts.filter(a => a.id !== accountId);
    
    localStorage.setItem('accounts', JSON.stringify(filteredAccounts));
    
    loadAccounts();
    showNotification('帳戶已刪除', 'success');
}

// 儲存總預算
function saveTotalBudget(totalBudget) {
    const monthKey = getSelectedMonthKey();
    const budgetData = JSON.parse(localStorage.getItem(`budget_${monthKey}`) || '{}');
    
    budgetData.total = totalBudget;
    budgetData.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(`budget_${monthKey}`, JSON.stringify(budgetData));
}

// 顯示新增分類預算模態框
function showAddCategoryBudgetModal() {
    const categories = JSON.parse(localStorage.getItem('expenseCategories') || '[]');
    
    const modal = createModal({
        title: '💰 設定分類預算',
        content: `
            <form id="addCategoryBudgetForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">選擇分類</label>
                    <select name="category" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">請選擇分類</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">預算金額</label>
                    <input type="number" name="budget" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="請輸入預算金額">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">設定</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#addCategoryBudgetForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#addCategoryBudgetForm');
        saveCategoryBudget(data.category, data.budget);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 儲存分類預算
function saveCategoryBudget(category, budget) {
    const monthKey = getSelectedMonthKey();
    const budgetData = JSON.parse(localStorage.getItem(`budget_${monthKey}`) || '{}');
    
    if (!budgetData.categories) {
        budgetData.categories = {};
    }
    
    budgetData.categories[category] = parseFloat(budget) || 0;
    budgetData.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(`budget_${monthKey}`, JSON.stringify(budgetData));
    
    loadBudgetData();
    updateBudgetSummary();
    showNotification('分類預算已設定', 'success');
    playClickSound();
}

// 編輯分類預算
function editCategoryBudget(category) {
    const monthKey = getSelectedMonthKey();
    const budgetData = JSON.parse(localStorage.getItem(`budget_${monthKey}`) || '{}');
    const currentBudget = budgetData.categories?.[category] || 0;

    const modal = createModal({
        title: '✏️ 編輯分類預算',
        content: `
            <form id="editCategoryBudgetForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">分類</label>
                    <input type="text" value="${category}" readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; background: #f5f5f5;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">預算金額</label>
                    <input type="number" name="budget" min="0" step="1" required value="${currentBudget}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editCategoryBudgetForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#editCategoryBudgetForm');
        saveCategoryBudget(category, data.budget);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 取得選中的月份鍵值
function getSelectedMonthKey() {
    const selectedMonth = document.getElementById('selectedMonth');
    if (selectedMonth) {
        return selectedMonth.value;
    }
    // 如果沒有選擇器，使用當前月份
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBudget);
} else {
    initBudget();
}
