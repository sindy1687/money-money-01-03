// ========== 主題顏色功能 ==========
var themes = window.AppThemes || [
    {
        id: 'pink',
        name: '粉色主題',
        icon: '💖',
        buttonIcon: '💗',
        preview: 'linear-gradient(135deg, #ffeef5 0%, #fff5f9 100%)',
        color: '#ff69b4',
        category: 'basic'
    },
    {
        id: 'blue',
        name: '藍色主題',
        icon: '💙',
        buttonIcon: '💙',
        preview: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)',
        color: '#4a90e2',
        category: 'basic'
    },
    {
        id: 'green',
        name: '綠色主題',
        icon: '💚',
        buttonIcon: '💚',
        preview: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)',
        color: '#4caf50',
        category: 'basic'
    },
    {
        id: 'purple',
        name: '紫色主題',
        icon: '💜',
        buttonIcon: '💜',
        preview: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)',
        color: '#9c27b0',
        category: 'basic'
    },
    {
        id: 'orange',
        name: '橙色主題',
        icon: '🧡',
        buttonIcon: '🧡',
        preview: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)',
        color: '#ff9800',
        category: 'basic'
    },
    {
        id: 'cyan',
        name: '青色主題',
        icon: '🩵',
        buttonIcon: '🩵',
        preview: 'linear-gradient(135deg, #e0f7fa 0%, #f0fdfe 100%)',
        color: '#00bcd4',
        category: 'basic'
    },
    {
        id: 'red',
        name: '紅色主題',
        icon: '❤️',
        buttonIcon: '❤️',
        preview: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
        color: '#e53935',
        category: 'basic'
    },
    {
        id: 'yellow',
        name: '黃色主題',
        icon: '💛',
        buttonIcon: '💛',
        preview: 'linear-gradient(135deg, #fffde7 0%, #fffef5 100%)',
        color: '#fbc02d',
        category: 'basic'
    },
    {
        id: 'indigo',
        name: '靛藍主題',
        icon: '🔵',
        buttonIcon: '🔵',
        preview: 'linear-gradient(135deg, #e8eaf6 0%, #f3f4f9 100%)',
        color: '#5c6bc0',
        category: 'basic'
    },
    {
        id: 'teal',
        name: '茶色主題',
        icon: '💚',
        buttonIcon: '💚',
        preview: 'linear-gradient(135deg, #e0f2f1 0%, #f0f9f8 100%)',
        color: '#26a69a',
        category: 'basic'
    },
    {
        id: 'dreamyGalaxy',
        name: '夢幻星河',
        icon: '🌌',
        buttonIcon: '✨',
        preview: 'url("https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg") center/cover',
        color: '#B19CD9',
        category: 'cosmic',
        backgroundImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/2a/20/38/2a2038686a48d048cc0b21e4f2ba44a5.jpg'
    },
    {
        id: 'mandalaNoirBloom',
        name: '曼陀羅黑金',
        icon: '🪷',
        buttonIcon: '🪷',
        preview: 'linear-gradient(135deg, rgba(18, 22, 28, 0.88) 0%, rgba(47, 58, 74, 0.52) 48%, rgba(243, 240, 232, 0.22) 100%)',
        color: '#c9b79a',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/b9/81/2a/b9812ad57a6a2115ebfd25638ecc2ce5.jpg'
    },
    {
        id: 'star',
        name: '星空主題',
        icon: '✨',
        buttonIcon: '✨',
        preview: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        color: '#8b7cf6',
        category: 'cosmic'
    },
    {
        id: 'aurora',
        name: '極光主題',
        icon: '🌈',
        buttonIcon: '🌈',
        preview: 'linear-gradient(135deg, #071a52 0%, #0b8457 50%, #7c3aed 100%)',
        color: '#00d4ff',
        category: 'cosmic'
    },
    {
        id: 'firefly',
        name: '螢火蟲主題',
        icon: '✨',
        buttonIcon: '✨',
        preview: 'linear-gradient(135deg, #0b1020 0%, #1a2b3f 100%)',
        color: '#facc15',
        category: 'cosmic'
    },
    {
        id: 'neon',
        name: '霓虹波動',
        icon: '🟣',
        buttonIcon: '🟣',
        preview: 'linear-gradient(135deg, #0b1020 0%, #1f1147 50%, #00d4ff 100%)',
        color: '#7c3aed',
        category: 'cosmic'
    },
    {
        id: 'midnight',
        name: '午夜深色',
        icon: '🌙',
        buttonIcon: '🌙',
        preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: '#6366f1',
        category: 'dark'
    },
    {
        id: 'space',
        name: '星際宇航',
        icon: '🚀',
        buttonIcon: '🛸',
        preview: 'linear-gradient(135deg, #001428 0%, #002850 60%, #8a2be2 100%)',
        color: '#00d4ff',
        category: 'dynamic',
        backgroundVideo: 'https://v1.pinimg.com/videos/iht/720p/4e/00/d1/4e00d1999152ab007ebe4aef36d5e2c9.mp4'
    },
    {
        id: 'totoro',
        name: '龍貓主題',
        icon: '🌼',
        buttonIcon: '🌼',
        preview: 'url("https://i.pinimg.com/736x/f6/e9/10/f6e910dc17992265ad9833055ff153ac.jpg") center/cover',
        color: '#4682B4',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/736x/f6/e9/10/f6e910dc17992265ad9833055ff153ac.jpg'
    },
    {
        id: 'noface',
        name: '無臉男主題',
        icon: '🎭',
        buttonIcon: '🎭',
        preview: 'url("https://i.pinimg.com/1200x/fe/b3/f9/feb3f9990f903e1b7b0f4a2066a97722.jpg") center/cover',
        color: '#f6c343',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/1200x/fe/b3/f9/feb3f9990f903e1b7b0f4a2066a97722.jpg'
    },
    {
        id: 'demonslayer',
        name: '鬼滅之刃主題',
        icon: '🗡️',
        buttonIcon: '🗡️',
        preview: 'url("https://i.pinimg.com/736x/73/3c/b0/733cb0696372d66f16702dd385a5aa5b.jpg") center/cover',
        color: '#00c2d1',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/736x/73/3c/b0/733cb0696372d66f16702dd385a5aa5b.jpg'
    },
    {
        id: 'waterBlade',
        name: '水之刃',
        icon: '🌊',
        buttonIcon: '💧',
        preview: 'linear-gradient(135deg, rgba(7, 16, 22, 0.92) 0%, rgba(31, 106, 165, 0.55) 55%, rgba(73, 199, 211, 0.45) 100%)',
        color: '#49c7d3',
        category: 'anime',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/25/bc/b8/25bcb8505a3a276fcd8d978684ca797c.jpg'
    },
    {
        id: 'waveRonin',
        name: '浪人水影',
        icon: '🌊',
        buttonIcon: '🗡️',
        preview: 'linear-gradient(135deg, rgba(7, 21, 34, 0.92) 0%, rgba(30, 78, 115, 0.55) 55%, rgba(107, 183, 230, 0.40) 100%)',
        color: '#2c7db3',
        category: 'anime',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/c5/d5/60/c5d5605539ede1eb0e8c9c1aef661dee.jpg'
    },
    {
        id: 'amberRonin',
        name: '暖金浪人',
        icon: '🍁',
        buttonIcon: '🗡️',
        preview: 'linear-gradient(135deg, rgba(27, 18, 13, 0.92) 0%, rgba(168, 90, 42, 0.34) 55%, rgba(244, 178, 74, 0.30) 100%)',
        color: '#f4b24a',
        category: 'anime',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/10/21/7b/10217b8f99106e8ff921040354429197.jpg'
    },
    {
        id: 'serpentEyes',
        name: '蛇影雙瞳',
        icon: '🐍',
        buttonIcon: '👁️',
        preview: 'linear-gradient(135deg, rgba(14, 20, 24, 0.94) 0%, rgba(31, 90, 102, 0.44) 55%, rgba(242, 178, 51, 0.24) 100%)',
        color: '#2aa9a4',
        category: 'anime',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/2e/60/08/2e6008635951b66dcc9ad7b0943526f2.jpg'
    },
    {
        id: 'kitsuneElegance',
        name: '九尾和風',
        icon: '🦊',
        buttonIcon: '🦊',
        preview: 'linear-gradient(135deg, rgba(11, 19, 24, 0.94) 0%, rgba(47, 111, 121, 0.34) 55%, rgba(217, 121, 60, 0.22) 100%)',
        color: '#d9793c',
        category: 'anime',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/2e/66/5c/2e665c345865193001e3870c80cc4d06.jpg'
    },
    {
        id: 'shinchan',
        name: '蠟筆小新主題',
        icon: '🌻',
        buttonIcon: '🌻',
        preview: 'url("https://i.pinimg.com/1200x/c3/66/a8/c366a88a9b62dee30d8628ddae89afa9.jpg") center/cover',
        color: '#FFD700',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/1200x/c3/66/a8/c366a88a9b62dee30d8628ddae89afa9.jpg'
    },
    {
        id: 'anyMelody',
        name: '安妮亞旋律',
        icon: '🎵',
        buttonIcon: '🎶',
        preview: 'url("https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg") center/cover',
        color: '#f06c9b',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/5b/e3/dd/5be3dd7d3c655fbc76f891dc98240304.jpg'
    },
    {
        id: 'money',
        name: '金錢滿滿',
        icon: '💸',
        buttonIcon: '💸',
        preview: 'url("https://i.pinimg.com/736x/cc/56/8d/cc568d4109c2c92d507f597ba0ece7be.jpg") center/cover',
        color: '#16f49a',
        category: 'dynamic',
        backgroundImage: 'https://i.pinimg.com/736x/cc/56/8d/cc568d4109c2c92d507f597ba0ece7be.jpg',
        backgroundVideo: 'https://v1.pinimg.com/videos/iht/expMp4/a4/53/29/a45329a21920d8db7a7f778daa592453_720w.mp4'
    },
    {
        id: 'caitu',
        name: '財兔滿滿',
        icon: '🐰',
        buttonIcon: '🐰',
        preview: 'url("https://i.pinimg.com/736x/85/9c/7c/859c7c50479b84c65089909c4acec1f3.jpg") center/cover',
        color: '#FFD700',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/736x/85/9c/7c/859c7c50479b84c65089909c4acec1f3.jpg'
    },
    {
        id: 'floralGradient',
        name: '花漾漸層',
        icon: '🌺',
        buttonIcon: '🌺',
        preview: 'linear-gradient(135deg, rgba(255, 128, 160, 0.35) 0%, rgba(255, 202, 98, 0.3) 35%, rgba(140, 220, 255, 0.25) 70%, rgba(200, 170, 255, 0.25) 100%)',
        color: '#ff5a8a',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/ad/aa/b6/adaab6e2e82651185578cf132884c482.jpg'
    },
    {
        id: 'mintRoseFairy',
        name: '薄荷玫瑰精靈',
        icon: '🧚',
        buttonIcon: '🌿',
        preview: 'linear-gradient(135deg, rgba(83, 200, 193, 0.34) 0%, rgba(243, 255, 251, 0.28) 45%, rgba(255, 120, 167, 0.22) 100%)',
        color: '#53c8c1',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        investmentCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        accountingCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        holdingCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        buyingCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        sellingCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg',
        dividendCardImage: 'https://i.pinimg.com/474x/c9/11/ec/c911ec31a445ed3e6a3ebc14392a0e11.jpg'
    },
    {
        id: 'crystalFortune',
        name: '粉晶招財',
        icon: '💎',
        buttonIcon: '🪙',
        preview: 'linear-gradient(135deg, rgba(255, 214, 230, 0.55) 0%, rgba(255, 236, 246, 0.45) 28%, rgba(201, 235, 255, 0.35) 62%, rgba(255, 215, 140, 0.28) 100%)',
        color: '#f3b7d6',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/ce/51/ad/ce51ad70ef8ce24f13090a3dc913b0f6.jpg'
    },
    {
        id: 'emeraldPrince',
        name: '翡翠王子',
        icon: '👑',
        buttonIcon: '🗡️',
        preview: 'url("https://i.pinimg.com/736x/55/40/2f/55402fb6bcf0c65c832636ad5504499f.jpg") center/cover',
        color: '#2E8B57',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/736x/55/40/2f/55402fb6bcf0c65c832636ad5504499f.jpg'
    },
    {
        id: 'cuteCats',
        name: '可愛貓咪',
        icon: '🐱',
        buttonIcon: '🐈',
        preview: 'url("https://i.pinimg.com/736x/fe/2a/cf/fe2acfb6eedcf65941dad52ad03e3490.jpg") center/cover',
        color: '#FFB6C1',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/fe/2a/cf/fe2acfb6eedcf65941dad52ad03e3490.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/bf/bb/d8/bfbbd8069018715418b04a38e199a34d.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/a7/bb/f9/a7bbf99031a6d722e01446217985af5f.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/95/64/99/956499812b93c3c5bf8226051c7e627f.jpg'
    },
    {
        id: 'shibaPastel',
        name: '柴犬粉彩',
        icon: '🐶',
        buttonIcon: '🐾',
        preview: 'linear-gradient(135deg, rgba(244, 165, 142, 0.40) 0%, rgba(255, 236, 231, 0.18) 28%, rgba(158, 210, 230, 0.22) 62%, rgba(120, 148, 168, 0.18) 100%)',
        color: '#f4a58e',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/22/08/48/220848ccfb147982dacd366023399186.jpg'
    },
    {
        id: 'pikachuSnow',
        name: '雪境皮卡丘',
        icon: '❄️',
        buttonIcon: '⚡',
        preview: 'url("https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg") center/cover',
        color: '#1e5bff',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/09/47/3b/09473b4845e1a576e384d8185f0b0adc.jpg'
    },
    {
        id: 'blueLotusGoldGlow',
        name: '藍金蓮光',
        icon: '🪷',
        buttonIcon: '✨',
        preview: 'url("https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg") center/cover',
        color: '#2b5ea8',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/09/1b/cd/091bcdf0eb9b1cc5125cb60f4fa3854d.jpg'
    },
    {
        id: 'hanfuMaskNoir',
        name: '金箔面具夜色',
        icon: '🎭',
        buttonIcon: '✨',
        preview: 'linear-gradient(135deg, rgba(10, 12, 18, 0.92) 0%, rgba(31, 41, 55, 0.62) 55%, rgba(214, 178, 94, 0.18) 100%)',
        color: '#d6b25e',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/3c/d4/1c/3cd41c515b0c0d50d3d455c93bb09aa0.jpg'
    },
    {
        id: 'samoyedSnowWave',
        name: '雪浪白犬',
        icon: '🐶',
        buttonIcon: '🌊',
        preview: 'url("https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg") center/cover',
        color: '#2d8fbe',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/d8/86/9b/d8869b7555b465b043ea42cf297d78eb.jpg'
    },
    {
        id: 'citrusNoirBlossom',
        name: '柑橘夜花',
        icon: '🍊',
        buttonIcon: '🍊',
        preview: 'url("https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg") center/cover',
        color: '#ff7a1a',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/54/7b/5e/547b5ea055f9bdc0288b711d842e3e90.jpg'
    },
    {
        id: 'totoroCitrusPool',
        name: '龍貓柑橘沁涼',
        icon: '🍋',
        buttonIcon: '🍃',
        preview: 'linear-gradient(135deg, rgba(10, 49, 56, 0.88) 0%, rgba(31, 123, 134, 0.46) 52%, rgba(183, 226, 74, 0.22) 100%)',
        color: '#2bb6b1',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/93/90/fc/9390fceb4e3f56bcbf59ff6e12698228.jpg'
    },
    {
        id: 'leafCatGreen',
        name: '葉影貓咪綠',
        icon: '🍃',
        buttonIcon: '🍃',
        preview: 'url("https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg") center/cover',
        color: '#2f8f3a',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/da/80/c5/da80c5a273bc8fe4e4f62f4bf66c6f95.jpg'
    },
    {
        id: 'pastelBlossomMist',
        name: '粉彩花霧',
        icon: '🌸',
        buttonIcon: '🌿',
        preview: 'url("https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg") center/cover',
        color: '#e86a8d',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/32/62/23/326223aca9d453a14355f46b2831e985.jpg'
    },
    {
        id: 'pastelStarryEyes',
        name: '夢幻星瞳',
        icon: '🌙',
        buttonIcon: '✨',
        preview: 'url("https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg") center/cover',
        color: '#b58cff',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/c2/c2/95/c2c29589e119b36a664e3f541ae5aeaa.jpg'
    },
    {
        id: 'peonyAzureMask',
        name: '藍金牡丹星眸',
        icon: '🦋',
        buttonIcon: '✨',
        preview: 'url("https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg") center/cover',
        color: '#2aa9a4',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/01/fa/42/01fa420519e6ce78785135c0e7a7072d.jpg'
    },
    {
        id: 'starryBlossomEyes',
        name: '星夜櫻眸',
        icon: '🌸',
        buttonIcon: '✨',
        preview: 'url("https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg") center/cover',
        color: '#4fd3ff',
        category: 'fantasy',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/7b/de/dd/7bdeddd9adbe0a4fa24bb082797093ac.jpg'
    },
    {
        id: 'dreamy',
        name: '夢幻境域',
        icon: '🌈',
        buttonIcon: '🎨',
        preview: 'url("https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg") center/cover',
        color: '#87CEEB',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/95/64/99/956499812b93c3c5bf8226051c7e627f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/21/4d/cc/214dccff6dac6b30bebd621afc60669d.jpg'
    },
    {
        id: 'dreamyfish',
        name: '夢幻魚語',
        icon: '🐠',
        buttonIcon: '🐟',
        preview: 'url("https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg") center/cover',
        color: '#87CEEB',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/95/64/99/956499812b93c3c5bf8226051c7e627f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/a3/82/37/a382370de3785e43c0bd8db75fa13e67.jpg'
    },
    {
        id: 'emerald',
        name: '翠綠之夢',
        icon: '💎',
        buttonIcon: '🌿',
        preview: 'url("https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg") center/cover',
        color: '#2E8B57',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/95/64/99/956499812b93c3c5bf8226051c7e627f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/54/58/17/5458177129997fbd8f56b713e39d2d0f.jpg'
    },
    {
        id: 'graffiti',
        name: '塗鴉風格',
        icon: '🎨',
        buttonIcon: '🎭',
        preview: 'url("https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg") center/cover',
        color: '#1E90FF',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/fa/a1/0c/faa10cd0b7816efb3ac74d940bc4bda4.jpg'
    },
    {
        id: 'shinobu',
        name: '蝴蝶忍',
        icon: '🦋',
        buttonIcon: '🗡️',
        preview: 'url("https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg") center/cover',
        color: '#9B59B6',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/8b/18/2b/8b182b4b3bdc6420ae9bb42b08025854.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg'
    },
    {
        id: 'spacegold',
        name: '太空金彩',
        icon: '🚀',
        buttonIcon: '🪐',
        preview: 'url("https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg") center/cover',
        color: '#FFD700',
        category: 'cosmic',
        backgroundImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/85/74/68/857468da4307fa5dc160ad691a91203b.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/85/74/68/857468da4307fa5dc160ad691a91203b.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/eb/33/27/eb3327b7caa47a87c1f4cee99344892e.jpg'
    },
    {
        id: 'attractGold',
        name: '吸金紅金',
        icon: '🪙',
        buttonIcon: '🧧',
        preview: 'url("https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg") center/cover',
        color: '#C62828',
        category: 'wealth',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/26/c9/c0/26c9c0297b0cad3dfa8d6d5c41ccfc18.jpg'
    },
    {
        id: 'getrich',
        name: '恭喜發財',
        icon: '🧧',
        buttonIcon: '💰',
        preview: 'url("https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg") center/cover',
        color: '#D42C2C',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/c9/6c/28/c96c28bb9f8555ef81c7649f97aac720.jpg'
    },
    {
        id: 'fortuneGodGetRich',
        name: '眾生請發財',
        icon: '🧧',
        buttonIcon: '🪙',
        preview: 'linear-gradient(135deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 246, 232, 0.70) 38%, rgba(255, 228, 225, 0.62) 70%, rgba(242, 184, 75, 0.22) 100%)',
        color: '#b11f2a',
        category: 'wealth',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/14/34/74/1434744422d640eb5d8d955a2a86247b.jpg'
    },
    {
        id: 'ganeshaGoldOm',
        name: '金曜梵音',
        icon: 'ॐ',
        buttonIcon: '🪔',
        preview: 'url("https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg") center/cover',
        color: '#d6b25e',
        category: 'wealth',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/d4/ed/3b/d4ed3ba9170e4f38f19dc1d3868eb986.jpg'
    },
    {
        id: 'attractGold',
        name: '吸金紅金',
        icon: '🪙',
        buttonIcon: '🧧',
        preview: 'url("https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg") center/cover',
        color: '#C62828',
        category: 'wealth',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/94/e4/9e/94e49ef07a1ce58f8bfa3b177a580bd5.jpg'
    },
    {
        id: 'festive',
        name: '節日慶典',
        icon: '🎊',
        buttonIcon: '🎉',
        preview: 'url("https://i.pinimg.com/736x/c8/57/a1/c857a19b3f5bd274ba864e54dc27f550.jpg") center/cover',
        color: '#E63946',
        category: 'celebration',
        backgroundImage: 'https://i.pinimg.com/736x/c8/57/a1/c857a19b3f5bd274ba864e54dc27f550.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/c8/57/a1/c857a19b3f5bd274ba864e54dc27f550.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/6f/49/9a/6f499af434927a2eff91221a60393ae5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/c8/57/a1/c857a19b3f5bd274ba864e54dc27f550.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/ba/24/9a/ba249a3cc3f9f317683f78c240ff0686.jpg'
    },
    {
        id: 'shinchanPool',
        name: '小新泳池派對',
        icon: '🏊',
        preview: 'url("image/79793c93271b2231adefb28841972eec.jpg") center/cover',
        color: '#00CED1',
        category: 'dynamic',
        backgroundImage: 'image/79793c93271b2231adefb28841972eec.jpg',
        backgroundVideo: 'https://v1.pinimg.com/videos/iht/expMp4/76/35/eb/7635eb2cc1d1c08a867742f7144faf11_720w.mp4'
    },
    {
        id: 'nightglowSeasons',
        name: '夜光四季',
        icon: '🌃',
        buttonIcon: '✨',
        preview: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 25%, #2e5266 50%, #1a365d 75%, #0f172a 100%)',
        color: '#64ffda',
        category: 'dynamic',
        backgroundVideo: 'https://v1.pinimg.com/videos/iht/expMp4/c7/39/73/c739737a7c0471e01fa4e606507d0a48_720w.mp4'
    },
    {
        id: 'mori',
        name: '小森主題',
        icon: '🍃',
        buttonIcon: '🍃',
        preview: 'url("https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg") center/cover',
        color: '#3B7A57',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/91/12/d5/9112d581109a8069dff4011d272cd26f.jpg'
    },
    {
        id: 'littlePrince',
        name: '小王子星光',
        icon: '👑',
        buttonIcon: '⭐',
        preview: 'url("https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg") center/cover',
        color: '#3E5B9A',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/91/87/48/918748238a3b26c91dcacd9926591d57.jpg'
    },
    {
        id: 'jellyParty',
        name: '果凍派對',
        icon: '🍬',
        buttonIcon: '🍬',
        preview: 'url("https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg") center/cover',
        color: '#ff7aa2',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/c2/b1/45/c2b14507e3346ef9d72d09d83f54e430.jpg'
    },
    {
        id: 'cozyWood',
        name: '溫暖木屋',
        icon: '🛋️',
        buttonIcon: '🪵',
        preview: 'linear-gradient(135deg, #fff6ea 0%, #f2d8c3 45%, #e8c7a0 100%)',
        color: '#c58a5a',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/cf/3f/fd/cf3ffdf44aef4e6600bba86f0f9877f2.jpg'
    },
    {
        id: 'oceanWhale',
        name: '海洋鯨魚',
        icon: '🐋',
        buttonIcon: '🐳',
        preview: 'linear-gradient(135deg, #dff5ff 0%, #bfe6ff 35%, #bfb8ff 70%, #f7c1d8 100%)',
        color: '#4aa6e8',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/aa/71/a7/aa71a78307c34e76fb8f3058996ba65e.jpg'
    },
    {
        id: 'shinchanFlashlightNight',
        name: '小新手電筒夜',
        icon: '🔦',
        buttonIcon: '⭐',
        preview: 'url("https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg") center/cover',
        color: '#5a6fc4',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/5d/ea/1b/5dea1b06637f915b5ddcdfdad801983e.jpg'
    },
    {
        id: 'capybaraSakuraPond',
        name: '水豚櫻花池',
        icon: '🦫',
        buttonIcon: '🌸',
        preview: 'linear-gradient(135deg, rgba(255, 220, 230, 0.75) 0%, rgba(248, 231, 211, 0.70) 42%, rgba(200, 236, 234, 0.65) 100%)',
        color: '#e889a6',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg'
    },
    {
        id: 'piggyMelody',
        name: '粉豬旋律',
        icon: '🐷',
        buttonIcon: '🎤',
        preview: 'linear-gradient(135deg, rgba(255, 226, 236, 0.85) 0%, rgba(255, 240, 246, 0.78) 52%, rgba(255, 248, 252, 0.76) 100%)',
        color: '#e86f9a',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/41/d8/c5/41d8c595cfef850cb707ed8d4a008d7f.jpg'
    },
    {
        id: 'autumnBunny',
        name: '秋日兔兔',
        icon: '🐰',
        buttonIcon: '🍂',
        preview: 'linear-gradient(135deg, rgba(255, 248, 238, 0.96) 0%, rgba(255, 229, 199, 0.92) 45%, rgba(255, 198, 122, 0.9) 100%)',
        color: '#d98b3a',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/1f/b2/c3/1fb2c3bf2f76c698f85bdf7a5c1116b9.jpg'
    },
    {
        id: 'mintBunnyTea',
        name: '薄荷兔奶茶',
        icon: '🐰',
        buttonIcon: '🧋',
        preview: 'linear-gradient(135deg, rgba(223, 245, 244, 0.96) 0%, rgba(200, 236, 234, 0.92) 42%, rgba(255, 238, 216, 0.9) 72%, rgba(255, 213, 170, 0.88) 100%)',
        color: '#4fb8b3',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/7b/91/62/7b9162124b29ec7ba01ddf685efbdfc8.jpg'
    },
    {
        id: 'goldfishLantern',
        name: '金魚燈籠',
        icon: '🏮',
        buttonIcon: '🐟',
        preview: 'url("https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg") center/cover',
        color: '#ff7a1a',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/7b/8e/5b/7b8e5b7b975562a392bec4e3bca9de64.jpg'
    },
    {
        id: 'starryOceanPrince',
        name: '星夜王子',
        icon: '🌌',
        buttonIcon: '⭐',
        preview: 'linear-gradient(135deg, #050814 0%, #0b162b 45%, #1a4bb8 100%)',
        color: '#2b6cff',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        investmentCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/a5/1c/e4/a51ce4741b9a6ff901bc67d09f9a791c.jpg'
    },
    {
        id: 'lilyCatPond',
        name: '睡蓮喵池',
        icon: '🌸',
        buttonIcon: '🌸',
        preview: 'linear-gradient(135deg, rgba(223, 245, 244, 0.96) 0%, rgba(176, 224, 216, 0.92) 45%, rgba(247, 193, 216, 0.88) 100%)',
        color: '#4FB8B3',
        category: 'cute',
        backgroundImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/23/09/c8/2309c8b8703951c217f99a7ed505e580.jpg'
    },
    {
        id: 'blackGoldFrog',
        name: '黑金招財蛙',
        icon: '🐸',
        buttonIcon: '🪙',
        preview: 'url("https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg") center/cover',
        color: '#D4AF37',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/2f/45/4f/2f454fc2eeb4f4df1989181167f3ee53.jpg'
    },
    {
        id: 'blackCatCoinGalaxy',
        name: '黑貓金幣星河',
        icon: '🐈‍⬛',
        buttonIcon: '🪙',
        preview: 'url("https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg") center/cover',
        color: '#D4AF37',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/93/28/ab/9328ab5e8beb9c858fc42dd9a10d9407.jpg'
    },
    {
        id: 'luckyCatPink',
        name: '招財貓金幣粉色',
        icon: '🐈',
        buttonIcon: '🐈',
        preview: 'linear-gradient(135deg, #FFC5C5 0%, #FFB6C1 45%, #FF99CC 100%)',
        color: '#FF69B4',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/ec/6a/b3/ec6ab38b73b1d50220475548dbab5853.jpg'
    },
    {
        id: 'coinCatGold',
        name: '金幣招財喵',
        icon: '🐱',
        buttonIcon: '🪙',
        preview: 'linear-gradient(135deg, rgba(255, 242, 217, 0.96) 0%, rgba(255, 208, 140, 0.9) 45%, rgba(201, 122, 58, 0.86) 100%)',
        color: '#D4AF37',
        category: 'wealth',
        backgroundImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/28/20/3b/28203b8793e1c88974581f3f6c5c03c5.jpg'
    },
    {
        id: 'crimsonIvory',
        name: '紅金象牙',
        icon: '🩸',
        buttonIcon: '🥀',
        preview: 'url("https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg") center/cover',
        color: '#c7353f',
        category: 'fantasy',
        backgroundImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/90/cf/2f/90cf2f9508f557620d7da4bac4fdd6fd.jpg'
    },
    {
        id: 'blueBunnyFlower',
        name: '藍花兔兔',
        icon: '🐰',
        buttonIcon: '🩵',
        preview: 'linear-gradient(135deg, rgba(239, 246, 255, 0.96) 0%, rgba(206, 228, 255, 0.9) 45%, rgba(255, 245, 230, 0.85) 100%)',
        color: '#5a86c8',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/57/e8/74/57e874b367bec0044835bee700c85c9f.jpg'
    },
    {
        id: 'mintBlossomGarden',
        name: '薄荷花園',
        icon: '🌿',
        buttonIcon: '🤍',
        preview: 'linear-gradient(135deg, rgba(214, 244, 234, 0.92) 0%, rgba(178, 233, 220, 0.86) 45%, rgba(248, 246, 236, 0.82) 100%)',
        color: '#5fb8a8',
        category: 'cute',
        cssBackground: true,
        backgroundImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        investmentCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        accountingCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        holdingCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        buyingCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        sellingCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg',
        dividendCardImage: 'https://i.pinimg.com/736x/d2/7b/08/d27b08c045e17c2c73427e866c5ff5e9.jpg'
    },
    {
        id: 'narutoGraffiti',
        name: '鳴人塗鴉',
        icon: '🌀',
        buttonIcon: '🌀',
        preview: 'linear-gradient(135deg, rgba(10, 12, 18, 0.92) 0%, rgba(31, 127, 214, 0.22) 55%, rgba(255, 122, 26, 0.14) 100%)',
        color: '#1f7fd6',
        category: 'anime',
        backgroundImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        cssBackground: true,
        investmentCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        accountingCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        walletBudgetCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        monthlyPlanningCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        investmentSettingsCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        holdingCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        buyingCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        sellingCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg',
        dividendCardImage: 'https://i.pinimg.com/1200x/6d/6a/41/6d6a4198c235f519f1c6f79f9efeeea4.jpg'
    },
];

const themeCategories = {
    cosmic: {
        name: '宇宙星空',
        icon: '🌌',
        description: '星空、極光等宇宙主題'
    },
    dark: {
        name: '深色主題',
        icon: '🌙',
        description: '深色護眼主題'
    },
    anime: {
        name: '動漫風格',
        icon: '🎌',
        description: '吉卜力、鬼滅等動漫主題'
    },
    wealth: {
        name: '財富金錢',
        icon: '💰',
        description: '金錢、財富相關主題'
    },
    cute: {
        name: '可愛風格',
        icon: '🐾',
        description: '可愛、萌系主題',
        animation: 'cuteAnimation'
    },
    fantasy: {
        name: '奇幻風格',
        icon: '🗡️',
        description: '騎士、奇幻主題',
        animation: 'fantasyAnimation'
    },
    dynamic: {
        name: '動態背景',
        icon: '🎬',
        description: '影片動態背景主題',
        animation: 'dynamicAnimation'
    },
    celebration: {
        name: '節日慶典',
        icon: '🎊',
        description: '節日、慶典、派對主題'
    }
};

const themeAnimations = {};

const themeVideoController = (() => {
    let moneyVideoEl = null;
    let spaceVideoEl = null;
    let shinchanPoolVideoEl = null;
    let nightglowSeasonsVideoEl = null;
    let containerEl = null;

    const ensureElements = () => {
        if (!moneyVideoEl) {
            moneyVideoEl = document.getElementById('moneyThemeVideo');
        }
        if (!spaceVideoEl) {
            spaceVideoEl = document.getElementById('spaceThemeVideo');
        }
        if (!shinchanPoolVideoEl) {
            shinchanPoolVideoEl = document.getElementById('shinchanPoolThemeVideo');
        }
        if (!nightglowSeasonsVideoEl) {
            nightglowSeasonsVideoEl = document.getElementById('nightglowSeasonsThemeVideo');
        }
        if (!containerEl) {
            containerEl = document.querySelector('.theme-video-background');
        }
        return (moneyVideoEl && spaceVideoEl && shinchanPoolVideoEl && nightglowSeasonsVideoEl && containerEl) || 
               (moneyVideoEl && spaceVideoEl && containerEl);
    };

    const setActive = (themeId) => {
        if (!ensureElements()) return;
        
        // Pause all videos
        if (moneyVideoEl) moneyVideoEl.pause();
        if (spaceVideoEl) spaceVideoEl.pause();
        if (shinchanPoolVideoEl) shinchanPoolVideoEl.pause();
        if (nightglowSeasonsVideoEl) nightglowSeasonsVideoEl.pause();

        const isActive = themeId === 'money' || themeId === 'space' || themeId === 'shinchanPool' || themeId === 'nightglowSeasons';
        containerEl.classList.toggle('active', isActive);

        if (isActive) {
            let activeVideo = null;
            
            // Hide all videos first
            if (moneyVideoEl) moneyVideoEl.style.display = 'none';
            if (spaceVideoEl) spaceVideoEl.style.display = 'none';
            if (shinchanPoolVideoEl) shinchanPoolVideoEl.style.display = 'none';
            if (nightglowSeasonsVideoEl) nightglowSeasonsVideoEl.style.display = 'none';
            
            if (themeId === 'money') {
                activeVideo = moneyVideoEl;
                if (moneyVideoEl) moneyVideoEl.style.display = 'block';
            } else if (themeId === 'space') {
                activeVideo = spaceVideoEl;
                if (spaceVideoEl) spaceVideoEl.style.display = 'block';
            } else if (themeId === 'shinchanPool') {
                activeVideo = shinchanPoolVideoEl;
                if (shinchanPoolVideoEl) shinchanPoolVideoEl.style.display = 'block';
            } else if (themeId === 'nightglowSeasons') {
                activeVideo = nightglowSeasonsVideoEl;
                if (nightglowSeasonsVideoEl) nightglowSeasonsVideoEl.style.display = 'block';
            }

            if (activeVideo) {
                activeVideo.currentTime = 0;
                const playPromise = activeVideo.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            }
        } else {
            // Hide all videos when inactive
            if (moneyVideoEl) moneyVideoEl.style.display = 'none';
            if (spaceVideoEl) spaceVideoEl.style.display = 'none';
            if (shinchanPoolVideoEl) shinchanPoolVideoEl.style.display = 'none';
            if (nightglowSeasonsVideoEl) nightglowSeasonsVideoEl.style.display = 'none';
        }
    };

    return { setActive };
})();

function getCurrentTheme() {
    // 優先使用 selectedTheme，如果沒有則使用舊的 theme 鍵值以保持向後兼容
    return localStorage.getItem('selectedTheme') || localStorage.getItem('theme') || 'blue';
}

function applyTheme(themeId) {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    if (typeof window.loadThemeStylesheet === 'function') {
        window.loadThemeStylesheet(themeId);
    }
    localStorage.setItem('selectedTheme', themeId);
    localStorage.setItem('theme', themeId); // 保持向後兼容
    root.style.removeProperty('--bg-white');
    
    // 自動應用主題背景圖片
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.backgroundImage && !theme.cssBackground) {
        applyThemeBackgroundImage(theme.backgroundImage);
    } else {
        // 如果主題沒有背景圖片，清除背景
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
    }
    
    // 應用卡片背景圖片
    applyThemeCardImages(theme);
    
    updateThemeButtons(themeId);
    themeVideoController.setActive(themeId);

    const pageChart = document.getElementById('pageChart');
    if (pageChart && pageChart.style.display !== 'none') {
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
    }
}

function applyThemeCardImages(theme) {
    if (!theme) return;
    
    // 應用其他卡片背景圖片（不包括預算設定頁面）
    const cardMappings = [
        { selector: '.investment-card', image: theme.investmentCardImage },
        { selector: '.accounting-card', image: theme.accountingCardImage },
        { selector: '.wallet-budget-card', image: theme.walletBudgetCardImage },
        { selector: '.monthly-planning-card', image: theme.monthlyPlanningCardImage },
        { selector: '.investment-settings-card', image: theme.investmentSettingsCardImage },
        { selector: '.holding-card', image: theme.holdingCardImage },
        { selector: '.buying-card', image: theme.buyingCardImage },
        { selector: '.selling-card', image: theme.sellingCardImage },
        { selector: '.dividend-card', image: theme.dividendCardImage }
    ];
    
    cardMappings.forEach(mapping => {
        if (mapping.image) {
            applyCardBackgroundImage(mapping.selector, mapping.image);
        }
    });
}

function applyCardBackgroundImage(selector, imageUrl) {
    if (!imageUrl) return;
    
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        // 檢查圖片是否可以載入
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // 圖片載入成功，應用背景
            element.style.backgroundImage = `url(${imageUrl})`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            console.log(`✅ 卡片背景圖片載入成功: ${selector} - ${imageUrl}`);
        };
        
        img.onerror = function() {
            // 圖片載入失敗，清除背景
            element.style.backgroundImage = '';
            element.style.backgroundSize = '';
            element.style.backgroundPosition = '';
            element.style.backgroundRepeat = '';
            console.warn(`⚠️ 卡片背景圖片載入失敗: ${selector} - ${imageUrl}`);
        };
        
        // 開始載入圖片
        img.src = imageUrl;
    });
}

function applyThemeBackgroundImage(imageUrl) {
    if (!imageUrl) return;
    
    // 檢查圖片是否可以載入
    const img = new Image();
    img.onload = function() {
        // 圖片載入成功，應用背景
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        
        // 可選：添加載入成功的視覺反饋
        console.log(`✅ 主題背景圖片載入成功: ${imageUrl}`);
    };
    
    img.onerror = function() {
        // 圖片載入失敗，清除背景
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        
        console.warn(`⚠️ 主題背景圖片載入失敗: ${imageUrl}`);
    };
    
    // 開始載入圖片
    img.src = imageUrl;
}

function updateThemeButtons(themeId) {
    const buttonIcons = {
        pink: {
            fab: '✏️',
            navLedger: '📖',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        blue: {
            fab: '✍️',
            navLedger: '📘',
            navWallet: '💵',
            navInvestment: '📉',
            navChart: '📋',
            navSettings: '🔧'
        },
        green: {
            fab: '📝',
            navLedger: '📗',
            navWallet: '💶',
            navInvestment: '💹',
            navChart: '📉',
            navSettings: '🎛️'
        },
        purple: {
            fab: '🖊️',
            navLedger: '📕',
            navWallet: '💸',
            navInvestment: '💹',
            navChart: '📉',
            navSettings: '🎛️'
        },
        orange: {
            fab: '✎',
            navLedger: '📓',
            navWallet: '💳',
            navInvestment: '📌',
            navChart: '📑',
            navSettings: '🔩'
        },
        cyan: {
            fab: '✐',
            navLedger: '📙',
            navWallet: '💸',
            navInvestment: '📍',
            navChart: '📄',
            navSettings: '🛠️'
        },
        star: {
            fab: '⭐',
            navLedger: '🌌',
            navWallet: '💫',
            navInvestment: '🌟',
            navChart: '🔭',
            navSettings: '🌠'
        },
        red: {
            fab: '❤️',
            navLedger: '📕',
            navWallet: '💴',
            navInvestment: '📊',
            navChart: '📈',
            navSettings: '⚙️'
        },
        yellow: {
            fab: '💛',
            navLedger: '📒',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '🔧'
        },
        narutoGraffiti: {
            fab: '🌀',
            navLedger: '📒',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        autumnBunny: {
            fab: '🐰',
            navLedger: '📖',
            navWallet: '🧺',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        mintBunnyTea: {
            fab: '🐰',
            navLedger: '📖',
            navWallet: '🧋',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        blueBunnyFlower: {
            fab: '🐰',
            navLedger: '📖',
            navWallet: '🩵',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        mintBlossomGarden: {
            fab: '🌿',
            navLedger: '📗',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        mintRoseFairy: {
            fab: '🧚',
            navLedger: '📖',
            navWallet: '👛',
            navInvestment: '🌿',
            navChart: '📊',
            navSettings: '🎨'
        },
        starryOceanPrince: {
            fab: '⭐',
            navLedger: '🌌',
            navWallet: '🐟',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        waterBlade: {
            fab: '🌊',
            navLedger: '🗡️',
            navWallet: '💧',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        waveRonin: {
            fab: '🌊',
            navLedger: '🗡️',
            navWallet: '💧',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        samoyedSnowWave: {
            fab: '🐾',
            navLedger: '📖',
            navWallet: '💧',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        blackCatCoinGalaxy: {
            fab: '🪙',
            navLedger: '📒',
            navWallet: '🪙',
            navInvestment: '📈',
            navChart: '✨',
            navSettings: '⚙️'
        },
        amberRonin: {
            fab: '🍁',
            navLedger: '🗡️',
            navWallet: '🪙',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        mandalaNoirBloom: {
            fab: '🪷',
            navLedger: '📖',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        goldfishLantern: {
            fab: '🏮',
            navLedger: '📖',
            navWallet: '🪙',
            navInvestment: '🐟',
            navChart: '📊',
            navSettings: '⚙️'
        },
        indigo: {
            fab: '💙',
            navLedger: '📘',
            navWallet: '�',
            navInvestment: '�',
            navChart: '�',
            navSettings: '🔧'
        },
        teal: {
            fab: '💚',
            navLedger: '📗',
            navWallet: '💶',
            navInvestment: '💹',
            navChart: '📉',
            navSettings: '🎛️'
        },
        capybaraSakuraPond: {
            fab: '🌸',
            navLedger: '📖',
            navWallet: '🪙',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        aurora: {
            fab: '🌈',
            navLedger: '🌈',
            navWallet: '💎',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        noface: {
            fab: '🪙',
            navLedger: '📜',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        demonslayer: {
            fab: '🗡️',
            navLedger: '📓',
            navWallet: '💠',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        totoro: {
            fab: '🌱',
            navLedger: '📗',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        firefly: {
            fab: '✨',
            navLedger: '✨',
            navWallet: '💫',
            navInvestment: '🌟',
            navChart: '🔭',
            navSettings: '🌠'
        },
        cute: {
            fab: '🐾',
            navLedger: '🐾',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        
        coinCatGold: {
            fab: '🪙',
            navLedger: '📒',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        hardworkMoney: {
            fab: '💸',
            navLedger: '📘',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        
        jellyParty: {
            fab: '🍬',
            navLedger: '🧾',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        
        neon: {
            fab: '🟣',
            navLedger: '🟣',
            navWallet: '💎',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        
        money: {
            fab: '💸',
            navLedger: '📒',
            navWallet: '💰',
            navInvestment: '💹',
            navChart: '📊',
            navSettings: '⚙️'
        },
        space: {
            fab: '🚀',
            navLedger: '🛸',
            navWallet: '🌌',
            navInvestment: '🛰️',
            navChart: '🔭',
            navSettings: '⚙️'
        },
        fruit: {
            fab: '🍓',
            navLedger: '🍉',
            navWallet: '🍋',
            navInvestment: '🥝',
            navChart: '🍊',
            navSettings: '🍇'
        },
        meow: {
            fab: '🐱',
            navLedger: '🐈',
            navWallet: '🐾',
            navInvestment: '🐭',
            navChart: '🐹',
            navSettings: '🐰'
        },
        mori: {
            fab: '🍃',
            navLedger: '📗',
            navWallet: '🍀',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '🌿'
        },
        littlePrince: {
            fab: '👑',
            navLedger: '📖',
            navWallet: '🌟',
            navInvestment: '📈',
            navChart: '✨',
            navSettings: '⚙️'
        },
        bluerose: {
            fab: '🗡️',
            navLedger: '📜',
            navWallet: '💎',
            navInvestment: '🛡️',
            navChart: '🏰',
            navSettings: '⚔️'
        },
                emeraldPrince: {
            fab: '👑',
            navLedger: '📜',
            navWallet: '💎',
            navInvestment: '🗡️',
            navChart: '🏰',
            navSettings: '⚔️'
        },
        goldenElegance: {
            fab: '🦋',
            navLedger: '📜',
            navWallet: '💎',
            navInvestment: '🗡️',
            navChart: '🏰',
            navSettings: '⚔️'
        },
        cuteCats: {
            fab: '🐱',
            navLedger: '🐈',
            navWallet: '🐾',
            navInvestment: '🐭',
            navChart: '🐹',
            navSettings: '🐰'
        },
        pastelStarryEyes: {
            fab: '✨',
            navLedger: '🌸',
            navWallet: '💎',
            navInvestment: '📈',
            navChart: '🔮',
            navSettings: '⚙️'
        },
        peonyAzureMask: {
            fab: '✨',
            navLedger: '📜',
            navWallet: '💎',
            navInvestment: '📈',
            navChart: '🦋',
            navSettings: '⚙️'
        },
        dreamy: {
            fab: '🌈',
            navLedger: '🎨',
            navWallet: '💖',
            navInvestment: '🌸',
            navChart: '🦋',
            navSettings: '✨'
        },
        
        dreamyfish: {
            fab: '🐠',
            navLedger: '🐟',
            navWallet: '🐡',
            navInvestment: '🦈',
            navChart: '🐙',
            navSettings: '🦑'
        },
        emerald: {
            fab: '💎',
            navLedger: '🌿',
            navWallet: '🍃',
            navInvestment: '🌱',
            navChart: '🍀',
            navSettings: '🌳'
        },
        graffiti: {
            fab: '🎨',
            navLedger: '🎭',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        
        spacegold: {
            fab: '🚀',
            navLedger: '🪐',
            navWallet: '✨',
            navInvestment: '💫',
            navChart: '🌟',
            navSettings: '🚀'
        },
        blackGoldFrog: {
            fab: '🐸',
            navLedger: '🪙',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        attractGold: {
            fab: '🧧',
            navLedger: '📖',
            navWallet: '🪙',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        },
        getrich: {
            fab: '🧧',
            navLedger: '🐱',
            navWallet: '💰',
            navInvestment: '📈',
            navChart: '🎯',
            navSettings: '🎊'
        },
        fortuneGodGetRich: {
            fab: '🧧',
            navLedger: '🧾',
            navWallet: '💰',
            navInvestment: '🪙',
            navChart: '📊',
            navSettings: '⚙️'
        },
        ganeshaGoldOm: {
            fab: 'ॐ',
            navLedger: '📿',
            navWallet: '🪙',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '🕉️'
        },
        festive: {
            fab: '🎉',
            navLedger: '🎊',
            navWallet: '💰',
            navInvestment: '🎈',
            navChart: '🎆',
            navSettings: '🎇'
        },
        whimsicalStarry: {
            fab: '🌟',
            navLedger: '✨',
            navWallet: '💫',
            navInvestment: '🌌',
            navChart: '🔭',
            navSettings: '🌠'
        },
        shinchanPool: {
            fab: '🏊',
            navLedger: '🦆',
            navWallet: '💧',
            navInvestment: '🌊',
            navChart: '🏖️',
            navSettings: '⛱️'
        },
        dreamyGalaxy: {
            fab: '🌌',
            navLedger: '✨',
            navWallet: '💫',
            navInvestment: '🌟',
            navChart: '🔭',
            navSettings: '🌠'
        },
        dreamyRealm: {
            fab: '🌸',
            navLedger: '✨',
            navWallet: '💖',
            navInvestment: '🌈',
            navChart: '🦋',
            navSettings: '🎨'
        },
        crimsonIvory: {
            fab: '🥀',
            navLedger: '📜',
            navWallet: '👛',
            navInvestment: '📈',
            navChart: '📊',
            navSettings: '⚙️'
        }
    };

    const iconAssetsCute = {
        nav: {
            ledger: 'image/1.png',
            wallet: 'image/2.png',
            investment: 'image/3.png',
            chart: 'image/4.png',
            settings: 'image/5.png'
        },
        fab: 'image/6.png'
    };

    const setButtonImgIcon = (btn, src) => {
        btn.innerHTML = `<img src="${src}" alt="icon" class="ui-icon-img" style="width: 28px; height: 28px; object-fit: contain;" />`;
    };

    const icons = buttonIcons[themeId] || buttonIcons.pink;
    const iconAssets = themeId === 'cute' ? iconAssetsCute : null;

    const fabBtn = document.getElementById('fabBtn');
    if (fabBtn) {
        if (themeId === 'cute') {
            setButtonImgIcon(fabBtn, iconAssetsCute.fab);
        } else {
            fabBtn.textContent = icons.fab;
        }
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const page = item.dataset.page;
        const navIcon = item.querySelector('.nav-icon');
        if (navIcon) {
            if (navIcon.tagName === 'IMG') {
                const src = iconAssets && iconAssets.nav && iconAssets.nav[page];
                if (src) {
                    navIcon.src = src;
                }
            } else {
                switch(page) {
                    case 'ledger':
                        navIcon.textContent = icons.navLedger;
                        break;
                    case 'wallet':
                        navIcon.textContent = icons.navWallet;
                        break;
                    case 'investment':
                        navIcon.textContent = icons.navInvestment;
                        break;
                    case 'chart':
                        navIcon.textContent = icons.navChart;
                        break;
                    case 'settings':
                        navIcon.textContent = icons.navSettings;
                        break;
                }
            }
        }
    });

    restoreButtonIcons();
}

const originalButtonIcons = {
    accountBtn: '💳',
    emojiBtn: '😊',
    memberBtn: '👤',
    imageBtn: '📷',
    checkBtn: '✓',
    searchBtn: '🔍',
    addCategoryBtn: '➕',
    quickNotes: {
        '早餐': '🍳',
        '午餐': '🍱',
        '晚餐': '🍽️',
        '交通': '🚗',
        '購物': '🛒',
        '娛樂': '🎮'
    }
};

function restoreButtonIcons() {
    document.querySelectorAll('[data-original-icon]').forEach(btn => {
        const originalIcon = btn.dataset.originalIcon;
        if (originalIcon) {
            if (btn.classList.contains('quick-note-btn')) {
                btn.innerHTML = originalIcon;
            } else {
                btn.textContent = originalIcon;
            }
            btn.removeAttribute('data-original-icon');
        }
    });

    const quickNoteButtons = document.querySelectorAll('.quick-note-btn');
    quickNoteButtons.forEach(btn => {
        const note = btn.dataset.note;
        if (note && originalButtonIcons.quickNotes[note]) {
            btn.innerHTML = `${originalButtonIcons.quickNotes[note]} ${note}`;
        }
    });

    const accountBtn = document.querySelector('.account-btn');
    if (accountBtn && !accountBtn.dataset.originalIcon) {
        accountBtn.textContent = originalButtonIcons.accountBtn;
    }

    const emojiBtn = document.querySelector('.emoji-btn');
    if (emojiBtn && !emojiBtn.dataset.originalIcon) {
        emojiBtn.textContent = originalButtonIcons.emojiBtn;
    }

    const memberBtn = document.getElementById('memberBtn');
    if (memberBtn && !memberBtn.dataset.originalIcon) {
        memberBtn.textContent = originalButtonIcons.memberBtn;
    }

    const imageBtn = document.getElementById('imageBtn');
    if (imageBtn && !imageBtn.dataset.originalIcon) {
        imageBtn.textContent = originalButtonIcons.imageBtn;
    }

    const checkBtn = document.getElementById('saveBtn');
    if (checkBtn && !checkBtn.dataset.originalIcon) {
        checkBtn.textContent = originalButtonIcons.checkBtn;
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn && !searchBtn.dataset.originalIcon) {
        searchBtn.textContent = originalButtonIcons.searchBtn;
    }

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn && !addCategoryBtn.dataset.originalIcon) {
        addCategoryBtn.textContent = originalButtonIcons.addCategoryBtn;
    }

    const equalBtnRestore = document.querySelector('.key-btn.equal');
    if (equalBtnRestore && equalBtnRestore.dataset.key === '=' && !equalBtnRestore.dataset.originalIcon) {
        equalBtnRestore.textContent = '=';
    }
}

function getCustomTheme() {
    return JSON.parse(localStorage.getItem('customTheme') || '{}');
}

function saveCustomTheme(theme) {
    localStorage.setItem('customTheme', JSON.stringify(theme));
}

function applyCustomTheme() {
    const customTheme = getCustomTheme();
    const root = document.documentElement;

    if (!customTheme || Object.keys(customTheme).length === 0) {
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--color-primary-light');
        root.style.removeProperty('--color-primary-lighter');
        root.style.removeProperty('--color-primary-dark');
        root.style.removeProperty('--border-primary');
        root.style.removeProperty('--bg-white');
        root.style.removeProperty('--bg-primary');
        document.body.style.background = '';
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        return;
    }

    if (customTheme.primaryColor) {
        root.style.setProperty('--color-primary', customTheme.primaryColor);
        root.style.setProperty('--border-primary', customTheme.primaryColor);

        const hex = customTheme.primaryColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.3));
        const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.3));
        const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.3));
        root.style.setProperty('--color-primary-light', `rgb(${lightR}, ${lightG}, ${lightB})`);

        const lighterR = Math.min(255, Math.floor(r + (255 - r) * 0.5));
        const lighterG = Math.min(255, Math.floor(g + (255 - g) * 0.5));
        const lighterB = Math.min(255, Math.floor(b + (255 - b) * 0.5));
        root.style.setProperty('--color-primary-lighter', `rgb(${lighterR}, ${lighterG}, ${lighterB})`);

        const darkR = Math.max(0, Math.floor(r * 0.8));
        const darkG = Math.max(0, Math.floor(g * 0.8));
        const darkB = Math.max(0, Math.floor(b * 0.8));
        root.style.setProperty('--color-primary-dark', `rgb(${darkR}, ${darkG}, ${darkB})`);
    }

    if (customTheme.buttonColor) {
        root.style.setProperty('--color-primary', customTheme.buttonColor);
    }

    const effectivePrimaryColor = customTheme.buttonColor || customTheme.primaryColor;
    if (effectivePrimaryColor) {
        const parseRgb = (color) => {
            const c = String(color || '').trim();
            if (/^#?[0-9a-fA-F]{6}$/.test(c)) {
                const hex = c.replace('#', '');
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }
            const m = c.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
            if (m) {
                return {
                    r: Math.min(255, Math.max(0, parseInt(m[1], 10))),
                    g: Math.min(255, Math.max(0, parseInt(m[2], 10))),
                    b: Math.min(255, Math.max(0, parseInt(m[3], 10)))
                };
            }
            return null;
        };

        const base = parseRgb(effectivePrimaryColor);
        if (base) {
            const { r, g, b } = base;

            root.style.setProperty('--color-primary', effectivePrimaryColor);
            root.style.setProperty('--border-primary', effectivePrimaryColor);

            const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.3));
            const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.3));
            const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.3));
            root.style.setProperty('--color-primary-light', `rgb(${lightR}, ${lightG}, ${lightB})`);

            const lighterR = Math.min(255, Math.floor(r + (255 - r) * 0.5));
            const lighterG = Math.min(255, Math.floor(g + (255 - g) * 0.5));
            const lighterB = Math.min(255, Math.floor(b + (255 - b) * 0.5));
            root.style.setProperty('--color-primary-lighter', `rgb(${lighterR}, ${lighterG}, ${lighterB})`);

            const darkR = Math.max(0, Math.floor(r * 0.8));
            const darkG = Math.max(0, Math.floor(g * 0.8));
            const darkB = Math.max(0, Math.floor(b * 0.8));
            root.style.setProperty('--color-primary-dark', `rgb(${darkR}, ${darkG}, ${darkB})`);

            const setAlpha = (suffix, alpha) => {
                root.style.setProperty(`--color-primary-rgba-${suffix}`, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            };
            setAlpha('08', '0.08');
            setAlpha('10', '0.1');
            setAlpha('12', '0.12');
            setAlpha('15', '0.15');
            setAlpha('18', '0.18');
            setAlpha('20', '0.2');
            setAlpha('25', '0.25');
            setAlpha('30', '0.3');

            const setLightAlpha = (suffix, alpha) => {
                root.style.setProperty(`--color-primary-light-rgba-${suffix}`, `rgba(${lightR}, ${lightG}, ${lightB}, ${alpha})`);
            };
            setLightAlpha('08', '0.08');
            setLightAlpha('10', '0.1');
            setLightAlpha('15', '0.15');
            setLightAlpha('20', '0.2');
            setLightAlpha('25', '0.25');
        }
    }

    if (customTheme.boxColor) {
        root.style.setProperty('--bg-white', customTheme.boxColor);
    }

    if (customTheme.backgroundColor) {
        root.style.setProperty('--bg-primary', customTheme.backgroundColor);
        if (!customTheme.backgroundColor.includes('gradient')) {
            document.body.style.background = customTheme.backgroundColor;
        } else {
            document.body.style.background = customTheme.backgroundColor;
        }
    }

    if (customTheme.backgroundImage) {
        document.body.style.backgroundImage = `url(${customTheme.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
    }
}

function showThemeNotification(theme) {
    if (!theme) return;
    
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `
        <div class="theme-notification-content">
            <div class="theme-notification-icon">${theme.icon || '🎨'}</div>
            <div class="theme-notification-text">
                <div class="theme-notification-title">主題已切換</div>
                <div class="theme-notification-name">${theme.name}</div>
            </div>
            <div class="theme-notification-close">✕</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 添加關閉事件
    const closeBtn = notification.querySelector('.theme-notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification();
    });
    
    // 自動移除
    const removeNotification = () => {
        notification.classList.add('theme-notification--fadeout');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    };
    
    // 3秒後自動移除
    setTimeout(removeNotification, 3000);
    
    // 點擊外部關閉
    notification.addEventListener('click', (e) => {
        if (e.target === notification) {
            removeNotification();
        }
    });
}

function showThemeSelector() {
    const modal = document.createElement('div');
    modal.className = 'theme-select-modal';

    const currentTheme = getCurrentTheme();
    const customTheme = getCustomTheme();

    modal.innerHTML = `
        <div class="theme-custom-content modal-content-standard">
            <div class="theme-modal-header">
                <div class="theme-modal-title">🎨 主題</div>
                <button class="theme-close-btn" type="button" aria-label="Close">✕</button>
            </div>

            <div class="theme-section">
                <div class="theme-section-title">主題分類</div>
                <div class="theme-toolbar">
                    <input id="themeSearchInput" class="theme-search-input" type="text" placeholder="搜尋主題..." autocomplete="off" />
                    <div id="categoryTabs" class="theme-category-tabs"></div>
                </div>
                <div id="themeGrid" class="theme-grid theme-grid--categorized"></div>
            </div>

            <div class="theme-section theme-section--divider">
                <div class="theme-section-title">背景圖片</div>
                <input type="file" id="backgroundImageInput" accept="image/*" style="display: none;">
                <button id="uploadImageBtn" class="theme-primary-btn" type="button">📷 上傳背景圖片</button>
                ${customTheme.backgroundImage ? `
                    <div id="imagePreviewContainer" class="theme-image-preview">
                        <img src="${customTheme.backgroundImage}" alt="背景預覽" class="theme-image-preview-img">
                        <button id="removeImageBtn" class="theme-image-remove-btn" type="button">✕</button>
                    </div>
                ` : '<div id="imagePreviewContainer"></div>'}
            </div>

            <div class="theme-actions">
                <button id="resetThemeBtn" class="theme-secondary-btn" type="button">重置</button>
                <button id="saveThemeBtn" class="theme-primary-btn" type="button">儲存設定</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const initCategoryTabs = () => {
        const categoryTabs = document.getElementById('categoryTabs');
        if (!categoryTabs) return;

        let tabsHTML = `
            <button class="category-tab active" data-category="all">
                <span class="category-tab-icon">🎨</span>
                <span class="category-tab-name">全部</span>
                <span class="category-tab-count">${themes.length}</span>
            </button>
        `;

        Object.entries(themeCategories).forEach(([categoryId, categoryInfo]) => {
            const categoryThemes = themes.filter(t => t.category === categoryId);
            if (categoryThemes.length > 0) {
                tabsHTML += `
                    <button class="category-tab" data-category="${categoryId}">
                        <span class="category-tab-icon">${categoryInfo.icon}</span>
                        <span class="category-tab-name">${categoryInfo.name}</span>
                        <span class="category-tab-count">${categoryThemes.length}</span>
                    </button>
                `;
            }
        });

        categoryTabs.innerHTML = tabsHTML;

        categoryTabs.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const searchInput = document.getElementById('themeSearchInput');
                renderThemeGrid(searchInput ? searchInput.value : '', tab.dataset.category);
            });
        });
    };

    const renderThemeGrid = (query = '', selectedCategory = 'all') => {
        const q = (query || '').trim().toLowerCase();
        const grid = document.getElementById('themeGrid');
        if (!grid) return;

        let list = themes.filter(t => {
            if (!q) return true;
            return (t.name || '').toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q);
        });

        if (selectedCategory !== 'all') {
            list = list.filter(t => t.category === selectedCategory);
        }

        const groupedThemes = {};
        list.forEach(theme => {
            const category = theme.category || 'basic';
            if (!groupedThemes[category]) {
                groupedThemes[category] = [];
            }
            groupedThemes[category].push(theme);
        });

        let gridHTML = '';
        
        Object.entries(groupedThemes).forEach(([categoryId, categoryThemes]) => {
            const categoryInfo = themeCategories[categoryId] || { name: '其他', icon: '📁', description: '' };
            
            gridHTML += `
                <div class="theme-category-section">
                    <div class="theme-category-header">
                        <span class="theme-category-icon">${categoryInfo.icon}</span>
                        <span class="theme-category-name">${categoryInfo.name}</span>
                        <span class="theme-category-description">${categoryInfo.description}</span>
                    </div>
                    <div class="theme-category-grid">
                        ${categoryThemes.map(theme => {
                            const isSelected = theme.id === currentTheme && !customTheme.primaryColor;
                            const hasBackgroundImage = theme.backgroundImage;
                            return `
                                <div class="theme-item ${isSelected ? 'selected' : ''}" data-theme-id="${theme.id}">
                                    <div class="theme-item-preview ${hasBackgroundImage ? 'theme-item-preview--image' : ''}" ${hasBackgroundImage ? `data-preview-image="${theme.backgroundImage}"` : `style="background: ${theme.preview};"`}></div>
                                    <div class="theme-item-content theme-item-content--compact">
                                        <div class="theme-item-icon">${theme.icon}</div>
                                        <div class="theme-item-name">${theme.name}</div>
                                        ${isSelected ? '<div class="theme-item-check">✓</div>' : '<div class="theme-item-check theme-item-check--placeholder"></div>'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        grid.innerHTML = gridHTML || '<div class="theme-grid-empty" style="padding: 32px 16px; text-align: center; opacity: 0.7;">找不到符合的主題</div>';

        // 預覽圖捲動到畫面附近才載入，避免一打開就下載所有主題圖片
        const previews = grid.querySelectorAll('[data-preview-image]');
        const loadPreview = (el) => {
            el.style.backgroundImage = `url('${el.dataset.previewImage}')`;
            el.removeAttribute('data-preview-image');
        };
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadPreview(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '200px' });
            previews.forEach(el => observer.observe(el));
        } else {
            previews.forEach(loadPreview);
        }

        grid.querySelectorAll('.theme-item').forEach(item => {
            item.addEventListener('click', () => {
                const themeId = item.dataset.themeId;
                const theme = themes.find(t => t.id === themeId);

                if (!theme) return;

                saveCustomTheme({});
                applyTheme(themeId);

                grid.querySelectorAll('.theme-item').forEach(t => t.classList.remove('selected'));
                item.classList.add('selected');

                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                    showThemeNotification(theme);
                }, 300);
            });
        });
    };

    initCategoryTabs();
    renderThemeGrid('');

    // 打開時捲動到目前使用中的主題
    const selectedItem = modal.querySelector('.theme-item.selected');
    if (selectedItem) {
        requestAnimationFrame(() => selectedItem.scrollIntoView({ block: 'center' }));
    }

    const themeSearchInput = document.getElementById('themeSearchInput');
    if (themeSearchInput) {
        themeSearchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.category-tab.active');
            const selectedCategory = activeTab ? activeTab.dataset.category : 'all';
            renderThemeGrid(e.target.value, selectedCategory);
        });
    }

    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('backgroundImageInput');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (uploadBtn && imageInput) {
        uploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target.result;
                    const previewContainer = document.getElementById('imagePreviewContainer');
                    previewContainer.innerHTML = `
                        <img src="${imageUrl}" alt="背景預覽" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">
                        <button id="removeImageBtn" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 18px;">✕</button>
                    `;
                    previewContainer.style.position = 'relative';
                    previewContainer.style.marginTop = '12px';

                    const newRemoveBtn = document.getElementById('removeImageBtn');
                    if (newRemoveBtn) {
                        newRemoveBtn.addEventListener('click', () => {
                            imageInput.value = '';
                            previewContainer.innerHTML = '';
                            previewContainer.style.marginTop = '0';
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = '';
            previewContainer.style.marginTop = '0';
        });
    }

    const saveBtn = document.getElementById('saveThemeBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            playClickSound();
            const theme = {};

            const imagePreview = document.querySelector('#imagePreviewContainer img');
            if (imagePreview) {
                theme.backgroundImage = imagePreview.src;
            }

            saveCustomTheme(theme);
            applyCustomTheme();

            if (typeof updateAllCharts === 'function') {
                updateAllCharts();
            }

            alert('主題設定已儲存！');
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }

    const resetBtn = document.getElementById('resetThemeBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('確定要重置所有自訂設定嗎？')) {
                saveCustomTheme({});
                applyTheme('blue');
                applyCustomTheme();
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                showThemeSelector();
            }
        });
    }

    const closeBtn = modal.querySelector('.theme-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
}

function initTheme() {
    const savedTheme = getCurrentTheme();

    const savedThemeExists = themes.some(t => t.id === savedTheme);
    const effectiveTheme = savedThemeExists ? savedTheme : 'blue';
    applyTheme(effectiveTheme);
    applyCustomTheme();
    const customTheme = getCustomTheme();
    if (customTheme.backgroundImage) {
        document.body.style.backgroundImage = `url(${customTheme.backgroundImage})`;
    }
    setTimeout(() => {
        updateThemeButtons(effectiveTheme);
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});