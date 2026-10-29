// 投資分析增強模組
// 投資組合分析和投資目標追蹤

// 投資組合分析功能
function analyzePortfolio(holdings, marketData = null) {
    if (!holdings || holdings.length === 0) {
        return null;
    }
    
    const analysis = {
        summary: {
            totalValue: 0,
            totalCost: 0,
            totalGain: 0,
            totalGainPercent: 0,
            holdingsCount: holdings.length
        },
        risk: {
            riskScore: 0,
            riskLevel: 'low',
            concentrationRisk: 0,
            volatilityRisk: 0,
            currencyRisk: 0
        },
        diversification: {
            sectorAllocation: {},
            geographicAllocation: {},
            assetAllocation: {},
            diversificationScore: 0,
            recommendations: []
        },
        performance: {
            bestPerformer: null,
            worstPerformer: null,
            averageReturn: 0,
            volatility: 0,
            sharpeRatio: 0
        },
        insights: [],
        recommendations: []
    };
    
    // 1. 基本統計計算
    holdings.forEach(holding => {
        const currentValue = holding.currentPrice * holding.quantity || 0;
        const totalCost = holding.avgCost * holding.quantity || 0;
        const gain = currentValue - totalCost;
        const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
        
        analysis.summary.totalValue += currentValue;
        analysis.summary.totalCost += totalCost;
        analysis.summary.totalGain += gain;
        
        // 更新最佳/最差表現
        if (!analysis.performance.bestPerformer || gainPercent > analysis.performance.bestPerformer.return) {
            analysis.performance.bestPerformer = {
                symbol: holding.symbol,
                name: holding.name,
                return: gainPercent,
                value: currentValue
            };
        }
        
        if (!analysis.performance.worstPerformer || gainPercent < analysis.performance.worstPerformer.return) {
            analysis.performance.worstPerformer = {
                symbol: holding.symbol,
                name: holding.name,
                return: gainPercent,
                value: currentValue
            };
        }
    });
    
    analysis.summary.totalGainPercent = analysis.summary.totalCost > 0 ? 
        (analysis.summary.totalGain / analysis.summary.totalCost) * 100 : 0;
    
    // 2. 風險評估
    analysis.risk = calculatePortfolioRisk(holdings, analysis.summary.totalValue);
    
    // 3. 分散度分析
    analysis.diversification = calculateDiversification(holdings, analysis.summary.totalValue);
    
    // 4. 績效分析
    analysis.performance = calculatePerformanceMetrics(holdings, analysis.performance);
    
    // 5. 生成洞察
    analysis.insights = generatePortfolioInsights(analysis);
    
    // 6. 生成建議
    analysis.recommendations = generatePortfolioRecommendations(analysis);
    
    return analysis;
}

// 計算投資組合風險
function calculatePortfolioRisk(holdings, totalValue) {
    const risk = {
        riskScore: 0,
        riskLevel: 'low',
        concentrationRisk: 0,
        volatilityRisk: 0,
        currencyRisk: 0
    };
    
    // 1. 集中度風險
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const weight = value / totalValue;
        
        // 單一持股超過20%為高風險
        if (weight > 0.2) {
            risk.concentrationRisk += (weight - 0.2) * 2;
        }
    });
    
    // 2. 波動率風險（基於股票類型）
    const stockTypes = {
        '科技股': { volatility: 0.8, risk: 'high' },
        '金融股': { volatility: 0.6, risk: 'medium' },
        '傳產股': { volatility: 0.4, risk: 'low' },
        '生技股': { volatility: 0.9, risk: 'high' },
        '能源股': { volatility: 0.7, risk: 'medium' }
    };
    
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const weight = value / totalValue;
        const stockType = getStockType(holding) || '傳產股';
        const typeInfo = stockTypes[stockType] || stockTypes['傳產股'];
        
        risk.volatilityRisk += typeInfo.volatility * weight;
    });
    
    // 3. 幣別風險
    const currencyWeights = {};
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const currency = holding.currency || 'TWD';
        currencyWeights[currency] = (currencyWeights[currency] || 0) + value;
    });
    
    Object.values(currencyWeights).forEach(weight => {
        const ratio = weight / totalValue;
        // 單一幣別超過80%為風險
        if (ratio > 0.8) {
            risk.currencyRisk += (ratio - 0.8) * 1.5;
        }
    });
    
    // 4. 綜合風險評分
    risk.riskScore = (risk.concentrationRisk * 0.4 + risk.volatilityRisk * 0.4 + risk.currencyRisk * 0.2) * 100;
    
    // 5. 風險等級
    if (risk.riskScore < 30) {
        risk.riskLevel = 'low';
    } else if (risk.riskScore < 60) {
        risk.riskLevel = 'medium';
    } else {
        risk.riskLevel = 'high';
    }
    
    return risk;
}

// 計算分散度
function calculateDiversification(holdings, totalValue) {
    const diversification = {
        sectorAllocation: {},
        geographicAllocation: {},
        assetAllocation: {},
        diversificationScore: 0,
        recommendations: []
    };
    
    // 1. 產業分配
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const sector = getStockSector(holding) || '其他';
        diversification.sectorAllocation[sector] = (diversification.sectorAllocation[sector] || 0) + value;
    });
    
    // 2. 地域分配
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const region = getStockRegion(holding) || '台灣';
        diversification.geographicAllocation[region] = (diversification.geographicAllocation[region] || 0) + value;
    });
    
    // 3. 資產類別分配
    holdings.forEach(holding => {
        const value = holding.currentPrice * holding.quantity || 0;
        const assetType = getAssetType(holding) || '股票';
        diversification.assetAllocation[assetType] = (diversification.assetAllocation[assetType] || 0) + value;
    });
    
    // 4. 計算分散度分數
    let score = 0;
    
    // 產業分散度 (40%)
    const sectorCount = Object.keys(diversification.sectorAllocation).length;
    score += Math.min(sectorCount / 5, 1) * 40;
    
    // 地域分散度 (30%)
    const regionCount = Object.keys(diversification.geographicAllocation).length;
    score += Math.min(regionCount / 3, 1) * 30;
    
    // 資產類別分散度 (30%)
    const assetCount = Object.keys(diversification.assetAllocation).length;
    score += Math.min(assetCount / 3, 1) * 30;
    
    diversification.diversificationScore = Math.round(score);
    
    // 5. 分散度建議
    diversification.recommendations = generateDiversificationRecommendations(diversification);
    
    return diversification;
}

// 計算績效指標
function calculatePerformanceMetrics(holdings, performance) {
    const returns = [];
    
    holdings.forEach(holding => {
        const totalCost = holding.avgCost * holding.quantity || 0;
        const currentValue = holding.currentPrice * holding.quantity || 0;
        const returnPercent = totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0;
        returns.push(returnPercent);
    });
    
    if (returns.length > 0) {
        // 平均報酬率
        performance.averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        
        // 波動率（標準差）
        const mean = performance.averageReturn;
        const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
        performance.volatility = Math.sqrt(variance);
        
        // 夏普比率（假設無風險利率為2%）
        const riskFreeRate = 2;
        performance.sharpeRatio = performance.volatility > 0 ? 
            (performance.averageReturn - riskFreeRate) / performance.volatility : 0;
    }
    
    return performance;
}

// 投資目標追蹤功能
function trackInvestmentGoals(goals, currentPortfolio) {
    if (!goals || goals.length === 0) {
        return null;
    }
    
    const tracking = {
        overview: {
            totalGoals: goals.length,
            completedGoals: 0,
            inProgressGoals: 0,
            notStartedGoals: 0,
            totalTargetAmount: 0,
            totalCurrentAmount: 0
        },
        goals: [],
        insights: [],
        recommendations: []
    };
    
    goals.forEach(goal => {
        const goalTracking = trackSingleGoal(goal, currentPortfolio);
        tracking.goals.push(goalTracking);
        
        // 更新統計
        tracking.overview.totalTargetAmount += goal.targetAmount;
        tracking.overview.totalCurrentAmount += goalTracking.currentAmount;
        
        if (goalTracking.progress >= 100) {
            tracking.overview.completedGoals++;
        } else if (goalTracking.progress > 0) {
            tracking.overview.inProgressGoals++;
        } else {
            tracking.overview.notStartedGoals++;
        }
    });
    
    // 生成洞察
    tracking.insights = generateGoalInsights(tracking);
    
    // 生成建議
    tracking.recommendations = generateGoalRecommendations(tracking);
    
    return tracking;
}

// 追蹤單一目標
function trackSingleGoal(goal, currentPortfolio) {
    const tracking = {
        id: goal.id,
        name: goal.name,
        type: goal.type,
        targetAmount: goal.targetAmount,
        currentAmount: 0,
        progress: 0,
        timeRemaining: 0,
        monthlyRequired: 0,
        status: 'not_started',
        onTrack: false
    };
    
    // 計算當前進度
    if (goal.type === 'retirement') {
        // 退休目標：計算所有投資總值
        tracking.currentAmount = currentPortfolio.summary.totalValue || 0;
    } else if (goal.type === 'education') {
        // 教育目標：計算專用教育基金
        tracking.currentAmount = calculateEducationFund(currentPortfolio, goal);
    } else if (goal.type === 'house') {
        // 購屋目標：計算購屋基金
        tracking.currentAmount = calculateHouseFund(currentPortfolio, goal);
    } else {
        // 一般目標：按比例計算
        tracking.currentAmount = (currentPortfolio.summary.totalValue || 0) * 0.3;
    }
    
    tracking.progress = Math.round((tracking.currentAmount / goal.targetAmount) * 100);
    
    // 計算剩餘時間
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    tracking.timeRemaining = Math.max(0, Math.floor((targetDate - now) / (1000 * 60 * 60 * 24 * 30))); // 月
    
    // 計算每月需要投資金額
    if (tracking.timeRemaining > 0) {
        const remainingAmount = goal.targetAmount - tracking.currentAmount;
        tracking.monthlyRequired = Math.ceil(remainingAmount / tracking.timeRemaining);
    }
    
    // 判斷狀態
    if (tracking.progress >= 100) {
        tracking.status = 'completed';
        tracking.onTrack = true;
    } else if (tracking.progress > 0) {
        tracking.status = 'in_progress';
        // 檢查是否在軌道上
        const expectedProgress = ((goal.duration || 120) - tracking.timeRemaining) / (goal.duration || 120) * 100;
        tracking.onTrack = tracking.progress >= expectedProgress * 0.9; // 容忍10%誤差
    } else {
        tracking.status = 'not_started';
        tracking.onTrack = false;
    }
    
    return tracking;
}

// 生成投資組合洞察
function generatePortfolioInsights(analysis) {
    const insights = [];
    
    // 1. 整體表現洞察
    if (analysis.summary.totalGainPercent > 20) {
        insights.push({
            type: 'performance',
            title: '投資表現優異',
            content: `您的投資組合總報酬率為${analysis.summary.totalGainPercent.toFixed(1)}%，表現優於市場平均水平`,
            level: 'positive'
        });
    } else if (analysis.summary.totalGainPercent < -10) {
        insights.push({
            type: 'performance',
            title: '投資表現不佳',
            content: `您的投資組合總報酬率為${analysis.summary.totalGainPercent.toFixed(1)}%，建議檢視投資策略`,
            level: 'warning'
        });
    }
    
    // 2. 風險洞察
    if (analysis.risk.riskLevel === 'high') {
        insights.push({
            type: 'risk',
            title: '投資風險偏高',
            content: '您的投資組合風險評分較高，建議增加分散度以降低風險',
            level: 'warning'
        });
    }
    
    // 3. 分散度洞察
    if (analysis.diversification.diversificationScore < 50) {
        insights.push({
            type: 'diversification',
            title: '投資分散度不足',
            content: '您的投資組合分散度較低，建議增加不同產業或地域的投資',
            level: 'info'
        });
    }
    
    // 4. 集中度洞察
    if (analysis.risk.concentrationRisk > 0.3) {
        insights.push({
            type: 'concentration',
            title: '持股集中度偏高',
            content: '您的投資組合過度集中於少數標的，建議分散投資以降低風險',
            level: 'warning'
        });
    }
    
    return insights;
}

// 生成投資組合建議
function generatePortfolioRecommendations(analysis) {
    const recommendations = [];
    
    // 1. 分散度建議
    if (analysis.diversification.diversificationScore < 60) {
        recommendations.push({
            type: 'diversify',
            title: '增加投資分散度',
            content: '建議增加不同產業和地域的投資，以降低組合風險',
            action: 'rebalance_portfolio',
            priority: 'high'
        });
    }
    
    // 2. 風險管理建議
    if (analysis.risk.riskLevel === 'high') {
        recommendations.push({
            type: 'risk_management',
            title: '調整風險暴露',
            content: '建議減少高波動性投資，增加穩定收益資產',
            action: 'adjust_risk',
            priority: 'high'
        });
    }
    
    // 3. 再平衡建議
    const maxWeight = Math.max(...Object.values(analysis.diversification.sectorAllocation)) / analysis.summary.totalValue;
    if (maxWeight > 0.4) {
        recommendations.push({
            type: 'rebalance',
            title: '投資組合再平衡',
            content: '建議進行投資組合再平衡，避免單一產業比重過高',
            action: 'rebalance_portfolio',
            priority: 'medium'
        });
    }
    
    // 4. 績效改善建議
    if (analysis.performance.averageReturn < 5) {
        recommendations.push({
            type: 'performance_improvement',
            title: '改善投資績效',
            content: '建議檢視投資策略，考慮調整投資組合以提升報酬率',
            action: 'optimize_strategy',
            priority: 'medium'
        });
    }
    
    return recommendations;
}

// 生成目標洞察
function generateGoalInsights(tracking) {
    const insights = [];
    
    // 1. 整體進度洞察
    const overallProgress = (tracking.overview.totalCurrentAmount / tracking.overview.totalTargetAmount) * 100;
    
    if (overallProgress > 80) {
        insights.push({
            type: 'overall_progress',
            title: '目標達成度良好',
            content: `您的投資目標整體進度已達${Math.round(overallProgress)}%，表現優異`,
            level: 'positive'
        });
    } else if (overallProgress < 30) {
        insights.push({
            type: 'overall_progress',
            title: '目標進度落後',
            content: `您的投資目標整體進度僅${Math.round(overallProgress)}%，需要加強投資力度`,
            level: 'warning'
        });
    }
    
    // 2. 時間壓力洞察
    const urgentGoals = tracking.goals.filter(goal => goal.timeRemaining <= 12 && goal.progress < 80);
    if (urgentGoals.length > 0) {
        insights.push({
            type: 'time_pressure',
            title: '短期目標需要關注',
            content: `您有${urgentGoals.length}個目標將在一年內到期，建議優先處理`,
            level: 'warning'
        });
    }
    
    return insights;
}

// 生成目標建議
function generateGoalRecommendations(tracking) {
    const recommendations = [];
    
    // 1. 落後目標建議
    const behindGoals = tracking.goals.filter(goal => !goal.onTrack && goal.status === 'in_progress');
    if (behindGoals.length > 0) {
        recommendations.push({
            type: 'catch_up',
            title: '加速落後目標',
            content: `有${behindGoals.length}個目標進度落後，建議增加月度投資金額`,
            action: 'increase_monthly_investment',
            priority: 'high'
        });
    }
    
    // 2. 新目標建議
    if (tracking.overview.completedGoals > 0) {
        recommendations.push({
            type: 'new_goals',
            title: '設定新目標',
            content: '您已達成部分目標，建議設定新的投資目標持續成長',
            action: 'set_new_goals',
            priority: 'low'
        });
    }
    
    // 3. 策略調整建議
    const lowProgressGoals = tracking.goals.filter(goal => goal.progress < 20 && goal.timeRemaining > 0);
    if (lowProgressGoals.length > 0) {
        recommendations.push({
            type: 'strategy_adjustment',
            title: '調整投資策略',
            content: '部分目標進度緩慢，建議檢視並調整投資策略',
            action: 'adjust_strategy',
            priority: 'medium'
        });
    }
    
    return recommendations;
}

// 輔助函數
function getStockType(holding) {
    // 根據股票代碼或名稱判斷類型
    const name = holding.name || '';
    const symbol = holding.symbol || '';
    
    if (name.includes('科技') || name.includes('半導體') || name.includes('電子') || 
        symbol.includes('2330') || symbol.includes('2454')) {
        return '科技股';
    } else if (name.includes('銀行') || name.includes('金融') || name.includes('保險') ||
               symbol.includes('2882') || symbol.includes('2881')) {
        return '金融股';
    } else if (name.includes('生技') || name.includes('醫療') || name.includes('藥') ||
               symbol.includes('4155') || symbol.includes('6532')) {
        return '生技股';
    } else if (name.includes('油') || name.includes('電') || name.includes('氣') ||
               symbol.includes('2615') || symbol.includes('9908')) {
        return '能源股';
    } else {
        return '傳產股';
    }
}

function getStockSector(holding) {
    const name = holding.name || '';
    const symbol = holding.symbol || '';
    
    if (name.includes('半導體') || symbol.includes('2330') || symbol.includes('2454')) {
        return '半導體';
    } else if (name.includes('金融') || name.includes('銀行') || symbol.includes('2882')) {
        return '金融';
    } else if (name.includes('電子') || name.includes('科技')) {
        return '電子';
    } else if (name.includes('傳統') || name.includes('製造')) {
        return '傳產';
    } else if (name.includes('生技') || name.includes('醫療')) {
        return '生技醫療';
    } else {
        return '其他';
    }
}

function getStockRegion(holding) {
    const symbol = holding.symbol || '';
    
    if (symbol.startsWith('00') || symbol.startsWith('30')) {
        return '台灣';
    } else if (symbol.startsWith('AAPL') || symbol.startsWith('MSFT')) {
        return '美國';
    } else if (symbol.startsWith('0700') || symbol.startsWith('9988')) {
        return '香港';
    } else {
        return '台灣';
    }
}

function getAssetType(holding) {
    if (holding.type === 'stock') {
        return '股票';
    } else if (holding.type === 'bond') {
        return '債券';
    } else if (holding.type === 'fund') {
        return '基金';
    } else if (holding.type === 'etf') {
        return 'ETF';
    } else {
        return '股票';
    }
}

function calculateEducationFund(portfolio, goal) {
    // 計算教育基金（假設佔投資組合的20%）
    return (portfolio.summary.totalValue || 0) * 0.2;
}

function calculateHouseFund(portfolio, goal) {
    // 計算購屋基金（假設佔投資組合的30%）
    return (portfolio.summary.totalValue || 0) * 0.3;
}

function generateDiversificationRecommendations(diversification) {
    const recommendations = [];
    
    // 檢查產業集中度
    const maxSectorWeight = Math.max(...Object.values(diversification.sectorAllocation)) / 
                           Object.values(diversification.sectorAllocation).reduce((a, b) => a + b, 0);
    
    if (maxSectorWeight > 0.5) {
        recommendations.push('建議減少單一產業比重至40%以下');
    }
    
    // 檢查地域分散度
    if (Object.keys(diversification.geographicAllocation).length < 2) {
        recommendations.push('建議增加海外投資以分散地域風險');
    }
    
    // 檢查資產類別
    if (Object.keys(diversification.assetAllocation).length < 2) {
        recommendations.push('建議增加債券或ETF等不同資產類別');
    }
    
    return recommendations;
}

// 導出功能
window.InvestmentAnalysis = {
    analyzePortfolio,
    trackInvestmentGoals,
    calculatePortfolioRisk,
    calculateDiversification,
    trackSingleGoal
};
