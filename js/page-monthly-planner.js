// 每月規劃頁面（由 script.js 拆出）

// 初始化每月規劃頁面
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

    const totalIncomeEl = document.getElementById('monthlyPlannerTotalIncome');
    const totalExpenseEl = document.getElementById('monthlyPlannerTotalExpense');
    const remainingEl = document.getElementById('monthlyPlannerRemaining');

    // 載入月度規劃資料
    loadMonthlyPlannerData(monthKey);

    // 綁定事件
    bindMonthlyPlannerEvents();

    // 更新摘要
    updateMonthlyPlannerSummary();
}

// 載入月度規劃資料
function loadMonthlyPlannerData(monthKey) {
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');

    // 載入收入
    const incomeInput = document.getElementById('monthlyIncomeInput');
    if (incomeInput) {
        incomeInput.value = plannerData.income || '';
    }

    // 載入固定支出
    renderFixedExpenses(plannerData.fixed || []);

    // 載入儲蓄目標
    renderSavingGoals(plannerData.goals || []);

    // 載入個人支出
    renderPersonalExpenses(plannerData.personal || []);
}

// 渲染固定支出
function renderFixedExpenses(fixedExpenses) {
    const fixedListEl = document.getElementById('monthlyPlannerFixedList');
    if (!fixedListEl) return;

    if (fixedExpenses.length === 0) {
        fixedListEl.innerHTML = '<div class="empty-state">尚無固定支出</div>';
        return;
    }

    let html = '';
    fixedExpenses.forEach((expense, index) => {
        html += `
            <div class="planner-item" data-type="fixed" data-index="${index}">
                <div class="planner-item-info">
                    <div class="planner-item-name">${expense.name}</div>
                    <div class="planner-item-amount">NT$${expense.amount.toLocaleString('zh-TW')}</div>
                </div>
                <div class="planner-item-actions">
                    <button class="planner-edit-btn" data-type="fixed" data-index="${index}">✏️</button>
                    <button class="planner-delete-btn" data-type="fixed" data-index="${index}">🗑️</button>
                </div>
            </div>
        `;
    });

    fixedListEl.innerHTML = html;
    updateFixedSubtotal();
}

// 渲染儲蓄目標
function renderSavingGoals(goals) {
    const goalListEl = document.getElementById('savingGoalList');
    if (!goalListEl) return;

    if (goals.length === 0) {
        goalListEl.innerHTML = '<div class="empty-state">尚無儲蓄目標</div>';
        return;
    }

    let html = '';
    goals.forEach((goal, index) => {
        const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
        const remaining = goal.target - goal.saved;
        
        html += `
            <div class="goal-item" data-index="${index}">
                <div class="goal-info">
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-target">目標: NT$${goal.target.toLocaleString('zh-TW')}</div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(1)}%</div>
                    </div>
                </div>
                <div class="goal-details">
                    <div class="goal-saved">已存: NT$${goal.saved.toLocaleString('zh-TW')}</div>
                    <div class="goal-remaining ${remaining < 0 ? 'completed' : ''}">
                        ${remaining <= 0 ? '已完成' : `剩餘: NT$${remaining.toLocaleString('zh-TW')}`}
                    </div>
                    <div class="goal-monthly">每月: NT$${goal.monthly.toLocaleString('zh-TW')}</div>
                </div>
                <div class="goal-actions">
                    <button class="goal-edit-btn" data-index="${index}">✏️</button>
                    <button class="goal-delete-btn" data-index="${index}">🗑️</button>
                </div>
            </div>
        `;
    });

    goalListEl.innerHTML = html;
    updateSavingsSubtotal();
}

// 渲染個人支出
function renderPersonalExpenses(personalExpenses) {
    const personalListEl = document.getElementById('monthlyPlannerPersonalList');
    if (!personalListEl) return;

    if (personalExpenses.length === 0) {
        personalListEl.innerHTML = '<div class="empty-state">尚無個人支出</div>';
        return;
    }

    let html = '';
    personalExpenses.forEach((expense, index) => {
        html += `
            <div class="planner-item" data-type="personal" data-index="${index}">
                <div class="planner-item-info">
                    <div class="planner-item-name">${expense.name}</div>
                    <div class="planner-item-amount">NT$${expense.amount.toLocaleString('zh-TW')}</div>
                </div>
                <div class="planner-item-actions">
                    <button class="planner-edit-btn" data-type="personal" data-index="${index}">✏️</button>
                    <button class="planner-delete-btn" data-type="personal" data-index="${index}">🗑️</button>
                </div>
            </div>
        `;
    });

    personalListEl.innerHTML = html;
    updatePersonalSubtotal();
}

// 綁定每月規劃事件
function bindMonthlyPlannerEvents() {
    // 收入輸入
    const incomeInput = document.getElementById('monthlyIncomeInput');
    if (incomeInput) {
        incomeInput.addEventListener('change', (e) => {
            saveMonthlyIncome(parseFloat(e.target.value) || 0);
            updateMonthlyPlannerSummary();
        });
    }

    // 新增固定支出
    const addFixedBtn = document.getElementById('addFixedExpenseBtn');
    if (addFixedBtn) {
        addFixedBtn.addEventListener('click', showAddFixedExpenseModal);
    }

    // 新增儲蓄目標
    const goalAddBtn = document.getElementById('savingGoalAddBtn');
    if (goalAddBtn) {
        goalAddBtn.addEventListener('click', showAddSavingGoalModal);
    }

    // 新增個人支出
    const addPersonalBtn = document.getElementById('addPersonalExpenseBtn');
    if (addPersonalBtn) {
        addPersonalBtn.addEventListener('click', showAddPersonalExpenseModal);
    }

    // 綁定編輯/刪除按鈕
    bindPlannerItemEvents();
}

// 綁定規劃項目事件
function bindPlannerItemEvents() {
    // 固定支出編輯/刪除
    document.querySelectorAll('.planner-edit-btn[data-type="fixed"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            editFixedExpense(index);
        });
    });

    document.querySelectorAll('.planner-delete-btn[data-type="fixed"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteFixedExpense(index);
        });
    });

    // 儲蓄目標編輯/刪除
    document.querySelectorAll('.goal-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            editSavingGoal(index);
        });
    });

    document.querySelectorAll('.goal-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteSavingGoal(index);
        });
    });

    // 個人支出編輯/刪除
    document.querySelectorAll('.planner-edit-btn[data-type="personal"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            editPersonalExpense(index);
        });
    });

    document.querySelectorAll('.planner-delete-btn[data-type="personal"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deletePersonalExpense(index);
        });
    });
}

// 顯示新增固定支出模態框
function showAddFixedExpenseModal() {
    const modal = createModal({
        title: '📌 新增固定支出',
        content: `
            <form id="addFixedExpenseForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">項目名稱</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="例如：房租">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">金額</label>
                    <input type="number" name="amount" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="請輸入金額">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">新增</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#addFixedExpenseForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#addFixedExpenseForm');
        addFixedExpense(data.name, parseFloat(data.amount) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 新增固定支出
function addFixedExpense(name, amount) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.fixed) {
        plannerData.fixed = [];
    }
    
    plannerData.fixed.push({
        id: Date.now().toString(),
        name,
        amount,
        createdAt: new Date().toISOString()
    });
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderFixedExpenses(plannerData.fixed);
    updateMonthlyPlannerSummary();
    showNotification('固定支出已新增', 'success');
    playClickSound();
}

// 編輯固定支出
function editFixedExpense(index) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const expense = plannerData.fixed?.[index];
    if (!expense) return;

    const modal = createModal({
        title: '✏️ 編輯固定支出',
        content: `
            <form id="editFixedExpenseForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">項目名稱</label>
                    <input type="text" name="name" required value="${expense.name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">金額</label>
                    <input type="number" name="amount" min="0" step="1" required value="${expense.amount}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editFixedExpenseForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#editFixedExpenseForm');
        updateFixedExpense(index, data.name, parseFloat(data.amount) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 更新固定支出
function updateFixedExpense(index, name, amount) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.fixed || !plannerData.fixed[index]) return;
    
    plannerData.fixed[index] = {
        ...plannerData.fixed[index],
        name,
        amount,
        updatedAt: new Date().toISOString()
    };
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderFixedExpenses(plannerData.fixed);
    updateMonthlyPlannerSummary();
    showNotification('固定支出已更新', 'success');
}

// 刪除固定支出
function deleteFixedExpense(index) {
    if (!confirm('確定要刪除這筆固定支出嗎？')) return;

    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.fixed) return;
    
    plannerData.fixed.splice(index, 1);
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderFixedExpenses(plannerData.fixed);
    updateMonthlyPlannerSummary();
    showNotification('固定支出已刪除', 'success');
}

// 顯示新增儲蓄目標模態框
function showAddSavingGoalModal() {
    const modal = createModal({
        title: '🎯 新增儲蓄目標',
        content: `
            <form id="addSavingGoalForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">目標名稱</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="例如：買車基金">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">目標金額</label>
                    <input type="number" name="target" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="請輸入目標金額">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">已存金額</label>
                    <input type="number" name="saved" min="0" step="1" value="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="已存金額">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">每月儲蓄</label>
                    <input type="number" name="monthly" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="每月計劃儲蓄金額">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">新增</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#addSavingGoalForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#addSavingGoalForm');
        addSavingGoal(data.name, parseFloat(data.target) || 0, parseFloat(data.saved) || 0, parseFloat(data.monthly) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 新增儲蓄目標
function addSavingGoal(name, target, saved, monthly) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.goals) {
        plannerData.goals = [];
    }
    
    plannerData.goals.push({
        id: Date.now().toString(),
        name,
        target,
        saved,
        monthly,
        createdAt: new Date().toISOString()
    });
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderSavingGoals(plannerData.goals);
    updateMonthlyPlannerSummary();
    showNotification('儲蓄目標已新增', 'success');
    playClickSound();
}

// 編輯儲蓄目標
function editSavingGoal(index) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const goal = plannerData.goals?.[index];
    if (!goal) return;

    const modal = createModal({
        title: '✏️ 編輯儲蓄目標',
        content: `
            <form id="editSavingGoalForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">目標名稱</label>
                    <input type="text" name="name" required value="${goal.name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">目標金額</label>
                    <input type="number" name="target" min="0" step="1" required value="${goal.target}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">已存金額</label>
                    <input type="number" name="saved" min="0" step="1" value="${goal.saved}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">每月儲蓄</label>
                    <input type="number" name="monthly" min="0" step="1" required value="${goal.monthly}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editSavingGoalForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#editSavingGoalForm');
        updateSavingGoal(index, data.name, parseFloat(data.target) || 0, parseFloat(data.saved) || 0, parseFloat(data.monthly) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 更新儲蓄目標
function updateSavingGoal(index, name, target, saved, monthly) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.goals || !plannerData.goals[index]) return;
    
    plannerData.goals[index] = {
        ...plannerData.goals[index],
        name,
        target,
        saved,
        monthly,
        updatedAt: new Date().toISOString()
    };
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderSavingGoals(plannerData.goals);
    updateMonthlyPlannerSummary();
    showNotification('儲蓄目標已更新', 'success');
}

// 刪除儲蓄目標
function deleteSavingGoal(index) {
    if (!confirm('確定要刪除這個儲蓄目標嗎？')) return;

    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.goals) return;
    
    plannerData.goals.splice(index, 1);
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderSavingGoals(plannerData.goals);
    updateMonthlyPlannerSummary();
    showNotification('儲蓄目標已刪除', 'success');
}

// 顯示新增個人支出模態框
function showAddPersonalExpenseModal() {
    const modal = createModal({
        title: '💸 新增個人支出',
        content: `
            <form id="addPersonalExpenseForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">項目名稱</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="例如：娛樂">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">預算金額</label>
                    <input type="number" name="amount" min="0" step="1" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="請輸入預算金額">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">新增</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#addPersonalExpenseForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#addPersonalExpenseForm');
        addPersonalExpense(data.name, parseFloat(data.amount) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 新增個人支出
function addPersonalExpense(name, amount) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.personal) {
        plannerData.personal = [];
    }
    
    plannerData.personal.push({
        id: Date.now().toString(),
        name,
        amount,
        createdAt: new Date().toISOString()
    });
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderPersonalExpenses(plannerData.personal);
    updateMonthlyPlannerSummary();
    showNotification('個人支出已新增', 'success');
    playClickSound();
}

// 編輯個人支出
function editPersonalExpense(index) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const expense = plannerData.personal?.[index];
    if (!expense) return;

    const modal = createModal({
        title: '✏️ 編輯個人支出',
        content: `
            <form id="editPersonalExpenseForm" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">項目名稱</label>
                    <input type="text" name="name" required value="${expense.name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">預算金額</label>
                    <input type="number" name="amount" min="0" step="1" required value="${expense.amount}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" data-action="cancel">取消</button>
                    <button type="submit" class="btn btn-primary">更新</button>
                </div>
            </form>
        `
    });

    // 綁定表單提交
    const form = modal.element.querySelector('#editPersonalExpenseForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectForm('#editPersonalExpenseForm');
        updatePersonalExpense(index, data.name, parseFloat(data.amount) || 0);
        modal.close();
    });

    // 取消按鈕
    modal.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
    });
}

// 更新個人支出
function updatePersonalExpense(index, name, amount) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.personal || !plannerData.personal[index]) return;
    
    plannerData.personal[index] = {
        ...plannerData.personal[index],
        name,
        amount,
        updatedAt: new Date().toISOString()
    };
    
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderPersonalExpenses(plannerData.personal);
    updateMonthlyPlannerSummary();
    showNotification('個人支出已更新', 'success');
}

// 刪除個人支出
function deletePersonalExpense(index) {
    if (!confirm('確定要刪除這筆個人支出嗎？')) return;

    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    if (!plannerData.personal) return;
    
    plannerData.personal.splice(index, 1);
    plannerData.lastUpdated = new Date().toISOString();
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
    
    renderPersonalExpenses(plannerData.personal);
    updateMonthlyPlannerSummary();
    showNotification('個人支出已刪除', 'success');
}

// 儲存月收入
function saveMonthlyIncome(income) {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    plannerData.income = income;
    plannerData.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(`planner_${monthKey}`, JSON.stringify(plannerData));
}

// 更新固定支出小計
function updateFixedSubtotal() {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const fixedExpenses = plannerData.fixed || [];
    
    const subtotal = fixedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const subtotalEl = document.getElementById('monthlyPlannerFixedSubtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `NT$${subtotal.toLocaleString('zh-TW')}`;
    }
}

// 更新儲蓄小計
function updateSavingsSubtotal() {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const goals = plannerData.goals || [];
    
    const subtotal = goals.reduce((sum, goal) => sum + (goal.monthly || 0), 0);
    
    const subtotalEl = document.getElementById('monthlyPlannerSavingsSubtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `NT$${subtotal.toLocaleString('zh-TW')}`;
    }
}

// 更新個人支出小計
function updatePersonalSubtotal() {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    const personalExpenses = plannerData.personal || [];
    
    const subtotal = personalExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const subtotalEl = document.getElementById('monthlyPlannerPersonalSubtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `NT$${subtotal.toLocaleString('zh-TW')}`;
    }
}

// 更新每月規劃摘要
function updateMonthlyPlannerSummary() {
    const monthKey = getSelectedMonthKey();
    const plannerData = JSON.parse(localStorage.getItem(`planner_${monthKey}`) || '{}');
    
    const income = plannerData.income || 0;
    const fixedTotal = (plannerData.fixed || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const savingsTotal = (plannerData.goals || []).reduce((sum, g) => sum + (g.monthly || 0), 0);
    const personalTotal = (plannerData.personal || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const totalExpense = fixedTotal + savingsTotal + personalTotal;
    const remaining = income - totalExpense;

    // 更新顯示
    const totalIncomeEl = document.getElementById('monthlyPlannerTotalIncome');
    const totalExpenseEl = document.getElementById('monthlyPlannerTotalExpense');
    const remainingEl = document.getElementById('monthlyPlannerRemaining');

    if (totalIncomeEl) totalIncomeEl.textContent = `NT$${income.toLocaleString('zh-TW')}`;
    if (totalExpenseEl) totalExpenseEl.textContent = `NT$${totalExpense.toLocaleString('zh-TW')}`;
    if (remainingEl) {
        remainingEl.textContent = `NT$${remaining.toLocaleString('zh-TW')}`;
        remainingEl.className = remaining >= 0 ? 'planner-remaining positive' : 'planner-remaining negative';
    }
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonthlyPlannerPage);
} else {
    initMonthlyPlannerPage();
}
