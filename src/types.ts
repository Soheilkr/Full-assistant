export type TradeResult = 'TP' | 'SL' | 'PENDING';

export interface Trade {
  id: string;
  timestamp: number;
  preTradeNotes: string;
  result: TradeResult;
  postTradeNotes?: string;
  tradeCondition: 'Wide' | 'Tight' | 'Reng' | '';
  winRateAtEntry?: number;
  strategyMode?: 'channel' | 'btb';
  voiceText?: string;
  voiceAudioUrl?: string;
}

export interface DailyState {
  id: string;
  date: string; // YYYY-MM-DD
  trades: Trade[];
  archivedAt?: number; // Timestamp when session was closed
  strategyMode?: 'channel' | 'btb';
}

export interface HistoryState {
  dailyRecords: DailyState[];
}

export interface AlarmSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, etc.
  intervalEnabled: boolean;
  customTimes: string[]; // e.g. ["14:15", "16:00"]
  customTimesEnabled: boolean;
  customSoundBase64?: string; // User-uploaded audio file base64 data URL
  customSoundName?: string; // User-uploaded audio filename
  selectedSoundType: 'default' | 'bell' | 'digital' | 'custom';
  playbackSeconds?: number; // Duration to play alarm in seconds
  volume?: number; // Volume from 0 to 100
  keepScreenAwake?: boolean; // Prevent screen sleep on mobile/desktop
}

export interface Settings {
  maxTradesPerDay: number;
  maxWinsPerDay: number;
  maxConsecutiveLosses: number;
  sequenceProbabilities: {
    LL: number;
    WW: number;
    LLW: number;
    WLL: number;
    LWW: number;
    LWL: number;
    WWL: number;
    WLW: number;
    LLL: number;
    WWW: number;
    LW: number;
    WL: number;
    [key: string]: number; // Allow extensibility
  };
  positionSizing?: {
    enabled?: boolean;
    simplified?: boolean;
    lookback: number;
    lowThreshold: number;
    highThreshold: number;
    lowRisk: number;
    normalRisk: number;
    highRisk: number;
    seedHistoryString: string;
  };
  strategyRules?: string[];
  passcodeEnabled?: boolean;
  passcode?: string;
  alarmSettings?: AlarmSettings;
  voicePlaybackMode?: 'auto' | 'manual' | 'disabled';
  voicePlaybackVolume?: number;
  voiceSLMappings?: Record<string, string>;
  voiceTPMappings?: Record<string, string>;
  screenshotSettings?: ScreenshotSettings;
  autoExcelExport?: AutoExcelExportSettings;
  appLanguage?: 'default' | 'en' | 'fa';
  alwaysOnTop?: boolean;
  sequenceProbabilitiesEnabled?: boolean;
  windowDimensions?: {
    unfoldedWidth: number;
    unfoldedHeight: number;
    foldedWidth: number;
    foldedHeight: number;
  };
}

export interface ScreenshotSettings {
  enabled: boolean;
  monitorIndex: number; // 0, 1, 2
  folderPath: string;
}

export interface AutoExcelExportSettings {
  enabled: boolean;
  folderPath: string;
}

export const PSYCHOLOGY_TIPS = [
  "بازار همیشه فرصت‌های جدیدی خلق می‌کند. صبور باشید.",
  "ضرر جزئی از بازی است، نه پایان آن. به استراتژی خود پایبند بمانید.",
  "احساسات خود را نظاره کنید اما اجازه ندهید سکان هدایت را به دست بگیرند.",
  "یک معامله بد شما را به معامله‌گر بدی تبدیل نمی‌کند؛ این صرفاً یک نقطه داده آماری است.",
  "انضباط شخصی یعنی انجام کارهایی که باید انجام شوند، حتی وقتی که تمایلی به انجام آن‌ها ندارید.",
  "روی فرآیند تمرکز کنید، نه روی نتیجه مالی.",
  "اگر خسته یا تحت فشار هستید، پلتفرم معاملاتی خود را ببندید. بازار فردا هم باز خواهد بود."
];

export const PSYCHOLOGY_TIPS_EN = [
  "The market always creates new opportunities. Be patient.",
  "Loss is part of the game, not the end of it. Stick to your strategy.",
  "Observe your emotions but do not let them take the helm.",
  "A bad trade doesn't make you a bad trader; it is simply a statistical data point.",
  "Self-discipline means doing what needs to be done, even when you don't feel like doing it.",
  "Focus on the process, not the financial outcome.",
  "If you are tired or stressed, close your trading platform. The market will be open tomorrow."
];

export const STRATEGY_TIPS = [
  "You only follow the system if you track trades with alerts, just like backtesting. Look at the chart for only a few minutes on alert, check the position, set another alert, and walk away to see if it hits TP or SL. In other words, do not stare at the chart continuously.",
  "Your only duty is to act according to the plan and strategy. Why? Because backtesting has already proven exactly how much profit this strategy generates monthly.",
  "Why don't we double the trade volume? Because with increased volume, you will not endure until the position hits its target. This ruins performance and raises psychological stress.",
  "At market open or during the first hour, the market is usually ranging. On a 15-minute timeframe, the candle must close full-bodied after shadows. If shadows remain, wait for a wide channel to form.",
  "In wide channels, if a high-volume signal bar appears, wait for the price to return to that signal bar and form a pinbar to decrease your stop loss. (The pinbar must form within the core of that high-volume signal bar.)",
  "Do not take positions when the market is in a range. To avoid unnecessary entries, switch your chart to line chart view."
];
