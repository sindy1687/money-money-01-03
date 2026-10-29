// 數字鍵盤組件（共用於金額輸入）

class NumberKeyboard {
    constructor(options = {}) {
        this.targetInput = options.targetInput;
        this.onInput = options.onInput || (() => {});
        this.onClose = options.onClose || (() => {});
        this.maxValue = options.maxValue || 999999999;
        this.allowDecimal = options.allowDecimal !== false;
        this.isVisible = false;
        this.currentValue = '';
        
        this.init();
    }

    init() {
        this.createKeyboard();
        this.bindEvents();
    }

    createKeyboard() {
        // 創建鍵盤容器
        this.keyboardContainer = document.createElement('div');
        this.keyboardContainer.className = 'number-keyboard-overlay';
        this.keyboardContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10007;
            display: none;
            align-items: flex-end;
            justify-content: center;
        `;

        // 創建鍵盤主體
        this.keyboard = document.createElement('div');
        this.keyboard.className = 'number-keyboard';
        this.keyboard.style.cssText = `
            background: white;
            border-radius: 20px 20px 0 0;
            padding: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
            animation: slideUp 0.3s ease;
        `;

        // 顯示區域
        this.display = document.createElement('div');
        this.display.className = 'number-keyboard-display';
        this.display.style.cssText = `
            background: #f5f5f5;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: 600;
            text-align: right;
            color: #333;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
        `;
        this.display.textContent = '0';

        // 按鈕區域
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.className = 'number-keyboard-buttons';
        this.buttonsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        `;

        // 創建按鈕
        this.createButtons();

        // 組裝鍵盤
        this.keyboard.appendChild(this.display);
        this.keyboard.appendChild(this.buttonsContainer);
        this.keyboardContainer.appendChild(this.keyboard);
        document.body.appendChild(this.keyboardContainer);

        // 添加樣式
        this.addStyles();
    }

    createButtons() {
        const buttons = [
            { text: '7', value: '7', type: 'number' },
            { text: '8', value: '8', type: 'number' },
            { text: '9', value: '9', type: 'number' },
            { text: '4', value: '4', type: 'number' },
            { text: '5', value: '5', type: 'number' },
            { text: '6', value: '6', type: 'number' },
            { text: '1', value: '1', type: 'number' },
            { text: '2', value: '2', type: 'number' },
            { text: '3', value: '3', type: 'number' },
            { text: '清除', value: 'clear', type: 'clear' },
            { text: '0', value: '0', type: 'number' },
            { text: '⌫', value: 'backspace', type: 'backspace' }
        ];

        // 如果允許小數點，添加小數點按鈕
        if (this.allowDecimal) {
            buttons.push({ text: '.', value: '.', type: 'decimal' });
        }

        // 添加完成按鈕
        buttons.push({ text: '✓', value: 'done', type: 'done' });

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `number-keyboard-btn number-keyboard-btn--${btn.type}`;
            button.textContent = btn.text;
            button.dataset.value = btn.value;

            // 按鈕樣式
            if (btn.type === 'number' || btn.type === 'decimal') {
                button.style.cssText = `
                    background: #fff;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
            } else if (btn.type === 'clear') {
                button.style.cssText = `
                    background: #ff6b6b;
                    border: none;
                    border-radius: 12px;
                    padding: 20px;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
            } else if (btn.type === 'backspace') {
                button.style.cssText = `
                    background: #ffd93d;
                    border: none;
                    border-radius: 12px;
                    padding: 20px;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
            } else if (btn.type === 'done') {
                button.style.cssText = `
                    background: #4caf50;
                    border: none;
                    border-radius: 12px;
                    padding: 20px;
                    font-size: 20px;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    grid-column: span 2;
                `;
            }

            // 添加點擊事件
            button.addEventListener('click', () => this.handleButtonClick(btn));

            this.buttonsContainer.appendChild(button);
        });
    }

    handleButtonClick(button) {
        const { value, type } = button;

        switch (type) {
            case 'number':
                this.handleNumberInput(value);
                break;
            case 'decimal':
                this.handleDecimalInput();
                break;
            case 'clear':
                this.handleClear();
                break;
            case 'backspace':
                this.handleBackspace();
                break;
            case 'done':
                this.handleDone();
                break;
        }

        this.updateDisplay();
    }

    handleNumberInput(value) {
        const newValue = this.currentValue + value;
        const numValue = parseFloat(newValue);

        // 檢查是否超過最大值
        if (numValue > this.maxValue) {
            this.showTemporaryMessage('超過最大值');
            return;
        }

        // 檢查小數位數（最多2位）
        if (this.allowDecimal && newValue.includes('.')) {
            const decimalPart = newValue.split('.')[1];
            if (decimalPart && decimalPart.length > 2) {
                return;
            }
        }

        this.currentValue = newValue;
        this.onInput(this.currentValue);
    }

    handleDecimalInput() {
        if (!this.allowDecimal) return;
        
        // 如果已經有小數點，不能再添加
        if (this.currentValue.includes('.')) return;
        
        // 如果當前值為空，添加 0.
        if (this.currentValue === '') {
            this.currentValue = '0.';
        } else {
            this.currentValue += '.';
        }
        
        this.onInput(this.currentValue);
    }

    handleClear() {
        this.currentValue = '';
        this.onInput(this.currentValue);
    }

    handleBackspace() {
        if (this.currentValue.length > 0) {
            this.currentValue = this.currentValue.slice(0, -1);
            this.onInput(this.currentValue);
        }
    }

    handleDone() {
        this.close();
    }

    updateDisplay() {
        const displayValue = this.currentValue || '0';
        this.display.textContent = displayValue;
    }

    showTemporaryMessage(message) {
        const originalText = this.display.textContent;
        this.display.textContent = message;
        this.display.style.color = '#ff6b6b';
        
        setTimeout(() => {
            this.display.textContent = originalText;
            this.display.style.color = '#333';
        }, 1000);
    }

    show(inputValue = '') {
        this.currentValue = inputValue;
        this.updateDisplay();
        this.keyboardContainer.style.display = 'flex';
        this.isVisible = true;
        
        // 防止背景滾動
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.keyboardContainer.style.display = 'none';
        this.isVisible = false;
        
        // 恢復背景滾動
        document.body.style.overflow = '';
    }

    close() {
        this.hide();
        this.onClose(this.currentValue);
    }

    bindEvents() {
        // 點擊背景關閉
        this.keyboardContainer.addEventListener('click', (e) => {
            if (e.target === this.keyboardContainer) {
                this.close();
            }
        });

        // ESC 鍵關閉
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.close();
            }
        });
    }

    addStyles() {
        if (document.getElementById('number-keyboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'number-keyboard-styles';
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            .number-keyboard-btn:hover {
                transform: scale(0.95);
                opacity: 0.8;
            }

            .number-keyboard-btn:active {
                transform: scale(0.9);
            }

            @media (max-width: 480px) {
                .number-keyboard {
                    padding: 16px;
                }
                
                .number-keyboard-btn {
                    padding: 16px;
                    font-size: 18px;
                }
                
                .number-keyboard-display {
                    font-size: 20px;
                    padding: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    destroy() {
        if (this.keyboardContainer && this.keyboardContainer.parentNode) {
            this.keyboardContainer.parentNode.removeChild(this.keyboardContainer);
        }
    }
}

// 自動綁定數字輸入框
function autoBindNumberInputs() {
    // 為所有 number 類型的輸入框添加數字鍵盤
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        // 檢查是否已經綁定
        if (input.dataset.numberKeyboardBound) return;
        
        input.addEventListener('focus', () => {
            // 創建數字鍵盤
            const keyboard = new NumberKeyboard({
                targetInput: input,
                maxValue: parseFloat(input.max) || 999999999,
                allowDecimal: input.step && input.step.includes('.'),
                onInput: (value) => {
                    input.value = value;
                    // 觸發 input 事件
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                },
                onClose: (value) => {
                    input.value = value;
                    // 觸發 change 事件
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    // 銷毀鍵盤
                    keyboard.destroy();
                }
            });
            
            // 顯示鍵盤
            keyboard.show(input.value);
            
            // 標記為已綁定
            input.dataset.numberKeyboardBound = 'true';
        });
    });
}

// 為特定輸入框綁定數字鍵盤
function bindNumberKeyboard(inputSelector, options = {}) {
    const input = document.querySelector(inputSelector);
    if (!input) return;

    input.addEventListener('focus', () => {
        const keyboard = new NumberKeyboard({
            targetInput: input,
            maxValue: parseFloat(input.max) || 999999999,
            allowDecimal: input.step && input.step.includes('.'),
            ...options,
            onInput: (value) => {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                if (options.onInput) options.onInput(value);
            },
            onClose: (value) => {
                input.value = value;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                if (options.onClose) options.onClose(value);
                keyboard.destroy();
            }
        });
        
        keyboard.show(input.value);
    });
}

// 初始化數字鍵盤
function initNumberKeyboard() {
    // 延遲初始化，確保 DOM 已載入
    setTimeout(() => {
        autoBindNumberInputs();
    }, 100);
}

// 在 DOMContentLoaded 時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNumberKeyboard);
} else {
    initNumberKeyboard();
}

// 導出給全域使用
window.NumberKeyboard = NumberKeyboard;
window.bindNumberKeyboard = bindNumberKeyboard;
