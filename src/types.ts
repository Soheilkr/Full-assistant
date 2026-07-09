export interface TradePosition {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  openTime: string;
}

export interface Alarm {
  id: string;
  price: number;
  ticker: string;
  type: 'ABOVE' | 'BELOW';
  isActive: boolean;
  isTriggered: boolean;
  message?: string;
}

export interface AppSettings {
  confirmOnCloseWithOpenPosition: boolean;
  soundEnabled: boolean;
  selectedDirectory: string;
}

declare global {
  interface Window {
    electronAPI?: {
      toggleCollapse: (collapsed: boolean) => void;
      selectDirectory: () => Promise<string | null>;
      takeScreenshot: (dir: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      closeApp: () => void;
      minimizeApp: () => void;
    };
  }
}
