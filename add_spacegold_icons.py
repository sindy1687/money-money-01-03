#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# 讀取文件
with open('js/theme.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到並替換 cutecreatures 部分
pattern = r'(\s+cutecreatures: \{\s+fab: .🌿.,\s+navLedger: .🐾.,\s+navWallet: .🌱.,\s+navInvestment: .🍃.,\s+navChart: .🌿.,\s+navSettings: .🌿.\s+\})'
replacement = r'\1,\n        spacegold: {\n            fab: \'🚀\',\n            navLedger: \'🪐\',\n            navWallet: \'✨\',\n            navInvestment: \'💫\',\n            navChart: \'🌟\',\n            navSettings: \'🚀\'\n        }'

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# 寫回文件
with open('js/theme.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ spacegold 按鈕圖標已成功添加！")
