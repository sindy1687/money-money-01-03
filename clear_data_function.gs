/**
 * Google Apps Script - 清除所有數據功能
 * 添加到現有的 Google Script 專案中
 */

// 清除所有數據的函數
function clearAllData() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = sheet.getSheets();
    
    let deletedSheets = [];
    let errors = [];
    
    // 遍歷所有工作表
    sheets.forEach(sheet => {
      try {
        const sheetName = sheet.getName();
        
        // 保留主要的 Sheet，只清除內容
        if (sheetName === sheet.getSheetName()) {
          // 清除主 Sheet 的內容（保留標題）
          const lastRow = sheet.getLastRow();
          if (lastRow > 1) {
            sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
            deletedSheets.push(`已清除 ${sheetName} 的數據`);
          }
        } else {
          // 刪除備份相關的工作表
          if (isBackupSheet(sheetName)) {
            sheet.deleteSheet();
            deletedSheets.push(`已刪除工作表: ${sheetName}`);
          }
        }
      } catch (error) {
        errors.push(`處理工作表 ${sheet.getName()} 時發生錯誤: ${error.toString()}`);
      }
    });
    
    return {
      success: true,
      message: '數據清除完成',
      deletedItems: deletedSheets,
      errors: errors,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: '清除數據時發生錯誤: ' + error.toString()
    };
  }
}

// 判斷是否為備份相關工作表
function isBackupSheet(sheetName) {
  const backupSheetNames = [
    '完整備份',
    '記帳記錄',
    '想買的東西',
    '存錢目標',
    '分類設定',
    '備份摘要',
    'Backup',
    'Records',
    'Wishlist',
    'Savings',
    'Categories'
  ];
  
  return backupSheetNames.includes(sheetName) || 
         sheetName.includes('備份') || 
         sheetName.includes('Backup');
}

// 在 doPost 中添加清除數據的處理
function handleClearDataRequest(requestData) {
  // 驗證清除權限（使用特殊的清除金鑰）
  const CLEAR_KEY = 'CLEAR_ALL_DATA_2026';
  
  if (requestData.clearKey !== CLEAR_KEY) {
    return {
      success: false,
      error: '清除權限驗證失敗',
      message: '需要正確的清除金鑰才能執行此操作'
    };
  }
  
  return clearAllData();
}
