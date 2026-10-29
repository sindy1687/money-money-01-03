const fs = require('fs');

// 讀取原文件
let content = fs.readFileSync('js/theme.js', 'utf8');

// 找到 cutecreatures 的結束位置並添加 spacegold
const target = '        cutecreatures: {\n' +
               '            fab: \'🌿\',\n' +
               '            navLedger: \'🐾\',\n' +
               '            navWallet: \'🌱\',\n' +
               '            navInvestment: \'🍃\',\n' +
               '            navChart: \'🌿\',\n' +
               '            navSettings: \'🌿\'\n' +
               '        }';

const replacement = '        cutecreatures: {\n' +
                    '            fab: \'🌿\',\n' +
                    '            navLedger: \'🐾\',\n' +
                    '            navWallet: \'🌱\',\n' +
                    '            navInvestment: \'🍃\',\n' +
                    '            navChart: \'🌿\',\n' +
                    '            navSettings: \'🌿\'\n' +
                    '        },\n' +
                    '        spacegold: {\n' +
                    '            fab: \'🚀\',\n' +
                    '            navLedger: \'🪐\',\n' +
                    '            navWallet: \'✨\',\n' +
                    '            navInvestment: \'💫\',\n' +
                    '            navChart: \'🌟\',\n' +
                    '            navSettings: \'🚀\'\n' +
                    '        }';

// 替換內容
content = content.replace(target, replacement);

// 寫回文件
fs.writeFileSync('js/theme.js', content, 'utf8');

console.log('✅ spacegold 按鈕圖標已成功添加！');
