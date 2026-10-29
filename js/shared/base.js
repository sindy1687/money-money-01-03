// 共用基礎工具（音效、格式化、通知、localStorage helpers 等）

// 音效緩存與播放
let clickAudio = null;
let incomeAudio = null;
let audioFailed = { click: false, income: false };

function playClickSound() {
    if (audioFailed.click) return;
    if (!clickAudio) {
        clickAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => { audioFailed.click = true; });
}

function playIncomeSound() {
    if (audioFailed.income) return;
    if (!incomeAudio) {
        incomeAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }
    incomeAudio.currentTime = 0;
    incomeAudio.play().catch(() => { audioFailed.income = true; });
}

// 日期與金額格式化
function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// localStorage helpers
function safeGetItem(key, fallback = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn('localStorage get error:', key, e);
        return fallback;
    }
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.warn('localStorage set error:', key, e);
        return false;
    }
}

function safeRemoveItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn('localStorage remove error:', key, e);
        return false;
    }
}

// 通用通知（簡化版，各頁可覆蓋）
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10006;
        max-width: 320px;
        word-wrap: break-word;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) document.body.removeChild(notification);
            }, 300);
        }
    }, duration);
}

// 通用防抖/節流
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 通用 DOM helpers
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

// 通用 modal 框架（簡化版）
function createModal(options = {}) {
    const { title = '', content = '', className = '', size = 'medium' } = options;
    const modal = document.createElement('div');
    modal.className = `modal-overlay ${className}`;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;
    const sizeMap = {
        small: 'max-width: 320px;',
        medium: 'max-width: 500px;',
        large: 'max-width: 800px;',
        full: 'width: 90%; height: 90%;'
    };
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-card, rgba(255, 255, 255, 0.92));
            color: var(--text-primary, #111);
            border-radius: 12px;
            padding: 24px;
            ${sizeMap[size] || sizeMap.medium}
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-primary, 0 8px 32px rgba(0,0,0,0.2));
            animation: slideUp 0.3s ease;
        ">
            ${title ? `<h2 style="margin:0 0 16px 0;">${title}</h2>` : ''}
            ${content}
            <button class="modal-close" style="
                position: absolute;
                top: 12px;
                right: 12px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: var(--text-secondary, #666);
            ">✕</button>
        </div>
    `;
    document.body.appendChild(modal);
    const close = () => {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (modal.parentNode) document.body.removeChild(modal);
        }, 200);
    };
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    return { element: modal, close };
}

// 通用表單驗證
function validateForm(form, rules = {}) {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input) continue;
        const value = input.value.trim();
        if (rule.required && !value) {
            errors.push(`${rule.label || field} 為必填`);
        } else if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
            errors.push(`${rule.label || field} 格式不正確`);
        } else if (rule.min && value.length < rule.min) {
            errors.push(`${rule.label || field} 至少需要 ${rule.min} 個字元`);
        } else if (rule.max && value.length > rule.max) {
            errors.push(`${rule.label || field} 最多 ${rule.max} 個字元`);
        }
    }
    return errors;
}

// 通用確認框
function confirmAction(message, options = {}) {
    const { title = '確認操作', confirmText = '確定', cancelText = '取消' } = options;
    return new Promise(resolve => {
        const { element: modal, close } = createModal({
            title,
            content: `
                <p style="margin:0 0 24px 0;">${message}</p>
                <div style="display:flex;gap:12px;justify-content:flex-end;">
                    <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
                </div>
            `
        });
        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            close();
            resolve(true);
        });
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            close();
            resolve(false);
        });
    });
}

// 通用 loading 遮罩
function showLoading(message = '載入中...') {
    const overlay = document.createElement('div');
    overlay.id = 'globalLoadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top:0;left:0;right:0;bottom:0;
        background: rgba(0,0,0,0.6);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
    `;
    overlay.innerHTML = `
        <div style="text-align:center;">
            <div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.3);
                border-top-color:white;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
            <div>${message}</div>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(overlay);
    return () => {
        const el = document.getElementById('globalLoadingOverlay');
        if (el) document.body.removeChild(el);
    };
}

// 通用錯誤處理
function handleError(error, context = '') {
    console.error(`[Error${context ? ` (${context})` : ''}]`, error);
    const message = error?.message || String(error);
    showNotification(message, 'error');
}

// 通用常數
const CONSTANTS = {
    STORAGE_PREFIX: 'myApp_',
    DEFAULT_CURRENCY: 'NT$',
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
    NOTIFICATION_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 200
};

// 通用初始化
function initSharedBase() {
    // 注入通用樣式
    if (!$('#sharedBaseStyles')) {
        const style = document.createElement('style');
        style.id = 'sharedBaseStyles';
        style.textContent = `
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes fadeOut{from{opacity:1}to{opacity:0}}
            @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
            @keyframes slideOutRight{from{transform:translateX(0)}to{transform:translateX(100%)}}
            @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
            .btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:14px;transition:all 0.2s}
            .btn-primary{background:#007bff;color:white}
            .btn-secondary{background:#6c757d;color:white}
            .btn:hover{opacity:0.9}
        `;
        document.head.appendChild(style);
    }
}

// 立即初始化
initSharedBase();
