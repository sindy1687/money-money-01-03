// 共用 UI 操作與 DOM 工具（模態、表單綁定、渲染輔助等）

// 通用 DOM 事件綁定
function bindClick(selector, handler) {
    document.addEventListener('click', e => {
        const target = e.target.closest(selector);
        if (target) handler(e, target);
    });
}

function bindSubmit(formSelector, handler) {
    const form = document.querySelector(formSelector);
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            handler(e, form);
        });
    }
}

// 通用列表渲染
function renderList(container, items, renderItem, emptyMessage = '無資料') {
    if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
        return;
    }
    container.innerHTML = items.map(renderItem).join('');
}

// 通用卡片渲染
function renderCard(data, template) {
    if (typeof template === 'function') return template(data);
    let html = template;
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, value || '');
    }
    return html;
}

// 通用表單填充
function fillForm(formSelector, data) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    for (const [name, value] of Object.entries(data)) {
        const field = form.querySelector(`[name="${name}"]`);
        if (!field) continue;
        if (field.type === 'checkbox') {
            field.checked = Boolean(value);
        } else if (field.type === 'radio') {
            const radio = form.querySelector(`[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        } else {
            field.value = value;
        }
        // 觸發 change 事件以便其他邏輯響應
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// 通用表單收集
function collectForm(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return {};
    const data = {};
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach(el => {
        const name = el.name;
        if (!name) return;
        if (el.type === 'checkbox') {
            data[name] = el.checked;
        } else if (el.type === 'radio') {
            if (el.checked) data[name] = el.value;
        } else {
            data[name] = el.value.trim();
        }
    });
    return data;
}

// 通用分頁控制
class Pagination {
    constructor(container, options = {}) {
        this.container = container;
        this.currentPage = options.page || 1;
        this.pageSize = options.pageSize || 10;
        this.totalItems = options.totalItems || 0;
        this.onPageChange = options.onPageChange;
        this.maxButtons = options.maxButtons || 5;
    }

    render() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        if (totalPages <= 1) {
            this.container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        
        // 上一頁
        if (this.currentPage > 1) {
            html += `<button class="page-btn" data-page="${this.currentPage - 1}">上一頁</button>`;
        }

        // 頁碼按鈕
        const start = Math.max(1, this.currentPage - Math.floor(this.maxButtons / 2));
        const end = Math.min(totalPages, start + this.maxButtons - 1);
        
        if (start > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (start > 2) html += '<span class="page-ellipsis">...</span>';
        }

        for (let i = start; i <= end; i++) {
            const active = i === this.currentPage ? ' active' : '';
            html += `<button class="page-btn${active}" data-page="${i}">${i}</button>`;
        }

        if (end < totalPages) {
            if (end < totalPages - 1) html += '<span class="page-ellipsis">...</span>';
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // 下一頁
        if (this.currentPage < totalPages) {
            html += `<button class="page-btn" data-page="${this.currentPage + 1}">下一頁</button>`;
        }

        html += '</div>';
        this.container.innerHTML = html;

        // 綁定點擊事件
        this.container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.render();
                    if (this.onPageChange) this.onPageChange(page);
                }
            });
        });
    }

    update(totalItems) {
        this.totalItems = totalItems;
        this.currentPage = 1;
        this.render();
    }
}

// 通用搜尋框
class SearchBox {
    constructor(inputSelector, options = {}) {
        this.input = document.querySelector(inputSelector);
        if (!this.input) return;
        this.onSearch = options.onSearch;
        this.debounceMs = options.debounceMs || 300;
        this.placeholder = options.placeholder || '搜尋...';
        this.init();
    }

    init() {
        this.input.placeholder = this.placeholder;
        let timeout;
        this.input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.onSearch) this.onSearch(this.input.value.trim());
            }, this.debounceMs);
        });

        // 清除按鈕
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; display: inline-block;';
        this.input.parentNode.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);

        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '✕';
        clearBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 4px;
            display: none;
        `;
        wrapper.appendChild(clearBtn);

        const updateClearBtn = () => {
            clearBtn.style.display = this.input.value ? 'block' : 'none';
        };

        this.input.addEventListener('input', updateClearBtn);
        clearBtn.addEventListener('click', () => {
            this.input.value = '';
            this.input.focus();
            updateClearBtn();
            if (this.onSearch) this.onSearch('');
        });
    }

    getValue() {
        return this.input.value.trim();
    }

    setValue(value) {
        this.input.value = value;
        this.input.dispatchEvent(new Event('input'));
    }

    clear() {
        this.setValue('');
    }
}

// 通用 Tabs
class Tabs {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        this.onTabChange = options.onTabChange;
        this.defaultTab = options.defaultTab || 0;
        this.init();
    }

    init() {
        this.tabButtons = this.container.querySelectorAll('[data-tab]');
        this.tabPanels = this.container.querySelectorAll('[data-tab-panel]');
        
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.showTab(tabId);
            });
        });

        // 顯示預設分頁
        const firstTab = this.tabButtons[this.defaultTab]?.dataset.tab;
        if (firstTab) this.showTab(firstTab);
    }

    showTab(tabId) {
        // 更新按鈕狀態
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 更新面板顯示
        this.tabPanels.forEach(panel => {
            panel.style.display = panel.dataset.tabPanel === tabId ? '' : 'none';
        });

        if (this.onTabChange) this.onTabChange(tabId);
    }

    getCurrentTab() {
        const activeBtn = this.container.querySelector('[data-tab].active');
        return activeBtn?.dataset.tab;
    }
}

// 通用下拉選單
class Dropdown {
    constructor(triggerSelector, options = {}) {
        this.trigger = document.querySelector(triggerSelector);
        if (!this.trigger) return;
        this.onSelect = options.onSelect;
        this.items = options.items || [];
        this.placeholder = options.placeholder || '請選擇';
        this.init();
    }

    init() {
        this.createDropdown();
        this.bindEvents();
    }

    createDropdown() {
        // 包裝器
        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown-wrapper';
        this.trigger.parentNode.insertBefore(wrapper, this.trigger);
        wrapper.appendChild(this.trigger);

        // 下拉面板
        this.panel = document.createElement('div');
        this.panel.className = 'dropdown-panel';
        this.panel.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;

        // 選項
        this.renderItems();

        wrapper.appendChild(this.panel);
    }

    renderItems() {
        this.panel.innerHTML = this.items.map(item => `
            <div class="dropdown-item" data-value="${item.value}" style="
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
            ">
                ${item.label || item.value}
            </div>
        `).join('');

        // 綁定點擊事件
        this.panel.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                const label = item.textContent;
                this.select(value, label);
            });
        });
    }

    select(value, label) {
        this.trigger.textContent = label;
        this.hide();
        if (this.onSelect) this.onSelect(value, label);
    }

    show() {
        this.panel.style.display = 'block';
        document.addEventListener('click', this.handleClickOutside);
    }

    hide() {
        this.panel.style.display = 'none';
        document.removeEventListener('click', this.handleClickOutside);
    }

    bindEvents() {
        this.trigger.addEventListener('click', () => {
            if (this.panel.style.display === 'block') {
                this.hide();
            } else {
                this.show();
            }
        });

        this.handleClickOutside = (e) => {
            if (!this.trigger.contains(e.target) && !this.panel.contains(e.target)) {
                this.hide();
            }
        };
    }

    updateItems(items) {
        this.items = items;
        this.renderItems();
    }
}

// 通用表格排序
class TableSort {
    constructor(tableSelector, options = {}) {
        this.table = document.querySelector(tableSelector);
        if (!this.table) return;
        this.onSort = options.onSort;
        this.defaultColumn = options.defaultColumn;
        this.defaultDirection = options.defaultDirection || 'asc';
        this.init();
    }

    init() {
        this.headers = this.table.querySelectorAll('th[data-sort]');
        this.headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                this.sort(column);
            });
        });

        if (this.defaultColumn) {
            this.sort(this.defaultColumn, this.defaultDirection);
        }
    }

    sort(column, direction = null) {
        // 確定排序方向
        if (direction === null) {
            const current = this.table.querySelector('th[data-sort].sorted-asc, th[data-sort].sorted-desc');
            if (current && current.dataset.sort === column) {
                direction = current.classList.contains('sorted-asc') ? 'desc' : 'asc';
            } else {
                direction = 'asc';
            }
        }

        // 更新標頭樣式
        this.headers.forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
        });
        const header = this.table.querySelector(`th[data-sort="${column}"]`);
        header.classList.add(`sorted-${direction}`);

        // 執行排序回調
        if (this.onSort) {
            this.onSort(column, direction);
        }
    }
}

// 通用圖表輔助
function getChartColors(count, theme = 'default') {
    const themes = {
        default: ['#4a90e2', '#7c3aed', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'],
        pastel: ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e63946', '#a8dadc', '#457b9d', '#1d3557'],
        vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#74b9ff', '#a29bfe']
    };
    const palette = themes[theme] || themes.default;
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
}

// 通用響應式處理
function setupResponsive() {
    const updateLayout = () => {
        const width = window.innerWidth;
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop', width >= 1024);
    };
    
    updateLayout();
    window.addEventListener('resize', debounce(updateLayout, 250));
}

// 通用鍵盤快捷鍵
function setupKeyboardShortcuts(shortcuts = {}) {
    document.addEventListener('keydown', e => {
        // 忽略在輸入框中的按鍵
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = [];
        if (e.ctrlKey) key.push('ctrl');
        if (e.shiftKey) key.push('shift');
        if (e.altKey) key.push('alt');
        key.push(e.key.toLowerCase());
        
        const combo = key.join('+');
        const handler = shortcuts[combo];
        if (handler) {
            e.preventDefault();
            handler(e);
        }
    });
}

// 初始化共用 UI
function initSharedUI() {
    setupResponsive();
    // 可以在這裡加入其他全域 UI 初始化
}

// 立即初始化
initSharedUI();
