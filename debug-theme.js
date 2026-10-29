// Debug script for theme selector
console.log('=== 主題選擇器調試 ===');

// Check if required functions exist
console.log('檢查必要函數:');
console.log('- showThemeSelector:', typeof showThemeSelector);
console.log('- getCurrentTheme:', typeof getCurrentTheme);
console.log('- applyTheme:', typeof applyTheme);
console.log('- initTheme:', typeof initTheme);

// Check if themes array exists
console.log('檢查主題數據:');
console.log('- themes array:', typeof themes);
console.log('- themes length:', themes ? themes.length : 'undefined');
console.log('- themeCategories:', typeof themeCategories);

// Check theme categories
if (themeCategories) {
    console.log('主題分類:');
    Object.entries(themeCategories).forEach(([id, info]) => {
        const categoryThemes = themes.filter(t => t.category === id);
        console.log(`- ${id}: ${info.name} (${categoryThemes.length} 個主題)`);
    });
}

// Test theme selector creation
try {
    console.log('測試主題選擇器創建...');
    const modal = document.createElement('div');
    modal.className = 'theme-select-modal';
    console.log('✓ 模態框元素創建成功');
    
    const currentTheme = getCurrentTheme();
    console.log('✓ 當前主題:', currentTheme);
    
    const customTheme = getCustomTheme();
    console.log('✓ 自訂主題:', customTheme);
    
    console.log('✓ 主題選擇器測試完成');
} catch (error) {
    console.error('✗ 主題選擇器測試失敗:', error);
}

console.log('=== 調試完成 ===');
