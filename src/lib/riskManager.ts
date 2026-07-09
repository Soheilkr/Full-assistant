export interface RiskManagerParams {
  lookback: number;
  lowThreshold: number;
  highThreshold: number;
  lowRisk: number;
  normalRisk: number;
  highRisk: number;
}

export interface RiskManagerState {
  winRate: number;
  winRatePercent: string;
  currentRisk: number;
  riskIfWin: number;
  riskIfLoss: number;
  totalTradesConsidered: number;
}

export class RiskManager {
  private params: RiskManagerParams = {
    lookback: 40,
    lowThreshold: 0.58,
    highThreshold: 0.62,
    lowRisk: 0.7,
    normalRisk: 1.0,
    highRisk: 1.2
  };

  private tradeResults: boolean[] = [];

  constructor(params?: Partial<RiskManagerParams>) {
    if (params) {
      this.configure(params);
    }
  }

  configure(params: Partial<RiskManagerParams>): void {
    this.params = { ...this.params, ...params };
    // Trim queue if lookback has shrunk
    if (this.tradeResults.length > this.params.lookback) {
      this.tradeResults = this.tradeResults.slice(-this.params.lookback);
    }
  }

  addTradeResult(isWin: boolean): void {
    this.tradeResults.push(isWin);
    if (this.tradeResults.length > this.params.lookback) {
      this.tradeResults.shift();
    }
  }

  private calculateRiskForHistory(history: boolean[]): { winRate: number; risk: number } {
    if (history.length === 0) {
      // Default risk is normal scale if no trades exist yet
      return { winRate: 0, risk: this.params.normalRisk };
    }
    const wins = history.filter(w => w).length;
    const winRate = wins / history.length;
    
    let risk = this.params.normalRisk;
    if (winRate < this.params.lowThreshold) {
      risk = this.params.lowRisk;
    } else if (winRate >= this.params.highThreshold) {
      risk = this.params.highRisk;
    }
    return { winRate, risk };
  }

  getCurrentState(): RiskManagerState {
    const { winRate, risk: currentRisk } = this.calculateRiskForHistory(this.tradeResults);
    
    // Simulate if this trade wins
    const winHistory = [...this.tradeResults, true].slice(-this.params.lookback);
    const { risk: riskIfWin } = this.calculateRiskForHistory(winHistory);

    // Simulate if this trade loses
    const lossHistory = [...this.tradeResults, false].slice(-this.params.lookback);
    const { risk: riskIfLoss } = this.calculateRiskForHistory(lossHistory);

    return {
      winRate,
      winRatePercent: `${(winRate * 100).toFixed(1)}%`,
      currentRisk,
      riskIfWin,
      riskIfLoss,
      totalTradesConsidered: this.tradeResults.length
    };
  }

  setHistory(history: boolean[]): void {
    this.tradeResults = history.slice(-this.params.lookback);
  }

  reset(): void {
    this.tradeResults = [];
  }
}
