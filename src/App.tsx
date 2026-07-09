/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, History, PlusCircle, ChevronLeft, ChevronRight, Brain, BarChart3, RotateCcw, Trash, Trash2, ChevronDown, ChevronUp, Square, CheckSquare, Download, Upload, Crown, Sparkles, Plus, Edit, RefreshCw, CloudLightning, Database, Lock, Unlock, LogOut, Volume2, Bell, Music, X, Clock, Camera, Pin, Minimize2, Maximize2, FolderOpen, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { cn } from './lib/utils';
import { Trade, DailyState, TradeResult, PSYCHOLOGY_TIPS, PSYCHOLOGY_TIPS_EN, HistoryState, STRATEGY_TIPS, Settings, AlarmSettings } from './types';
import { RiskManager } from './lib/riskManager';
import { t } from './translations';

// Electron storage persistence decorator
if (typeof window !== 'undefined' && 'electronAPI' in window) {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function (key) {
    const api = (window as any).electronAPI;
    if (api && typeof api.loadStateSync === 'function') {
      try {
        const res = api.loadStateSync(key);
        if (res && res.success && res.data !== null) {
          return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        }
      } catch (err) {
        console.error('Error in loaded state override:', err);
      }
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    const api = (window as any).electronAPI;
    if (api && typeof api.saveStateSync === 'function') {
      try {
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (e) {
          parsed = value;
        }
        api.saveStateSync(key, parsed);
      } catch (err) {
        console.error('Error in saved state override:', err);
      }
    }
    originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    const api = (window as any).electronAPI;
    if (api && typeof api.saveStateSync === 'function') {
      try {
        api.saveStateSync(key, null);
      } catch (err) {
        console.error('Error in remove state override:', err);
      }
    }
    originalRemoveItem.call(this, key);
  };
}

// Page IDs for reference as requested
const PAGES = {
  WELCOME: "A",
  RULES: "B",
  DASHBOARD: "C",
  PRE_TRADE: "D",
  POST_TRADE: "E",
  RULE_VIOLATION: "F",
  HISTORY: "G",
  SETTINGS: "H",
  SYSTEM_SETTINGS: "I",
  ARCHIVE: "J"
};

const isPersian = (text: string) => /[\u0600-\u06FF]/.test(text);

const defaultVoiceGroups = {
  group1: [
    { text: "عالی بود! سود اول رو گرفتی. صبور باش برای معامله بعدی.", audioUrl: "", fileName: "" },
    { text: "آفرین، این معامله با موفقیت انجام شد. طبق برنامه پیش برو.", audioUrl: "", fileName: "" },
    { text: "یک معامله خوب دیگر. فرآیند را حفظ کن.", audioUrl: "", fileName: "" },
    { text: "بسیار عالی. تمرکز خودت رو حفظ کن و اسیر طمع نشو.", audioUrl: "", fileName: "" },
    { text: "سود شیرینی بود. طبق قوانین جلو برو.", audioUrl: "", fileName: "" }
  ],
  group2: [
    { text: "اولین استاپ امروز خورد. اشکالی نداره، ضرر بخشی از سیستم است.", audioUrl: "", fileName: "" },
    { text: "یک استاپ خوردیم. عجله نکن و دنبال انتقام از بازار نباش.", audioUrl: "", fileName: "" },
    { text: "قوانین رو رعایت کن. این فقط یک معامله است و آمار کلی مهم است.", audioUrl: "", fileName: "" },
    { text: "اشتباهات رو بررسی کن و با آرامش منتظر موقعیت بعدی باش.", audioUrl: "", fileName: "" },
    { text: "خونسرد باش. به مدیریت ریسک خودت پایبند بمان.", audioUrl: "", fileName: "" }
  ],
  group3: [
    { text: "دومین استاپ هم خورد! حواست باشه، به حد ضرر روزانه نزدیک می‌شوی.", audioUrl: "", fileName: "" },
    { text: "دومین باخت امروز. لطفاً قبل از معامله بعدی چند دقیقه استراحت کن.", audioUrl: "", fileName: "" },
    { text: "تمرکزت رو از دست نده. بازار همیشه هست، سرمایه توست که باید حفظ شود.", audioUrl: "", fileName: "" },
    { text: "نفس عمیق بکش. آیا تمام شرایط استراتژی برقرار بود؟", audioUrl: "", fileName: "" },
    { text: "دو ضرر متوالی. الان وقت احتیاط و مدیریت دقیق حجم است.", audioUrl: "", fileName: "" }
  ],
  group4: [
    { text: "حد ضرر روزانه لمس شد. همین الان پلتفرم را ببند و استراحت کن.", audioUrl: "", fileName: "" },
    { text: "معاملات امروز تمام شد. قانونمند باش و سیستم را تعطیل کن.", audioUrl: "", fileName: "" },
    { text: "کاپ ترید روزانه تکمیل شد. فردا روز جدیدی است.", audioUrl: "", fileName: "" },
    { text: "بسه دیگه ترید نکن! برو بیرون قدم بزن و به بازار فکر نکن.", audioUrl: "", fileName: "" },
    { text: "آفرین که تا اینجا به قوانین پایبند بودی. فردا دوباره شروع می‌کنیم.", audioUrl: "", fileName: "" }
  ],
  group5: [
    { text: "همیشه به یاد داشته باش: ترید نکردن خودش نوعی ترید موفق است.", audioUrl: "", fileName: "" },
    { text: "هدف ما بقا در بازار است، نه ثروتمند شدن یک شبه.", audioUrl: "", fileName: "" },
    { text: "انضباط تفاوت بین یک تریدر سودده و یک تریدر بازنده است.", audioUrl: "", fileName: "" },
    { text: "هر معامله فقط یک توزیع مستقل از سود و زیان است.", audioUrl: "", fileName: "" },
    { text: "احساساتت رو کنترل کن و به استراتژی وفادار بمون.", audioUrl: "", fileName: "" }
  ]
};

interface PhaseInfo {
  phase: string;
  bgClasses: string;
  borderClasses: string;
  dotColor: string;
  titleColor: string;
  badgeBg: string;
  badgeText: string;
  iconName: 'Sparkles' | 'Crown' | 'AlertCircle' | 'Brain' | 'CloudLightning';
  iconColorClass: string;
  glowAnimationClass: string;
  text: string;
  textColorClass: string;
}

const getCurrentPhaseInfo = (winRateVal: number, combinedHistory: { isWin: boolean; isSeed: boolean }[]): PhaseInfo => {
  const last15 = combinedHistory.slice(-15);
  const shortTermWinRate = last15.length > 0
    ? (last15.filter(h => h.isWin).length / last15.length) * 100
    : winRateVal;

  if (winRateVal < 45) {
    return {
      phase: "فاز بحرانی (وینریت زیر ۴۵٪)",
      bgClasses: "bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-rose-900/10 animate-glow-red",
      borderClasses: "border-rose-500/40",
      dotColor: "bg-rose-500 animate-pulse",
      titleColor: "text-rose-400 font-extrabold animate-blink-red",
      badgeBg: "bg-rose-950/60 border-rose-500/35",
      badgeText: "text-rose-400 animate-blink-red",
      iconName: 'CloudLightning',
      iconColorClass: "text-rose-400 animate-bounce",
      glowAnimationClass: "animate-glow-red border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
      textColorClass: "text-slate-100 font-medium animate-blink-red",
      text: "سیستم در فاز بحرانی قرار دارد. این پایین‌ترین سطح وینریت در ۳ سال گذشته بوده است. در کل دوره، این حالت فقط در چند مقطع کوتاه (کمتر از ۲ هفته) رخ داده است. در این شرایط، سیستم نباید تغییر کند. وظیفه تو فقط اجرا است، آن هم با کمترین حجم ممکن. این فاز، آزمون نهایی بقای سیستم است. فقط صبر کن."
    };
  } else if (winRateVal >= 45 && winRateVal < 55) {
    if (shortTermWinRate > winRateVal) {
      return {
        phase: "فاز بازگشت (وینریت از پایین به بالا)",
        bgClasses: "bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-purple-900/10 animate-glow-purple",
        borderClasses: "border-purple-500/40",
        dotColor: "bg-purple-500 animate-pulse",
        titleColor: "text-purple-400 font-extrabold animate-blink-purple",
        badgeBg: "bg-purple-950/60 border-purple-500/35",
        badgeText: "text-purple-350 animate-blink-purple",
        iconName: 'Sparkles',
        iconColorClass: "text-purple-400 animate-pulse",
        glowAnimationClass: "animate-glow-purple border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.5)]",
        textColorClass: "text-slate-200 font-medium animate-blink-purple",
        text: "سیستم در حال خروج از فاز سرد است. بر اساس داده‌های تاریخی، بعد از هر فاز سرد، یک فاز گرم با وینریت بالای ۷۰٪ رخ داده است. میانگین زمان بازگشت ۳۰ تا ۵۰ روز بوده. تو درست در نقطه‌ای هستی که سیستم دارد فنر خود را جمع می‌کند. همینطور که هستی ادامه بده. نور در انتهای تونل است."
      };
    } else {
      return {
        phase: "فاز سرد (وینریت ۴۵-۵۵٪)",
        bgClasses: "bg-gradient-to-br from-amber-950/35 via-slate-900/80 to-amber-900/10 animate-glow-orange",
        borderClasses: "border-amber-500/30",
        dotColor: "bg-amber-500 animate-pulse",
        titleColor: "text-amber-400 font-extrabold animate-blink-orange",
        badgeBg: "bg-amber-950/60 border-amber-500/35",
        badgeText: "text-amber-400 animate-blink-orange",
        iconName: 'AlertCircle',
        iconColorClass: "text-amber-400 animate-pulse",
        glowAnimationClass: "animate-glow-orange border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
        textColorClass: "text-slate-200 font-medium animate-blink-orange",
        text: "سیستم در فاز سرد قرار دارد. این یک پدیده طبیعی و آماری است که در تمام سیستم‌های معاملاتی رخ می‌دهد. در ۳ سال گذشته، این فاز ۳ بار اتفاق افتاده و هر بار بین ۳۰ تا ۵۰ روز طول کشیده است. مهمترین قانون در این فاز: سیستم را تغییر نده. حجم را کاهش بده و فقط به اجرا ادامه بده. این فاز هم مثل دفعات قبل می‌گذرد. فقط کافی است که در آن دوام بیاوری."
      };
    }
  } else if (winRateVal >= 55 && winRateVal <= 65) {
    if (winRateVal < 58.3) {
      return {
        phase: "فاز عادی - متمایل به سرد (وینریت ۵۵-۶۵٪)",
        bgClasses: "bg-gradient-to-br from-blue-950/30 via-slate-900/80 to-slate-950/20 animate-glow-blue",
        borderClasses: "border-blue-500/35",
        dotColor: "bg-blue-400 animate-pulse",
        titleColor: "text-blue-400 font-extrabold animate-blink-blue",
        badgeBg: "bg-blue-950/60 border-blue-500/25",
        badgeText: "text-blue-300 animate-blink-blue",
        iconName: 'Brain',
        iconColorClass: "text-blue-400 animate-pulse",
        glowAnimationClass: "animate-glow-blue border-blue-500/35 shadow-[0_0_20px_rgba(59,130,246,0.45)]",
        textColorClass: "text-slate-250 font-medium animate-blink-blue",
        text: "سیستم در فاز عادی، اما در ناحیه پایینی محدوده قرار داد. این یک محدوده نوسانی طبیعی است که بر کلیت سیستم اثری ندارد. همانطور که طراحی شده، ۶۰٪ معاملات در این فاز عادی انجام می‌شود. بدون اعمال نظر شخصی، به اجرا بپرداز."
      };
    } else if (winRateVal < 61.6) {
      return {
        phase: "فاز عادی - تعادل کامل (وینریت ۵۵-۶۵٪)",
        bgClasses: "bg-gradient-to-br from-blue-950/35 via-slate-900/80 to-blue-900/10 animate-glow-blue",
        borderClasses: "border-blue-500/40",
        dotColor: "bg-blue-500 animate-pulse",
        titleColor: "text-blue-400 font-extrabold animate-blink-blue",
        badgeBg: "bg-blue-950/50 border-blue-500/20",
        badgeText: "text-blue-300 animate-blink-blue",
        iconName: 'Brain',
        iconColorClass: "text-blue-300 animate-pulse",
        glowAnimationClass: "animate-glow-blue border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
        textColorClass: "text-slate-200 font-medium animate-blink-blue",
        text: "سیستم در فاز عادی قرار دارد. این جایی است که ۶۰٪ از کل معاملات در آن رخ می‌دهد. وینریت فعلی دقیقاً در محدوده طراحی شده است. هیچ تصمیمی لازم نیست. فقط به اجرا ادامه بده. این فاز، همان فازی است که کل سیستم روی آن بنا شده. ادامه بده."
      };
    } else {
      return {
        phase: "فاز عادی - متمایل به گرم (وینریت ۵۵-۶۵٪)",
        bgClasses: "bg-gradient-to-br from-blue-950/30 via-slate-900/80 to-sky-950/20 animate-glow-blue",
        borderClasses: "border-sky-500/35",
        dotColor: "bg-sky-400 animate-pulse",
        titleColor: "text-sky-400 font-extrabold animate-blink-blue",
        badgeBg: "bg-blue-950/50 border-blue-500/20",
        badgeText: "text-sky-300 animate-blink-blue",
        iconName: 'Brain',
        iconColorClass: "text-sky-450 animate-pulse",
        glowAnimationClass: "animate-glow-blue border-sky-400/30 shadow-[0_0_20px_rgba(59,130,246,0.45)]",
        textColorClass: "text-slate-200 font-medium animate-blink-blue",
        text: "سیستم در آستانه ورود به فاز گرم قرار دارد و بازدهی صعودی است. در این محدوده، فرصت‌های بهتری در قالب روندها رخ می‌دهند. طبق چارچوب‌های سیستم، تمرکز را بالا ببر و آماده بهره‌برداری از فاز فوق‌العاده بعدی باش."
      };
    }
  } else {
    return {
      phase: "فاز گرم (وینریت بالای ۶۵٪)",
      bgClasses: "bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-emerald-900/10 animate-glow-green",
      borderClasses: "border-emerald-500/40",
      dotColor: "bg-emerald-500 animate-pulse",
      titleColor: "text-emerald-400 font-extrabold animate-blink-green",
      badgeBg: "bg-emerald-950/50 border-emerald-500/20",
      badgeText: "text-emerald-400 animate-blink-green",
      iconName: 'Crown',
      iconColorClass: "text-emerald-400 animate-pulse",
      glowAnimationClass: "animate-glow-green border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      textColorClass: "text-slate-200 font-medium animate-blink-green",
      text: "سیستم در فاز گرم قرار دارد. بازار با سیستم همراستا شده. این فازها معمولاً ۱ تا ۲ ماه طول می‌کشند و میانگین سود روزانه به ۳ تا ۵ برابر ریسک می‌رسد. حجم را طبق پلن افزایش بده. از این فرصت استفاده کن، ولی مراقب باش که این فازها همیشه موقتی هستند. اجرا کن، اما هوشیار باش."
    };
  }
};

// Global AudioContext singleton to keep audio engine active across background/lock states
let globalAudioCtx: AudioContext | null = null;

const getGlobalAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!globalAudioCtx) {
    globalAudioCtx = new AudioContextClass();
  }
  
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
};

// Global silent unlocker & WakeLock management
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getGlobalAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

const playProceduralSound = (type: 'default' | 'bell' | 'digital', volMult: number = 1) => {
  try {
    const ctx = getGlobalAudioContext();
    if (!ctx) return;
    
    if (type === 'bell') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime); // E6
      
      gainNode.gain.setValueAtTime(0.35 * volMult, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.8);
      osc2.stop(ctx.currentTime + 1.8);
    } else if (type === 'digital') {
      const playBeep = (delay: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0.2 * volMult, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      };
      playBeep(0);
      playBeep(0.2);
      playBeep(0.4);
    } else {
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.3); // C#5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.6); // E5
      
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(880, ctx.currentTime + 0.25);
      
      gainNode.gain.setValueAtTime(0.25 * volMult, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gainNode);
      oscHarmonic.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      oscHarmonic.start(ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 1.2);
      oscHarmonic.stop(ctx.currentTime + 1.2);
    }
  } catch (err) {
    console.error("Web Audio playback failed:", err);
  }
};

let currentAlarmStopFn: (() => void) | null = null;

const stopAlarmSound = () => {
  if (currentAlarmStopFn) {
    currentAlarmStopFn();
    currentAlarmStopFn = null;
  }
};

const playAlarmSound = (
  type: 'default' | 'bell' | 'digital' | 'custom',
  customBase64?: string,
  durationSeconds: number = 30,
  volumePercent: number = 80
) => {
  stopAlarmSound();

  const vol = Math.max(0, Math.min(100, volumePercent)) / 100;
  let isStopped = false;
  let timerId: any = null;
  let intervalId: any = null;
  let customAudio: HTMLAudioElement | null = null;

  const stop = () => {
    if (isStopped) return;
    isStopped = true;
    if (timerId) clearTimeout(timerId);
    if (intervalId) clearInterval(intervalId);
    if (customAudio) {
      customAudio.pause();
      customAudio.currentTime = 0;
    }
  };

  currentAlarmStopFn = stop;

  if (durationSeconds > 0) {
    timerId = setTimeout(() => {
      stop();
    }, durationSeconds * 1000);
  }

  if (type === 'custom' && customBase64) {
    try {
      customAudio = new Audio(customBase64);
      customAudio.volume = vol;
      customAudio.loop = true;
      customAudio.play().catch(err => {
        console.error("Failed custom sound playback, fallback to procedural:", err);
        playProceduralSound('default', vol);
        intervalId = setInterval(() => {
          if (!isStopped) playProceduralSound('default', vol);
        }, 1800);
      });
    } catch (e) {
      playProceduralSound('default', vol);
      intervalId = setInterval(() => {
        if (!isStopped) playProceduralSound('default', vol);
      }, 1800);
    }
  } else {
    const proceduralType = type === 'custom' ? 'default' : type;
    playProceduralSound(proceduralType, vol);
    intervalId = setInterval(() => {
      if (!isStopped) playProceduralSound(proceduralType, vol);
    }, proceduralType === 'digital' ? 800 : 1800);
  }

  return stop;
};

export default function App() {
  const generateId = () => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
    } catch (e) {}
    return Math.random().toString(36).substring(2, 11);
  };

  const [strategyMode, setStrategyMode] = useState<'channel' | 'btb'>(() => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Check if there is an active pending trade in btb
      const btbSaved = localStorage.getItem('trading_daily_state_btb');
      if (btbSaved) {
        const parsed = JSON.parse(btbSaved);
        if (parsed && parsed.date === today && Array.isArray(parsed.trades)) {
          if (parsed.trades.some((t: any) => t && t.result === 'PENDING')) {
            localStorage.setItem('trading_strategy_mode', 'btb');
            return 'btb';
          }
        }
      }
      
      // Check if there is an active pending trade in channel
      const channelSaved = localStorage.getItem('trading_daily_state_channel') || localStorage.getItem('trading_daily_state');
      if (channelSaved) {
        const parsed = JSON.parse(channelSaved);
        if (parsed && parsed.date === today && Array.isArray(parsed.trades)) {
          if (parsed.trades.some((t: any) => t && t.result === 'PENDING')) {
            localStorage.setItem('trading_strategy_mode', 'channel');
            return 'channel';
          }
        }
      }

      const saved = localStorage.getItem('trading_strategy_mode');
      if (saved === 'channel' || saved === 'btb') return saved;
    } catch (e) {}
    return 'channel';
  });

  const [dailyState, setDailyState] = useState<DailyState>(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      const key = `trading_daily_state_${mode}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as DailyState;
        if (parsed && typeof parsed === 'object' && parsed.date === today) {
          if (!Array.isArray(parsed.trades)) {
            parsed.trades = [];
          }
          return parsed;
        }
      } else if (mode === 'channel') {
        const legacySaved = localStorage.getItem('trading_daily_state');
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved) as DailyState;
          if (parsed && typeof parsed === 'object' && parsed.date === today) {
            if (!Array.isArray(parsed.trades)) {
              parsed.trades = [];
            }
            return parsed;
          }
        }
      }
    } catch (e) {}
    return { id: generateId(), date: today, trades: [] };
  });

  const pruneDailyRecords = (records: DailyState[]): DailyState[] => {
    if (!Array.isArray(records)) return [];
    
    // Separate records by strategyMode (default to 'channel' if empty)
    const channelRecords = records.filter(r => r && (r.strategyMode === 'channel' || !r.strategyMode));
    const btbRecords = records.filter(r => r && r.strategyMode === 'btb');
    
    // In each of the two modes, when they reach 50 records, start automatically deleting the oldest (slice from index 0 up to 50, since index 0 is newest)
    let prunedChannel = channelRecords;
    if (channelRecords.length > 50) {
      prunedChannel = channelRecords.slice(0, 50);
    }
    
    let prunedBtb = btbRecords;
    if (btbRecords.length > 50) {
      prunedBtb = btbRecords.slice(0, 50);
    }
    
    const prunedChannelSet = new Set(prunedChannel.map(r => r.id));
    const prunedBtbSet = new Set(prunedBtb.map(r => r.id));
    
    // Combine back keeping the original order
    let combined = records.filter(r => r && (prunedChannelSet.has(r.id) || prunedBtbSet.has(r.id)));
    
    // In the overall archive, after 100 days/records, start automatically deleting from the oldest day.
    if (combined.length > 100) {
      combined = combined.slice(0, 100);
    }
    
    return combined;
  };

  const [history, setHistory] = useState<HistoryState>(() => {
    try {
      const savedUnified = localStorage.getItem('trading_history');
      if (savedUnified) {
        const parsed = JSON.parse(savedUnified);
        if (parsed && Array.isArray(parsed.dailyRecords)) {
          // Sanitize daily records to ensure trades is always a valid array
          parsed.dailyRecords = parsed.dailyRecords.map((r: any) => ({
            ...r,
            trades: Array.isArray(r.trades) ? r.trades : []
          }));
          return { dailyRecords: pruneDailyRecords(parsed.dailyRecords) };
        }
      }
      
      // If no unified history exists, merge from both channel and btb histories
      const savedChannel = localStorage.getItem('trading_history_channel');
      const savedBtb = localStorage.getItem('trading_history_btb');
      
      let mergedRecords: DailyState[] = [];
      const seenIds = new Set<string>();

      if (savedChannel) {
        try {
          const parsed = JSON.parse(savedChannel);
          if (parsed && Array.isArray(parsed.dailyRecords)) {
            parsed.dailyRecords.forEach((rec: DailyState) => {
              const recCopy = { ...rec, strategyMode: rec.strategyMode || 'channel' };
              recCopy.trades = recCopy.trades?.map(t => ({ ...t, strategyMode: t.strategyMode || 'channel' })) || [];
              if (rec.id && !seenIds.has(rec.id)) {
                seenIds.add(rec.id);
                mergedRecords.push(recCopy);
              }
            });
          }
        } catch (e) {}
      }

      if (savedBtb) {
        try {
          const parsed = JSON.parse(savedBtb);
          if (parsed && Array.isArray(parsed.dailyRecords)) {
            parsed.dailyRecords.forEach((rec: DailyState) => {
              const recCopy = { ...rec, strategyMode: rec.strategyMode || 'btb' };
              recCopy.trades = recCopy.trades?.map(t => ({ ...t, strategyMode: t.strategyMode || 'btb' })) || [];
              if (rec.id && !seenIds.has(rec.id)) {
                seenIds.add(rec.id);
                mergedRecords.push(recCopy);
              }
            });
          }
        } catch (e) {}
      }

      if (mergedRecords.length > 0) {
        // Sort by date or archive time if needed, otherwise order of creation
        return { dailyRecords: pruneDailyRecords(mergedRecords) };
      }
    } catch (e) {}
    return { dailyRecords: [] };
  });

  const [view, setView] = useState<'welcome' | 'rules' | 'dashboard' | 'pre-trade' | 'pre-trade-warning' | 'post-trade' | 'history' | 'archive' | 'settings' | 'system-settings'>(() => {
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      
      // Check if there is an active pending trade on launch
      const today = format(new Date(), 'yyyy-MM-dd');
      const key = `trading_daily_state_${mode}`;
      const savedState = localStorage.getItem(key);
      let hasPendingTrade = false;
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && parsed.date === today && Array.isArray(parsed.trades)) {
          hasPendingTrade = parsed.trades.some((t: any) => t && t.result === 'PENDING');
        }
      } else if (mode === 'channel') {
        const legacySaved = localStorage.getItem('trading_daily_state');
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved);
          if (parsed && parsed.date === today && Array.isArray(parsed.trades)) {
            hasPendingTrade = parsed.trades.some((t: any) => t && t.result === 'PENDING');
          }
        }
      }

      if (hasPendingTrade) {
        return 'dashboard';
      }

      const saved = localStorage.getItem(`trading_view_${mode}`) || localStorage.getItem('trading_view');
      const validViews = ['welcome', 'rules', 'dashboard', 'pre-trade', 'pre-trade-warning', 'post-trade', 'history', 'archive', 'settings', 'system-settings'];
      if (saved && validViews.includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'welcome';
  });

  const [openedFrom, setOpenedFrom] = useState<'welcome' | 'mode'>(() => {
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      const saved = localStorage.getItem(`trading_view_${mode}`) || localStorage.getItem('trading_view');
      if (saved === 'welcome') return 'welcome';
      return 'mode';
    } catch (e) {
      return 'welcome';
    }
  });

  const defaultSequenceProbabilities = {
    LL: 83.33,
    WW: 65.22,
    LLW: 100,
    WLL: 50,
    LWW: 50,
    LWL: 50,
    WWL: 50,
    WLW: 50,
    LLL: 50,
    WWW: 50,
    LW: 50,
    WL: 50
  };

  const defaultPositionSizing = {
    enabled: true,
    simplified: false,
    lookback: 40,
    lowThreshold: 0.58,
    highThreshold: 0.62,
    lowRisk: 0.7,
    normalRisk: 1.0,
    highRisk: 1.2,
    seedHistoryString: "W W W L L W W L W L W L W W L W W L W L W L W W W W L L W W W L W L W L W W L W"
  };

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      const key = `trading_settings_${mode}`;
      let saved = localStorage.getItem(key);
      if (!saved && mode === 'channel') {
        saved = localStorage.getItem('trading_settings');
      }
      if (!saved && mode === 'btb') {
        saved = localStorage.getItem('trading_settings_channel') || localStorage.getItem('trading_settings');
      }
      
      let parsed: any = {};
      if (saved && saved !== 'undefined') {
        parsed = JSON.parse(saved);
      }

      // Load global settings
      let globalSaved = localStorage.getItem('trading_global_settings');
      let globalParsed: any = {};
      if (globalSaved && globalSaved !== 'undefined') {
        globalParsed = JSON.parse(globalSaved);
      }

      // Fallback search to other strategy keys if certain global settings are missing
      let resolvedAlarmSettings = globalParsed.alarmSettings !== undefined ? globalParsed.alarmSettings : parsed.alarmSettings;
      let resolvedScreenshotSettings = globalParsed.screenshotSettings !== undefined ? globalParsed.screenshotSettings : parsed.screenshotSettings;
      let resolvedAutoExcelExport = globalParsed.autoExcelExport !== undefined ? globalParsed.autoExcelExport : parsed.autoExcelExport;
      let resolvedAppLanguage = globalParsed.appLanguage !== undefined ? globalParsed.appLanguage : parsed.appLanguage;
      let resolvedAlwaysOnTop = globalParsed.alwaysOnTop !== undefined ? globalParsed.alwaysOnTop : parsed.alwaysOnTop;
      let resolvedPasscodeEnabled = globalParsed.passcodeEnabled !== undefined ? globalParsed.passcodeEnabled : parsed.passcodeEnabled;
      let resolvedPasscode = globalParsed.passcode !== undefined ? globalParsed.passcode : parsed.passcode;
      let resolvedVoicePlaybackMode = globalParsed.voicePlaybackMode !== undefined ? globalParsed.voicePlaybackMode : parsed.voicePlaybackMode;
      let resolvedVoicePlaybackVolume = globalParsed.voicePlaybackVolume !== undefined ? globalParsed.voicePlaybackVolume : parsed.voicePlaybackVolume;
      let resolvedVoiceSLMappings = globalParsed.voiceSLMappings !== undefined ? globalParsed.voiceSLMappings : parsed.voiceSLMappings;
      let resolvedVoiceTPMappings = globalParsed.voiceTPMappings !== undefined ? globalParsed.voiceTPMappings : parsed.voiceTPMappings;
      let resolvedWindowDimensions = globalParsed.windowDimensions !== undefined ? globalParsed.windowDimensions : parsed.windowDimensions;

      const keysToSearchFallback = ['trading_settings_channel', 'trading_settings_btb', 'trading_settings', 'trading_global_settings'];
      for (const k of keysToSearchFallback) {
        try {
          const val = localStorage.getItem(k);
          if (val && val !== 'undefined') {
            const p = JSON.parse(val);
            if (p) {
              if (resolvedAlarmSettings === undefined && p.alarmSettings !== undefined) resolvedAlarmSettings = p.alarmSettings;
              if (resolvedScreenshotSettings === undefined && p.screenshotSettings !== undefined) resolvedScreenshotSettings = p.screenshotSettings;
              if (resolvedAutoExcelExport === undefined && p.autoExcelExport !== undefined) resolvedAutoExcelExport = p.autoExcelExport;
              if (resolvedAppLanguage === undefined && p.appLanguage !== undefined) resolvedAppLanguage = p.appLanguage;
              if (resolvedAlwaysOnTop === undefined && p.alwaysOnTop !== undefined) resolvedAlwaysOnTop = p.alwaysOnTop;
              if (resolvedPasscodeEnabled === undefined && p.passcodeEnabled !== undefined) resolvedPasscodeEnabled = p.passcodeEnabled;
              if (resolvedPasscode === undefined && p.passcode !== undefined) resolvedPasscode = p.passcode;
              if (resolvedVoicePlaybackMode === undefined && p.voicePlaybackMode !== undefined) resolvedVoicePlaybackMode = p.voicePlaybackMode;
              if (resolvedVoicePlaybackVolume === undefined && p.voicePlaybackVolume !== undefined) resolvedVoicePlaybackVolume = p.voicePlaybackVolume;
              if (resolvedVoiceSLMappings === undefined && p.voiceSLMappings !== undefined) resolvedVoiceSLMappings = p.voiceSLMappings;
              if (resolvedVoiceTPMappings === undefined && p.voiceTPMappings !== undefined) resolvedVoiceTPMappings = p.voiceTPMappings;
              if (resolvedWindowDimensions === undefined && p.windowDimensions !== undefined) resolvedWindowDimensions = p.windowDimensions;
            }
          }
        } catch (err) {}
      }

      // Merge parsed with global parsed and fallback options
      const merged = {
        ...parsed,
        ...globalParsed,
        screenshotSettings: resolvedScreenshotSettings,
        autoExcelExport: resolvedAutoExcelExport,
        alarmSettings: resolvedAlarmSettings,
        appLanguage: resolvedAppLanguage,
        alwaysOnTop: resolvedAlwaysOnTop,
        passcodeEnabled: resolvedPasscodeEnabled,
        passcode: resolvedPasscode,
        voicePlaybackMode: resolvedVoicePlaybackMode,
        voicePlaybackVolume: resolvedVoicePlaybackVolume,
        voiceSLMappings: resolvedVoiceSLMappings,
        voiceTPMappings: resolvedVoiceTPMappings,
        windowDimensions: resolvedWindowDimensions,
      };
      
      if (saved || globalSaved || resolvedAlarmSettings !== undefined || resolvedAppLanguage !== undefined) {
        return {
          maxTradesPerDay: merged.maxTradesPerDay ?? 4,
          maxWinsPerDay: merged.maxWinsPerDay ?? 3,
          maxConsecutiveLosses: merged.maxConsecutiveLosses ?? 2,
          sequenceProbabilities: merged.sequenceProbabilities ? {
            ...defaultSequenceProbabilities,
            ...merged.sequenceProbabilities
          } : defaultSequenceProbabilities,
          positionSizing: merged.positionSizing ? {
            ...defaultPositionSizing,
            enabled: merged.positionSizing.enabled !== undefined ? merged.positionSizing.enabled : true,
            simplified: merged.positionSizing.simplified !== undefined ? merged.positionSizing.simplified : false,
            ...merged.positionSizing
          } : defaultPositionSizing,
          strategyRules: merged.strategyRules ?? STRATEGY_TIPS,
          passcodeEnabled: merged.passcodeEnabled ?? false,
          passcode: merged.passcode ?? '',
          voicePlaybackMode: merged.voicePlaybackMode ?? 'auto',
          voicePlaybackVolume: merged.voicePlaybackVolume ?? 80,
          voiceSLMappings: merged.voiceSLMappings ?? { "1": "group2", "2": "group3", "3": "group4", "4": "group4" },
          voiceTPMappings: merged.voiceTPMappings ?? { "1": "group1", "2": "group1", "3": "group5", "4": "group5" },
          appLanguage: merged.appLanguage ?? 'default',
          alwaysOnTop: merged.alwaysOnTop ?? false,
          sequenceProbabilitiesEnabled: merged.sequenceProbabilitiesEnabled !== undefined ? merged.sequenceProbabilitiesEnabled : true,
          screenshotSettings: merged.screenshotSettings ? {
            enabled: merged.screenshotSettings.enabled ?? false,
            monitorIndex: merged.screenshotSettings.monitorIndex ?? 0,
            folderPath: merged.screenshotSettings.folderPath ?? 'C:\\BtbScreenshots',
          } : {
            enabled: false,
            monitorIndex: 0,
            folderPath: 'C:\\BtbScreenshots',
          },
          autoExcelExport: merged.autoExcelExport ? {
            enabled: merged.autoExcelExport.enabled ?? false,
            folderPath: merged.autoExcelExport.folderPath ?? 'C:\\BtbExcelExports',
          } : {
            enabled: false,
            folderPath: 'C:\\BtbExcelExports',
          },
          alarmSettings: merged.alarmSettings ? {
            enabled: merged.alarmSettings.enabled ?? false,
            intervalMinutes: merged.alarmSettings.intervalMinutes ?? 15,
            intervalEnabled: merged.alarmSettings.intervalEnabled ?? false,
            customTimes: merged.alarmSettings.customTimes ?? [],
            customTimesEnabled: merged.alarmSettings.customTimesEnabled ?? false,
            customSoundBase64: merged.alarmSettings.customSoundBase64,
            customSoundName: merged.alarmSettings.customSoundName,
            selectedSoundType: merged.alarmSettings.selectedSoundType ?? 'default',
            volume: merged.alarmSettings.volume ?? 80,
            playbackSeconds: merged.alarmSettings.playbackSeconds ?? 30,
          } : {
            enabled: false,
            intervalMinutes: 15,
            intervalEnabled: false,
            customTimes: [],
            customTimesEnabled: false,
            selectedSoundType: 'default',
            volume: 80,
            playbackSeconds: 30,
          }
        };
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return {
      maxTradesPerDay: 4,
      maxWinsPerDay: 3,
      maxConsecutiveLosses: 2,
      sequenceProbabilities: defaultSequenceProbabilities,
      positionSizing: defaultPositionSizing,
      strategyRules: STRATEGY_TIPS,
      passcodeEnabled: false,
      passcode: '',
      voicePlaybackMode: 'auto',
      voicePlaybackVolume: 80,
      voiceSLMappings: { "1": "group2", "2": "group3", "3": "group4", "4": "group4" },
      voiceTPMappings: { "1": "group1", "2": "group1", "3": "group5", "4": "group5" },
      appLanguage: 'default',
      alwaysOnTop: false,
      sequenceProbabilitiesEnabled: true,
      screenshotSettings: {
        enabled: false,
        monitorIndex: 0,
        folderPath: 'C:\\BtbScreenshots',
      },
      autoExcelExport: {
        enabled: false,
        folderPath: 'C:\\BtbExcelExports',
      },
      alarmSettings: {
        enabled: false,
        intervalMinutes: 15,
        intervalEnabled: false,
        customTimes: [],
        customTimesEnabled: false,
        selectedSoundType: 'default',
        volume: 80,
        playbackSeconds: 30,
      },
      windowDimensions: {
        unfoldedWidth: 365,
        unfoldedHeight: 740,
        foldedWidth: 365,
        foldedHeight: 100,
      }
    };
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      let saved = localStorage.getItem(`trading_settings_${mode}`);
      if (!saved && mode === 'channel') {
        saved = localStorage.getItem('trading_settings');
      }
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed?.passcodeEnabled && parsed?.passcode) {
          return false;
        }
      }
    } catch (e) {}
    return true;
  });

  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [currentTradeId, setCurrentTradeId] = useState<string | null>(() => {
    try {
      const mode = localStorage.getItem('trading_strategy_mode') || 'channel';
      let saved = localStorage.getItem(`trading_current_trade_id_${mode}`);
      if (!saved && mode === 'channel') {
        saved = localStorage.getItem('trading_current_trade_id');
      }
      return saved;
    } catch (e) { return null; }
  });
  const [preTradeNotes, setPreTradeNotes] = useState('');
  const [tradeCondition, setTradeCondition] = useState<'Wide' | 'Tight' | 'Reng' | ''>('');
  const [holdingValue, setHoldingValue] = useState<'Wide' | 'Tight' | 'Reng' | null>(null);
  const holdTimerRef = useRef<any>(null);
  const [postTradeNotes, setPostTradeNotes] = useState('');
  const [tip, setTip] = useState('');
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (collapsedState: boolean) => {
    setIsCollapsed(collapsedState);
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      if (typeof api.setWindowCollapsed === 'function') {
        api.setWindowCollapsed(collapsedState, settings.windowDimensions);
      }
    }
  };
  const [newRuleText, setNewRuleText] = useState('');
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [editingRuleText, setEditingRuleText] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('12:00');

  const [voiceGroups, setVoiceGroups] = useState<typeof defaultVoiceGroups>(() => {
    try {
      const saved = localStorage.getItem('trading_voice_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const normalizeGroup = (group: any, defaultGroup: any[]) => {
            if (!Array.isArray(group)) return defaultGroup;
            return group.map((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                return {
                  text: item.text ?? (defaultGroup[idx]?.text || ""),
                  audioUrl: item.audioUrl ?? (defaultGroup[idx]?.audioUrl || ""),
                  fileName: item.fileName ?? (defaultGroup[idx]?.fileName || "")
                };
              }
              return {
                text: String(item),
                audioUrl: "",
                fileName: ""
              };
            });
          };

          return {
            group1: normalizeGroup(parsed.group1, defaultVoiceGroups.group1),
            group2: normalizeGroup(parsed.group2, defaultVoiceGroups.group2),
            group3: normalizeGroup(parsed.group3, defaultVoiceGroups.group3),
            group4: normalizeGroup(parsed.group4, defaultVoiceGroups.group4),
            group5: normalizeGroup(parsed.group5, defaultVoiceGroups.group5),
          };
        }
      }
    } catch (e) {
      console.error('Error loading voice groups:', e);
    }
    return defaultVoiceGroups;
  });

  useEffect(() => {
    try {
      localStorage.setItem('trading_voice_groups', JSON.stringify(voiceGroups));
    } catch (e) {
      console.error('Error saving voice groups:', e);
    }
  }, [voiceGroups]);

  const [limitCapUnlocked, setLimitCapUnlocked] = useState(false);
  const [sequenceProbUnlocked, setSequenceProbUnlocked] = useState(false);
  const [riskMgmtUnlocked, setRiskMgmtUnlocked] = useState(false);
  const [showWinRateOnlyWhenDisabled, setShowWinRateOnlyWhenDisabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('trading_show_win_rate_when_disabled');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });


  useEffect(() => {
    const handleOnline = () => setIsOfflineReady(false);
    const handleOffline = () => setIsOfflineReady(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      if (typeof api.setAlwaysOnTop === 'function') {
        api.setAlwaysOnTop(!!settings.alwaysOnTop);
      }
    }
  }, [settings.alwaysOnTop]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      if (typeof api.setWindowCollapsed === 'function') {
        api.setWindowCollapsed(isCollapsed, settings.windowDimensions);
      }
    }
  }, [settings.windowDimensions, isCollapsed]);

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [expandedVoiceGroup, setExpandedVoiceGroup] = useState<string | null>('group1');
  const [uploadErrorItem, setUploadErrorItem] = useState<{group: string, idx: number, message: string} | null>(null);
  const [manualInputKeys, setManualInputKeys] = useState<Record<string, boolean>>({});
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const stopSpeakText = () => {
    try {
      const audio = document.getElementById('persian-tts-audio') as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsVoicePlaying(false);
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
  };

  const speakText = (input: string | { text: string; audioUrl?: string }) => {
    if (!input) return;

    let text = '';
    let audioUrl = '';

    if (typeof input === 'object' && input !== null) {
      text = input.text || '';
      audioUrl = input.audioUrl || '';
    } else {
      text = String(input);
    }

    if (!text && !audioUrl) return;

    try {
      // 1. Try Google Translate TTS API or custom audio path using a hidden audio element with referrerpolicy='no-referrer'
      // This is crucial because Google Translate blocks requests containing non-google Referer headers with 403 Forbidden.
      let audio = document.getElementById('persian-tts-audio') as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'persian-tts-audio';
        audio.style.display = 'none';
        document.body.appendChild(audio);
      }
      
      audio.setAttribute('referrerpolicy', 'no-referrer');
      (audio as any).referrerPolicy = 'no-referrer';
      
      // Set volume
      audio.volume = (settings.voicePlaybackVolume ?? 80) / 100;

      // Event listeners to sync state
      const onPlay = () => setIsVoicePlaying(true);
      const onEndedOrError = () => {
        setIsVoicePlaying(false);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('ended', onEndedOrError);
        audio.removeEventListener('pause', onEndedOrError);
        audio.removeEventListener('error', onEndedOrError);
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('ended', onEndedOrError);
      audio.addEventListener('pause', onEndedOrError);
      audio.addEventListener('error', onEndedOrError);
      
      // If a custom audio URL/path is specified, prioritize playing that directly!
      if (audioUrl) {
        console.log('Playing custom voice audio from URL/path:', audioUrl);
        audio.src = audioUrl;
        const playPromise = audio.play();
        if (playPromise instanceof Promise) {
          playPromise.catch(err => {
            console.warn('Failed to play custom audio URL:', err);
            setIsVoicePlaying(false);
            if (err.name === 'NotAllowedError') {
              console.log('Autoplay blocked by browser. User interaction required.');
              return;
            }
            // Fallback to TTS text if custom audio playback fails
            if (text) {
              speakText(text); // Call again with just text to trigger TTS fallback
            }
          });
        }
        return;
      }

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fa&client=tw-ob&q=${encodeURIComponent(text)}`;
      audio.src = ttsUrl;
      
      const playPromise = audio.play();
      if (playPromise instanceof Promise) {
        playPromise.then(() => {
          setIsVoicePlaying(true);
          console.log('Successfully playing Persian voice via Google Translate TTS with no-referrer');
        }).catch(err => {
          setIsVoicePlaying(false);
          if (err.name === 'NotAllowedError') {
            console.log('Autoplay blocked by browser. User interaction required.');
            return;
          }
          console.warn('Google Translate TTS with client=tw-ob failed, trying client=gtx:', err);
          try {
            audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fa&client=gtx&q=${encodeURIComponent(text)}`;
            const innerPromise = audio.play();
            if (innerPromise instanceof Promise) {
              innerPromise.then(() => {
                setIsVoicePlaying(true);
                console.log('Successfully playing Persian voice via Google Translate TTS with client=gtx');
              }).catch(err2 => {
                if (err2.name === 'NotAllowedError') return;
                console.warn('Google Translate TTS (gtx) failed, falling back to Web Speech API:', err2);
                fallbackToSpeechSynthesis(text);
              });
            }
          } catch (e) {
            fallbackToSpeechSynthesis(text);
          }
        });
      } else {
        setIsVoicePlaying(true);
        console.log('Successfully started Persian voice via Google Translate TTS with no-referrer (sync/no promise)');
      }
    } catch (e) {
      console.error('Error in speakText, falling back:', e);
      fallbackToSpeechSynthesis(text);
    }
  };

  const fallbackToSpeechSynthesis = (text: string) => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = (settings.voicePlaybackVolume ?? 80) / 100;
        
        utterance.onstart = () => setIsVoicePlaying(true);
        utterance.onend = () => setIsVoicePlaying(false);
        utterance.onerror = () => setIsVoicePlaying(false);

        const voices = window.speechSynthesis.getVoices();
        const faVoice = voices.find(v => v.lang.includes('fa') || v.lang.includes('IR') || v.lang.includes('fa-IR'));
        if (faVoice) {
          utterance.voice = faVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('Error playing text-to-speech fallback:', e);
      setIsVoicePlaying(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastFiredTime, setLastFiredTime] = useState<string>('');
  const [recentAlarmTriggered, setRecentAlarmTriggered] = useState<{ time: string, type: string, ignoredAlarm?: string } | null>(null);
  const recentAlarmTriggeredRef = useRef<{ time: string, type: string, ignoredAlarm?: string } | null>(null);

  useEffect(() => {
    recentAlarmTriggeredRef.current = recentAlarmTriggered;
  }, [recentAlarmTriggered]);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
      // Check if iOS
      const ios = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);

      // Check if standalone
      const standalone = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || 
                         (typeof navigator !== 'undefined' && (navigator as any).standalone === true);
      setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstallable(false);
        }
      } catch (err) {
        console.error('Error during PWA installation prompt:', err);
      } finally {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(`trading_daily_state_${strategyMode}`, JSON.stringify(dailyState));
    if (strategyMode === 'channel') {
      localStorage.setItem('trading_daily_state', JSON.stringify(dailyState));
    }
  }, [dailyState, strategyMode]);

  useEffect(() => {
    localStorage.setItem('trading_history', JSON.stringify(history));
    localStorage.setItem(`trading_history_${strategyMode}`, JSON.stringify(history));
  }, [history, strategyMode]);

  useEffect(() => {
    localStorage.setItem(`trading_settings_${strategyMode}`, JSON.stringify(settings));
    if (strategyMode === 'channel') {
      localStorage.setItem('trading_settings', JSON.stringify(settings));
    }
    
    // Save to global settings
    const globalSettings = {
      alarmSettings: settings.alarmSettings,
      appLanguage: settings.appLanguage,
      alwaysOnTop: settings.alwaysOnTop,
      voicePlaybackMode: settings.voicePlaybackMode,
      voicePlaybackVolume: settings.voicePlaybackVolume,
      voiceSLMappings: settings.voiceSLMappings,
      voiceTPMappings: settings.voiceTPMappings,
      screenshotSettings: settings.screenshotSettings,
      autoExcelExport: settings.autoExcelExport,
      passcodeEnabled: settings.passcodeEnabled,
      passcode: settings.passcode,
      windowDimensions: settings.windowDimensions,
    };
    localStorage.setItem('trading_global_settings', JSON.stringify(globalSettings));
  }, [settings, strategyMode]);

  useEffect(() => {
    localStorage.setItem(`trading_view_${strategyMode}`, view);
    localStorage.setItem('trading_view', view);
  }, [view, strategyMode]);

  useEffect(() => {
    if (currentTradeId) {
      localStorage.setItem(`trading_current_trade_id_${strategyMode}`, currentTradeId);
      if (strategyMode === 'channel') {
        localStorage.setItem('trading_current_trade_id', currentTradeId);
      }
    } else {
      localStorage.removeItem(`trading_current_trade_id_${strategyMode}`);
      if (strategyMode === 'channel') {
        localStorage.removeItem('trading_current_trade_id');
      }
    }
  }, [currentTradeId, strategyMode]);

  useEffect(() => {
    const currentOpen = (dailyState?.trades || []).filter(t => t && t.result === 'PENDING');
    
    const otherMode = strategyMode === 'channel' ? 'btb' : 'channel';
    let otherOpenCount = 0;
    try {
      const saved = localStorage.getItem(`trading_daily_state_${otherMode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.trades)) {
          otherOpenCount = parsed.trades.filter((t: any) => t && t.result === 'PENDING').length;
        }
      }
    } catch (err) {}
    
    const hasAnyPending = currentOpen.length > 0 || otherOpenCount > 0;
    
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      if (typeof api.updateActiveTradeState === 'function') {
        api.updateActiveTradeState(hasAnyPending);
      }
    }
  }, [dailyState, strategyMode]);

  const switchStrategy = (newMode: 'channel' | 'btb', overrideView?: any) => {
    if (newMode === strategyMode) {
      if (overrideView) {
        setView(overrideView);
      }
      return;
    }

    // 1. Save current state of the old mode
    const oldMode = strategyMode;
    localStorage.setItem(`trading_view_${oldMode}`, view);
    localStorage.setItem(`trading_daily_state_${oldMode}`, JSON.stringify(dailyState));
    localStorage.setItem(`trading_history_${oldMode}`, JSON.stringify(history));
    localStorage.setItem(`trading_settings_${oldMode}`, JSON.stringify(settings));
    if (currentTradeId) {
      localStorage.setItem(`trading_current_trade_id_${oldMode}`, currentTradeId);
    } else {
      localStorage.removeItem(`trading_current_trade_id_${oldMode}`);
    }

    // 2. Load state of the new mode
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Daily State
    let newDailyState: DailyState = { id: generateId(), date: today, trades: [] };
    try {
      const saved = localStorage.getItem(`trading_daily_state_${newMode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          newDailyState = parsed;
        }
      } else if (newMode === 'channel') {
        const legacySaved = localStorage.getItem('trading_daily_state');
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved);
          if (parsed && typeof parsed === 'object') {
            newDailyState = parsed;
          }
        }
      }
      if (newDailyState && typeof newDailyState === 'object') {
        if (!Array.isArray(newDailyState.trades)) {
          newDailyState.trades = [];
        }
      } else {
        newDailyState = { id: generateId(), date: today, trades: [] };
      }
    } catch (e) {
      newDailyState = { id: generateId(), date: today, trades: [] };
    }
    
    // History (unified across modes)
    const newHistory = history;
    
    // Settings
    let newSettings: Settings = {
      maxTradesPerDay: 4,
      maxWinsPerDay: 3,
      maxConsecutiveLosses: 2,
      sequenceProbabilities: defaultSequenceProbabilities,
      positionSizing: defaultPositionSizing,
      strategyRules: STRATEGY_TIPS,
      passcodeEnabled: false,
      passcode: '',
      appLanguage: settings.appLanguage,
      alwaysOnTop: settings.alwaysOnTop,
      screenshotSettings: settings.screenshotSettings,
      sequenceProbabilitiesEnabled: settings.sequenceProbabilitiesEnabled !== undefined ? settings.sequenceProbabilitiesEnabled : true,
      alarmSettings: {
        enabled: false,
        intervalMinutes: 15,
        intervalEnabled: false,
        customTimes: [],
        customTimesEnabled: false,
        selectedSoundType: 'default',
        volume: 80,
        playbackSeconds: 30,
      },
      windowDimensions: settings.windowDimensions || {
        unfoldedWidth: 365,
        unfoldedHeight: 740,
        foldedWidth: 365,
        foldedHeight: 100,
      }
    };
    try {
      let saved = localStorage.getItem(`trading_settings_${newMode}`);
      if (!saved && newMode === 'channel') {
        saved = localStorage.getItem('trading_settings');
      }
      if (!saved && newMode === 'btb') {
        saved = localStorage.getItem('trading_settings_channel') || localStorage.getItem('trading_settings');
      }
      
      let parsed: any = {};
      if (saved && saved !== 'undefined') {
        parsed = JSON.parse(saved);
      }

      // Load global settings
      let globalSaved = localStorage.getItem('trading_global_settings');
      let globalParsed: any = {};
      if (globalSaved && globalSaved !== 'undefined') {
        globalParsed = JSON.parse(globalSaved);
      }

      // Merge
      const merged = {
        ...parsed,
        ...globalParsed,
        screenshotSettings: globalParsed.screenshotSettings !== undefined ? globalParsed.screenshotSettings : parsed.screenshotSettings,
        autoExcelExport: globalParsed.autoExcelExport !== undefined ? globalParsed.autoExcelExport : parsed.autoExcelExport,
        alarmSettings: globalParsed.alarmSettings !== undefined ? globalParsed.alarmSettings : parsed.alarmSettings,
      };

      if (saved || globalSaved) {
        newSettings = {
          maxTradesPerDay: merged.maxTradesPerDay ?? 4,
          maxWinsPerDay: merged.maxWinsPerDay ?? 3,
          maxConsecutiveLosses: merged.maxConsecutiveLosses ?? 2,
          sequenceProbabilities: merged.sequenceProbabilities ? {
            ...defaultSequenceProbabilities,
            ...merged.sequenceProbabilities
          } : defaultSequenceProbabilities,
          positionSizing: merged.positionSizing ? {
            ...defaultPositionSizing,
            enabled: merged.positionSizing.enabled !== undefined ? merged.positionSizing.enabled : true,
            simplified: merged.positionSizing.simplified !== undefined ? merged.positionSizing.simplified : false,
            ...merged.positionSizing
          } : defaultPositionSizing,
          strategyRules: merged.strategyRules ?? STRATEGY_TIPS,
          passcodeEnabled: merged.passcodeEnabled ?? false,
          passcode: merged.passcode ?? '',
          voicePlaybackMode: merged.voicePlaybackMode ?? 'auto',
          voicePlaybackVolume: merged.voicePlaybackVolume ?? 80,
          voiceSLMappings: merged.voiceSLMappings ?? { "1": "group2", "2": "group3", "3": "group4", "4": "group4" },
          voiceTPMappings: merged.voiceTPMappings ?? { "1": "group1", "2": "group1", "3": "group5", "4": "group5" },
          appLanguage: merged.appLanguage ?? settings.appLanguage ?? 'default',
          alwaysOnTop: merged.alwaysOnTop ?? settings.alwaysOnTop ?? false,
          sequenceProbabilitiesEnabled: merged.sequenceProbabilitiesEnabled !== undefined ? merged.sequenceProbabilitiesEnabled : true,
          screenshotSettings: merged.screenshotSettings ? {
            enabled: merged.screenshotSettings.enabled ?? false,
            monitorIndex: merged.screenshotSettings.monitorIndex ?? 0,
            folderPath: merged.screenshotSettings.folderPath ?? 'C:\\BtbScreenshots',
          } : {
            enabled: false,
            monitorIndex: 0,
            folderPath: 'C:\\BtbScreenshots',
          },
          autoExcelExport: merged.autoExcelExport ? {
            enabled: merged.autoExcelExport.enabled ?? false,
            folderPath: merged.autoExcelExport.folderPath ?? 'C:\\BtbExcelExports',
          } : {
            enabled: false,
            folderPath: 'C:\\BtbExcelExports',
          },
          alarmSettings: merged.alarmSettings ? {
            enabled: merged.alarmSettings.enabled ?? false,
            intervalMinutes: merged.alarmSettings.intervalMinutes ?? 15,
            intervalEnabled: merged.alarmSettings.intervalEnabled ?? false,
            customTimes: merged.alarmSettings.customTimes ?? [],
            customTimesEnabled: merged.alarmSettings.customTimesEnabled ?? false,
            customSoundBase64: merged.alarmSettings.customSoundBase64,
            customSoundName: merged.alarmSettings.customSoundName,
            selectedSoundType: merged.alarmSettings.selectedSoundType ?? 'default',
            volume: merged.alarmSettings.volume ?? 80,
            playbackSeconds: merged.alarmSettings.playbackSeconds ?? 30,
          } : {
            enabled: false,
            intervalMinutes: 15,
            intervalEnabled: false,
            customTimes: [],
            customTimesEnabled: false,
            selectedSoundType: 'default',
            volume: 80,
            playbackSeconds: 30,
          },
          windowDimensions: merged.windowDimensions ? {
            unfoldedWidth: merged.windowDimensions.unfoldedWidth ?? 365,
            unfoldedHeight: merged.windowDimensions.unfoldedHeight ?? 740,
            foldedWidth: merged.windowDimensions.foldedWidth ?? 365,
            foldedHeight: merged.windowDimensions.foldedHeight ?? 100,
          } : {
            unfoldedWidth: 365,
            unfoldedHeight: 740,
            foldedWidth: 365,
            foldedHeight: 100,
          }
        };
      } else {
        newSettings = {
          ...newSettings,
          appLanguage: settings.appLanguage,
          alwaysOnTop: settings.alwaysOnTop,
          screenshotSettings: settings.screenshotSettings,
          autoExcelExport: settings.autoExcelExport,
          alarmSettings: settings.alarmSettings,
          voicePlaybackMode: settings.voicePlaybackMode,
          voicePlaybackVolume: settings.voicePlaybackVolume,
          voiceSLMappings: settings.voiceSLMappings,
          voiceTPMappings: settings.voiceTPMappings,
          passcodeEnabled: settings.passcodeEnabled,
          passcode: settings.passcode,
          windowDimensions: settings.windowDimensions,
        };
      }
    } catch (e) {}

    // Current Trade ID
    let newTradeId: string | null = null;
    try {
      newTradeId = localStorage.getItem(`trading_current_trade_id_${newMode}`);
      if (!newTradeId && newMode === 'channel') {
        newTradeId = localStorage.getItem('trading_current_trade_id');
      }
    } catch (e) {}

    // View state
    let newView: any = 'welcome';
    try {
      if (overrideView) {
        newView = overrideView;
      } else {
        const savedView = localStorage.getItem(`trading_view_${newMode}`);
        const validViews = ['welcome', 'rules', 'dashboard', 'pre-trade', 'pre-trade-warning', 'post-trade', 'history', 'archive', 'settings', 'system-settings'];
        if (savedView && validViews.includes(savedView) && savedView !== 'welcome') {
          newView = savedView;
        } else {
          newView = 'rules';
        }
      }
    } catch (e) {}

    // Update States
    setStrategyMode(newMode);
    localStorage.setItem('trading_strategy_mode', newMode);
    
    setDailyState(newDailyState);
    setHistory(newHistory);
    setSettings(newSettings);
    setCurrentTradeId(newTradeId);

    if (newSettings.passcodeEnabled && newSettings.passcode) {
      setIsUnlocked(false);
    } else {
      setIsUnlocked(true);
    }

    if (newView === 'welcome') {
      setOpenedFrom('welcome');
    } else {
      setOpenedFrom('mode');
    }

    setView(newView);
  };

  useEffect(() => {
    localStorage.setItem('trading_show_win_rate_when_disabled', showWinRateOnlyWhenDisabled ? 'true' : 'false');
  }, [showWinRateOnlyWhenDisabled]);

  // Keep a ref of alarmSettings so we can access fresh values inside the interval without resetting it
  const alarmSettingsRef = useRef(settings.alarmSettings);
  useEffect(() => {
    alarmSettingsRef.current = settings.alarmSettings;
  }, [settings.alarmSettings]);

  // Stable dependency key based on alarm configuration values that require an interval reset
  const alarmTriggerDeps = useMemo(() => {
    const alarmSet = settings.alarmSettings;
    if (!alarmSet) return '';
    return `${alarmSet.enabled}-${alarmSet.intervalEnabled}-${alarmSet.intervalMinutes}-${alarmSet.customTimesEnabled}-${(alarmSet.customTimes || []).join(',')}`;
  }, [settings.alarmSettings]);

  // Alarm Triggering Effect
  useEffect(() => {
    const alarmSet = alarmSettingsRef.current;
    if (!alarmSet || !alarmSet.enabled) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      // Check if already fired for this minute to prevent duplicate triggers
      if (lastFiredTime === currentTimeStr) return;

      let shouldFire = false;
      let alarmType = '';

      const currentAlarmSet = alarmSettingsRef.current;
      if (!currentAlarmSet || !currentAlarmSet.enabled) return;

      // 1. Check custom specific times
      if (currentAlarmSet.customTimesEnabled && currentAlarmSet.customTimes && currentAlarmSet.customTimes.includes(currentTimeStr)) {
        shouldFire = true;
        alarmType = `ساعت مشخص شده ${currentTimeStr}`;
      }

      // 2. Check periodic intervals
      if (!shouldFire && currentAlarmSet.intervalEnabled) {
        const intervalMins = currentAlarmSet.intervalMinutes || 15;
        if (now.getMinutes() % intervalMins === 0) {
          shouldFire = true;
          alarmType = `بازه تکرار شونده ${intervalMins} دقیقه‌ای`;
        }
      }

      if (shouldFire) {
        setLastFiredTime(currentTimeStr);
        // Play the selected alarm audio sound
        playAlarmSound(
          currentAlarmSet.selectedSoundType, 
          currentAlarmSet.customSoundBase64,
          currentAlarmSet.playbackSeconds,
          currentAlarmSet.volume
        );

        // Restore window and uncollapse if collapsed when alarm triggers
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
          const api = (window as any).electronAPI;
          if (typeof api.restoreWindow === 'function') {
            api.restoreWindow();
          }
          if (typeof api.setWindowCollapsed === 'function') {
            api.setWindowCollapsed(false);
          }
        }
        setIsCollapsed(false);
        
        // Check if there was already an active alarm that was not dismissed/touched
        const previousActive = recentAlarmTriggeredRef.current;
        const ignoredTime = previousActive ? previousActive.time : undefined;

        // Trigger the visual alert banner
        setRecentAlarmTriggered({
          time: currentTimeStr,
          type: alarmType,
          ignoredAlarm: ignoredTime
        });
      }
    }, 1000); // Check every second for extreme timing precision

    return () => clearInterval(intervalId);
  }, [alarmTriggerDeps, lastFiredTime]);

  const checkPasscode = (code: string) => {
    const normalizedEntered = code
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    
    const normalizedSetting = (settings.passcode || '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    if (normalizedEntered === normalizedSetting) {
      setPasscodeError(false);
      setIsUnlocked(true);
    } else {
      setPasscodeError(true);
      setEnteredPasscode('');
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  const handleKeypadPress = (num: string) => {
    setPasscodeError(false);
    setEnteredPasscode(prev => {
      if (prev.length >= 4) return prev;
      const next = prev + num;
      if (next.length === 4) {
        setTimeout(() => checkPasscode(next), 100);
      }
      return next;
    });
  };

  const handleKeypadDelete = () => {
    setPasscodeError(false);
    setEnteredPasscode(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPasscodeError(false);
    setEnteredPasscode('');
  };

  useEffect(() => {
    // If running in Electron, the main process's window 'close' listener handles confirmation.
    // We must NOT intercept beforeunload here, otherwise it conflicts and prevents closing.
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentOpen = (dailyState?.trades || []).filter(t => t && t.result === 'PENDING');
      const currentModeName = strategyMode === 'btb' ? 'BTB' : 'Channel';
      
      const otherMode = strategyMode === 'channel' ? 'btb' : 'channel';
      let otherOpenCount = 0;
      try {
        const saved = localStorage.getItem(`trading_daily_state_${otherMode}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.trades)) {
            otherOpenCount = parsed.trades.filter((t: any) => t && t.result === 'PENDING').length;
          }
        }
      } catch (err) {}
      
      if (currentOpen.length > 0 || otherOpenCount > 0) {
        const modeDetailsList: string[] = [];
        if (currentOpen.length > 0) {
          modeDetailsList.push(`${currentModeName} (${currentOpen.length} open trade${currentOpen.length > 1 ? 's' : ''})`);
        }
        if (otherOpenCount > 0) {
          modeDetailsList.push(`${otherMode === 'btb' ? 'BTB' : 'Channel'} (${otherOpenCount} open trade${otherOpenCount > 1 ? 's' : ''})`);
        }
        
        const detailsStr = modeDetailsList.join(' and ');
        const message = `You have active open trades in: ${detailsStr}! Are you sure you want to exit?`;
        
        // CRITICAL ELECTRON FIX:
        // Set active trade state to false in the main process before showing the confirm dialog.
        // If the user clicks "Leave/Yes", the main process will not intercept and block the exit.
        // If they click "Cancel/No", any subsequent state change or render will restore it to true.
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
          const api = (window as any).electronAPI;
          if (typeof api.updateActiveTradeState === 'function') {
            api.updateActiveTradeState(false);
          }
        }
        
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dailyState, strategyMode]);

  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9۰-۹]$/.test(e.key)) {
        const char = e.key
          .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        setEnteredPasscode(prev => {
          if (prev.length >= 4) return prev;
          const next = prev + char;
          if (next.length === 4) {
            checkPasscode(next);
          }
          return next;
        });
      } else if (e.key === 'Backspace') {
        setEnteredPasscode(prev => prev.slice(0, -1));
        setPasscodeError(false);
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        setEnteredPasscode('');
        setPasscodeError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, settings.passcode]);

  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(v => cleanUndefined(v)).filter(v => v !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          if (val !== undefined) {
            cleaned[key] = cleanUndefined(val);
          }
        }
      }
      return cleaned;
    }
    return obj;
  };


  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [fullBackupStatus, setFullBackupStatus] = useState<{ success: boolean; message: string } | null>(null);

  const exportFullBackup = () => {
    try {
      const keys = [
        'trading_strategy_mode',
        'trading_history',
        'trading_history_channel',
        'trading_history_btb',
        'trading_settings_channel',
        'trading_settings_btb',
        'trading_daily_state_channel',
        'trading_daily_state_btb',
        'trading_view_channel',
        'trading_view_btb',
        'trading_view',
        'trading_current_trade_id_channel',
        'trading_current_trade_id_btb',
        'trading_current_trade_id',
        'trading_show_win_rate_when_disabled',
        'trading_settings',
        'trading_daily_state',
        'trading_voice_groups',
        'trading_global_settings'
      ];
      const payload: Record<string, string | null> = {};
      keys.forEach(key => {
        payload[key] = localStorage.getItem(key);
      });

      const backupData = {
        backupType: 'super_full_trading_assistant_backup',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        payload
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading_assistant_full_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('خطا در خروجی گرفتن از نسخه پشتیبان کامل');
    }
  };

  const importFullBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          parsed.backupType === 'super_full_trading_assistant_backup' &&
          parsed.payload &&
          typeof parsed.payload === 'object'
        ) {
          const payload = parsed.payload;
          Object.keys(payload).forEach(key => {
            const val = payload[key];
            if (val !== null && val !== undefined) {
              localStorage.setItem(key, val);
            } else {
              localStorage.removeItem(key);
            }
          });

          setFullBackupStatus({ 
            success: true, 
            message: 'پشتیبان کامل سیستم (تنظیمات هر دو مد، آلارم و تاریخچه آرشیوها) با موفقیت بازیابی شد. صفحه تا ۳ ثانیه دیگر بارگذاری مجدد می‌شود.' 
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else if (
          typeof parsed === 'object' &&
          parsed !== null &&
          parsed.backupType === 'combined_trading_assistant_backup'
        ) {
          if (parsed.history) localStorage.setItem('trading_history', JSON.stringify(parsed.history));
          if (parsed.settings_channel) localStorage.setItem('trading_settings_channel', JSON.stringify(parsed.settings_channel));
          if (parsed.settings_btb) localStorage.setItem('trading_settings_btb', JSON.stringify(parsed.settings_btb));
          if (parsed.daily_state_channel) localStorage.setItem('trading_daily_state_channel', JSON.stringify(parsed.daily_state_channel));
          if (parsed.daily_state_btb) localStorage.setItem('trading_daily_state_btb', JSON.stringify(parsed.daily_state_btb));
          if (parsed.view_channel) localStorage.setItem('trading_view_channel', parsed.view_channel);
          if (parsed.view_btb) localStorage.setItem('trading_view_btb', parsed.view_btb);
          if (parsed.activeStrategyMode) localStorage.setItem('trading_strategy_mode', parsed.activeStrategyMode);
          
          setFullBackupStatus({ 
            success: true, 
            message: 'پشتیبان با موفقیت بازیابی شد. در حال بارگذاری مجدد صفحه...' 
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setFullBackupStatus({ success: false, message: 'ساختار فایل پشتیبان معتبر نیست. لطفاً فایل پشتیبان کامل سیستم را انتخاب کنید.' });
          setTimeout(() => setFullBackupStatus(null), 6000);
        }
      } catch (err) {
        setFullBackupStatus({ success: false, message: 'خطا در خواندن یا پردازش فایل پشتیبان.' });
        setTimeout(() => setFullBackupStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportSettings = () => {
    try {
      const settingsChannelStr = localStorage.getItem('trading_settings_channel') || (strategyMode === 'channel' ? JSON.stringify(settings) : null);
      const settingsBtbStr = localStorage.getItem('trading_settings_btb') || (strategyMode === 'btb' ? JSON.stringify(settings) : null);
      const dailyStateChannelStr = localStorage.getItem('trading_daily_state_channel') || (strategyMode === 'channel' ? JSON.stringify(dailyState) : null);
      const dailyStateBtbStr = localStorage.getItem('trading_daily_state_btb') || (strategyMode === 'btb' ? JSON.stringify(dailyState) : null);
      const viewChannel = localStorage.getItem('trading_view_channel') || (strategyMode === 'channel' ? view : 'welcome');
      const viewBtb = localStorage.getItem('trading_view_btb') || (strategyMode === 'btb' ? view : 'welcome');

      const backupData = {
        backupType: 'combined_trading_assistant_backup',
        backupVersion: 2,
        exportedAt: new Date().toISOString(),
        activeStrategyMode: strategyMode,
        history: history, // Unified history

        // Both modes' specific states
        settings_channel: settingsChannelStr ? JSON.parse(settingsChannelStr) : null,
        settings_btb: settingsBtbStr ? JSON.parse(settingsBtbStr) : null,
        daily_state_channel: dailyStateChannelStr ? JSON.parse(dailyStateChannelStr) : null,
        daily_state_btb: dailyStateBtbStr ? JSON.parse(dailyStateBtbStr) : null,
        view_channel: viewChannel,
        view_btb: viewBtb,

        // For legacy fallback
        settings: settings,
        dailyState: dailyState
      };
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading_full_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error exporting full backup');
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        
        let settingsToLoad: Settings | null = null;
        let historyToLoad: HistoryState | null = null;
        let dailyStateToLoad: DailyState | null = null;
        let isCombined = false;

        // Check if combined format
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          (parsed.backupType === 'combined_trading_assistant_backup' || 
           (parsed.settings && (parsed.history || parsed.dailyState)))
        ) {
          isCombined = true;
          
          // Unpack mode-specific keys if they exist (BackupVersion 2+)
          if (parsed.backupVersion === 2 || parsed.settings_channel || parsed.settings_btb) {
            if (parsed.settings_channel) {
              localStorage.setItem('trading_settings_channel', JSON.stringify(parsed.settings_channel));
              if (strategyMode === 'channel') {
                localStorage.setItem('trading_settings', JSON.stringify(parsed.settings_channel));
              }
            }
            if (parsed.settings_btb) {
              localStorage.setItem('trading_settings_btb', JSON.stringify(parsed.settings_btb));
            }
            if (parsed.daily_state_channel) {
              localStorage.setItem('trading_daily_state_channel', JSON.stringify(parsed.daily_state_channel));
              if (strategyMode === 'channel') {
                localStorage.setItem('trading_daily_state', JSON.stringify(parsed.daily_state_channel));
              }
            }
            if (parsed.daily_state_btb) {
              localStorage.setItem('trading_daily_state_btb', JSON.stringify(parsed.daily_state_btb));
            }
            if (parsed.view_channel) {
              localStorage.setItem('trading_view_channel', parsed.view_channel);
              if (strategyMode === 'channel') {
                localStorage.setItem('trading_view', parsed.view_channel);
              }
            }
            if (parsed.view_btb) {
              localStorage.setItem('trading_view_btb', parsed.view_btb);
              if (strategyMode === 'btb') {
                localStorage.setItem('trading_view', parsed.view_btb);
              }
            }
            
            // Set active states
            if (strategyMode === 'channel' && parsed.settings_channel) {
              settingsToLoad = parsed.settings_channel;
            } else if (strategyMode === 'btb' && parsed.settings_btb) {
              settingsToLoad = parsed.settings_btb;
            } else {
              settingsToLoad = parsed.settings;
            }

            if (strategyMode === 'channel' && parsed.daily_state_channel) {
              dailyStateToLoad = parsed.daily_state_channel;
            } else if (strategyMode === 'btb' && parsed.daily_state_btb) {
              dailyStateToLoad = parsed.daily_state_btb;
            } else {
              dailyStateToLoad = parsed.dailyState;
            }

            if (strategyMode === 'channel' && parsed.view_channel) {
              setView(parsed.view_channel);
            } else if (strategyMode === 'btb' && parsed.view_btb) {
              setView(parsed.view_btb);
            }
          } else {
            settingsToLoad = parsed.settings;
            dailyStateToLoad = parsed.dailyState;
          }
          
          historyToLoad = parsed.history;
        } else {
          // Fallback to legacy format (just a settings object)
          settingsToLoad = parsed;
        }

        // Validation of basic settings
        if (
          typeof settingsToLoad === 'object' &&
          settingsToLoad !== null &&
          (typeof settingsToLoad.maxTradesPerDay === 'number' ||
           typeof settingsToLoad.maxWinsPerDay === 'number' ||
           typeof settingsToLoad.maxConsecutiveLosses === 'number')
        ) {
          const validatedSettings: Settings = {
            maxTradesPerDay: typeof settingsToLoad.maxTradesPerDay === 'number' ? settingsToLoad.maxTradesPerDay : settings.maxTradesPerDay,
            maxWinsPerDay: typeof settingsToLoad.maxWinsPerDay === 'number' ? settingsToLoad.maxWinsPerDay : settings.maxWinsPerDay,
            maxConsecutiveLosses: typeof settingsToLoad.maxConsecutiveLosses === 'number' ? settingsToLoad.maxConsecutiveLosses : settings.maxConsecutiveLosses,
            sequenceProbabilities: typeof settingsToLoad.sequenceProbabilities === 'object' && settingsToLoad.sequenceProbabilities !== null
              ? { ...settings.sequenceProbabilities, ...settingsToLoad.sequenceProbabilities }
              : settings.sequenceProbabilities,
            positionSizing: typeof settingsToLoad.positionSizing === 'object' && settingsToLoad.positionSizing !== null
              ? {
                  lookback: typeof settingsToLoad.positionSizing.lookback === 'number' ? settingsToLoad.positionSizing.lookback : defaultPositionSizing.lookback,
                  lowThreshold: typeof settingsToLoad.positionSizing.lowThreshold === 'number' ? settingsToLoad.positionSizing.lowThreshold : defaultPositionSizing.lowThreshold,
                  highThreshold: typeof settingsToLoad.positionSizing.highThreshold === 'number' ? settingsToLoad.positionSizing.highThreshold : defaultPositionSizing.highThreshold,
                  lowRisk: typeof settingsToLoad.positionSizing.lowRisk === 'number' ? settingsToLoad.positionSizing.lowRisk : defaultPositionSizing.lowRisk,
                  normalRisk: typeof settingsToLoad.positionSizing.normalRisk === 'number' ? settingsToLoad.positionSizing.normalRisk : defaultPositionSizing.normalRisk,
                  highRisk: typeof settingsToLoad.positionSizing.highRisk === 'number' ? settingsToLoad.positionSizing.highRisk : defaultPositionSizing.highRisk,
                  seedHistoryString: typeof settingsToLoad.positionSizing.seedHistoryString === 'string' ? settingsToLoad.positionSizing.seedHistoryString : defaultPositionSizing.seedHistoryString,
                  enabled: settingsToLoad.positionSizing.enabled !== undefined ? settingsToLoad.positionSizing.enabled : (settings.positionSizing?.enabled ?? true),
                  simplified: settingsToLoad.positionSizing.simplified !== undefined ? settingsToLoad.positionSizing.simplified : (settings.positionSizing?.simplified ?? false),
                }
              : settings.positionSizing,
            strategyRules: Array.isArray(settingsToLoad.strategyRules) ? settingsToLoad.strategyRules : (settings.strategyRules ?? STRATEGY_TIPS),
            voicePlaybackMode: settingsToLoad.voicePlaybackMode ?? settings.voicePlaybackMode ?? 'auto',
            voicePlaybackVolume: settingsToLoad.voicePlaybackVolume ?? settings.voicePlaybackVolume ?? 80,
            voiceSLMappings: settingsToLoad.voiceSLMappings ?? settings.voiceSLMappings ?? { "1": "group2", "2": "group3", "3": "group4", "4": "group4" },
            voiceTPMappings: settingsToLoad.voiceTPMappings ?? settings.voiceTPMappings ?? { "1": "group1", "2": "group1", "3": "group5", "4": "group5" },
            alarmSettings: settingsToLoad.alarmSettings ? {
              enabled: !!settingsToLoad.alarmSettings.enabled,
              intervalMinutes: typeof settingsToLoad.alarmSettings.intervalMinutes === 'number' ? settingsToLoad.alarmSettings.intervalMinutes : 15,
              intervalEnabled: !!settingsToLoad.alarmSettings.intervalEnabled,
              customTimes: Array.isArray(settingsToLoad.alarmSettings.customTimes) ? settingsToLoad.alarmSettings.customTimes : [],
              customTimesEnabled: !!settingsToLoad.alarmSettings.customTimesEnabled,
              customSoundBase64: settingsToLoad.alarmSettings.customSoundBase64,
              customSoundName: settingsToLoad.alarmSettings.customSoundName,
              selectedSoundType: settingsToLoad.alarmSettings.selectedSoundType ?? 'default',
            } : settings.alarmSettings
          };

          setSettings(validatedSettings);

          // Handle history if exists
          if (historyToLoad && Array.isArray(historyToLoad.dailyRecords)) {
            setHistory({ dailyRecords: pruneDailyRecords(historyToLoad.dailyRecords) });
          }

          // Handle daily state if exists
          if (dailyStateToLoad && typeof dailyStateToLoad === 'object' && Array.isArray(dailyStateToLoad.trades)) {
            setDailyState(dailyStateToLoad);
          }

          if (isCombined) {
            setImportStatus({ success: true, message: 'پشتیبان کامل (تنظیمات + آرشیو معاملات) با موفقیت بازیابی شد.' });
          } else {
            setImportStatus({ success: true, message: 'تنظیمات (فایل قدیمی) با موفقیت بازیابی شد.' });
          }
          
          setTimeout(() => setImportStatus(null), 6000);
        } else {
          setImportStatus({ success: false, message: 'ساختار فایل پشتیبان معتبر نیست.' });
          setTimeout(() => setImportStatus(null), 6000);
        }
      } catch (err) {
        setImportStatus({ success: false, message: 'خطا در خواندن یا پردازش فایل پشتیبان.' });
        setTimeout(() => setImportStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const generateTradesCSVString = (): string => {
    const allTrades: {
      id: string;
      timestamp: number;
      date: string;
      sessionType: string;
      result: string;
      tradeCondition: string;
      preNotes: string;
      postNotes: string;
      strategyMode: string;
    }[] = [];

    if (dailyState && Array.isArray(dailyState.trades)) {
      dailyState.trades.forEach(t => {
        if (!t) return;
        allTrades.push({
          id: t.id || '',
          timestamp: t.timestamp,
          date: dailyState.date,
          sessionType: 'Active',
          result: t.result,
          tradeCondition: t.tradeCondition || '',
          preNotes: t.preTradeNotes || '',
          postNotes: t.postTradeNotes || '',
          strategyMode: t.strategyMode || strategyMode
        });
      });
    }

    if (history && Array.isArray(history.dailyRecords)) {
      history.dailyRecords.forEach(record => {
        if (!record) return;
        if (Array.isArray(record.trades)) {
          record.trades.forEach(t => {
            if (!t) return;
            allTrades.push({
              id: t.id || '',
              timestamp: t.timestamp,
              date: record.date,
              sessionType: 'Archived',
              result: t.result,
              tradeCondition: t.tradeCondition || '',
              preNotes: t.preTradeNotes || '',
              postNotes: t.postTradeNotes || '',
              strategyMode: t.strategyMode || record.strategyMode || 'channel'
            });
          });
        }
      });
    }

    allTrades.sort((a, b) => a.timestamp - b.timestamp);

    const headers = [
      'Row',
      'Trade ID',
      'Strategy',
      'Date',
      'Time',
      'Session Type',
      'Result',
      'Market Condition',
      'Pre-Trade Notes',
      'Post-Trade Notes'
    ];

    const csvRows = [headers.join(',')];

    allTrades.forEach((t, index) => {
      const timeStr = format(t.timestamp, 'HH:mm:ss');
      
      let resultEng = 'PENDING';
      if (t.result === 'TP') resultEng = 'TP';
      if (t.result === 'SL') resultEng = 'SL';

      let conditionEng = 'None';
      if (t.tradeCondition === 'Wide') {
        conditionEng = t.strategyMode === 'btb' ? 'FL' : 'Wide';
      } else if (t.tradeCondition === 'Tight') {
        conditionEng = t.strategyMode === 'btb' ? 'Shadow' : 'Tight';
      } else if (t.tradeCondition === 'Reng') {
        conditionEng = 'Reng';
      }

      const cleanField = (str: string) => {
        if (!str) return '""';
        const escaped = str.replace(/"/g, '""').replace(/\r?\n/g, ' ');
        return `"${escaped}"`;
      };

      const row = [
        index + 1,
        cleanField(t.id),
        cleanField(t.strategyMode === 'btb' ? 'BTB' : 'Channel'),
        cleanField(t.date),
        cleanField(timeStr),
        cleanField(t.sessionType),
        cleanField(resultEng),
        cleanField(conditionEng),
        cleanField(t.preNotes),
        cleanField(t.postNotes)
      ];

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const performAutoExcelExport = async () => {
    const folderPath = settings.autoExcelExport?.folderPath || 'C:\\BtbExcelExports';
    const today = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Archive_${today}.csv`;
    const csvString = generateTradesCSVString();
    
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      if (typeof api.saveExcelFile === 'function') {
        const result = await api.saveExcelFile({ folderPath, fileName, csvContent: csvString });
        if (result && result.success) {
          console.log(`Auto Excel export saved successfully to ${result.path}`);
        } else {
          console.error(`Auto Excel export failed: ${result?.error}`);
        }
      }
    } else {
      console.log(`[Web simulation] Auto-exported Excel (CSV) to folder: ${folderPath} with name: ${fileName}`);
    }
  };

  const triggerAutoExcelExportIfNeeded = (currentDailyStateAfterUpdate?: DailyState) => {
    if (!settings.autoExcelExport?.enabled) return;
    
    const activeDailyState = currentDailyStateAfterUpdate || dailyState;
    const currentPending = (activeDailyState?.trades || []).filter(t => t.result === 'PENDING');
    
    const otherMode = strategyMode === 'channel' ? 'btb' : 'channel';
    let otherPending: any[] = [];
    try {
      const saved = localStorage.getItem(`trading_daily_state_${otherMode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.trades)) {
          otherPending = parsed.trades.filter((t: any) => t.result === 'PENDING');
        }
      }
    } catch (e) {}
    
    if (currentPending.length === 0 && otherPending.length === 0) {
      performAutoExcelExport();
    }
  };

  const exportTradesCSV = () => {
    try {
      const csvString = generateTradesCSVString();
      const UTF8_BOM = '\uFEFF';
      const blob = new Blob([UTF8_BOM + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading_trades_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error exporting CSV report');
    }
  };

  const importTradesCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const cleanText = text.replace(/^\uFEFF/, '');
        
        // Custom simple yet robust CSV line parser taking quotes into account
        let line = '';
        let inQuotes = false;
        const chars = cleanText.split('');
        const lines: string[] = [];
        
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          if (char === '"') {
            inQuotes = !inQuotes;
            line += char;
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (line.trim().length > 0 || char === '\n') {
              lines.push(line);
            }
            line = '';
          } else {
            line += char;
          }
        }
        if (line.trim().length > 0) {
          lines.push(line);
        }

        const parsedRows = lines.map(l => {
          const fields: string[] = [];
          let currentField = '';
          let insideQuotes = false;
          for (let i = 0; i < l.length; i++) {
            const c = l[i];
            if (c === '"') {
              if (insideQuotes && l[i+1] === '"') {
                currentField += '"';
                i++;
              } else {
                insideQuotes = !insideQuotes;
              }
            } else if (c === ',' && !insideQuotes) {
              fields.push(currentField.trim());
              currentField = '';
            } else {
              currentField += c;
            }
          }
          fields.push(currentField.trim());
          return fields;
        });

        if (parsedRows.length < 2) {
          setImportStatus({ success: false, message: 'Invalid CSV format (no rows found).' });
          setTimeout(() => setImportStatus(null), 6000);
          return;
        }

        const headers = parsedRows[0].map(h => h.toLowerCase());
        
        const getIdx = (keywords: string[], defaultIdx: number) => {
          const found = headers.findIndex(h => keywords.some(kw => h.includes(kw)));
          return found !== -1 ? found : defaultIdx;
        };

        const idIdx = getIdx(['شناسه', 'id', 'identity'], 1);
        const dateIdx = getIdx(['تاریخ', 'date', 'day'], 2);
        const timeIdx = getIdx(['ساعت', 'time', 'clock'], 3);
        const sessionIdx = getIdx(['وضعیت معامله', 'وضعیت', 'session', 'type'], 4);
        const resultIdx = getIdx(['نتیجه', 'result', 'outcome'], 5);
        const condIdx = getIdx(['موقعیت', 'condition', 'market'], 6);
        const preIdx = getIdx(['بیش از', 'قبل', 'pre', 'notes'], 7);
        const postIdx = getIdx(['پس از', 'بعد', 'post', 'notes'], 8);

        const tradesByDate: { [date: string]: Trade[] } = {};

        for (let idx = 1; idx < parsedRows.length; idx++) {
          const row = parsedRows[idx];
          if (row.length < 3 || !row[idIdx]) continue;

          const rawId = row[idIdx].replace(/^"|"$/g, '').trim();
          const id = rawId || Math.random().toString(36).substring(2, 11);
          
          let dateStr = row[dateIdx] ? row[dateIdx].replace(/^"|"$/g, '').trim() : '';
          if (!dateStr) {
            dateStr = format(new Date(), 'yyyy-MM-dd');
          }
          
          const timeStr = row[timeIdx] ? row[timeIdx].replace(/^"|"$/g, '').trim() : '12:00:00';
          
          let resultValue: TradeResult = 'PENDING';
          const rText = (row[resultIdx] || '').toUpperCase();
          if (rText.includes('TP') || rText.includes('سود') || rText.includes('برد') || rText.includes('WIN') || rText.includes('SUCCESS') || rText === 'ص') {
            resultValue = 'TP';
          } else if (rText.includes('SL') || rText.includes('ضرر') || rText.includes('باخت') || rText.includes('LOSS') || rText === 'ض') {
            resultValue = 'SL';
          }

          let condValue: 'Wide' | 'Tight' | 'Reng' | '' = '';
          const cText = (row[condIdx] || '').toLowerCase();
          if (cText.includes('wide') || cText.includes('عریض') || cText.includes('واید')) {
            condValue = 'Wide';
          } else if (cText.includes('tight') || cText.includes('تنگ')) {
            condValue = 'Tight';
          } else if (cText.includes('reng') || cText.includes('رنج') || cText.includes('range')) {
            condValue = 'Reng';
          }

          const preTradeNotesVal = row[preIdx] ? row[preIdx].replace(/^"|"$/g, '').trim() : '';
          const postTradeNotesVal = row[postIdx] ? row[postIdx].replace(/^"|"$/g, '').trim() : '';

          let timestamp = Date.now();
          try {
            const combinedString = `${dateStr}T${timeStr}`;
            const parsedTime = Date.parse(combinedString);
            if (!isNaN(parsedTime)) {
              timestamp = parsedTime;
            } else {
              const fallbackParsed = Date.parse(dateStr);
              if (!isNaN(fallbackParsed)) {
                timestamp = fallbackParsed;
              }
            }
          } catch(err) {}

          const tradeObj: Trade = {
            id,
            timestamp,
            tradeCondition: condValue,
            result: resultValue,
            preTradeNotes: preTradeNotesVal,
            ...(postTradeNotesVal ? { postTradeNotes: postTradeNotesVal } : {})
          };

          if (!tradesByDate[dateStr]) {
            tradesByDate[dateStr] = [];
          }
          tradesByDate[dateStr].push(tradeObj);
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let updatedDailyState = { ...dailyState };
        const updatedHistoryRecords = [...(history?.dailyRecords || [])];

        Object.keys(tradesByDate).forEach(date => {
          const importedTrades = tradesByDate[date];
          
          if (date === todayStr) {
            const currentTrades = [...(updatedDailyState?.trades || [])];
            importedTrades.forEach(imported => {
              const dupIdx = currentTrades.findIndex(c => c.id === imported.id);
              if (dupIdx !== -1) {
                currentTrades[dupIdx] = imported;
              } else {
                currentTrades.push(imported);
              }
            });
            currentTrades.sort((a, b) => a.timestamp - b.timestamp);
            updatedDailyState = { ...updatedDailyState, trades: currentTrades };
          } else {
            const dateRecordIdx = updatedHistoryRecords.findIndex(r => r && r.date === date);
            if (dateRecordIdx !== -1) {
              const existingTrades = [...(updatedHistoryRecords[dateRecordIdx]?.trades || [])];
              importedTrades.forEach(imported => {
                const dupIdx = existingTrades.findIndex(c => c.id === imported.id);
                if (dupIdx !== -1) {
                  existingTrades[dupIdx] = imported;
                } else {
                  existingTrades.push(imported);
                }
              });
              existingTrades.sort((a, b) => a.timestamp - b.timestamp);
              updatedHistoryRecords[dateRecordIdx] = {
                ...updatedHistoryRecords[dateRecordIdx],
                trades: existingTrades
              };
            } else {
              updatedHistoryRecords.push({
                id: Math.random().toString(36).substring(2, 11),
                date,
                trades: importedTrades.sort((a, b) => a.timestamp - b.timestamp)
              });
            }
          }
        });

        updatedHistoryRecords.sort((a, b) => {
          if (!a || !a.date) return 1;
          if (!b || !b.date) return -1;
          return b.date.localeCompare(a.date);
        });

        setDailyState(updatedDailyState);
        setHistory({ dailyRecords: updatedHistoryRecords });

        setImportStatus({ success: true, message: 'Trades CSV imported and merged successfully!' });
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err) {
        setImportStatus({ success: false, message: 'Failed to import trades. Please ensure valid CSV structure.' });
        setTimeout(() => setImportStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const trades = (dailyState?.trades || []).filter(t => t && typeof t === 'object');
  const completedTrades = trades.filter(t => t && t.result !== 'PENDING');
  const winCount = completedTrades.filter(t => t && t.result === 'TP').length;
  const lossCount = completedTrades.filter(t => t && t.result === 'SL').length;

  const consecutiveLossesCount = (() => {
    let count = 0;
    for (let i = completedTrades.length - 1; i >= 0; i--) {
      if (completedTrades[i].result === 'SL') {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  const consecutiveWinsCount = (() => {
    let count = 0;
    for (let i = completedTrades.length - 1; i >= 0; i--) {
      if (completedTrades[i].result === 'TP') {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  const hasActivePendingTrade = trades.some(t => t.result === 'PENDING');

  const isBossBlocked = !hasActivePendingTrade && (
    (completedTrades.length >= settings.maxTradesPerDay && winCount >= 1) ||
    (consecutiveLossesCount >= settings.maxConsecutiveLosses) ||
    (consecutiveWinsCount >= settings.maxWinsPerDay)
  );

  // Rule Checks
  const isMaxTradesReached = trades.length >= settings.maxTradesPerDay;
  const isMaxWinsReached = winCount >= settings.maxWinsPerDay;
  
  const checkConsecutiveLosses = () => {
    if (completedTrades.length < settings.maxConsecutiveLosses) return false;
    const lastN = completedTrades.slice(-settings.maxConsecutiveLosses);
    const areLastNSL = lastN.every(t => t.result === 'SL');
    
    // Original logic: If you have at least one win, you can continue even after consecutive losses.
    // However, if the user defines a stop rule, maybe we should respect it strictly or keep the "win protection"
    // For now, let's keep the win protection: only block if winCount is 0 AND consecutive losses reached.
    return areLastNSL && winCount === 0;
  };
  const isConsecutiveLosses = checkConsecutiveLosses();

  // 1. Memoize completed app trades list
  const completedAppTrades = useMemo((): boolean[] => {
    const list: boolean[] = [];
    if (history && Array.isArray(history.dailyRecords)) {
      const cronRecords = [...history.dailyRecords].reverse();
      for (const rec of cronRecords) {
        if (rec && rec.trades && Array.isArray(rec.trades)) {
          for (const t of rec.trades) {
            if (t && t.result === 'TP') list.push(true);
            else if (t && t.result === 'SL') list.push(false);
          }
        }
      }
    }
    if (dailyState && Array.isArray(dailyState.trades)) {
      for (const t of dailyState.trades) {
        if (t && t.result === 'TP') list.push(true);
        else if (t && t.result === 'SL') list.push(false);
      }
    }
    return list;
  }, [history?.dailyRecords, dailyState?.trades]);

  const getCompletedAppTrades = (): boolean[] => completedAppTrades;

  // 2. Memoize combined trade history with seed history
  const combinedTradeHistory = useMemo((): { isWin: boolean; isSeed: boolean }[] => {
    const appTrades = completedAppTrades.map(isWin => ({ isWin, isSeed: false }));
    const seedString = String(settings.positionSizing?.seedHistoryString !== undefined 
      ? settings.positionSizing.seedHistoryString 
      : defaultPositionSizing.seedHistoryString);
      
    let seedTrades: { isWin: boolean; isSeed: boolean }[] = [];
    
    // Split by spaces, commas, Persian commas, or semicolons
    const parts = (seedString || '')
      .toUpperCase()
      .split(/[\s,،؛]+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const mappedParts = parts
      .map(part => {
        const isWinMatch = /^(W|TP|WIN|Y|YES|TRUE|1|برد|سود|ص)$/.test(part);
        const isLossMatch = /^(L|SL|LOSS|N|NO|FALSE|0|باخت|ضرر|ض)$/.test(part);
        if (isWinMatch) return { isWin: true, isSeed: true };
        if (isLossMatch) return { isWin: false, isSeed: true };
        return null;
      })
      .filter((x): x is { isWin: boolean; isSeed: boolean } => x !== null);

    if (mappedParts.length > 0) {
      seedTrades = mappedParts;
    } else {
      // Fallback: Parse character by character (e.g. "WWLWW" or "بببضض")
      const chars = seedString.toUpperCase().replace(/[\s,،؛]+/g, '').split('');
      seedTrades = chars
        .map(char => {
          const isWinMatch = /^(W|T|1|Y|برد|سود|ص)$/.test(char);
          const isLossMatch = /^(L|S|0|N|باخت|ضرر|ض)$/.test(char);
          if (isWinMatch) return { isWin: true, isSeed: true };
          if (isLossMatch) return { isWin: false, isSeed: true };
          return null;
        })
        .filter((x): x is { isWin: boolean; isSeed: boolean } => x !== null);
    }

    const combined = [...seedTrades, ...appTrades];
    const lookback = settings.positionSizing?.lookback ?? defaultPositionSizing.lookback;
    return combined.slice(-lookback);
  }, [
    completedAppTrades,
    settings.positionSizing?.seedHistoryString,
    settings.positionSizing?.lookback
  ]);

  const getCombinedTradeHistory = (): { isWin: boolean; isSeed: boolean }[] => combinedTradeHistory;

  // 3. Memoize risk state calculation
  const riskStateMemo = useMemo(() => {
    const combinedHistory = combinedTradeHistory;
    const isEnabled = settings.positionSizing?.enabled !== false;
    const riskMgr = new RiskManager({
      lookback: settings.positionSizing?.lookback ?? defaultPositionSizing.lookback,
      lowThreshold: settings.positionSizing?.lowThreshold ?? defaultPositionSizing.lowThreshold,
      highThreshold: settings.positionSizing?.highThreshold ?? defaultPositionSizing.highThreshold,
      lowRisk: settings.positionSizing?.lowRisk ?? defaultPositionSizing.lowRisk,
      normalRisk: settings.positionSizing?.normalRisk ?? defaultPositionSizing.normalRisk,
      highRisk: settings.positionSizing?.highRisk ?? defaultPositionSizing.highRisk,
    });
    riskMgr.setHistory(combinedHistory.map(h => h.isWin));
    const rawState = riskMgr.getCurrentState();

    if (!isEnabled) {
      return {
        state: {
          ...rawState,
          currentRisk: 1.0,
          riskIfWin: 1.0,
          riskIfLoss: 1.0,
        },
        historyItems: combinedHistory,
        enabled: false
      };
    }

    return {
      state: rawState,
      historyItems: combinedHistory,
      enabled: true
    };
  }, [
    combinedTradeHistory,
    settings.positionSizing?.enabled,
    settings.positionSizing?.lookback,
    settings.positionSizing?.lowThreshold,
    settings.positionSizing?.highThreshold,
    settings.positionSizing?.lowRisk,
    settings.positionSizing?.normalRisk,
    settings.positionSizing?.highRisk,
  ]);

  const getRiskState = () => riskStateMemo;

  const getSequenceProbabilityInfo = () => {
    const seq = completedTrades.map(t => t.result === 'TP' ? 'W' : 'L').join('');
    if (!seq) return null;

    const keysToCheck = [
      'LLW', 'WLL', 'LWW', 'LWL', 'WWL', 'WLW', 'LLL', 'WWW',
      'LL', 'WW', 'LW', 'WL'
    ];

    for (const key of keysToCheck) {
      if (seq.endsWith(key)) {
        return {
          matchedKey: key,
          probability: settings.sequenceProbabilities?.[key] ?? 50,
          currentFullSeq: seq
        };
      }
    }
    return null;
  };

  const canTrade = !isMaxTradesReached && !isMaxWinsReached && !isConsecutiveLosses;

  const startNewTrade = () => {
    if (!canTrade) return;
    setPreTradeNotes('');
    setPostTradeNotes('');
    setTradeCondition('');
    
    const isConsecutiveLossWarn = consecutiveLossesCount === (settings.maxConsecutiveLosses - 1) && settings.maxConsecutiveLosses > 1;
    const isConsecutiveWinsWarn = consecutiveWinsCount === (settings.maxWinsPerDay - 1) && settings.maxWinsPerDay > 1;
    const isLastDailyTradeWarn = trades.length === (settings.maxTradesPerDay - 1) && winCount >= 1;
    
    if (isConsecutiveLossWarn || isConsecutiveWinsWarn || isLastDailyTradeWarn) {
      setView('pre-trade-warning');
    } else {
      setView('pre-trade');
    }
    setIsSubmitting(false);
  };

  const triggerScreenshot = async (type: 'entry' | 'reflection') => {
    if (!settings.screenshotSettings?.enabled) {
      console.log('Screenshots are disabled in settings.');
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const timeStr = format(new Date(), 'HH-mm-ss');
      const strategy = strategyMode === 'btb' ? 'btb' : 'channel';
      const fileName = `${today}_${timeStr}_${strategy}_${type}.png`;
      const folderPath = settings.screenshotSettings.folderPath || 'C:\\BtbScreenshots';
      const monitorIndex = settings.screenshotSettings.monitorIndex ?? 0;

      if (typeof window !== 'undefined' && 'electronAPI' in window) {
        const api = (window as any).electronAPI;
        const result = await api.takeScreenshot({ monitorIndex, folderPath, fileName });
        if (result.success) {
          console.log(`Screenshot saved successfully: ${result.path}`);
        } else {
          console.error(`Failed to save screenshot: ${result.error}`);
        }
      } else {
        console.log(`[Web Preview - Screenshot Simulated] Folder: ${folderPath}, Monitor: ${monitorIndex + 1}, File: ${fileName}`);
      }
    } catch (e) {
      console.error('Error in triggerScreenshot:', e);
    }
  };

  const handlePreTradeSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { state: currentRiskState } = getRiskState();
    const winRateAtEntry = parseFloat((currentRiskState.winRate * 100).toFixed(1));

    const newTrade: Trade = {
      id: generateId(),
      timestamp: Date.now(),
      preTradeNotes,
      tradeCondition,
      result: 'PENDING',
      winRateAtEntry,
      strategyMode
    };
    setDailyState(prev => ({ ...prev, trades: [...(prev?.trades || []), newTrade] }));
    setCurrentTradeId(newTrade.id);
    setPreTradeNotes('');
    setTradeCondition('');
    setView('dashboard');
    setIsSubmitting(false);

    // Capture screenshot on log trade entry
    triggerScreenshot('entry');
  };

  const handlePostTradeSubmit = (id: string, result: TradeResult) => {
    let chosenVoiceText = '';
    let chosenVoiceAudioUrl = '';
    
    if (result === 'TP' || result === 'SL') {
      const count = (dailyState?.trades || []).filter(t => t.result === result && t.id !== id).length + 1;
      const mappings = result === 'SL' ? settings.voiceSLMappings : settings.voiceTPMappings;
      const targetGroupKey = mappings?.[String(count)] || mappings?.[count];
      
      if (targetGroupKey && targetGroupKey !== 'none') {
        const groupTexts = voiceGroups[targetGroupKey as keyof typeof voiceGroups];
        if (groupTexts && groupTexts.length > 0) {
          // Filter items that have a non-empty voice file (audioUrl)
          const itemsWithAudio = groupTexts.filter(item => {
            const audioUrl = typeof item === 'object' && item !== null ? item.audioUrl : '';
            return audioUrl && audioUrl.trim() !== '';
          });

          let selectedItem = null;
          if (itemsWithAudio.length > 0) {
            // Priority with custom voices: randomize only among items that have an audioUrl set
            const randomIndex = Math.floor(Math.random() * itemsWithAudio.length);
            selectedItem = itemsWithAudio[randomIndex];
          } else {
            // Fallback: randomize among items that have at least some text content
            const itemsWithText = groupTexts.filter(item => {
              const text = typeof item === 'object' && item !== null ? item.text : String(item || '');
              return text && text.trim() !== '';
            });

            if (itemsWithText.length > 0) {
              const randomIndex = Math.floor(Math.random() * itemsWithText.length);
              selectedItem = itemsWithText[randomIndex];
            } else {
              // Final fallback to any item in the group
              const randomIndex = Math.floor(Math.random() * groupTexts.length);
              selectedItem = groupTexts[randomIndex];
            }
          }

          if (selectedItem && typeof selectedItem === 'object') {
            chosenVoiceText = selectedItem.text || '';
            chosenVoiceAudioUrl = selectedItem.audioUrl || '';
          } else {
            chosenVoiceText = String(selectedItem || '');
          }
        }
      }
    }

    setDailyState(prev => ({
      ...prev,
      trades: (prev?.trades || []).map(t => t.id === id ? { 
        ...t, 
        result,
        voiceText: chosenVoiceText || undefined,
        voiceAudioUrl: chosenVoiceAudioUrl || undefined
      } : t)
    }));
    
    setCurrentTradeId(id);
    setPostTradeNotes('');
    setView('post-trade');

    // Trigger TTS if playback mode is 'auto' and a voice text is chosen
    if (settings.voicePlaybackMode !== 'disabled' && settings.voicePlaybackMode !== 'manual' && (chosenVoiceText || chosenVoiceAudioUrl)) {
      speakText({ text: chosenVoiceText, audioUrl: chosenVoiceAudioUrl });
    }
  };

  const handlePostTradeNotesSubmit = (skip: boolean = false) => {
    if (!currentTradeId) return;

    setDailyState(prev => {
      const updated = {
        ...prev,
        trades: (prev?.trades || []).map(t => 
          t.id === currentTradeId 
            ? { ...t, postTradeNotes: skip ? undefined : postTradeNotes } 
            : t
        )
      };
      
      setTimeout(() => {
        triggerAutoExcelExportIfNeeded(updated);
      }, 50);

      return updated;
    });

    const trade = (dailyState?.trades || []).find(t => t.id === currentTradeId);
    if (trade) {
      if (trade.result === 'SL') {
        if (settings.appLanguage === 'en') {
          const randomTip = PSYCHOLOGY_TIPS_EN[Math.floor(Math.random() * PSYCHOLOGY_TIPS_EN.length)];
          setTip(`Stop Loss hit. ${randomTip} Stick to your precise system and plan for subsequent trades.`);
        } else {
          const randomTip = PSYCHOLOGY_TIPS[Math.floor(Math.random() * PSYCHOLOGY_TIPS.length)];
          setTip(`حد ضرر فعال شد. ${randomTip} برای معاملات بعدی به برنامه و سیستم دقیق خود پایبند بمانید.`);
        }
      } else {
        setTip('');
      }
    }
    
    setView('dashboard');
    setCurrentTradeId(null);

    // Capture screenshot on reflection save
    triggerScreenshot('reflection');
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const cancelTrade = (id: string) => {
    setDailyState(prev => ({
      ...prev,
      trades: (prev?.trades || []).filter(t => t.id !== id)
    }));
    setCurrentTradeId(null);
    setView('dashboard');
  };

  const resetDay = () => {
    if (dailyState && Array.isArray(dailyState.trades) && dailyState.trades.length > 0) {
      const archivedSession: DailyState = {
        ...dailyState,
        strategyMode,
        archivedAt: Date.now(),
        trades: (dailyState.trades || []).map(t => ({
          ...t,
          strategyMode: t.strategyMode || strategyMode
        }))
      };
      setHistory(prev => ({
        dailyRecords: pruneDailyRecords([archivedSession, ...(prev?.dailyRecords || [])])
      }));
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    setDailyState({ id: generateId(), date: today, trades: [] });
    setView('welcome');
    setTip('');
    setShowResetConfirm(false);
  };

  const renderWelcome = () => {
    return (
      <div className="space-y-4 py-3 px-2 flex flex-col items-center relative w-full h-full justify-center">
        {/* Top Header Row */}
        <div className="w-full flex justify-end items-center px-4 max-w-2xl select-none">
          <span className="text-[9px] font-mono font-black text-red-500 bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-900/40 shadow-inner">
            PAGE {PAGES.WELCOME}
          </span>
        </div>

        {/* Centered Large Premium Logo and Brand */}
        <div className="text-center space-y-3 select-none group max-w-2xl w-full">
          <div className="relative inline-flex justify-center items-center">
            {/* Animated glowing dark-red halo behind the crown */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-amber-600 to-red-800 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
            
            {/* Double ring luxurious border wrapper */}
            <div className="relative bg-slate-950/90 border-2 border-red-900/40 p-3.5 rounded-[28px] flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform duration-500 group-hover:scale-105">
              <div className="absolute inset-0.5 rounded-[24px] border border-red-500/10 pointer-events-none"></div>
              <Crown className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" size={38} />
            </div>
          </div>
          
          <div className="flex flex-col items-center whitespace-nowrap space-y-1.5">
            {/* Brand Title with elegant gold-to-platinum gradient */}
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-[0.15em] bg-gradient-to-r from-slate-100 via-amber-200 to-slate-200 bg-clip-text text-transparent font-sans flex items-center gap-2 leading-none filter drop-shadow-sm">
              Soheil Keshtkar
              <Sparkles className="text-red-500 animate-pulse shrink-0" size={13} />
            </h1>
            
            {/* Elegant Luxury Tagline Divider */}
            <div className="flex items-center gap-3 w-full max-w-xs justify-center">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-900/40"></div>
              <span className="text-[8px] font-black text-amber-500/90 uppercase tracking-[0.25em] font-mono px-1">
                {settings.appLanguage === 'fa' ? 'برند پریمیوم معاملاتی' : 'PREMIUM TRADING BRAND'}
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-900/40"></div>
            </div>
          </div>
        </div>

        {/* Strategy Selection Boxes */}
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            {/* Channel Strategy Card */}
            <button
              onClick={() => {
                switchStrategy('channel');
              }}
              className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-emerald-500/40 p-4.5 rounded-[28px] text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-center min-h-[105px] cursor-pointer"
            >
              {/* Inner glowing hover effect */}
              <div className="absolute inset-0 bg-emerald-500/[0.02] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10 w-full flex flex-col pointer-events-none space-y-3">
                <div className="flex items-center justify-between w-full">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-emerald-400 group-hover:border-emerald-500/20 flex items-center justify-center shadow-inner transition-all duration-300">
                    <TrendingUp size={18} />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">
                      {settings.appLanguage === 'fa' ? 'کانال' : 'Channel'}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-100 group-hover:text-emerald-400 transition-colors">
                   {t("Channel Strategy", settings.appLanguage)}
                </h3>
              </div>
            </button>

            {/* BTB Strategy Card */}
            <button
              onClick={() => {
                switchStrategy('btb');
              }}
              className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-indigo-500/40 p-4.5 rounded-[28px] text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-indigo-950/20 flex flex-col justify-center min-h-[105px] cursor-pointer"
            >
              {/* Inner glowing hover effect */}
              <div className="absolute inset-0 bg-indigo-500/[0.02] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 w-full flex flex-col pointer-events-none space-y-3">
                <div className="flex items-center justify-between w-full">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-indigo-400 group-hover:border-indigo-500/20 flex items-center justify-center shadow-inner transition-all duration-300">
                    <Brain size={18} />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">
                      BTB
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                  {t("BTB Strategy", settings.appLanguage)}
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* Global Controls & History with luxury glass design */}
        <div className="w-full flex gap-3 pt-4 border-t border-slate-900/60 max-w-2xl select-none">
          <button
            onClick={() => {
              setOpenedFrom('welcome');
              setView('archive');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <History size={14} className="text-red-500" />
            <span>{t("Archive & History", settings.appLanguage)}</span>
          </button>
          
          <button
            onClick={() => {
              setOpenedFrom('welcome');
              setView('system-settings');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <SettingsIcon size={14} className="text-red-500" />
            <span>{t("System Settings", settings.appLanguage)}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderRules = () => {
    const systemRules = settings.appLanguage === 'en' ? [
      "Only trade based on the system when you follow price triggers and alerts, not by constantly staring at the chart. Set alerts, check positions, and step away from the chart until a stop loss or take profit is hit.",
      "Your only duty is to follow the details of the plan and rules. Backtesting has proven that this strategy maintains its statistical edge in the long run.",
      "Never double your trade volume in a way that is outside the plan. Increasing leverage causes emotional distress and prevents trades from reaching their final targets.",
      "Never trade in tight ranging or market congestion. Switch the chart view to line charts to remove extra noise and prevent early entries due to boredom."
    ] : [
      "صرفاً زمانی بر اساس سیستم معامله کنید که بر اساس تریگرها و هشدارهای قیمتی پیش می‌روید، نه با زل زدن مکرر به چارت. آلارم‌ها را تنظیم کنید، موقعیت را بررسی کنید، و تا زمانی که حد ضرر یا سود لمس نشده، از چارت فاصله بگیرید.",
      "تنها وظیفه شما دنبال کردن جزئیات برنامه و قوانین است. فرآیند بک‌تست ثابت کرده که این استراتژی برتری آماری (Edge) خود را در بلندمدت حفظ می‌کند.",
      "هرگز حجم معاملات خود را به شیوه‌ای خارج از برنامه دو برابر نکنید. افزایش اهرم باعث اضطراب عاطفی شده و مانع از رسیدن معاملات به اهداف نهایی‌شان می‌شود.",
      "هرگز در شرایط رنج فشرده یا تراکم بازار معامله نکنید. حالت چارت را به لاین (خطی) تعویض کنید تا نویزهای اضافی حذف شده و مانع ورودهای زودهنگام ناشی از بی‌حوصلگی شود."
    ];

    const sizingRules = settings.appLanguage === 'en' ? [
      `Maximum of ${settings.maxTradesPerDay} trades per day.`,
      `Trading stop upon reaching ${settings.maxWinsPerDay} win trades (TP) per day.`,
      `Immediate stop after ${settings.maxConsecutiveLosses} consecutive stop losses (SL) (if no wins have been registered today).`,
      `If you have net profits today, you can continue trading up to the daily cap of ${settings.maxTradesPerDay} trades.`
    ] : [
      `حداکثر ${settings.maxTradesPerDay} معامله در روز.`,
      `توقف معاملاتی به محض رسیدن به ${settings.maxWinsPerDay} معامله سودده (TP) در روز.`,
      `توقف فوری پس از ${settings.maxConsecutiveLosses} حد ضرر متوالی (SL) (در صورتی که سودی از امروز ثبت نشده باشد).`,
      `در صورت داشتن سود خالص امروز، می‌توانید معامله را تا سقف روزانه ${settings.maxTradesPerDay} عدد ادامه دهید.`
    ];
    
    return (
      <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header from Screenshot */}
        <div className="flex justify-between items-center px-1 mb-2">
          <button 
            onClick={() => setView('welcome')}
            title="Go to Main Screen"
            className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              {strategyMode === 'btb' ? (
                <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-800 drop-shadow-sm" size={20} />
                </div>
              ) : (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                    <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              {strategyMode === 'btb' ? (
                <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
                </span>
              ) : (
                <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
                </span>
              )}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest font-mono",
                strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
              )}>
                Premium Trading Brand
              </span>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setView('settings')}
                className="p-2.5 text-slate-400 hover:text-slate-100 bg-slate-900/80 border border-slate-800 rounded-2xl transition-all active:scale-95"
              >
                <SettingsIcon size={20} />
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/60 shadow-inner">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">{PAGES.RULES}</span>
              </div>
          </div>
        </div>

        {/* System Rules Section */}
        <div className="bg-slate-900/40 border border-indigo-500/20 rounded-[40px] p-6 relative overflow-hidden group shadow-xl">
          <div className="flex items-center gap-3 mb-6 relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Brain size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">System Rules</h2>
          </div>
          
          <ul className="space-y-6 relative" dir="rtl">
            {systemRules.map((rule, idx) => (
              <li key={`sys-${idx}`} className="flex items-start gap-4 text-right">
                <div className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] flex-shrink-0" />
                <p className="text-sm font-medium text-slate-300 leading-relaxed font-sans">
                  {rule}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Position Sizing Rules Section */}
        <div className="bg-slate-900/40 border border-amber-500/20 rounded-[40px] p-6 relative overflow-hidden group shadow-xl">
          <div className="flex items-center gap-3 mb-6 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Position Sizing Rules</h2>
          </div>
          
          <ul className="space-y-4 relative" dir="rtl">
            {sizingRules.map((rule, idx) => (
              <li key={`size-${idx}`} className="flex items-start gap-3 text-right">
                <div className="mt-2 w-1.5 h-1.5 rounded-sm bg-amber-500 flex-shrink-0 rotate-45" />
                <p className="text-sm font-bold text-slate-300 font-sans leading-snug">
                  {rule}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-2">
          <button
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full h-24 flex items-center justify-between px-6 rounded-3xl transition-all group cursor-pointer text-left shadow-xl",
              strategyMode === 'btb'
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"
                : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-amber-500/20 hover:scale-[1.02] active:scale-95"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                strategyMode === 'btb' ? "bg-white/10" : "bg-black/20"
              )}>
                <TrendingUp size={28} />
              </div>
              <div className="flex flex-col text-left whitespace-nowrap">
                <span className="text-xl font-black uppercase leading-none tracking-tighter">Start Trading Session</span>
                <span className={cn(
                  "text-xs font-bold mt-1",
                  strategyMode === 'btb' ? "text-indigo-100" : "text-slate-900/70"
                )}>Begin logging and matching rules</span>
              </div>
            </div>
            <ChevronRight size={24} className={cn(
              "group-hover:translate-x-1 transition-transform",
              strategyMode === 'btb' ? "text-white" : "text-slate-950"
            )} />
          </button>

          <button
            onClick={() => setView('history')}
            className="w-full py-4 px-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer"
          >
            <History size={18} className="text-slate-500" />
            View History & Archived Logs
          </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setView('welcome')}
          title="Go to Main Screen"
          className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="relative">
            {strategyMode === 'btb' ? (
              <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                <Crown className="text-amber-800 drop-shadow-sm" size={20} />
              </div>
            ) : (
              <>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col text-left whitespace-nowrap">
            {strategyMode === 'btb' ? (
              <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                Soheil Keshtkar
                <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
              </span>
            ) : (
              <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                Soheil Keshtkar
                <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
              </span>
            )}
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest font-mono",
              strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
            )}>
              Premium Trading Brand
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setOpenedFrom('mode');
              setView('settings');
            }}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{PAGES.DASHBOARD}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="bg-slate-900 py-2 px-3.5 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold text-slate-400 font-sans">Wins (TP)</span>
          </div>
          <div className="text-lg font-black text-slate-100 font-mono leading-none">{winCount}</div>
        </div>
        <div className="bg-slate-900 py-2 px-3.5 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-400">
            <TrendingDown size={16} />
            <span className="text-xs font-semibold text-slate-400 font-sans">Losses (SL)</span>
          </div>
          <div className="text-lg font-black text-slate-100 font-mono leading-none">{lossCount}</div>
        </div>
      </div>

      {/* Rule Alerts */}
      <AnimatePresence>
        {isMaxWinsReached && (
          <motion.div 
            key="alert-max-wins"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl flex gap-3 items-start text-left"
          >
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <div className="w-full">
              <p className="text-emerald-100 font-medium text-sm">
                {settings.appLanguage === 'fa' ? "تارگت روزانه محقق شد!" : "Daily Target Achieved!"}
              </p>
              {settings.appLanguage === 'en' ? (
                <p className="text-emerald-300/70 text-xs mt-1 font-sans leading-relaxed">
                  You have reached your maximum of {settings.maxWinsPerDay} daily wins. To protect your results and today's profit, further trading is not allowed.
                </p>
              ) : (
                <p className="text-emerald-300/70 text-xs mt-1 text-right font-sans leading-relaxed" dir="rtl">
                  شما به حداکثر تعداد {settings.maxWinsPerDay} برد روزانه خود رسیده‌اید. برای محافظت از نتایج و سود امروز، انجام معامله بیشتر مجاز نیست.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {isConsecutiveLosses && (
          <motion.div 
            key="alert-consecutive-losses"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-2xl flex gap-3 items-start text-left"
          >
            <AlertCircle className="text-rose-400 shrink-0" size={20} />
            <div>
              <p className="text-rose-100 font-medium text-sm">
                {settings.appLanguage === 'fa' 
                  ? `حد ضرر متوالی فعال شد (${settings.maxConsecutiveLosses} SL)` 
                  : `Consecutive Loss Halted (${settings.maxConsecutiveLosses} SL)`}
              </p>
              <p className="text-rose-300/70 text-xs mt-1">
                {settings.appLanguage === 'fa'
                  ? `شما ${settings.maxConsecutiveLosses} باخت متوالی ثبت کرده‌اید. جهت محافظت از سرمایه شما، ترید متوقف شده است. استراحت کنید!`
                  : `You logged ${settings.maxConsecutiveLosses} consecutive stop losses. To protect your account size, trading has been stopped. Take a break!`}
              </p>
            </div>
          </motion.div>
        )}

        {isMaxTradesReached && !isMaxWinsReached && !isConsecutiveLosses && (
          <motion.div 
            key="alert-max-trades"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start text-left"
          >
            <AlertCircle className="text-amber-400 shrink-0" size={20} />
            <div>
              <p className="text-amber-100 font-medium text-sm">
                {settings.appLanguage === 'fa' ? "سقف ترید روزانه تکمیل شد" : "Daily Trade Cap Reached"}
              </p>
              <p className="text-amber-300/70 text-xs mt-1">
                {settings.appLanguage === 'fa'
                  ? `شما به سقف مجاز ${settings.maxTradesPerDay} ترید روزانه خود رسیده‌اید. لطفاً استراحت کنید.`
                  : `You have parsed your limit of ${settings.maxTradesPerDay} daily trades. Take some rest.`}
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Current/Next Action */}
      <div className="space-y-3">
        {trades.find(t => t.result === 'PENDING') && (
          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border-2 border-indigo-500/30 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-100">Trade in Progress...</h3>
              <span className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full"></span>
            </div>
            <p className="text-slate-400 text-sm">How did Trade #{trades.length} resolve?</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handlePostTradeSubmit(trades.find(t => t.result === 'PENDING')!.id, 'TP')}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <TrendingUp size={18} />
                Profit (TP)
              </button>
              <button 
                onClick={() => handlePostTradeSubmit(trades.find(t => t.result === 'PENDING')!.id, 'SL')}
                className="flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-500 transition-colors cursor-pointer"
              >
                <TrendingDown size={18} />
                Loss (SL)
              </button>
            </div>
            <button 
              onClick={() => cancelTrade(trades.find(t => t.result === 'PENDING')!.id)}
              className="w-full text-slate-500 text-xs py-2 hover:text-rose-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <XCircle size={14} />
              Cancel this Trade
            </button>
          </div>
        )}

        {(() => {
          if (settings.sequenceProbabilitiesEnabled === false) return null;
          const probInfo = getSequenceProbabilityInfo();
          if (!probInfo) return null;
          const isHighProb = probInfo.probability >= 70;
          const isLowProb = probInfo.probability <= 40;
          return (
            <div className={cn(
              "py-3 px-4 rounded-3xl border text-xs flex justify-between items-center gap-2 text-left",
              isHighProb 
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                : isLowProb
                  ? "bg-rose-950/20 border-rose-500/15 text-rose-300"
                  : "bg-slate-900 border-slate-800 text-slate-300"
            )}>
              <span className="font-bold flex items-center gap-1.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  isHighProb ? "bg-emerald-400" : isLowProb ? "bg-rose-400" : "bg-slate-400"
                )} />
                Today's Sequence: <span className="font-mono bg-slate-950/80 px-1.5 py-0.5 rounded ml-1">{probInfo.currentFullSeq}</span> | Win Prob:
              </span>
              <span className={cn(
                "font-black font-mono text-sm px-2.5 py-0.5 rounded-xl bg-slate-950/80 border border-slate-800/80",
                isHighProb ? "text-emerald-400" : isLowProb ? "text-rose-400" : "text-indigo-400"
              )}>
                {probInfo.probability}%
              </span>
            </div>
          );
        })()}

        {renderPositionSizingCard(false)}

        <AnimatePresence>
          {tip && (
            <motion.div 
              key="alert-tip"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-4 rounded-2xl flex gap-3 items-start border-slate-800 bg-slate-900/60 text-slate-100",
                isPersian(tip) ? "text-right flex-row-reverse font-sans" : "text-left"
              )}
              dir={isPersian(tip) ? "rtl" : undefined}
            >
              <Brain className="text-indigo-405 shrink-0 text-indigo-400" size={20} />
              <div className="w-full text-left">
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                  Mindset Tip
                </p>
                <p className="text-xs mt-1 leading-relaxed text-slate-300">
                  {tip}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!trades.find(t => t.result === 'PENDING') && (
          <button 
            disabled={!canTrade}
            onClick={startNewTrade}
            className={cn(
              "w-full h-24 flex items-center justify-between px-6 rounded-3xl transition-all group cursor-pointer text-left",
              canTrade 
                ? strategyMode === 'btb'
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95" 
                : "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                canTrade 
                  ? strategyMode === 'btb' ? "bg-white/10" : "bg-slate-950/20"
                  : "bg-slate-800"
              )}>
                <PlusCircle size={24} />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-lg">Register New Trade</p>
                <p className={cn(
                  "text-xs font-medium font-sans",
                  canTrade && strategyMode === 'btb' ? "text-indigo-100" : "opacity-80"
                )}>Trade {trades.length + 1} of {settings.maxTradesPerDay}</p>
              </div>
            </div>
            <ChevronRight className={cn(canTrade ? strategyMode === 'btb' ? "opacity-100 text-white" : "opacity-100 text-slate-950" : "opacity-0")} />
          </button>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-400 text-sm">Today's Activity</h3>
          <button 
            onClick={() => {
              setOpenedFrom('mode');
              setView('history');
            }} 
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer",
              strategyMode === 'btb'
                ? "text-slate-100 bg-slate-950/15 hover:bg-slate-950/25 border border-slate-800/50"
                : "text-indigo-400 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/20"
            )}
          >
            <History size={14} />
            Archived History
          </button>
        </div>
        <div className="space-y-2">
          {trades.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-left px-4">No trades recorded today. Start by registering a new trade!</div>
          ) : (
            trades.map((trade, idx) => (
              <div key={trade.id || `trade-${trade.timestamp}-${idx}`} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    trade.result === 'TP' ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" : 
                    trade.result === 'SL' ? "bg-rose-950/50 text-rose-400 border border-rose-500/20" : "bg-slate-800 text-slate-500"
                  )}>
                    {trade.result === 'TP' ? <TrendingUp size={20} /> : 
                     trade.result === 'SL' ? <TrendingDown size={20} /> : <BarChart3 size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-200">Trade #{idx + 1}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-slate-500 font-mono">{format(trade.timestamp, 'HH:mm')}</p>
                      {trade.tradeCondition && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-sans border font-black",
                          trade.tradeCondition === 'Wide' ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/20" :
                          trade.tradeCondition === 'Tight' ? "bg-violet-950/40 text-violet-400 border-violet-500/20" :
                          "bg-sky-950/40 text-sky-450 border-sky-500/20"
                        )}>
                          {trade.tradeCondition === 'Wide' ? (strategyMode === 'btb' ? 'FL' : 'Wide') :
                           trade.tradeCondition === 'Tight' ? (strategyMode === 'btb' ? 'Shadow' : 'Tight') : 'Reng'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  {settings.voicePlaybackMode !== 'disabled' && (trade.voiceText || trade.voiceAudioUrl) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText({ text: trade.voiceText || "", audioUrl: trade.voiceAudioUrl });
                      }}
                      title="پخش پیام صوتی دیسیپلین (ویز)"
                      className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-400 hover:text-red-450 hover:text-red-400 hover:border-red-500/20 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Volume2 size={13} className="animate-pulse text-red-400" />
                    </button>
                  )}
                  <div className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full font-mono",
                    trade.result === 'TP' ? "text-emerald-400 bg-emerald-950/50 border border-emerald-500/20" : 
                    trade.result === 'SL' ? "text-rose-400 bg-rose-950/50 border border-rose-500/20" : "text-slate-500 bg-slate-800"
                  )}>
                    {trade.result === 'TP' ? 'Take Profit (TP)' : trade.result === 'SL' ? 'Stop Loss (SL)' : 'In Progress'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showResetConfirm ? (
        <div className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-3xl space-y-3 text-left">
          <p className="text-xs text-rose-200 text-center font-bold">Are you sure? Today's session will be archived and reset.</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={resetDay}
              className="bg-rose-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-rose-500 cursor-pointer"
            >
              Yes, Archive & Reset
            </button>
            <button 
              onClick={() => setShowResetConfirm(false)}
              className="bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-center gap-2 text-slate-650 hover:text-rose-400 transition-colors py-4 text-xs cursor-pointer font-bold animate-none"
        >
          <RotateCcw size={16} />
          Archive & Reset Current Day Session
        </button>
      )}
    </div>
  );

  const renderPositionSizingCard = (isCompact: boolean = false) => {
    const { state: riskState, historyItems, enabled: isEnabled } = getRiskState();
    const config = settings.positionSizing || defaultPositionSizing;

    if (!isEnabled) {
      if (!showWinRateOnlyWhenDisabled) return null;
      return (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-2.5 text-left">
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full relative bg-indigo-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                Calculated Win Rate (Sizing Disabled)
              </h4>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-indigo-400 animate-pulse">
                {riskState.winRatePercent}
              </span>
              <span className="text-xs text-slate-500 font-sans font-medium">
                (based on {riskState.totalTradesConsidered} recent trades)
              </span>
            </div>
          </div>
        </div>
      );
    }

    const wrValForCard = riskState.winRate * 100;
    const cardPhaseInfo = getCurrentPhaseInfo(wrValForCard, historyItems);

    const isHigh = isEnabled && (riskState.currentRisk > config.normalRisk);
    const isLow = isEnabled && (riskState.currentRisk < config.normalRisk);

    if (isCompact) {

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl py-3 px-4 flex justify-between items-center text-xs text-left">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                isHigh ? "bg-emerald-400" : isLow ? "bg-rose-400" : "bg-indigo-450"
              )} />
              Suggested Vol Multiplier:
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              Win Rate <span className={cn("font-mono font-bold", cardPhaseInfo.titleColor)}>{riskState.winRatePercent}</span> in {riskState.totalTradesConsidered} recent trades
            </span>
          </div>
          <span className={cn(
            "font-black font-mono text-sm px-3 py-1 rounded-xl bg-slate-950 border border-slate-800",
            isHigh ? "text-emerald-400" : isLow ? "text-rose-400" : "text-indigo-400"
          )}>
            {riskState.currentRisk.toFixed(1)}x
          </span>
        </div>
      );
    }

    const realCount = historyItems.filter(h => !h.isSeed).length;
    const seedUsedCount = historyItems.filter(h => h.isSeed).length;
    const isSimplified = config.simplified === true;

    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-3 text-left">
        <div className="flex flex-col gap-1 border-b border-slate-800/40 pb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full relative",
              isHigh ? "bg-emerald-400" : isLow ? "bg-rose-400" : "bg-indigo-500"
            )} />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
              Calculated Win Rate
            </h4>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={cn("font-mono text-3xl md:text-4xl font-extrabold tracking-tight animate-pulse", cardPhaseInfo.titleColor)}>
              {riskState.winRatePercent}
            </span>
            <span className="text-xs text-slate-500 font-sans font-medium">
              (based on {riskState.totalTradesConsidered} recent trades)
            </span>
          </div>
        </div>

        {/* Visual Trade Queue */}
        {!isSimplified && (
          <div className="space-y-1.5 pt-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[10px] text-slate-400">
              <span className="font-bold">
                Sequence of {riskState.totalTradesConsidered} recent trades (calculation base):
                {realCount > 0 && (
                  <span className="text-indigo-400 ml-1 font-normal font-sans">
                    ({realCount} real trades + {seedUsedCount} default simulation trades)
                  </span>
                )}
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Profit (W)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Loss (L)</span>
                </span>
                <span className="flex items-center gap-1 opacity-60">
                  <span className="w-2 h-2 rounded border border-slate-600 border-dashed"></span>
                  <span>Simulation</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-indigo-500"></span>
                  <span className="font-bold text-slate-300">Your Real Trades</span>
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 py-2 px-3 rounded-2xl bg-slate-950/50 border border-slate-800/60 max-h-[105px] overflow-y-auto">
              {historyItems.map((item, index) => {
                const isWin = item.isWin;
                const isSeed = item.isSeed;
                return (
                  <div 
                    key={`q-item-${index}`}
                    title={isSeed ? "Default simulation trade" : "Your registered real trade"}
                    className={cn(
                      "w-7 h-7 rounded-lg flex flex-col items-center justify-center font-bold text-[10px] font-mono select-none relative transition-all",
                      isWin 
                        ? isSeed 
                          ? "bg-emerald-950/20 text-emerald-400/60 border border-emerald-500/20 border-dashed" 
                          : "bg-emerald-600 text-white shadow-md shadow-emerald-900/20 font-black border border-emerald-400/30"
                        : isSeed 
                          ? "bg-rose-950/20 text-rose-400/60 border border-rose-500/20 border-dashed" 
                          : "bg-rose-600 text-white shadow-md shadow-rose-900/20 font-black border border-rose-400/30"
                    )}
                  >
                    {isWin ? 'W' : 'L'}
                    {/* Subtle marker to indicate user actual trade */}
                    {!isSeed && (
                      <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-indigo-200 animate-pulse" />
                    )}
                  </div>
                );
              })}
              
              {historyItems.length === 0 && (
                <p className="text-[11px] text-slate-500 italic text-center w-full py-1">
                  No trades in statistical history yet. Add seed trades in Settings or start registering trades.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 items-stretch">
          {/* Next Multiplier (Current/Suggested Sizing) */}
          <div className={cn(
            "py-2 px-3 rounded-2xl flex flex-col justify-between border transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
            cardPhaseInfo.badgeBg || "bg-slate-950/40 border-slate-800"
          )}>
            <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Suggested Now</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-semibold text-slate-300">Next Multiplier</span>
              <span className={cn(
                "text-xl md:text-2xl font-black font-mono animate-pulse",
                cardPhaseInfo.titleColor
              )}>
                {riskState.currentRisk.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Side-by-side squares for TP & SL */}
          <div className="grid grid-cols-2 gap-3">
            {/* If Next is Profit (TP) */}
            <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_12px_rgba(16,185,129,0.02)]">
              <span className="block text-[9px] text-emerald-400 opacity-90 uppercase tracking-wider font-extrabold leading-tight">
                If Next is Profit (TP)
              </span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-emerald-500/60 font-semibold">Next Multiplier</span>
                <span className="font-mono text-xl font-black text-emerald-400">{riskState.riskIfWin.toFixed(1)}x</span>
              </div>
            </div>

            {/* If Next is Stop Loss (SL) */}
            <div className="bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_12px_rgba(239,68,68,0.02)]">
              <span className="block text-[9px] text-rose-400 opacity-90 uppercase tracking-wider font-extrabold leading-tight">
                If Next is Stop Loss (SL)
              </span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-rose-500/60 font-semibold">Next Multiplier</span>
                <span className="font-mono text-xl font-black text-rose-400">{riskState.riskIfLoss.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>

        {!isSimplified && (
          <p className="text-[10px] text-slate-500 leading-relaxed text-left pt-1.5 border-t border-slate-800/35">
            💡 As you register live real trades, your actual trading results automatically overwrite the default simulation seeds (dashed squares) in calculations.
          </p>
        )}
      </div>
    );
  };

  const renderPreTrade = () => {
    const isReng = tradeCondition === 'Reng';
    const canSubmit = (tradeCondition === 'Wide' || tradeCondition === 'Tight');

    return (
      <div className="space-y-6 text-left">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setView('welcome')}
            title="Go to Main Screen"
            className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              {strategyMode === 'btb' ? (
                <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-800 drop-shadow-sm" size={20} />
                </div>
              ) : (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                    <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              {strategyMode === 'btb' ? (
                <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
                </span>
              ) : (
                <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
                </span>
              )}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest font-mono",
                strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
              )}>
                Premium Trading Brand
              </span>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('dashboard')}
              className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all active:scale-95"
              title="Cancel and Go to Dashboard"
            >
              <XCircle size={20} />
            </button>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{PAGES.PRE_TRADE}</span>
          </div>
        </div>

        {(() => {
          if (settings.sequenceProbabilitiesEnabled === false) return null;
          const probInfo = getSequenceProbabilityInfo();
          if (!probInfo) return null;
          
          const isHighProb = probInfo.probability >= 70;
          const isLowProb = probInfo.probability <= 40;
          
          return (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Active Sequence Square */}
              <div className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 py-2 px-3 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                <span className="block text-[9px] text-slate-400 opacity-90 uppercase tracking-wider font-extrabold leading-tight">
                  Active Sequence
                </span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-500/60 font-semibold">Sequence</span>
                  <span className="font-mono text-xl font-black text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/30">
                    {probInfo.currentFullSeq || "None"}
                  </span>
                </div>
              </div>

              {/* Win Probability Square */}
              <div className={cn(
                "py-2 px-3 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border",
                isHighProb 
                  ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
                  : isLowProb
                    ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20"
                    : "bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20"
              )}>
                <span className={cn(
                  "block text-[9px] opacity-90 uppercase tracking-wider font-extrabold leading-tight",
                  isHighProb ? "text-emerald-400" : isLowProb ? "text-rose-400" : "text-indigo-400"
                )}>
                  Win Probability
                </span>
                <div className="flex justify-between items-center mt-1">
                  <span className={cn(
                    "text-[10px] font-semibold",
                    isHighProb ? "text-emerald-500/60" : isLowProb ? "text-rose-500/60" : "text-indigo-500/60"
                  )}>Probability</span>
                  <span className={cn(
                    "font-mono text-xl font-black",
                    isHighProb ? "text-emerald-400" : isLowProb ? "text-rose-400" : "text-indigo-400"
                  )}>
                    {probInfo.probability}%
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {renderPositionSizingCard(false)}

        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-slate-350 tracking-tight block">
                  {strategyMode === 'btb' ? 'Trade Condition' : 'Trade Condition / Channel Type'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'Wide' as const, label: strategyMode === 'btb' ? 'FL' : 'Wide', colorClass: 'indigo' },
                    { value: 'Tight' as const, label: strategyMode === 'btb' ? 'Shadow' : 'Tight', colorClass: 'violet' },
                    { value: 'Reng' as const, label: 'Reng', colorClass: 'sky' }
                  ].map((item) => {
                    const isSelected = tradeCondition === item.value;
                    
                    const handleClick = () => {
                      setTradeCondition(isSelected ? '' : item.value);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        try { navigator.vibrate(30); } catch (err) {}
                      }
                    };

                    return (
                      <div
                        key={item.value}
                        onClick={handleClick}
                        className={cn(
                          "relative aspect-[4/3] rounded-2xl border p-2 flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all duration-300 overflow-hidden",
                          isSelected
                            ? item.colorClass === 'indigo'
                              ? "bg-indigo-500/15 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.03]"
                              : item.colorClass === 'violet'
                              ? "bg-violet-500/15 border-violet-500 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.25)] scale-[1.03]"
                              : "bg-sky-500/15 border-sky-500 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.25)] scale-[1.03]"
                            : "bg-slate-950/45 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:text-slate-300"
                        )}
                      >
                        {holdingValue === item.value && (
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, ease: "linear" }}
                            className="absolute top-0 left-0 h-1 bg-amber-400 z-10"
                          />
                        )}
                        <div className="w-full text-right leading-none z-0">
                          <span className={cn(
                            "w-2 h-2 rounded-full inline-block",
                            isSelected 
                              ? item.colorClass === 'indigo' ? "bg-indigo-400 animate-pulse" : item.colorClass === 'violet' ? "bg-violet-400 animate-pulse" : "bg-sky-400 animate-pulse"
                              : "bg-slate-800"
                          )} />
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 z-0">
                          <span className="font-mono text-xs font-black tracking-wider uppercase">{item.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-slate-350 tracking-tight block font-mono">Strategy Triggers</label>
                {strategyMode === 'btb' ? (
                  <div className="flex gap-3">
                    {['INS', 'SKBar'].map((trigger) => {
                      const isSelected = preTradeNotes.split(',').map(s => s.trim()).includes(trigger);
                      return (
                        <button
                          key={trigger}
                          type="button"
                          onClick={() => {
                            let parts = preTradeNotes.split(',').map(s => s.trim()).filter(Boolean);
                            if (parts.includes(trigger)) {
                              parts = parts.filter(p => p !== trigger);
                            } else {
                              parts.push(trigger);
                            }
                            setPreTradeNotes(parts.join(', '));
                          }}
                          className={cn(
                            "flex-1 py-2.5 px-4 rounded-2xl border text-sm font-black tracking-wider transition-all duration-300 cursor-pointer text-center select-none",
                            isSelected
                              ? "bg-indigo-500/15 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.02]"
                              : "bg-slate-950/45 border-slate-800/80 text-slate-450 hover:border-slate-700/80 hover:text-slate-300"
                          )}
                        >
                          {trigger}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea 
                    value={preTradeNotes}
                    onChange={(e) => setPreTradeNotes(e.target.value)}
                    placeholder=""
                    className="w-full h-11 p-3 rounded-2xl border border-slate-800/80 bg-slate-950/45 text-slate-100 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 resize-none text-sm placeholder:text-slate-700 shadow-inner hover:border-slate-700/80"
                  />
                )}
              </div>



              <button 
                onClick={handlePreTradeSubmit}
                disabled={isSubmitting || isReng || !canSubmit}
                className={cn(
                  "w-full h-24 flex items-center justify-between px-6 rounded-3xl transition-all group cursor-pointer text-left select-none",
                  isReng 
                    ? "bg-rose-950/30 text-rose-400 border border-rose-900/40 cursor-not-allowed"
                    : !canSubmit
                    ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                    : strategyMode === 'btb'
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"
                      : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    canSubmit && !isReng 
                      ? strategyMode === 'btb' ? "bg-white/10 animate-pulse" : "bg-slate-950/20 animate-pulse"
                      : "bg-slate-800"
                  )}>
                    <CheckCircle2 size={24} className={cn(canSubmit && !isReng ? strategyMode === 'btb' ? "text-white" : "text-slate-950" : "text-slate-500")} />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-lg">
                      {isSubmitting ? 'Registering...' : isReng ? 'No Trade Allowed (Reng Channel)' : 'Confirm & Log Trade Entry'}
                    </p>
                    <p className={cn(
                      "text-xs font-medium font-sans",
                      canSubmit && !isReng && strategyMode === 'btb' ? "text-indigo-100" : "opacity-80"
                    )}>
                      {isReng ? 'Reng Channel Rules Applied' : `Trade ${trades.length + 1} of ${settings.maxTradesPerDay}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn((canSubmit && !isReng) ? strategyMode === 'btb' ? "opacity-100 text-white" : "opacity-100 text-slate-950" : "opacity-0")} />
              </button>
            </div>
          </div>

          {/* Dynamic Win Rate Phase Box */}
          {(() => {
            const { state: rxState, historyItems: hItems } = getRiskState();
            const wrVal = rxState.winRate * 100;
            const phaseInfo = getCurrentPhaseInfo(wrVal, hItems);

            const renderIcon = (name: string, customColorClass?: string) => {
              switch (name) {
                case 'Sparkles': return <Sparkles size={18} className={cn("text-purple-400", customColorClass)} />;
                case 'Crown': return <Crown size={18} className={cn("text-emerald-400 animate-pulse", customColorClass)} />;
                case 'AlertCircle': return <AlertCircle size={18} className={cn("text-amber-400", customColorClass)} />;
                case 'Brain': return <Brain size={18} className={cn("text-indigo-400", customColorClass)} />;
                case 'CloudLightning': return <CloudLightning size={18} className={cn("text-rose-400 animate-bounce", customColorClass)} />;
                default: return <Sparkles size={18} />;
              }
            };

            return (
              <div className={cn(
                "p-6 rounded-[32px] border space-y-4 text-right transition-all duration-500",
                phaseInfo.bgClasses,
                phaseInfo.borderClasses
              )} dir="rtl">
                <div className="flex items-center justify-between text-slate-100 font-bold border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-slate-950/85 border flex items-center justify-center p-2 transition-all duration-300",
                      phaseInfo.glowAnimationClass
                    )}>
                      {renderIcon(phaseInfo.iconName, phaseInfo.iconColorClass)}
                    </div>
                    <span className={cn("text-xs font-black tracking-tight", phaseInfo.titleColor)}>
                      {phaseInfo.phase}
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono text-xs px-3 py-1 rounded-full border shadow-inner font-extrabold",
                    phaseInfo.badgeBg,
                    phaseInfo.badgeText
                  )}>
                    {wrVal.toFixed(1)}% Win Rate
                  </span>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed font-sans font-semibold whitespace-pre-wrap text-right leading-relaxed pl-1",
                  phaseInfo.textColorClass
                )}>
                  {phaseInfo.text}
                </p>
              </div>
            );
          })()}

          {/* Core Unchangeable Rules Cards */}
          <div className="bg-slate-900 rounded-[32px] border border-slate-800/80 p-6 space-y-5 text-right shadow-[0_4px_30px_rgba(0,0,0,0.2)]" dir="rtl">
            <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3" dir="rtl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 border border-slate-800 flex items-center justify-center shadow-md">
                <Crown size={15} className="text-amber-400 animate-pulse" />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-100 tracking-wide font-sans">Constant Trading Rules & Values</h3>
                <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">Unchangeable Code of Discipline</p>
              </div>
            </div>

            <div className="space-y-4 text-right">
              {/* Option 1 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/15 space-y-2 hover:border-indigo-500/35 hover:shadow-[0_0_20px_rgba(99,102,241,0.06)] transition-all duration-300 text-right">
                <div className="flex items-center gap-2 text-indigo-400 font-sans font-bold">
                  <Sparkles size={14} className="text-indigo-400" />
                  <h5 className="text-xs font-extrabold text-indigo-300">System Macro Data</h5>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 font-sans font-semibold text-right leading-relaxed pr-1" dir="rtl">
                  در تعداد زیادی معامله در ۳ سال. وینریت کلی ۶۰٪. حداکثر درادون ۱۰ ریوارد که فقط ۲ بار در کل دوره رخ داده است. میانگین سود هر معامله بین ۰.۰۵ تا ۰.۱۰ ریوارد است. تعداد معاملات ماهانه بین ۴۰ تا ۵۵ عدد ثابت بوده. این سیستم در ۱۰-۱۵٪ برترین سیستمهای معاملاتی قرار دارد.
                </p>
              </div>

              {/* Option 2 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/15 space-y-2 hover:border-emerald-500/35 hover:shadow-[0_0_20px_rgba(16,185,129,0.06)] transition-all duration-300 text-right">
                <div className="flex items-center gap-2 text-emerald-400 font-sans font-bold text-right">
                  <Crown size={14} className="text-emerald-400" />
                  <h5 className="text-xs font-extrabold text-emerald-300">Law of Execution</h5>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 font-sans font-semibold text-right leading-relaxed pr-1" dir="rtl">
                  هیچ تصمیمی در حین معامله. فقط اجرا. سیستم قبلاً همه تصمیمات را گرفته است. ۱۰ سال طول کشید تا به اینجا برسی. با حس، به اینجا نرسیدی. با سیستم رسیدی. پس ادامه بده.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPostTrade = () => {
    const trade = (dailyState?.trades || []).find(t => t.id === currentTradeId);
    if (!trade) return null;

    return (
      <div className="space-y-6 text-left">
        <div className="flex justify-between items-center gap-4">
          <button 
            onClick={() => setView('welcome')}
            title="Go to Main Screen"
            className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              {strategyMode === 'btb' ? (
                <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-800 drop-shadow-sm" size={20} />
                </div>
              ) : (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                    <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              {strategyMode === 'btb' ? (
                <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
                </span>
              ) : (
                <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
                </span>
              )}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest font-mono",
                strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
              )}>
                Premium Trading Brand
              </span>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-400 font-sans hidden md:block">Trade Evaluation</h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{PAGES.POST_TRADE}</span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 space-y-4 text-left">
          <h3 className="text-sm font-bold text-slate-200">Reflect on Trade Entry and Execution</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Record any emotional state, execution details, or system adherence notes for this trade ({trade.result === 'TP' ? 'Profit' : 'Loss'}).
          </p>

          {/* Voice Prompt Playback Indicator */}
          {settings.voicePlaybackMode !== 'disabled' && (trade.voiceText || trade.voiceAudioUrl) && (
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-center shrink-0",
                  trade.result === 'TP' 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  <Volume2 size={16} />
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans block">Voice Alert (پیام صوتی ویز)</span>
                  <span className="text-xs font-semibold text-slate-350 font-sans block leading-relaxed italic">
                    «{trade.voiceText || "بدون متن (پخش مستقیم فایل صوتی)"}»
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (isVoicePlaying) {
                    stopSpeakText();
                  } else {
                    speakText({ text: trade.voiceText || "", audioUrl: trade.voiceAudioUrl });
                  }
                }}
                title={isVoicePlaying ? "توقف پخش صوتی" : "پخش مجدد این پیام صوتی"}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm select-none border shrink-0",
                  isVoicePlaying
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                    : strategyMode === 'btb'
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                )}
              >
                {isVoicePlaying ? (
                  <>
                    <Square size={13} className="fill-current text-rose-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={13} className="animate-pulse" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            </div>
          )}

          <textarea
            value={postTradeNotes}
            onChange={(e) => setPostTradeNotes(e.target.value)}
            placeholder="Write your mental reflections or system rules checks..."
            className="w-full text-xs font-sans p-3 rounded-xl border border-slate-800 bg-slate-950 text-indigo-300 focus:border-indigo-500 focus:ring-0 transition-all leading-relaxed"
            rows={5}
          />

          <div className="pt-2">
            <button
              onClick={() => handlePostTradeNotesSubmit(false)}
              className={cn(
                "w-full h-24 flex items-center justify-between px-6 rounded-3xl transition-all group cursor-pointer text-left select-none",
                strategyMode === 'btb'
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  strategyMode === 'btb' ? "bg-white/10" : "bg-slate-950/20"
                )}>
                  <CheckCircle2 size={24} className={strategyMode === 'btb' ? "text-white" : "text-slate-950"} />
                </div>
                <div className="text-left select-none">
                  <p className={cn(
                    "font-extrabold text-lg leading-tight",
                    strategyMode === 'btb' ? "text-white" : "text-slate-950"
                  )}>Save Reflections & Complete</p>
                  <p className={cn(
                    "text-xs font-medium font-sans",
                    strategyMode === 'btb' ? "text-indigo-100" : "text-slate-900 opacity-80"
                  )}>
                    Trade {(() => {
                      const currentTradesArr = dailyState?.trades || [];
                      const tIdx = currentTradesArr.findIndex(t => t.id === currentTradeId);
                      return tIdx !== -1 ? tIdx + 1 : currentTradesArr.length;
                    })()} of {settings.maxTradesPerDay}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn("opacity-100 animate-none", strategyMode === 'btb' ? "text-white" : "text-slate-950")} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemSettings = () => {
    return (
      <div className="space-y-6 text-left">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setView('welcome')}
            title="Go to Main Screen"
            className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative bg-slate-900 border border-red-500/30 p-2 rounded-xl flex items-center justify-center">
                <Crown className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" size={20} />
              </div>
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-red-200 via-red-400 to-rose-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                Soheil Keshtkar
                <Sparkles className="text-red-400/80 animate-pulse" size={10} />
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest font-mono text-red-500/60">
                Premium Trading Brand
              </span>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('welcome')}
              className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all active:scale-95"
              title="Return"
            >
              <XCircle size={20} />
            </button>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{PAGES.SYSTEM_SETTINGS}</span>
          </div>
        </div>

        <div className="space-y-8 bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 animate-none">
          {/* Language Selection Block */}
          <div className="space-y-4 font-sans text-left">
            <div className="flex items-center gap-2 text-red-400 text-left">
              <RefreshCw size={18} className="text-red-400" />
              <h3 className="text-sm font-bold text-slate-200 text-left">زبان برنامه / Language</h3>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed text-left font-sans">
              زبان مورد نظر خود را برای رابط کاربری برنامه انتخاب کنید (دیفالت، انگلیسی کامل، یا فارسی کامل).
              <br />
              Select your preferred interface language (Default, Full English, or Full Persian).
            </p>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm text-left">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'default', label: 'پیش‌فرض (Default)', desc: 'مخلوط فارسی/انگلیسی' },
                  { id: 'en', label: 'English (EN)', desc: 'Full English UI' },
                  { id: 'fa', label: 'فارسی (FA)', desc: 'رابط کاربری کاملاً فارسی' }
                ].map((langOption) => (
                  <button
                    key={langOption.id}
                    type="button"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        appLanguage: langOption.id as any
                      }));
                    }}
                    className={cn(
                      "py-3 px-2 rounded-2xl text-xs font-bold transition-all border text-center cursor-pointer flex flex-col items-center justify-center gap-1",
                      (settings.appLanguage || 'default') === langOption.id
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                    )}
                  >
                    <span>{langOption.label}</span>
                    <span className="text-[9px] opacity-60 font-medium">{langOption.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alarm & Reminders Hub Block */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-red-400 text-left">
              <Bell size={18} />
              <h3 className="text-sm font-bold text-slate-200 text-left">Alarm System & Periodic Audio Alerts</h3>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed text-left font-sans">
              Set alarms to remind yourself of chart analysis times at specific intervals (like every 15 minutes) or at specific hours of the day. You can also upload your custom alarm sound.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-5 shadow-sm text-left">
              <div className="flex items-center justify-between text-left">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-200 block text-left">Enable Master Alarm System</span>
                  <span className="text-[10px] text-slate-500 block text-left">Turn all alarms on or off globally</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = settings.alarmSettings || {
                      enabled: false,
                      intervalMinutes: 15,
                      intervalEnabled: false,
                      customTimes: [],
                      customTimesEnabled: false,
                      selectedSoundType: 'default',
                    };
                    updateAlarmSettings({ enabled: !current.enabled });
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                    settings.alarmSettings?.enabled ? "bg-red-600 justify-start flex-row" : "bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.alarmSettings?.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {settings.alarmSettings?.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-slate-200">Interval Alarms</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateAlarmSettings({ intervalEnabled: !settings.alarmSettings?.intervalEnabled })}
                        className={cn(
                          "w-8 h-4 rounded-full p-0.5 transition-colors flex items-center",
                          settings.alarmSettings?.intervalEnabled ? "bg-red-500" : "bg-slate-700"
                        )}
                      >
                        <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", settings.alarmSettings?.intervalEnabled ? "translate-x-4" : "translate-x-0")} />
                      </button>
                    </div>
                    
                    {settings.alarmSettings?.intervalEnabled && (
                      <div className="flex items-center gap-4 pt-1">
                        <input 
                          type="range" min="1" max="60" step="1"
                          value={settings.alarmSettings?.intervalMinutes || 15}
                          onChange={(e) => updateAlarmSettings({ intervalMinutes: parseInt(e.target.value) })}
                          className="flex-1 accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-red-400 min-w-[60px]">
                          {settings.alarmSettings?.intervalMinutes || 15} Min
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Specific Times */}
                  <div className="flex flex-col gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-slate-200">Custom Times</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateAlarmSettings({ customTimesEnabled: !settings.alarmSettings?.customTimesEnabled })}
                        className={cn(
                          "w-8 h-4 rounded-full p-0.5 transition-colors flex items-center",
                          settings.alarmSettings?.customTimesEnabled ? "bg-red-500" : "bg-slate-700"
                        )}
                      >
                        <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", settings.alarmSettings?.customTimesEnabled ? "translate-x-4" : "translate-x-0")} />
                      </button>
                    </div>
                    
                    {settings.alarmSettings?.customTimesEnabled && (
                      <div className="space-y-3 pt-1">
                        <div className="flex gap-2">
                          <input 
                            type="time" 
                            value={newAlarmTime}
                            onChange={e => setNewAlarmTime(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                          />
                          <button
                            onClick={handleAddAlarmTime}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/30"
                          >
                            Add
                          </button>
                        </div>
                        {settings.alarmSettings?.customTimes?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {settings.alarmSettings.customTimes.map(time => (
                              <div key={time} className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-1.5 rounded-lg">
                                <span className="text-xs font-mono font-bold text-slate-300">{time}</span>
                                <button onClick={() => handleDeleteAlarmTime(time)} className="text-slate-500 hover:text-red-400 transition-colors">
                                  <XCircle size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-200 text-left">Alarm Sound</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['default', 'bell', 'digital', 'custom'].map(type => (
                          <button
                            key={type}
                            onClick={() => updateAlarmSettings({ selectedSoundType: type as any })}
                            className={cn(
                              "py-2 px-3 rounded-xl text-xs font-bold transition-all border",
                              settings.alarmSettings?.selectedSoundType === type
                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                            )}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {settings.alarmSettings?.selectedSoundType === 'custom' && (
                      <div className="mt-2">
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-900/50 transition-all cursor-pointer">
                          <div className="text-center">
                            <span className="text-xs font-bold text-slate-300">
                              {settings.alarmSettings?.customSoundName || "Upload Custom Audio"}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">MP3, WAV, OGG</span>
                          </div>
                          <input 
                            type="file" 
                            accept="audio/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateAlarmSettings({ customSoundBase64: reader.result as string, customSoundName: file.name });
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mt-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-200">Volume</span>
                          <span className="text-xs font-mono font-bold text-red-400">{settings.alarmSettings?.volume ?? 80}%</span>
                        </div>
                        <input 
                          type="range" min="25" max="100" step="25"
                          value={settings.alarmSettings?.volume ?? 80}
                          onChange={(e) => updateAlarmSettings({ volume: parseInt(e.target.value) })}
                          className="accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-200">Duration (Loop)</span>
                          <span className="text-xs font-mono font-bold text-red-400">{settings.alarmSettings?.playbackSeconds ?? 30}s</span>
                        </div>
                        <input 
                          type="range" min="5" max="60" step="5"
                          value={settings.alarmSettings?.playbackSeconds ?? 30}
                          onChange={(e) => updateAlarmSettings({ playbackSeconds: parseInt(e.target.value) })}
                          className="accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => stopAlarmSound()}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => {
                          playAlarmSound(
                            settings.alarmSettings?.selectedSoundType || 'default', 
                            settings.alarmSettings?.customSoundBase64, 
                            settings.alarmSettings?.playbackSeconds || 30, 
                            settings.alarmSettings?.volume ?? 80
                          );
                        }}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        <Bell size={14} /> Test Alarm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full System Backup & Restore Block */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-red-400 text-left">
              <Database size={18} />
              <h3 className="text-sm font-bold text-slate-200 text-left">Full System Backup & Restore (پشتیبان‌گیری کامل)</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed text-left font-sans">
              خروجی گرفتن و بازیابی نسخه پشتیبان کامل از تمامی داده‌ها و تنظیمات نرم‌افزار. این فایل شامل تنظیمات هر دو حالت معاملاتی (BTB و کانال)، آلارم‌های سفارشی، جملات صوتی سفارشی ویز (Voice Alert Groups) و کل آرشیو و تاریخچه تراکنش‌های ذخیره‌شده است.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={exportFullBackup}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download size={16} />
                  <span>Export Full Backup (دانلود پشتیبان)</span>
                </button>

                <label
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden text-center animate-none"
                >
                  <Upload size={16} />
                  <span>Import Full Backup (آپلود پشتیبان)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFullBackup}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>

              {fullBackupStatus && (
                <div className={cn(
                  "p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1",
                  fullBackupStatus.success 
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400" 
                    : "bg-rose-950/30 border-rose-500/30 text-rose-400"
                )}>
                  {fullBackupStatus.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed text-left">
                    {fullBackupStatus.message}
                    {fullBackupStatus.success && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-500/80 font-semibold font-mono text-left">
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Reloading application in 3 seconds...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voice Alert Groups Editor */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-red-450 text-left">
              <Volume2 size={18} className="text-red-400" />
              <h3 className="text-sm font-bold text-slate-200 text-left">Voice Alert Groups Configuration (پیکربندی عبارات صوتی ویز)</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed text-left font-sans">
              برنامه مجهز به ۵ گروه صوتی است که هر کدام دارای ۵ متن پیام هستند. سیستم پس از ثبت هر سود یا زیان بر اساس سناریوی مشخص‌‌شده، به صورت کاملاً تصادفی یکی از جملات گروه انتخابی را از طریق موتور صوتی شبیه‌سازی می‌کند. عبارات زیر را به دلخواه خود ویرایش و تست صوتی کنید.
            </p>

            {/* Voice Control Settings Block (تنظیمات پخش و حجم صدا) */}
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-sm text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Active / Disabled Toggle */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-200">وضعیت کل سیستم صوتی (Active/Disabled)</span>
                  <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          voicePlaybackMode: prev.voicePlaybackMode === 'disabled' ? 'auto' : prev.voicePlaybackMode
                        }));
                      }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                        settings.voicePlaybackMode !== 'disabled'
                          ? "bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-extrabold"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      فعال (Enabled)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          voicePlaybackMode: 'disabled'
                        }));
                      }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                        settings.voicePlaybackMode === 'disabled'
                          ? "bg-rose-950 border border-rose-500/20 text-rose-400 font-extrabold"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      غیرفعال (Disabled)
                    </button>
                  </div>
                </div>

                {/* 2. Playback Mode (Auto / Manual) */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-200">روش پخش صوتی (Playback Mode)</span>
                  <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      disabled={settings.voicePlaybackMode === 'disabled'}
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          voicePlaybackMode: 'auto'
                        }));
                      }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed",
                        settings.voicePlaybackMode === 'auto'
                          ? strategyMode === 'btb'
                            ? "bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-extrabold"
                            : "bg-amber-950 border border-amber-500/30 text-amber-300 font-extrabold"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      خودکار (Auto)
                    </button>
                    <button
                      type="button"
                      disabled={settings.voicePlaybackMode === 'disabled'}
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          voicePlaybackMode: 'manual'
                        }));
                      }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed",
                        settings.voicePlaybackMode === 'manual'
                          ? strategyMode === 'btb'
                            ? "bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-extrabold"
                            : "bg-amber-950 border border-amber-500/30 text-amber-300 font-extrabold"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      دستی (Manual)
                    </button>
                  </div>
                </div>

                {/* 3. Volume Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">حجم صدای پیام صوتی (Volume)</span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {settings.voicePlaybackVolume ?? 80}%
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <input 
                      type="range" min="0" max="100" step="10"
                      disabled={settings.voicePlaybackMode === 'disabled'}
                      value={settings.voicePlaybackVolume ?? 80}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings(prev => ({
                          ...prev,
                          voicePlaybackVolume: val
                        }));
                      }}
                      className="accent-red-500 w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono select-none">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("space-y-3 transition-all duration-300", settings.voicePlaybackMode === 'disabled' && "opacity-40 pointer-events-none select-none")}>
              {(Object.keys(defaultVoiceGroups) as Array<keyof typeof defaultVoiceGroups>).map(groupKey => {
                const isExpanded = expandedVoiceGroup === groupKey;
                const info = {
                  group1: {
                    title: "گروه ۱: سودهای اول یا کلی (Profit / TPs)",
                    desc: "پیام‌های تمرکز و انگیزه برای زمانی که معامله شما با سود (TP) بسته می‌شود.",
                    borderClass: "border-emerald-500/30",
                    textClass: "text-emerald-400",
                    bgClass: "bg-emerald-500/5"
                  },
                  group2: {
                    title: "گروه ۲: حد ضررهای اول یا کلی (First Stop Loss / SLs)",
                    desc: "پیام‌های آرامش، یادآوری مدیریت سرمایه و جلوگیری از ترید انتقامی پس از اولین استاپ.",
                    borderClass: "border-rose-500/30",
                    textClass: "text-rose-400",
                    bgClass: "bg-rose-500/5"
                  },
                  group3: {
                    title: "گروه ۳: دومین باخت یا هشدار حد ضرر (Warning Stop Losses)",
                    desc: "جملات جدی برای کنترل هیجانات منفی و متقاعد کردن شما به استراحت چند دقیقه‌ای.",
                    borderClass: "border-amber-500/30",
                    textClass: "text-amber-400",
                    bgClass: "bg-amber-500/5"
                  },
                  group4: {
                    title: "گروه ۴: لمس حد باخت روزانه و خروج نهایی (Daily Cap Hit)",
                    desc: "پیام‌های بسیار مقتدرانه و بازدارنده برای بستن فوری لپ‌تاپ و خاموش کردن کامل سیستم.",
                    borderClass: "border-red-500/30",
                    textClass: "text-red-400",
                    bgClass: "bg-red-500/5"
                  },
                  group5: {
                    title: "گروه ۵: یادآورهای متفرقه دیسیپلین ترید (Custom Discipline)",
                    desc: "جملات طلایی و مربی‌گری روانشناسی معاملات برای حفظ اصول طلایی ترید و انضباط.",
                    borderClass: "border-indigo-500/30",
                    textClass: "text-indigo-400",
                    bgClass: "bg-indigo-500/5"
                  }
                }[groupKey];

                const textsList = voiceGroups[groupKey] || [];

                return (
                  <div 
                    key={groupKey} 
                    className={cn(
                      "border rounded-2xl transition-all overflow-hidden bg-slate-900/60",
                      isExpanded ? cn("border-slate-700 shadow-md", info.borderClass) : "border-slate-800/60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedVoiceGroup(isExpanded ? null : groupKey)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-850/50 transition-all text-left"
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <span className={cn("text-xs font-black font-sans flex items-center gap-2", info.textClass)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                            info.textClass === "text-emerald-400" ? "bg-emerald-400" : 
                            info.textClass === "text-rose-400" ? "bg-rose-400" : 
                            info.textClass === "text-amber-400" ? "bg-amber-400" : 
                            info.textClass === "text-red-400" ? "bg-red-400" : "bg-indigo-400"
                          )} />
                          {info.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans leading-relaxed">
                          {info.desc}
                        </span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={cn("text-slate-550 transition-transform duration-200 shrink-0", isExpanded && "transform rotate-180")} 
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-4">
                        {textsList.map((item, idx) => {
                          const itemText = typeof item === 'object' && item !== null ? item.text : String(item || '');
                          const itemAudioUrl = typeof item === 'object' && item !== null ? item.audioUrl : '';
                          const itemFileName = typeof item === 'object' && item !== null ? item.fileName : '';

                          return (
                            <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-left">
                              {/* Row 1: Index and Persian Phrase Input */}
                              <div className="flex gap-2.5 items-center">
                                <span className="text-[10px] font-black font-mono text-slate-500 w-4 text-center">{idx + 1}</span>
                                <input
                                  type="text"
                                  value={itemText}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setVoiceGroups(prev => {
                                      const updated = [...prev[groupKey]];
                                      updated[idx] = { ...updated[idx], text: val };
                                      return { ...prev, [groupKey]: updated };
                                    });
                                  }}
                                  className="flex-1 text-xs font-sans px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:border-red-500/30 focus:ring-0 transition-all leading-relaxed"
                                  placeholder={`جمله صوتی شماره ${idx + 1}...`}
                                />
                              </div>

                              {/* Row 2: File Selector, Speaker (Play) Button, and Clear Trash Button */}
                              <div className="pl-[26px] w-full flex flex-col gap-1.5">
                                <div className="flex gap-2 items-center w-full">
                                  {/* Real file input */}
                                  <input
                                    type="file"
                                    id={`file-input-${groupKey}-${idx}`}
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;

                                      // Limit size to 1.5MB to avoid localStorage limit issues
                                      if (file.size > 1.5 * 1024 * 1024) {
                                        setUploadErrorItem({
                                          group: groupKey,
                                          idx,
                                          message: "حجم فایل باید کمتر از 1.5 مگابایت باشد تا در حافظه مرورگر ذخیره شود."
                                        });
                                        // auto clear after 5 seconds
                                        setTimeout(() => {
                                          setUploadErrorItem(curr => (curr?.group === groupKey && curr?.idx === idx) ? null : curr);
                                        }, 5000);
                                        return;
                                      }

                                      setUploadErrorItem(null); // Clear previous errors

                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        setVoiceGroups(prev => {
                                          const updated = [...prev[groupKey]];
                                          updated[idx] = { 
                                            ...updated[idx], 
                                            audioUrl: base64,
                                            fileName: file.name
                                          };
                                          return { ...prev, [groupKey]: updated };
                                        });
                                      };
                                      reader.onerror = () => {
                                        setUploadErrorItem({
                                          group: groupKey,
                                          idx,
                                          message: "خطا در خواندن فایل صوتی."
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />

                                  {/* Clickable file selector/display container */}
                                  <div
                                    onClick={() => {
                                      document.getElementById(`file-input-${groupKey}-${idx}`)?.click();
                                    }}
                                    className={cn(
                                      "flex-1 text-[11px] font-sans px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none text-right flex items-center justify-between min-w-0",
                                      itemAudioUrl ? "border-emerald-500/10 bg-emerald-950/5 text-slate-300 hover:border-emerald-500/30" : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-red-500/20"
                                    )}
                                  >
                                    <span className="truncate font-mono text-[10px] pr-1">
                                      {itemAudioUrl 
                                        ? '🎵 فایل صوتی لود شده از سیستم' 
                                        : '📁 جهت انتخاب فایل صوتی از سیستم کلیک کنید...'}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-sans whitespace-nowrap mr-2 pl-1 shrink-0">
                                      {itemAudioUrl && itemFileName 
                                        ? itemFileName 
                                        : '(کلیک برای انتخاب)'}
                                    </span>
                                  </div>

                                  {/* Clear Voice File Button */}
                                  {itemAudioUrl && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setVoiceGroups(prev => {
                                          const updated = [...prev[groupKey]];
                                          updated[idx] = { ...updated[idx], audioUrl: "", fileName: "" };
                                          return { ...prev, [groupKey]: updated };
                                        });
                                      }}
                                      title="حذف فایل صوتی"
                                      className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-950/10 text-rose-400 hover:bg-rose-950/30 hover:border-rose-500/40 transition-all active:scale-95 cursor-pointer shrink-0"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}

                                  {/* Playback Test (Speaker) Button positioned in place of manual input field/toggle */}
                                  <button
                                    type="button"
                                    onClick={() => speakText({ text: itemText, audioUrl: itemAudioUrl })}
                                    title="پخش و تست شنیدن این پیام صوتی"
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer text-[10px] font-sans font-bold select-none",
                                      info.textClass === "text-emerald-400" ? "bg-emerald-950/20 border-emerald-500/20 hover:bg-emerald-950/40 text-emerald-400" :
                                      info.textClass === "text-rose-400" ? "bg-rose-950/20 border-rose-500/20 hover:bg-rose-950/40 text-rose-400" :
                                      info.textClass === "text-amber-400" ? "bg-amber-950/20 border-amber-500/20 hover:bg-amber-950/40 text-amber-400" :
                                      info.textClass === "text-red-400" ? "bg-red-950/20 border-red-500/20 hover:bg-red-500/40 text-red-400" :
                                      "bg-indigo-950/20 border-indigo-500/20 hover:bg-indigo-950/40 text-indigo-400"
                                    )}
                                  >
                                    <Volume2 size={12} />
                                    <span>پخش صدا</span>
                                  </button>
                                </div>
                                {uploadErrorItem?.group === groupKey && uploadErrorItem?.idx === idx && (
                                  <span className="text-[9px] text-rose-400 font-sans mt-0.5 animate-pulse">
                                    ⚠️ {uploadErrorItem.message}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Window Dimensions Block */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-red-400 text-left">
              <Maximize2 size={18} />
              <h3 className="text-sm font-bold text-slate-200 text-left">
                {settings.appLanguage === 'fa' ? 'تنظیم ابعاد پنجره (Window Dimensions)' : 'Window Dimensions (Fold / Unfold)'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed text-left font-sans">
              {settings.appLanguage === 'fa' 
                ? 'ابعاد پنجره برنامه را در دو حالت بزرگ (Unfold) و جمع‌شده (Fold) به صورت پیکسل تنظیم کنید. در صورت تغییر ابعاد، تغییرات فوراً اعمال خواهند شد.'
                : 'Customize the width and height of the window for both states. Changes are applied instantly so you can test them.'}
            </p>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unfolded state dimensions */}
                <div className="space-y-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-300 block border-b border-slate-800/80 pb-1.5 mb-1 text-left">
                    {settings.appLanguage === 'fa' ? 'حالت معمولی / بزرگ (Unfolded)' : 'Unfolded State (Normal)'}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block text-left">
                        {settings.appLanguage === 'fa' ? 'عرض (Width)' : 'Width (px)'}
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="2000"
                        value={settings.windowDimensions?.unfoldedWidth ?? 365}
                        onChange={(e) => {
                          const val = Math.max(40, Math.min(2000, parseInt(e.target.value) || 365));
                          setSettings(prev => ({
                            ...prev,
                            windowDimensions: {
                              ...(prev.windowDimensions || { unfoldedWidth: 365, unfoldedHeight: 740, foldedWidth: 365, foldedHeight: 100 }),
                              unfoldedWidth: val
                            }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500/50 leading-relaxed text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block text-left">
                        {settings.appLanguage === 'fa' ? 'ارتفاع (Height)' : 'Height (px)'}
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="2000"
                        value={settings.windowDimensions?.unfoldedHeight ?? 740}
                        onChange={(e) => {
                          const val = Math.max(40, Math.min(2000, parseInt(e.target.value) || 740));
                          setSettings(prev => ({
                            ...prev,
                            windowDimensions: {
                              ...(prev.windowDimensions || { unfoldedWidth: 365, unfoldedHeight: 740, foldedWidth: 365, foldedHeight: 100 }),
                              unfoldedHeight: val
                            }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500/50 leading-relaxed text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* Folded state dimensions */}
                <div className="space-y-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-300 block border-b border-slate-800/80 pb-1.5 mb-1 text-left">
                    {settings.appLanguage === 'fa' ? 'حالت فشرده / جمع‌شده (Folded)' : 'Folded State (Collapsed)'}
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block text-left">
                        {settings.appLanguage === 'fa' ? 'عرض (Width)' : 'Width (px)'}
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="2000"
                        value={settings.windowDimensions?.foldedWidth ?? 365}
                        onChange={(e) => {
                          const val = Math.max(40, Math.min(2000, parseInt(e.target.value) || 365));
                          setSettings(prev => ({
                            ...prev,
                            windowDimensions: {
                              ...(prev.windowDimensions || { unfoldedWidth: 365, unfoldedHeight: 740, foldedWidth: 365, foldedHeight: 100 }),
                              foldedWidth: val
                            }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500/50 leading-relaxed text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block text-left">
                        {settings.appLanguage === 'fa' ? 'ارتفاع (Height)' : 'Height (px)'}
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="2000"
                        value={settings.windowDimensions?.foldedHeight ?? 100}
                        onChange={(e) => {
                          const val = Math.max(40, Math.min(2000, parseInt(e.target.value) || 100));
                          setSettings(prev => ({
                            ...prev,
                            windowDimensions: {
                              ...(prev.windowDimensions || { unfoldedWidth: 365, unfoldedHeight: 740, foldedWidth: 365, foldedHeight: 100 }),
                              foldedHeight: val
                            }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500/50 leading-relaxed text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      windowDimensions: {
                        unfoldedWidth: 365,
                        unfoldedHeight: 740,
                        foldedWidth: 365,
                        foldedHeight: 100,
                      }
                    }));
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 rounded-xl border border-red-500/20 cursor-pointer transition-all"
                >
                  <RotateCcw size={12} />
                  <span>{settings.appLanguage === 'fa' ? 'بازنشانی به پیش‌فرض (Reset Defaults)' : 'Reset to Default (365x740 / 365x100)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Screenshot Automation Block */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-red-400 text-left">
              <Camera size={18} />
              <h3 className="text-sm font-bold text-slate-200 text-left">Automated Screenshots & Documenter (اسکرین‌شات خودکار معاملات)</h3>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed text-left font-sans">
              سیستم اسکرین‌شات خودکار می‌تواند هنگام تایید معامله (Confirm Log Trade) و پس از ثبت یادداشت‌های پس از معامله (Save Reflection) از مانیتور انتخابی شما عکسبرداری کرده و با فرمت منظم تاریخ و نام استراتژی ذخیره کند.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm text-left">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between text-left">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-200 block text-left">فعالسازی اسکرین‌شات خودکار (Auto Screenshots)</span>
                  <span className="text-[10px] text-slate-500 block text-left">تهیه خودکار اسکرین‌شات در زمان ثبت ورود و رفلکشن</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      screenshotSettings: {
                        ...(prev.screenshotSettings || { enabled: false, monitorIndex: 0, folderPath: 'C:\\BtbScreenshots' }),
                        enabled: !(prev.screenshotSettings?.enabled)
                      }
                    }));
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                    settings.screenshotSettings?.enabled ? "bg-red-600" : "bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.screenshotSettings?.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {settings.screenshotSettings?.enabled && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Save Folder Path */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-200 text-left">مسیر ذخیره‌سازی تصاویر (Save Directory Path)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.screenshotSettings?.folderPath || 'C:\\BtbScreenshots'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings(prev => ({
                            ...prev,
                            screenshotSettings: {
                              ...(prev.screenshotSettings || { enabled: true, monitorIndex: 0, folderPath: 'C:\\BtbScreenshots' }),
                              folderPath: val
                            }
                          }));
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500/50 leading-relaxed text-left"
                        placeholder="e.g. C:\BtbScreenshots or D:\Trading\Screenshots"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof window !== 'undefined' && 'electronAPI' in window) {
                            const api = (window as any).electronAPI;
                            if (typeof api.selectDirectory === 'function') {
                              const result = await api.selectDirectory();
                              if (result && result.success && result.path) {
                                setSettings(prev => ({
                                  ...prev,
                                  screenshotSettings: {
                                    ...(prev.screenshotSettings || { enabled: true, monitorIndex: 0, folderPath: 'C:\\BtbScreenshots' }),
                                    folderPath: result.path
                                  }
                                }));
                              }
                            }
                          } else {
                            alert(settings.appLanguage === 'fa' 
                              ? 'انتخاب پوشه فقط در نسخه دسکتاپ برنامه فعال است. لطفاً در مرورگر مسیر را به صورت دستی وارد کنید.' 
                              : 'Folder selector is only available in the Desktop App. Please enter the path manually in browser.');
                          }
                        }}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        title={settings.appLanguage === 'fa' ? 'انتخاب پوشه از سیستم' : 'Select Folder from computer'}
                      >
                        <FolderOpen size={14} className="text-red-400" />
                        <span>{settings.appLanguage === 'fa' ? 'انتخاب پوشه' : 'Select Folder'}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 text-left">
                      تصاویر با نام‌هایی مانند <code className="text-red-400 font-mono">YYYY-MM-DD_HH-mm-ss_strategy_entry.png</code> ذخیره خواهند شد.
                    </span>
                  </div>

                  {/* Monitor Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-200 text-left">انتخاب مانیتور (Monitor Screen Selection)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              screenshotSettings: {
                                ...(prev.screenshotSettings || { enabled: true, monitorIndex: 0, folderPath: 'C:\\BtbScreenshots' }),
                                monitorIndex: idx
                              }
                            }));
                          }}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                            settings.screenshotSettings?.monitorIndex === idx
                              ? "bg-red-500/20 border-red-500/50 text-red-400"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                          )}
                        >
                          مانیتور {idx + 1}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 text-left">
                      در صورتی که چند مانیتور به لپ‌تاپ متصل است، شماره صفحه مورد نظر را انتخاب کنید (مانیتور ۱ صفحه اصلی است).
                    </span>
                  </div>

                  {/* Test Screenshot Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        const timeStr = format(new Date(), 'HH-mm-ss');
                        const strategy = strategyMode === 'btb' ? 'btb' : 'channel';
                        const fileName = `${today}_${timeStr}_${strategy}_test.png`;
                        const folderPath = settings.screenshotSettings?.folderPath || 'C:\\BtbScreenshots';
                        const monitorIndex = settings.screenshotSettings?.monitorIndex ?? 0;

                        if (typeof window !== 'undefined' && 'electronAPI' in window) {
                          const api = (window as any).electronAPI;
                          const result = await api.takeScreenshot({ monitorIndex, folderPath, fileName });
                          if (result.success) {
                            alert(`اسکرین‌شات تستی با موفقیت ذخیره شد:\n${result.path}`);
                          } else {
                            alert(`خطا در تهیه اسکرین‌شات:\n${result.error}`);
                          }
                        } else {
                          const simulatedFolderPath = `${folderPath}\\${today}`;
                          alert(`[نمایش تحت وب - شبیه‌سازی اسکرین‌شات]\nیک عکس تستی در مسیر "${simulatedFolderPath}" از مانیتور ${monitorIndex + 1} شبیه‌سازی شد.\n(این قابلیت در نسخه دسکتاپ ویندوز به صورت واقعی عکس می‌گیرد)`);
                        }
                      }}
                      className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Camera size={14} /> تهیه اسکرین‌شات تستی (Test Grab)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Master Reset Block */}
          <div className="space-y-4 border-t border-slate-800 pt-6 font-sans text-left">
            <div className="flex items-center gap-2 text-rose-500 text-left">
              <Trash2 size={18} />
              <h3 className="text-sm font-bold text-slate-200 text-left">
                {settings.appLanguage === 'fa' ? 'منطقه خطر و ریست فکتوری' : 'Danger Zone & Factory Reset'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed text-left font-sans">
              {settings.appLanguage === 'fa' 
                ? 'پاک کردن تمامی سوابق معاملاتی، بازنشانی قوانین سیستم به پیش‌فرض‌ها و پاکسازی حافظه کش برنامه. این عمل غیرقابل برگشت است.'
                : 'Deleting all trading records, resetting system rules to defaults, and clearing all browser cache. This action is irreversible.'
              }
            </p>
            <button
              onClick={() => {
                const confirmed = confirm(
                  settings.appLanguage === 'fa' 
                    ? 'آیا از ریست فکتوری و پاک کردن تمامی اطلاعات و تنظیمات مطمئن هستید؟ این عمل غیرقابل بازگشت است.'
                    : 'Are you absolutely sure you want to reset everything? This will delete all history, configurations, and rules.'
                );
                if (confirmed) {
                  localStorage.clear();
                  if (typeof window !== 'undefined' && 'electronAPI' in window) {
                    const api = (window as any).electronAPI;
                    if (api && typeof api.clearAllStatesSync === 'function') {
                      api.clearAllStatesSync();
                    }
                    if (api && typeof api.setWindowCollapsed === 'function') {
                      api.setWindowCollapsed(false, { unfoldedWidth: 365, unfoldedHeight: 740, foldedWidth: 365, foldedHeight: 100 });
                    }
                  }
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              {settings.appLanguage === 'fa' ? 'ریست فکتوری و پاکسازی کامل کل اطلاعات برنامه' : 'Reset Entire Application Data'}
            </button>
          </div>

          <button 
            onClick={() => setView('welcome')}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-red-500 active:scale-95 transition-all cursor-pointer font-sans"
          >
            Save Changes & Return to Main Screen
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setView('welcome')}
          title="Go to Main Screen"
          className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="relative">
            {strategyMode === 'btb' ? (
              <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                <Crown className="text-amber-800 drop-shadow-sm" size={20} />
              </div>
            ) : (
              <>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col text-left whitespace-nowrap">
            {strategyMode === 'btb' ? (
              <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                Soheil Keshtkar
                <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
              </span>
            ) : (
              <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                Soheil Keshtkar
                <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
              </span>
            )}
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest font-mono",
              strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
            )}>
              Premium Trading Brand
            </span>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView(openedFrom === 'welcome' ? 'welcome' : 'dashboard')}
            className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all active:scale-95"
            title="Cancel and Return"
          >
            <XCircle size={20} />
          </button>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{PAGES.SETTINGS}</span>
        </div>
      </div>

      <div className="space-y-8 bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 animate-none">
        <div className="space-y-4 text-left">
          {/* Lock Switch Header for Section 1 */}
          <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 mb-2 select-none">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">Daily Trade Limit Cap</span>
            <button
              type="button"
              onClick={() => setLimitCapUnlocked(prev => !prev)}
              className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm animate-none"
            >
              {limitCapUnlocked ? (
                <>
                  <Unlock size={13} className="text-emerald-400 animate-pulse animate-none" />
                  <span className="text-[10px] font-black font-mono text-emerald-400">EDITABLE</span>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-slate-500" />
                  <span className="text-[10px] font-black font-mono text-slate-500">LOCKED</span>
                </>
              )}
            </button>
          </div>

          <div className={cn("space-y-2 transition-all duration-300", !limitCapUnlocked && "opacity-50")}>
            <label className="text-xs font-bold text-slate-300 block">Daily Trade Limit Cap</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="1" max="10" step="1"
                disabled={!limitCapUnlocked}
                value={settings.maxTradesPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTradesPerDay: parseInt(e.target.value) }))}
                className="flex-1 accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-10 text-center font-mono font-bold text-indigo-400 bg-slate-850 px-2 py-1 rounded border border-slate-800">{settings.maxTradesPerDay}</span>
            </div>
          </div>

          <div className={cn("space-y-2 transition-all duration-300", !limitCapUnlocked && "opacity-50")}>
            <label className="text-xs font-bold text-slate-300 block">Daily Profit Target Limit (Count of TPs)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="1" max="10" step="1"
                disabled={!limitCapUnlocked}
                value={settings.maxWinsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, maxWinsPerDay: parseInt(e.target.value) }))}
                className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-10 text-center font-mono font-bold text-emerald-400 bg-slate-850 px-2 py-1 rounded border border-slate-800">{settings.maxWinsPerDay}</span>
            </div>
          </div>

          <div className={cn("space-y-2 transition-all duration-300", !limitCapUnlocked && "opacity-50")}>
            <label className="text-xs font-bold text-slate-300 block">Consecutive Loss Stop Gap (SLs in a row)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="1" max="10" step="1"
                disabled={!limitCapUnlocked}
                value={settings.maxConsecutiveLosses}
                onChange={(e) => setSettings(prev => ({ ...prev, maxConsecutiveLosses: parseInt(e.target.value) }))}
                className="flex-1 accent-rose-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-10 text-center font-mono font-bold text-rose-400 bg-slate-850 px-2 py-1 rounded border border-slate-800">{settings.maxConsecutiveLosses}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800 pt-6 text-left">
          {/* Lock Switch Header for Section 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 mb-2 select-none">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">
                {settings.appLanguage === 'fa' ? 'بخش احتمال برد تسلسل معاملات' : 'Trading Sequence Win Probabilities'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {settings.appLanguage === 'fa' ? 'نمایش این بخش در منوی اصلی و قبل معامله' : 'Show this section in main dashboard and pre-trade views'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3 mr-1">
                <span className="text-[10px] font-bold text-slate-450 font-mono">
                  {settings.appLanguage === 'fa' 
                    ? (settings.sequenceProbabilitiesEnabled !== false ? 'فعال' : 'غیرفعال') 
                    : (settings.sequenceProbabilitiesEnabled !== false ? 'ENABLED' : 'DISABLED')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      sequenceProbabilitiesEnabled: prev.sequenceProbabilitiesEnabled === false ? true : false
                    }));
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                    settings.sequenceProbabilitiesEnabled !== false ? "bg-red-600" : "bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.sequenceProbabilitiesEnabled !== false ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {settings.sequenceProbabilitiesEnabled !== false && (
                <button
                  type="button"
                  onClick={() => setSequenceProbUnlocked(prev => !prev)}
                  className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm animate-none"
                >
                  {sequenceProbUnlocked ? (
                    <>
                      <Unlock size={13} className="text-emerald-400 animate-pulse animate-none" />
                      <span className="text-[10px] font-black font-mono text-emerald-400">EDITABLE</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} className="text-slate-500" />
                      <span className="text-[10px] font-black font-mono text-slate-500">LOCKED</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {settings.sequenceProbabilitiesEnabled !== false ? (
            <>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Configure the success probability (%) based on the daily sequence of results registered (W: Profit / L: Loss).
              </p>
              
              <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 text-left transition-all duration-300", !sequenceProbUnlocked && "opacity-50")}>
                {[
                  { id: 'LL', label: 'After two consecutive losses (LL)' },
                  { id: 'WW', label: 'After two consecutive wins (WW)' },
                  { id: 'LLW', label: 'After LL then W (LLW)' },
                  { id: 'WLL', label: 'After W then LL (WLL)' },
                  { id: 'LWW', label: 'After L then WW (LWW)' },
                  { id: 'LWL', label: 'After L, W, L (LWL)' },
                  { id: 'WWL', label: 'After WW then L (WWL)' },
                  { id: 'WLW', label: 'After W, L, W (WLW)' },
                  { id: 'LLL', label: 'After three consecutive losses (LLL)' },
                  { id: 'WWW', label: 'After three consecutive wins (WWW)' },
                  { id: 'LW', label: 'After Loss then Win (LW)' },
                  { id: 'WL', label: 'After Win then Loss (WL)' }
                ].map((item) => {
                  const val = settings.sequenceProbabilities?.[item.id] ?? 50;
                  return (
                    <div key={item.id} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs text-left">
                        <span className="font-bold text-slate-300 font-sans">{item.label}</span>
                        <span className="font-mono font-bold text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {val}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="100" step="1"
                          disabled={!sequenceProbUnlocked}
                          value={val}
                          onChange={(e) => {
                            const newProb = parseFloat(e.target.value);
                            setSettings(prev => ({
                              ...prev,
                              sequenceProbabilities: {
                                ...(prev.sequenceProbabilities || defaultSequenceProbabilities),
                                [item.id]: newProb
                              }
                            }));
                          }}
                          className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-3xl text-center text-slate-400 text-xs py-8">
              {settings.appLanguage === 'fa' 
                ? 'بخش احتمال آماری معاملات غیرفعال است و در منوها نمایش داده نخواهد شد.' 
                : 'Trading Sequence Probability section is disabled and will not be displayed in the app.'}
            </div>
          )}
        </div>

        <div className="space-y-6 border-t border-slate-800 pt-6 text-left">
          {/* Lock Switch Header for Section 3 */}
          <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 mb-2 select-none">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">Dynamic Risk & Sizing System</span>
            <button
              type="button"
              onClick={() => setRiskMgmtUnlocked(prev => !prev)}
              className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm animate-none"
            >
              {riskMgmtUnlocked ? (
                <>
                  <Unlock size={13} className="text-emerald-400 animate-pulse animate-none" />
                  <span className="text-[10px] font-black font-mono text-emerald-400">EDITABLE</span>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-slate-500" />
                  <span className="text-[10px] font-black font-mono text-slate-500">LOCKED</span>
                </>
              )}
            </button>
          </div>

          <div className={cn("bg-slate-950/40 p-5 rounded-3xl border border-slate-800/65 space-y-4 transition-all duration-300", !riskMgmtUnlocked && "opacity-55")}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">Dynamic Risk Management & Sizing System</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl text-left">
                  Dynamic multiplier scaling based on historical win rates over a defined analytical lookback sequence to recommend optimal volume for your next trade.
                </p>
              </div>
              
              <button
                type="button"
                disabled={!riskMgmtUnlocked}
                onClick={() => {
                  const isEnabled = settings.positionSizing?.enabled !== false;
                  setSettings(prev => ({
                    ...prev,
                    positionSizing: {
                      ...(prev.positionSizing || defaultPositionSizing),
                      enabled: !isEnabled
                    }
                  }));
                }}
                className={cn(
                  "flex items-center gap-3 self-start sm:self-center bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800 transition-all cursor-pointer shadow-inner animate-none",
                  !riskMgmtUnlocked && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="text-[11px] font-bold text-slate-400 select-none">System Status:</span>
                <div className={cn(
                  "w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center",
                  (settings.positionSizing?.enabled !== false) ? "bg-indigo-500" : "bg-slate-800"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-slate-100 shadow-md transform transition-transform duration-200",
                    (settings.positionSizing?.enabled !== false) ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-black font-sans tracking-wide min-w-[50px] text-center",
                  (settings.positionSizing?.enabled !== false) ? "text-indigo-400" : "text-slate-500"
                )}>
                  {(settings.positionSizing?.enabled !== false) ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-slate-800/60 text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300">Calculated Win Rate (Sizing Disabled)</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed text-left">
                  Show calculated historical win rate on the dashboard even when the Dynamic Risk Management & Sizing System is turned off.
                </p>
              </div>
              
              <button
                type="button"
                disabled={!riskMgmtUnlocked}
                onClick={() => setShowWinRateOnlyWhenDisabled(prev => !prev)}
                className={cn(
                  "flex items-center gap-3 self-start sm:self-center bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800 transition-all cursor-pointer shadow-inner animate-none",
                  !riskMgmtUnlocked && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="text-[11px] font-bold text-slate-400 select-none">Show Win Rate:</span>
                <div className={cn(
                  "w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center",
                  showWinRateOnlyWhenDisabled ? "bg-indigo-500" : "bg-slate-800"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-slate-100 shadow-md transform transition-transform duration-200",
                    showWinRateOnlyWhenDisabled ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-black font-sans tracking-wide min-w-[50px] text-center",
                  showWinRateOnlyWhenDisabled ? "text-indigo-400" : "text-slate-500"
                )}>
                  {showWinRateOnlyWhenDisabled ? "On" : "Off"}
                </span>
              </button>
            </div>

            {settings.positionSizing?.enabled !== false && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-slate-800/60 text-left">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-300">Compact Sizing Card UI Layout</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed text-left">
                      Hide the full queue history sequence and simulation markers; only show the main suggested multipliers dashboard.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    disabled={!riskMgmtUnlocked}
                    onClick={() => {
                      const isSimplified = settings.positionSizing?.simplified === true;
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          simplified: !isSimplified
                        }
                      }));
                    }}
                    className={cn(
                      "flex items-center gap-3 self-start sm:self-center bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800 transition-all cursor-pointer shadow-inner animate-none",
                      !riskMgmtUnlocked && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span className="text-[11px] font-bold text-slate-400 select-none">Compact UI:</span>
                    <div className={cn(
                      "w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center",
                      (settings.positionSizing?.simplified === true) ? "bg-indigo-500" : "bg-slate-800"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-slate-100 shadow-md transform transition-transform duration-200",
                        (settings.positionSizing?.simplified === true) ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs font-black font-sans tracking-wide min-w-[50px] text-center",
                      (settings.positionSizing?.simplified === true) ? "text-indigo-400" : "text-slate-500"
                    )}>
                      {(settings.positionSizing?.simplified === true) ? "On" : "Off"}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Lookback */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">Statistical History Lookback Sequence Window (Num Trades)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="5" max="100" step="1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={settings.positionSizing?.lookback ?? 40}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          lookback: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {settings.positionSizing?.lookback ?? 40}
                  </span>
                </div>
              </div>

              {/* Low Threshold */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">Low Win Rate Threshold</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0" max="100" step="1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={Math.round((settings.positionSizing?.lowThreshold ?? 0.58) * 100)}
                    onChange={(e) => {
                      const val = parseFloat((parseInt(e.target.value) / 100).toFixed(2));
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          lowThreshold: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {Math.round((settings.positionSizing?.lowThreshold ?? 0.58) * 100)}%
                  </span>
                </div>
              </div>

              {/* High Threshold */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">High Win Rate Threshold</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0" max="100" step="1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={Math.round((settings.positionSizing?.highThreshold ?? 0.62) * 100)}
                    onChange={(e) => {
                      const val = parseFloat((parseInt(e.target.value) / 100).toFixed(2));
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          highThreshold: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {Math.round((settings.positionSizing?.highThreshold ?? 0.62) * 100)}%
                  </span>
                </div>
              </div>

              {/* Low Risk */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">Reduced Volume Multiplier (Lower Risk Scale)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0.1" max="3.0" step="0.1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={settings.positionSizing?.lowRisk ?? 0.7}
                    onChange={(e) => {
                      const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          lowRisk: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {(settings.positionSizing?.lowRisk ?? 0.7).toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Normal Risk */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">Normal Volume Multiplier (Standard Risk Scale)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0.1" max="3.0" step="0.1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={settings.positionSizing?.normalRisk ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          normalRisk: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {(settings.positionSizing?.normalRisk ?? 1.0).toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* High Risk */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/60 text-left">
                <label className="text-xs font-bold text-slate-300 block">Increased Volume Multiplier (Higher Risk Scale)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0.1" max="3.0" step="0.1"
                    disabled={settings.positionSizing?.enabled === false || !riskMgmtUnlocked}
                    value={settings.positionSizing?.highRisk ?? 1.2}
                    onChange={(e) => {
                      const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          highRisk: val
                        }
                      }));
                    }}
                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {(settings.positionSizing?.highRisk ?? 1.2).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>

            {/* Seed History */}
            <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-sans text-left">
              <div>
                <label className="text-xs font-bold text-slate-200 block">Initial Simulation Seed History (For Win Rate Balance & Calibration)</label>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5 text-left">
                  Enter simulated prior results separated by space: Use uppercase <span className="font-mono text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">W</span> for Win (TP) and <span className="font-mono text-rose-400 bg-slate-900 px-1 py-0.5 rounded">L</span> for Loss (SL) (e.g., W L W W L). Real live trades naturally replace this sequence from newest to oldest.
                </p>
              </div>

              <textarea 
                value={settings.positionSizing?.seedHistoryString ?? ""}
                disabled={!riskMgmtUnlocked}
                onChange={(e) => {
                  const text = e.target.value;
                  setSettings(prev => ({
                    ...prev,
                    positionSizing: {
                      ...(prev.positionSizing || defaultPositionSizing),
                      seedHistoryString: text
                    }
                  }));
                }}
                rows={3}
                placeholder="W L W W L..."
                className={cn(
                  "w-full text-xs font-mono p-3 rounded-xl border border-slate-800 bg-slate-900 text-indigo-300 focus:border-indigo-500 focus:ring-0 transition-all leading-relaxed",
                  !riskMgmtUnlocked && "opacity-50 cursor-not-allowed"
                )}
              />

              <div className="flex flex-wrap gap-2 justify-between items-center bg-slate-900/60 p-2 rounded-xl text-left">
                <div className="flex gap-2">
                  <button 
                    type="button"
                    disabled={!riskMgmtUnlocked}
                    onClick={() => {
                      const currentStr = settings.positionSizing?.seedHistoryString ?? "";
                      const newStr = (currentStr.trim() + " W").trim();
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          seedHistoryString: newStr
                        }
                      }));
                    }}
                    className={cn(
                      "bg-emerald-950 text-emerald-400 hover:bg-emerald-900 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/10 transition-colors cursor-pointer",
                      !riskMgmtUnlocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    + Add Win (W)
                  </button>
                  <button 
                    type="button"
                    disabled={!riskMgmtUnlocked}
                    onClick={() => {
                      const currentStr = settings.positionSizing?.seedHistoryString ?? "";
                      const newStr = (currentStr.trim() + " L").trim();
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          seedHistoryString: newStr
                        }
                      }));
                    }}
                    className={cn(
                      "bg-rose-950 text-rose-400 hover:bg-rose-900 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-rose-500/10 transition-colors cursor-pointer",
                      !riskMgmtUnlocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    + Add Loss (L)
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    disabled={!riskMgmtUnlocked}
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          seedHistoryString: ""
                        }
                      }));
                    }}
                    className={cn(
                      "text-slate-400 hover:text-slate-100 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-medium transition-colors cursor-pointer",
                      !riskMgmtUnlocked && "opacity-40 cursor-not-allowed hover:text-slate-400"
                    )}
                  >
                    Clear Input
                  </button>
                  <button 
                    type="button"
                    disabled={!riskMgmtUnlocked}
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        positionSizing: {
                          ...(prev.positionSizing || defaultPositionSizing),
                          seedHistoryString: defaultPositionSizing.seedHistoryString
                        }
                      }));
                    }}
                    className={cn(
                      "text-slate-400 hover:text-indigo-400 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-medium transition-colors cursor-pointer",
                      !riskMgmtUnlocked && "opacity-40 cursor-not-allowed hover:text-slate-400"
                    )}
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              {/* Dynamic visual preview */}
              {(() => {
                const seedStr = settings.positionSizing?.seedHistoryString ?? "";
                const previewArray = seedStr
                  .toUpperCase()
                  .split(/[\s,]+/)
                  .filter(char => char === 'W' || char === 'L' || char === 'TP' || char === 'SL');
                
                const wins = previewArray.filter(char => char === 'W' || char === 'TP').length;
                const wrPercent = previewArray.length > 0 ? ((wins / previewArray.length) * 100).toFixed(1) : "0.0";
                
                return (
                  <div className="space-y-2 border-t border-slate-800 pt-3 text-left">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Live Simulation Seed Preview ({previewArray.length} items):</span>
                      <span className="font-mono text-indigo-400 font-bold">Win Rate: {wrPercent}%</span>
                    </div>
                    
                    {previewArray.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                        {previewArray.map((char, idx) => {
                          const isWin = char === 'W' || char === 'TP';
                          return (
                            <span 
                              key={`${char}-${idx}`}
                              title={isWin ? "Profit" : "Loss"}
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center font-black font-mono text-[9px] select-none",
                                isWin 
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-rose-950/60 text-rose-400 border border-rose-500/20"
                              )}
                            >
                              {isWin ? 'W' : 'L'}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic text-left">Simulation history string is empty. Please enter some sequence or add simulated items.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>

        {/* Section 4: Voice Assistant Rules */}
        <div className="space-y-6 border-t border-slate-800 pt-6 text-left">
          <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 mb-2 select-none">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className={strategyMode === 'btb' ? "text-indigo-400" : "text-amber-400"} />
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">Voice Assistance Rules (قوانین و فعال‌سازی دستیار صوتی)</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60">Voice Assistant</span>
          </div>

          <div className="space-y-4 bg-slate-950/40 p-5 rounded-3xl border border-slate-800/65 text-left animate-in fade-in slide-in-from-top-2 duration-300">
            {settings.voicePlaybackMode === 'disabled' ? (
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <p className="text-xs font-bold text-slate-400">Voice Assistant is currently Disabled</p>
                <p className="text-[10px] text-slate-500">You can enable and configure the voice assistant from the Voice Alerts Configuration (I) tab.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stop Loss Voice Mappings */}
                  <div className="bg-slate-950 p-4 rounded-2.5xl border border-slate-800/60 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                      <TrendingDown size={14} className="text-rose-400" />
                      <span className="text-xs font-black text-rose-400 uppercase tracking-wider font-sans">Stop Loss Voice Rules</span>
                    </div>

                    {[1, 2, 3, 4].map(num => {
                      const mappings = settings.voiceSLMappings || {};
                      const currentVal = mappings[String(num)] || 'none';
                      return (
                        <div key={num} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-300 font-sans font-bold">Stop {num === 1 ? '1st (1)' : num === 2 ? '2nd (2)' : num === 3 ? '3rd (3)' : '4th (4)'}:</span>
                          <select
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings(prev => ({
                                ...prev,
                                voiceSLMappings: {
                                  ...(prev.voiceSLMappings || {}),
                                  [String(num)]: val
                                }
                              }));
                            }}
                            className="bg-slate-900 text-slate-300 text-xs rounded-xl border border-slate-800 px-3 py-1.5 focus:border-rose-500/35 focus:ring-0 cursor-pointer text-left font-sans"
                          >
                            <option value="none">None</option>
                            <option value="group1">Group 1 (First Profits)</option>
                            <option value="group2">Group 2 (First Stop Loss)</option>
                            <option value="group3">Group 3 (Warning Losses)</option>
                            <option value="group4">Group 4 (Daily Loss Limit)</option>
                            <option value="group5">Group 5 (Discipline Rules)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Take Profit Voice Mappings */}
                  <div className="bg-slate-950 p-4 rounded-2.5xl border border-slate-800/60 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-sans">Take Profit Voice Rules</span>
                    </div>

                    {[1, 2, 3, 4].map(num => {
                      const mappings = settings.voiceTPMappings || {};
                      const currentVal = mappings[String(num)] || 'none';
                      return (
                        <div key={num} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-300 font-sans font-bold">Take Profit {num === 1 ? '1st (1)' : num === 2 ? '2nd (2)' : num === 3 ? '3rd (3)' : '4th (4)'}:</span>
                          <select
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings(prev => ({
                                ...prev,
                                voiceTPMappings: {
                                  ...(prev.voiceTPMappings || {}),
                                  [String(num)]: val
                                }
                              }));
                            }}
                            className="bg-slate-900 text-slate-300 text-xs rounded-xl border border-slate-800 px-3 py-1.5 focus:border-emerald-500/35 focus:ring-0 cursor-pointer text-left font-sans"
                          >
                            <option value="none">None</option>
                            <option value="group1">Group 1 (First Profits)</option>
                            <option value="group2">Group 2 (First Stop Loss)</option>
                            <option value="group3">Group 3 (Warning Losses)</option>
                            <option value="group4">Group 4 (Daily Loss Limit)</option>
                            <option value="group5">Group 5 (Discipline Rules)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 font-sans text-left">
          <p className="text-[11px] text-indigo-300/70 leading-relaxed italic text-left">
            * All your settings are auto-saved instantly to your browser's optimized local cache database.
          </p>
        </div>

        <button 
          onClick={() => {
            if (openedFrom === 'welcome') setView('welcome');
            else setView('dashboard');
          }}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer font-sans"
        >
          Save Changes & Return
        </button>
      </div>
    </div>
  );
  };

  const deleteRecord = (id: string) => {
    setHistory(prev => ({
      dailyRecords: (prev?.dailyRecords || []).filter(r => r && r.id && r.id !== id && r.date !== id)
    }));
  };

  const toggleRecordSelection = (id: string) => {
    if (!id) return;
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelectedRecords = () => {
    setHistory(prev => ({
      dailyRecords: (prev?.dailyRecords || []).filter(r => r && r.id && !selectedRecordIds.includes(r.id) && !selectedRecordIds.includes(r.date))
    }));
    setSelectedRecordIds([]);
    setIsSelectionMode(false);
  };

  const updateAlarmSettings = (updates: Partial<AlarmSettings>) => {
    setSettings(prev => {
      const current = prev.alarmSettings || {
        enabled: false,
        intervalMinutes: 15,
        intervalEnabled: false,
        customTimes: [],
        customTimesEnabled: false,
        selectedSoundType: 'default',
      };
      return {
        ...prev,
        alarmSettings: {
          ...current,
          ...updates
        }
      };
    });
  };

  const handleAddAlarmTime = () => {
    if (!newAlarmTime) return;
    setSettings(prev => {
      const currentAlarm = prev.alarmSettings || {
        enabled: false,
        intervalMinutes: 15,
        intervalEnabled: false,
        customTimes: [],
        customTimesEnabled: false,
        selectedSoundType: 'default',
      };
      
      if (currentAlarm.customTimes.includes(newAlarmTime)) return prev;
      const updatedTimes = [...currentAlarm.customTimes, newAlarmTime].sort();
      return {
        ...prev,
        alarmSettings: {
          ...currentAlarm,
          customTimes: updatedTimes
        }
      };
    });
  };

  const handleDeleteAlarmTime = (timeToDelete: string) => {
    setSettings(prev => {
      const currentAlarm = prev.alarmSettings || {
        enabled: false,
        intervalMinutes: 15,
        intervalEnabled: false,
        customTimes: [],
        customTimesEnabled: false,
        selectedSoundType: 'default',
      };
      return {
        ...prev,
        alarmSettings: {
          ...currentAlarm,
          customTimes: currentAlarm.customTimes.filter(t => t !== timeToDelete)
        }
      };
    });
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setSettings(prev => ({
      ...prev,
      strategyRules: [...(prev.strategyRules || STRATEGY_TIPS), newRuleText.trim()]
    }));
    setNewRuleText('');
  };

  const handleDeleteRule = (index: number) => {
    setSettings(prev => {
      const currentRules = prev.strategyRules || STRATEGY_TIPS;
      return {
        ...prev,
        strategyRules: currentRules.filter((_, idx) => idx !== index)
      };
    });
    if (editingRuleIndex === index) {
      setEditingRuleIndex(null);
      setEditingRuleText('');
    }
  };

  const handleStartEditRule = (index: number, text: string) => {
    setEditingRuleIndex(index);
    setEditingRuleText(text);
  };

  const handleSaveEditRule = (index: number) => {
    if (!editingRuleText.trim()) return;
    setSettings(prev => {
      const currentRules = [...(prev.strategyRules || STRATEGY_TIPS)];
      currentRules[index] = editingRuleText.trim();
      return {
        ...prev,
        strategyRules: currentRules
      };
    });
    setEditingRuleIndex(null);
    setEditingRuleText('');
  };

  const handleCancelEditRule = () => {
    setEditingRuleIndex(null);
    setEditingRuleText('');
  };

  const renderHistoryOrArchive = (isCombined: boolean) => {
    let renderedRecords: {
      id: string;
      date: string;
      trades: (Trade & { strategyMode: string })[];
      archivedAt?: number;
    }[] = [];

    const dailyRecords = history?.dailyRecords || [];
    if (isCombined) {
      const groupedByDate = dailyRecords.reduce((acc, record) => {
        if (!record || !record.date) return acc;
        if (!acc[record.date]) acc[record.date] = { id: record.date, date: record.date, trades: [] };
        const recordTrades = record.trades || [];
        const tradesWithMode = recordTrades.filter(t => t).map(t => ({ ...t, strategyMode: record.strategyMode || 'channel' }));
        acc[record.date].trades.push(...tradesWithMode);
        return acc;
      }, {} as Record<string, { id: string; date: string; trades: (Trade & { strategyMode: string })[] }>);

      renderedRecords = (Object.values(groupedByDate) as { id: string; date: string; trades: (Trade & { strategyMode: string })[] }[]).sort((a, b) => b.date.localeCompare(a.date));
      renderedRecords.forEach(group => {
        const groupTrades = group.trades || [];
        groupTrades.sort((a, b) => a.timestamp - b.timestamp);
      });
    } else {
      renderedRecords = [...dailyRecords]
        .filter(r => r && (r.strategyMode === strategyMode || (!r.strategyMode && strategyMode === 'channel')))
        .map(r => ({
          ...r,
          trades: (r.trades || []).filter(t => t).map(t => ({ ...t, strategyMode: r.strategyMode || 'channel' }))
        }))
        .reverse();
    }

    const allIds = renderedRecords.map(r => r.id);
    const isAllSelected = allIds.length > 0 && allIds.every(id => selectedRecordIds.includes(id));
    const handleSelectAll = () => {
      if (isAllSelected) {
        setSelectedRecordIds([]);
      } else {
        setSelectedRecordIds(allIds);
      }
    };
      
    return (
      <div className="space-y-6 text-left">
      <div className="flex flex-col gap-5 text-left">
        <div className="flex justify-between items-center text-left">
          <button 
            onClick={() => setView(isCombined ? 'welcome' : 'dashboard')}
            title={isCombined ? "Go to Main Screen" : "Go to Dashboard"}
            className="flex items-center gap-3 select-none group text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              {isCombined ? (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-rose-700 to-red-800 rounded-xl blur opacity-45 group-hover:opacity-75 transition duration-1000 animate-pulse"></div>
                  <div className="relative bg-slate-950/90 border border-red-900/40 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-red-950/50">
                    <Crown className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" size={20} />
                  </div>
                </>
              ) : strategyMode === 'btb' ? (
                <div className="relative bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-center">
                  <Crown className="text-amber-800 drop-shadow-sm" size={20} />
                </div>
              ) : (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-slate-900 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center">
                    <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col text-left whitespace-nowrap">
              {isCombined ? (
                <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-red-200 via-red-400 to-amber-200 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-red-500 animate-pulse" size={10} />
                </span>
              ) : strategyMode === 'btb' ? (
                <span className="text-lg font-black uppercase tracking-wider text-slate-100 font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-amber-800/80 animate-pulse" size={10} />
                </span>
              ) : (
                <span className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-sans flex items-center gap-1.5 leading-none">
                  Soheil Keshtkar
                  <Sparkles className="text-yellow-400/80 animate-pulse" size={10} />
                </span>
              )}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest font-mono",
                isCombined ? "text-red-500/80 bg-red-950/30 border border-red-900/30 px-2 rounded-full" : strategyMode === 'btb' ? "text-slate-500" : "text-amber-500/60"
              )}>
                Premium Trading Brand
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-red-500/70 bg-red-950/20 px-3 py-1.5 rounded-full border border-red-900/20 shadow-inner">
              {isCombined ? PAGES.ARCHIVE : PAGES.HISTORY}
            </span>
            <button 
              onClick={() => setView(openedFrom === 'welcome' ? 'welcome' : 'dashboard')}
              className="p-2.5 text-red-500 hover:text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-950/20"
              title="Return"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/40 rounded-2xl border border-red-900/10 shadow-inner w-full">
          <button 
            onClick={exportTradesCSV}
            className="text-[10px] font-black uppercase tracking-tighter py-2 rounded-xl transition-all border bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/50 flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer w-full"
          >
            <Download size={14} />
            <span className="hidden xs:inline">Export</span> CSV
          </button>

          <label className="text-[10px] font-black uppercase tracking-tighter py-2 rounded-xl transition-all border bg-indigo-950/40 text-indigo-400 border-indigo-500/20 hover:bg-indigo-900/50 flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer relative overflow-hidden w-full">
            <Upload size={14} />
            <span><span className="hidden xs:inline">Import</span> CSV</span>
            <input 
              type="file"
              accept=".csv"
              onChange={importTradesCSV}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          <div className="flex gap-1.5 w-full">
            {isSelectionMode && (
              <>
                <button 
                  onClick={deleteSelectedRecords}
                  disabled={selectedRecordIds.length === 0}
                  className="text-rose-400 p-2 hover:bg-rose-950/50 rounded-xl border border-rose-500/20 transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center shrink-0"
                  title="Delete Selected"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={handleSelectAll}
                  className="text-[10px] font-black uppercase tracking-tighter py-2 px-3 rounded-xl transition-all border bg-slate-900 border-slate-850 text-slate-350 hover:border-slate-700 hover:text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer font-sans"
                >
                  <CheckSquare size={13} />
                  <span>{isAllSelected ? 'Deselect' : 'Select All'}</span>
                </button>
              </>
            )}
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedRecordIds([]);
              }}
              className={cn(
                "text-[10px] font-black uppercase tracking-tighter py-2 rounded-xl transition-all border flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer flex-1",
                isSelectionMode 
                  ? "bg-rose-950/40 text-rose-400 border-rose-500/30 hover:bg-rose-900/50" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              <Edit size={14} />
              <span className="truncate">{isSelectionMode ? 'Cancel' : 'Select'}</span>
            </button>
          </div>
        </div>

        {isCombined && (
          <div className="p-5 rounded-[22px] bg-slate-900/60 border border-slate-800/80 shadow-md space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  <span>{settings.appLanguage === 'fa' ? 'خروجی اکسل خودکار در زمان اتمام معاملات' : 'Auto Excel Export on Trade Completion'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {settings.appLanguage === 'fa' 
                    ? 'وقتی همه معامله‌های باز شما مشخص و نهایی شدند، یک فایل گزارش اکسل به صورت خودکار ذخیره می‌شود.' 
                    : 'When all active open trades are settled and saved, a CSV report is automatically generated and saved.'}
                </p>
              </div>
              
              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    autoExcelExport: {
                      ...(prev.autoExcelExport || { enabled: false, folderPath: 'C:\\BtbExcelExports' }),
                      enabled: !prev.autoExcelExport?.enabled
                    }
                  }));
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  settings.autoExcelExport?.enabled ? "bg-emerald-500" : "bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    settings.autoExcelExport?.enabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {settings.autoExcelExport?.enabled && (
              <div className="space-y-3 pt-1 border-t border-slate-800/40">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 text-left">
                    {settings.appLanguage === 'fa' ? 'پوشه ذخیره‌سازی گزارش‌ها (Windows Export Directory)' : 'Windows Export Directory'}
                  </label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      value={settings.autoExcelExport?.folderPath || 'C:\\BtbExcelExports'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings(prev => ({
                          ...prev,
                          autoExcelExport: {
                            ...(prev.autoExcelExport || { enabled: true, folderPath: 'C:\\BtbExcelExports' }),
                            folderPath: val
                          }
                        }));
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed text-left"
                      placeholder="e.g. C:\BtbExcelExports or D:\Trading\Reports"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== 'undefined' && 'electronAPI' in window) {
                          const api = (window as any).electronAPI;
                          if (typeof api.selectDirectory === 'function') {
                            const result = await api.selectDirectory();
                            if (result && result.success && result.path) {
                              setSettings(prev => ({
                                ...prev,
                                autoExcelExport: {
                                  ...(prev.autoExcelExport || { enabled: true, folderPath: 'C:\\BtbExcelExports' }),
                                  folderPath: result.path
                                }
                              }));
                            }
                          }
                        } else {
                          alert(settings.appLanguage === 'fa' 
                            ? 'انتخاب پوشه فقط در نسخه دسکتاپ برنامه فعال است. لطفاً در مرورگر مسیر را به صورت دستی وارد کنید.' 
                            : 'Folder selector is only available in the Desktop App. Please enter the path manually in browser.');
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      title={settings.appLanguage === 'fa' ? 'انتخاب پوشه از سیستم' : 'Select Folder from computer'}
                    >
                      <FolderOpen size={14} className="text-emerald-400" />
                      <span>{settings.appLanguage === 'fa' ? 'انتخاب پوشه' : 'Select Folder'}</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-500 text-left">
                    {settings.appLanguage === 'fa' 
                      ? `فایل‌ها با نام‌هایی مانند Archive_YYYY-MM-DD.csv ذخیره خواهند شد تا در اکسل باز شوند.` 
                      : `Files will be saved as Archive_YYYY-MM-DD.csv compatible with Microsoft Excel.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-left">
        <h2 className="text-xl font-bold text-slate-100 text-left">{isCombined ? "Overall Archived Sessions" : "Archived Daily Sessions"}</h2>
      </div>

      <div className="space-y-6 text-left">
        {/* Today's Section */}
        {!isCombined && (
        <section className="space-y-4 text-left">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-bold text-slate-100 text-left">Today's Registered Trades</h2>
            <p className="text-slate-500 text-xs text-left">{format(new Date(), 'eeee, MMMM d, yyyy')}</p>
          </div>
          <div className="space-y-3 text-left">
            {trades.length === 0 ? (
              <p className="text-slate-600 text-xs py-4 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">No trades have been registered today yet.</p>
            ) : (
              trades.map((trade, idx) => (
                <div key={trade.id || `today-${trade.timestamp}-${idx}`} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3 text-left">
                  <div className="flex justify-between items-center text-left">
                    <div className="flex items-center gap-3 text-left">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        trade.result === 'TP' ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" : 
                        trade.result === 'SL' ? "bg-rose-950/50 text-rose-400 border border-rose-500/20" : "bg-slate-800 text-slate-500"
                      )}>
                        {trade.result === 'TP' ? <TrendingUp size={16} /> : 
                         trade.result === 'SL' ? <TrendingDown size={16} /> : <BarChart3 size={16} />}
                      </div>
                      <p className="font-bold text-sm text-slate-200">Trade {idx + 1}</p>
                      {trade.tradeCondition && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-sans border font-black",
                          trade.tradeCondition === 'Wide' ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/20" :
                          trade.tradeCondition === 'Tight' ? "bg-violet-950/40 text-violet-400 border-violet-500/20" :
                          "bg-sky-950/40 text-sky-450 border-sky-500/20"
                        )}>
                          {trade.tradeCondition === 'Wide' ? (strategyMode === 'btb' ? 'FL' : 'Wide') :
                           trade.tradeCondition === 'Tight' ? (strategyMode === 'btb' ? 'Shadow' : 'Tight') : 'Reng'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-sans">
                      {trade.winRateAtEntry !== undefined && (
                        <span className="font-mono bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 text-[10px]" dir="rtl">
                          وینریت ورود: {trade.winRateAtEntry}%
                        </span>
                      )}
                      {format(trade.timestamp, 'HH:mm')}
                    </span>
                  </div>
                  <div className="space-y-2 text-right" dir="auto">
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-right">
                      <p className="text-[10px] font-bold text-slate-500 mb-1 text-right" dir="ltr">Pre-Trade Notes:</p>
                      <p className="text-xs text-slate-300 text-right">{trade.preTradeNotes}</p>
                    </div>
                    {trade.postTradeNotes && (
                      <div className="bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/10 text-right">
                        <p className="text-[10px] font-bold text-indigo-400 mb-1 text-right" dir="ltr">Post-Trade Notes:</p>
                        <p className="text-xs text-indigo-200/70 italic text-right">{trade.postTradeNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        )}

        {/* Archived Section */}
        {renderedRecords.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-800 text-left">
            <h2 className="text-xl font-bold text-slate-100 text-left">{isCombined ? "Overall Archived Sessions" : "Archived Daily Sessions"}</h2>
            <div className="space-y-4 text-left">
              {renderedRecords.map((record, rIdx) => {
                const isExpanded = expandedRecordId === record.id;
                const isSelected = selectedRecordIds.includes(record.id);
                
                return (
                  <div 
                    key={record.id || `archived-${record.archivedAt}-${rIdx}`} 
                    className={cn(
                      "bg-slate-900 rounded-3xl border transition-all overflow-hidden text-left",
                      isExpanded ? "border-indigo-500/50 shadow-lg shadow-indigo-500/5" : "border-slate-800",
                      isSelected ? "ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-950" : ""
                    )}
                  >
                    <div 
                      onClick={() => isSelectionMode ? toggleRecordSelection(record.id) : setExpandedRecordId(isExpanded ? null : record.id)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 text-left">
                        {isSelectionMode && (
                          <div className="text-rose-400">
                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                        )}
                        <div className="flex flex-col text-left whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-200 block text-left">{record.date}</span>
                          {record.archivedAt && (
                            <span className="text-[9px] text-slate-500 block text-left">Closed at {format(record.archivedAt, 'HH:mm')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-full border border-slate-700 text-slate-400">
                          {(record.trades || []).length} trades
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-800 bg-slate-950/50 text-left"
                        >
                          <div className="p-4 space-y-4 text-left">
                            <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar text-left">
                              {(record.trades || []).map((t, tIdx) => (
                                <div key={`${record.id || rIdx}-${t.id || tIdx}-${tIdx}`} className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  t.result === 'TP' ? "bg-emerald-600 text-white" : 
                                  t.result === 'SL' ? "bg-rose-600 text-white" : "bg-slate-700 text-white"
                                )}>
                                  <span className="text-[10px] font-bold">{tIdx + 1}</span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-3 text-left">
                              {(record.trades || []).map((t, tIdx) => (
                                <div key={`detail-${t.id}-${tIdx}`} className="border-b border-slate-800 last:border-0 pb-3 last:pb-0 space-y-2 text-left">
                                  <div className="flex justify-between items-center text-left">
                                    <div className="flex items-center gap-2 text-left">
                                      <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center",
                                        t.result === 'TP' ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                                      )}>
                                        {t.result === 'TP' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-300">Trade {tIdx + 1}</span>
                                      {(t.voiceText || t.voiceAudioUrl) && (
                                        <button
                                          type="button"
                                          onClick={() => speakText({ text: t.voiceText || "", audioUrl: t.voiceAudioUrl })}
                                          title={`شنیدن ویس: ${t.voiceText || t.voiceAudioUrl}`}
                                          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                        >
                                          <Volume2 size={10} className="text-red-400" />
                                        </button>
                                      )}
                                      {t.tradeCondition && (
                                        <span className={cn(
                                          "text-[9px] px-1.5 py-0.5 rounded font-sans border font-black",
                                          t.tradeCondition === 'Wide' ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/20" :
                                          t.tradeCondition === 'Tight' ? "bg-violet-950/40 text-violet-400 border-violet-500/20" :
                                          "bg-sky-950/40 text-sky-450 border-sky-500/20"
                                        )}>
                                          {t.tradeCondition === 'Wide' ? (t.strategyMode === 'btb' ? 'FL' : 'Wide') :
                                           t.tradeCondition === 'Tight' ? (t.strategyMode === 'btb' ? 'Shadow' : 'Tight') : 'Reng'}
                                        </span>
                                      )}
                                      {isCombined && (
                                        <span className={cn(
                                          "text-[9px] px-1.5 py-0.5 rounded font-sans border font-black",
                                          t.strategyMode === 'btb' ? "bg-amber-950/40 text-amber-500 border-amber-500/20" : "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                                        )}>
                                          {t.strategyMode === 'btb' ? 'BTB' : 'CHANNEL'}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 flex items-center gap-1.5 font-sans">
                                      {t.winRateAtEntry !== undefined && (
                                        <span className="font-mono bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 text-[9px]" dir="rtl">
                                          وینریت ورود: {t.winRateAtEntry}%
                                        </span>
                                      )}
                                      {format(t.timestamp, 'HH:mm')}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 text-left">
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-right" dir="auto">
                                      <p className="text-[9px] font-bold text-slate-500 font-sans text-right" dir="ltr">Pre-Trade Notes:</p>
                                      <p className="text-[11px] text-slate-300 leading-relaxed text-right mt-1">{t.preTradeNotes}</p>
                                    </div>
                                    {t.postTradeNotes && (
                                      <div className="bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/10 text-right" dir="auto">
                                        <p className="text-[9px] font-bold text-indigo-400 font-sans text-right" dir="ltr">Post-Trade Notes:</p>
                                        <p className="text-[11px] text-indigo-200/70 leading-relaxed italic text-right mt-1">{t.postTradeNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {!isSelectionMode && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRecord(record.id);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 text-rose-400 text-[11px] font-bold hover:bg-rose-950/50 rounded-xl transition-colors mt-2 border border-rose-500/20 cursor-pointer"
                              >
                                <Trash2 size={14} />
                                Delete Session
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
  };

  const renderLockScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-8 font-sans">
        {/* Glow Header */}
        <button onClick={() => setView('welcome')} className="flex flex-col items-center space-y-3 text-center cursor-pointer group hover:scale-105 transition-transform">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-indigo-500/10">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-transparent animate-pulse" />
            <Crown className="text-amber-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:text-amber-300 transition-colors" />
            <Sparkles className="absolute -top-1 -right-1 text-indigo-400 w-4 h-4 animate-bounce" />
          </div>
          
          <div className="space-y-1 whitespace-nowrap">
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 via-indigo-200 to-amber-300 bg-clip-text text-transparent tracking-tight">
              Soheil Keshtkar
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Click to Return
            </p>
          </div>
        </button>

        {/* Form Message */}
        <div className="space-y-1.5 text-center w-full">
          <h2 className="text-sm font-bold text-slate-200">Secure Access to Trading Journal</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Please enter your 4-digit passcode to unlock your journal.
          </p>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-4 justify-center py-2 h-6">
          {[0, 1, 2, 3].map((idx) => {
            const isActive = idx < enteredPasscode.length;
            return (
              <motion.div
                key={`dot-${idx}`}
                animate={{
                  scale: isActive ? 1.25 : 1,
                  backgroundColor: passcodeError 
                    ? '#ef4444' 
                    : isActive 
                      ? '#6366f1'
                      : '#1e293b'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border border-slate-800",
                  isActive ? "shadow-[0_0_10px_rgba(99,102,241,0.5)]" : ""
                )}
              />
            );
          })}
        </div>

        {/* Keypad Container */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-3.5 pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={`key-${num}`}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-lg font-bold hover:bg-slate-850 hover:border-indigo-500/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
            >
              {num}
            </button>
          ))}
          
          <button
            type="button"
            onClick={handleKeypadClear}
            className="h-14 rounded-2xl bg-slate-950 border border-transparent text-slate-400 text-xs font-bold hover:text-rose-450 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
            title="Clear all"
          >
            Clear
          </button>
          
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-lg font-bold hover:bg-slate-850 hover:border-indigo-500/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
          >
            0
          </button>
          
          <button
            type="button"
            onClick={handleKeypadDelete}
            className="h-14 rounded-2xl bg-slate-950 border border-transparent text-slate-400 text-xs font-bold hover:text-indigo-400 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none animate-none"
            title="Delete"
          >
            Delete
          </button>
        </div>

        {/* Error message */}
        <div className="h-4 flex items-center justify-center text-center">
          <AnimatePresence>
            {passcodeError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[11px] font-bold text-rose-400 bg-rose-950/20 border border-rose-500/10 px-3 py-1 bg-rose-955 rounded-xl"
              >
                Incorrect passcode. Please try again.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderPreTradeWarning = () => {
    const isConsecutiveLossWarn = consecutiveLossesCount === (settings.maxConsecutiveLosses - 1) && settings.maxConsecutiveLosses > 1;
    const isConsecutiveWinsWarn = consecutiveWinsCount === (settings.maxWinsPerDay - 1) && settings.maxWinsPerDay > 1;
    const isLastDailyTradeWarn = trades.length === (settings.maxTradesPerDay - 1);

    let titlePersian = "گوشزد جدی مدیریت ریسک";
    let subtitlePersian = "قبل از ثبت معامله این تعهدنامه را تایید کنید.";
    let descriptionPersian = "";
    let alertBg = "from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/30";
    let accentColor = "text-amber-400";
    let buttonColor = "from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950";

    if (isConsecutiveLossWarn) {
      titlePersian = `⚠️ فرصت آخر: معامله شماره ${settings.maxConsecutiveLosses} متوالی`;
      subtitlePersian = `شما در حال حاضر ${consecutiveLossesCount} باخت متوالی ثبت کرده‌اید.`;
      descriptionPersian = `توجه ویژه: این معامله به شدت حیاتی است. در صورت باخت در این ترید، ${settings.maxConsecutiveLosses} ضرر متوالی پیاپی ثبت شده و طبق قوانین انضباطی، سیستم معاملاتی شما فوراً برای امروز کاملاً قفل خواهد شد.\n\nتنها در صورتی مجاز به ورود هستید که تمام فیلترها و قوانین سیستم به طور ۱۰۰٪ بی نقص تایید شده باشند. احساسات را نادیده بگیرید و تمرکز قطعی حفظ کنید.`;
      alertBg = "from-red-950/40 via-slate-900 to-slate-950 border-red-500/20";
      accentColor = "text-red-400";
      buttonColor = "from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white";
    } else if (isConsecutiveWinsWarn) {
      titlePersian = `🏆 هدف طلایی: معامله شماره ${settings.maxWinsPerDay} متوالی`;
      subtitlePersian = `تبریک! ${consecutiveWinsCount} سود عالی و شیرین و متوالی کسب کرده‌اید.`;
      descriptionPersian = `هشدار مدیریت ذهن: اسیر هیجان، اعتماد به نفس کاذب یا طمع بازار نشوید.\n\nاین ترید می‌تواند هدف ${settings.maxWinsPerDay} سود متوالی را کامل کند و بلافاصله جلسه معاملاتی موفق امروز شما را نهایی و قفل کند. در صورت ثبت این معامله چه سود شود و چه ضرر ترید دیگری نخواهید داشت. صبور باشید و فقط در بهترین شرایط ممکن وارد شوید.`;
      alertBg = "from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/20";
      accentColor = "text-emerald-400";
      buttonColor = "from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950";
    } else if (isLastDailyTradeWarn) {
      titlePersian = `⚠️ معامله پایانی روز (ترید شماره ${settings.maxTradesPerDay})`;
      subtitlePersian = `شما ${trades.length} معامله انجام داده‌اید.`;
      descriptionPersian = "گوشزد نهایی: این معامله آخرین ترید مجاز شما برای امروز است.\n\nبه یاد داشته باشید که پس از ثبت نتیجه این معامله (چه سود شود و چه ضرر)، سیستم به طور قطعی قفل خواهد شد و باید بلافاصله چارت را ببندید. با تمرکز کامل و بدون عجله تصمیم‌گیری کنید.";
      alertBg = "from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/20";
      accentColor = "text-amber-400";
      buttonColor = "from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950";
    }

    return (
      <div className={`space-y-6 text-center py-4 bg-gradient-to-b ${alertBg} p-6 rounded-[32px] border border-slate-800 shadow-2xl`}>
        <div className="flex justify-between items-center w-full">
          <button 
            onClick={() => setView('welcome')} 
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/40 border border-red-950/20 hover:border-red-500/30 rounded-xl transition-all text-xs font-bold text-slate-300 hover:text-red-400 cursor-pointer shadow-sm animate-none"
            title="Go to main screen"
          >
            <Crown size={14} className="text-red-500" />
            <span className="font-sans text-[10px] tracking-wider uppercase">SOHEIL KESHTKAR</span>
          </button>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">WARNING_STAGE</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500/20 rounded-full blur animate-pulse"></div>
            <div className="relative bg-slate-950 border border-slate-850 p-4 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className={accentColor} />
            </div>
          </div>
          <div className="space-y-1">
            <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded border border-slate-800 bg-slate-950 font-mono ${accentColor}`}>
              ⚠️ SYSTEM AUDIT WARNING
            </span>
            <h2 className="text-lg font-black text-slate-100 tracking-tight text-center font-sans mt-2" dir="rtl">
              {titlePersian}
            </h2>
            <p className="text-xs text-slate-400 font-semibold text-center font-sans mt-1" dir="rtl">
              {subtitlePersian}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-slate-850 p-5 rounded-2xl text-right font-sans space-y-3 leading-relaxed" dir="rtl">
          <p className="text-xs text-slate-300 font-medium whitespace-pre-line">
            {descriptionPersian}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => setView('pre-trade')}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${buttonColor} font-extrabold py-3.5 px-6 rounded-2xl text-xs transition-colors cursor-pointer shadow-lg`}
          >
            بله، متعهد می‌شوم و وارد ثبت معامله می‌شوم
          </button>
          
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            انصراف و بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  };

  const renderBossBlockedScreen = () => {
    const isConsecutiveLoss = consecutiveLossesCount >= settings.maxConsecutiveLosses;
    const isConsecutiveWins = consecutiveWinsCount >= settings.maxWinsPerDay;
    const isFourTradesWithWin = completedTrades.length >= settings.maxTradesPerDay && winCount >= 1;

    let titlePersian = "ایست جدی! چارت را همین الآن ببندید";
    let subtitlePersian = "قوانین حیاتی سیستم معاملاتی شما فعال شده است.";
    let descriptionPersian = "";
    
    if (isConsecutiveLoss) {
      titlePersian = `ایست! ${settings.maxConsecutiveLosses} باخت متوالی ثبت شد`;
      subtitlePersian = "هشدار جدی سیستم: امروز دیگر به هیچ عنوان حق معامله نداری!";
      descriptionPersian = `طبق دستور مستقیم سیستم معاملاتی، ${settings.maxConsecutiveLosses} ضرر متوالی پیاپی نشانه عدم همراستایی بازار یا ذهن شماست. ادامه دادن معامله در این شرایط مساوی با نابودی کل حساب است. چارت را همین حالا ببندید و فردا با انرژی تازه برگردید.`;
    } else if (isConsecutiveWins) {
      titlePersian = `ایست! ${settings.maxWinsPerDay} سود متوالی و شیرین`;
      subtitlePersian = "هدف امروز کامل شد! طمع در بازار بزرگترین دشمن شماست.";
      descriptionPersian = `قوانین محکم سیستم معاملاتی: شیرینی ${settings.maxWinsPerDay} سود متوالی را با ریسک اضافه تلخ نکنید. سود بزرگ امروز را بردارید و همین حالا چارت را بدون استثنا ببندید. هیچ تریدر موفقی سود بزرگ روزانه را دوباره دو دستی تقدیم بازار نمی‌کند!`;
    } else if (isFourTradesWithWin) {
      titlePersian = `ایست! معامله شماره ${settings.maxTradesPerDay} ثبت شد`;
      subtitlePersian = "حد مجاز روزانه به پایان رسید.";
      descriptionPersian = `شما به سقف ${settings.maxTradesPerDay} معامله روزانه خود رسیده‌اید. قانون محکم مدیریت سرمایه اجازه هیچ فعالیت اضافه دیگری را نمی‌دهد. چارت را بدون معطلی ببندید و سود امروز خود را نقد و سیو کنید.`;
    }

    return (
      <div className="space-y-6 text-center py-4 bg-gradient-to-b from-rose-950 via-red-950 to-slate-950 p-6 rounded-[32px] border-2 border-red-500/40 shadow-2xl shadow-red-900/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-40 animate-ping duration-1000"></div>
            <div className="relative bg-red-900/80 border-2 border-red-500 p-4 rounded-full flex items-center justify-center">
              <Crown className="text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" size={32} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/20 font-mono">⚠️ SYSTEM RULE ENFORCED</span>
            <h2 className="text-xl font-black text-rose-100 tracking-tight text-center font-sans mt-2" dir="rtl">
              {titlePersian}
            </h2>
            <p className="text-xs text-rose-300 font-semibold text-center font-sans mt-1" dir="rtl">
              {subtitlePersian}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-red-500/20 p-5 rounded-2xl text-right font-sans space-y-3 leading-relaxed" dir="rtl">
          <p className="text-xs text-rose-200/90 font-medium">
            {descriptionPersian}
          </p>
        </div>

        {/* Real-time stats display in Persian */}
        <div className="grid grid-cols-3 gap-2 text-center" dir="rtl">
          <div className="bg-red-950/40 p-3 rounded-2xl border border-red-500/10 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400">کل معاملات</span>
            <span className="text-lg font-black text-slate-100 font-mono mt-0.5">{completedTrades.length}</span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/10 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-emerald-400">کل سودها</span>
            <span className="text-lg font-black text-emerald-300 font-mono mt-0.5">{winCount}</span>
          </div>
          <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-500/10 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-rose-400">کل ضررها</span>
            <span className="text-lg font-black text-rose-300 font-mono mt-0.5">{lossCount}</span>
          </div>
        </div>

        {/* Boss Message */}
        <div className="text-center font-mono text-[9px] text-red-400 font-bold border-t border-red-500/15 pt-3.5 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Brain size={12} className="animate-pulse" />
          SYSTEM STRICTLY LOCKED FOR TODAY
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={resetDay}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/60"
          >
            بایگانی گزارش امروز و پایان قطعی جلسه معاملاتی
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setOpenedFrom('mode');
                setView('history');
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <History size={14} />
              مشاهده تاریخچه
            </button>
            <button
              onClick={() => {
                setOpenedFrom('mode');
                setView('settings');
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <SettingsIcon size={14} />
              تنظیمات سیستم
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategySwitcher = () => {
    const isBtb = strategyMode === 'btb';
    return (
      <div className={cn(
        "mb-2 p-1.5 rounded-2xl flex items-center justify-between select-none border transition-all duration-300",
        isBtb 
          ? "bg-slate-950/35 border-slate-800/60" 
          : "bg-slate-950/60 border-slate-800/80"
      )}>
        <button
          onClick={() => switchStrategy('channel')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer",
            strategyMode === 'channel'
              ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.05)] font-black"
              : isBtb 
                ? "text-slate-500 hover:text-slate-200"
                : "text-slate-400 hover:text-slate-200"
          )}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300", 
            strategyMode === 'channel' 
              ? "bg-emerald-400 animate-pulse" 
              : isBtb ? "bg-slate-500" : "bg-slate-600"
          )} />
          <span>استراتژی Channel</span>
        </button>
        <button
          onClick={() => switchStrategy('btb')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer",
            strategyMode === 'btb'
              ? isBtb
                ? "bg-slate-900 border border-slate-700 text-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.12)] font-black"
                : "bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 shadow-[0_2px_10px_rgba(99,102,241,0.05)] font-black"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300", 
            strategyMode === 'btb' 
              ? isBtb ? "bg-indigo-600 animate-pulse" : "bg-indigo-400 animate-pulse" 
              : "bg-slate-600"
          )} />
          <span>استراتژی BTB</span>
        </button>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div 
        className="fixed inset-0 bg-slate-950 flex items-center justify-between px-4 py-1.5 select-none border border-red-500/40 rounded-2xl overflow-hidden font-sans cursor-pointer text-left z-50 hover:border-red-500/60 transition-colors"
        onClick={() => toggleCollapse(false)}
        title={settings.appLanguage === 'fa' ? 'بزرگ کردن برنامه (کلیک کنید)' : 'Click to Expand App'}
      >
        {/* Brand Logo & Icon */}
        <div className="flex items-center gap-3">
          <div className="relative inline-flex justify-center items-center">
            {/* Animated glowing red halo behind the crown */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-red-600 via-rose-700 to-red-800 rounded-full blur opacity-55 animate-pulse"></div>
            <div className="relative bg-slate-900 border border-red-900/40 p-1.5 rounded-xl flex items-center justify-center">
              <Crown className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" size={16} />
            </div>
          </div>
          
          <div className="flex flex-col text-left justify-center leading-none">
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-200 via-red-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-1">
              SOHEIL KESHTKAR
              <Sparkles className="text-red-500 animate-pulse" size={8} />
            </span>
            <span className="text-[7.5px] text-red-500/85 font-mono tracking-widest font-black uppercase mt-1">
              PREMIUM TRADING
            </span>
          </div>
        </div>

        {/* Right Status Indicator & Restore */}
        <div className="flex items-center gap-3">
          {/* Clock & Status */}
          <div className="flex flex-col items-end text-right justify-center leading-none">
            <span className="text-[11px] font-bold text-slate-100 font-mono tracking-wider">
              {format(new Date(), 'HH:mm')}
            </span>
            <span className="text-[8px] font-semibold text-red-400 mt-1 uppercase tracking-wider animate-pulse">
              {settings.appLanguage === 'fa' ? 'در حال پایش' : 'MONITORING'}
            </span>
          </div>
          
          {/* Maximize Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(false);
            }}
            className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md shadow-red-500/20"
            title={settings.appLanguage === 'en' ? 'Expand App' : 'بزرگ کردن برنامه'}
          >
            <Maximize2 size={16} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans text-slate-100 p-4 md:p-8 flex items-center justify-center text-left transition-all duration-500",
      view === 'welcome' || view === 'system-settings' || view === 'archive'
        ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-slate-950 to-slate-950"
        : `bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 theme-${strategyMode}`
    )} dir="ltr">
      <div className={cn(
        "w-full max-w-md md:max-w-2xl lg:max-w-4xl transition-all duration-500 overflow-hidden relative rounded-[30px] md:rounded-[40px] shadow-2xl",
        view === 'welcome' || view === 'system-settings' || view === 'archive'
          ? "bg-slate-950/90 border border-red-950/25 shadow-red-950/10"
          : "bg-slate-900 border border-slate-800 shadow-slate-950/40"
      )}>
        {/* Global Desktop Titlebar */}
        <div className="bg-slate-950/65 backdrop-blur-md px-5 py-3 border-b border-slate-900/60 flex items-center justify-between select-none text-left">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              settings.alwaysOnTop ? "bg-red-500 animate-pulse" : "bg-slate-600"
            )} />
            <span className="text-[10px] font-black tracking-wider text-slate-400 font-mono uppercase">
              {settings.appLanguage === 'fa' 
                ? (strategyMode === 'btb' ? 'میز معاملاتی BTB' : 'میز معاملاتی کانال') 
                : (strategyMode === 'btb' ? 'BTB Trading Desk' : 'Channel Trading Desk')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Always On Top Pin Toggle */}
            <button 
              onClick={() => {
                const nextVal = !settings.alwaysOnTop;
                setSettings(prev => ({ ...prev, alwaysOnTop: nextVal }));
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border cursor-pointer",
                settings.alwaysOnTop 
                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
              title={settings.appLanguage === 'fa' ? 'پین کردن برنامه (Stay on Top)' : 'Pin to Stay on Top'}
            >
              <Pin size={11} className={cn("transition-all duration-300", settings.alwaysOnTop ? "rotate-45" : "")} />
              <span>
                {settings.alwaysOnTop 
                  ? (settings.appLanguage === 'fa' ? 'پین شده' : 'Pinned') 
                  : (settings.appLanguage === 'fa' ? 'پین بالا' : 'Pin On Top')}
              </span>
            </button>

            {/* Collapse/Fold button */}
            <button 
              onClick={() => toggleCollapse(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer"
              title={settings.appLanguage === 'fa' ? 'جمع کردن برنامه' : 'Collapse App'}
            >
              <Minimize2 size={11} />
              <span>
                {settings.appLanguage === 'fa' ? 'جمع کردن' : 'Fold'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-8 h-full overflow-y-auto max-h-[92vh] custom-scrollbar">
          <AnimatePresence mode="wait">
            {!isUnlocked && view !== 'welcome' && view !== 'system-settings' ? (
              <motion.div
                key="lockscreen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {renderLockScreen()}
              </motion.div>
            ) : isBossBlocked && view !== 'settings' && view !== 'archive' ? (
              <motion.div
                key="boss_blocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {renderBossBlockedScreen()}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {view !== 'welcome' && view !== 'system-settings' && view !== 'archive' && renderStrategySwitcher()}
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === 'welcome' && renderWelcome()}
                  {view === 'rules' && renderRules()}
                  {view === 'dashboard' && renderDashboard()}
                  {view === 'pre-trade-warning' && renderPreTradeWarning()}
                  {view === 'pre-trade' && renderPreTrade()}
                  {view === 'post-trade' && renderPostTrade()}
                  {view === 'archive' && renderHistoryOrArchive(true)}
                  {view === 'history' && renderHistoryOrArchive(false)}
                  {view === 'settings' && renderSettings()}
                  {view === 'system-settings' && renderSystemSettings()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Offline Indicator */}
        <AnimatePresence>
          {isOfflineReady && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-4 left-4 right-4 bg-rose-600 text-white p-3 rounded-2xl text-center text-xs font-bold shadow-lg z-50 flex items-center justify-center gap-2"
            >
              <AlertCircle size={16} />
              You are offline. Your trading activities will save locally.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alarm Notification Overlay */}
        <AnimatePresence>
          {recentAlarmTriggered && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4"
              onClick={() => {
                setRecentAlarmTriggered(null);
                stopAlarmSound();
              }}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-sm bg-slate-950 border-2 border-red-900/40 rounded-[32px] p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center text-center cursor-pointer overflow-hidden group select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecentAlarmTriggered(null);
                  stopAlarmSound();
                }}
              >
                {/* Glowing decorative red/amber halo behind */}
                <div className="absolute -inset-6 bg-gradient-to-r from-red-600 via-amber-600 to-red-800 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                <div className="absolute inset-0.5 rounded-[28px] border border-red-500/10 pointer-events-none z-0"></div>

                <div className="relative z-10 w-full flex flex-col items-center space-y-4" dir="ltr">
                  {/* Top header row */}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase font-mono">
                      ALARM NOTIFICATION
                    </span>
                  </div>

                  {/* Digital Clock Time */}
                  <div className="bg-slate-950/90 border border-red-900/30 rounded-2xl px-8 py-4.5 w-full shadow-inner flex flex-col items-center justify-center">
                    <span className="text-4xl font-mono font-extrabold text-white tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      {recentAlarmTriggered.time}
                    </span>
                    <span className="text-[9px] text-red-500/80 font-black tracking-widest uppercase font-mono mt-1">
                      {recentAlarmTriggered.type || "ALERT ACTIVE"}
                    </span>
                  </div>

                  {/* Performance stats report */}
                  {(() => {
                    // Load Channel State
                    let channelDaily: DailyState | null = null;
                    if (strategyMode === 'channel') {
                      channelDaily = dailyState;
                    } else {
                      try {
                        const saved = localStorage.getItem('trading_daily_state_channel');
                        if (saved) channelDaily = JSON.parse(saved);
                      } catch (e) {}
                    }

                    // Load BTB State
                    let btbDaily: DailyState | null = null;
                    if (strategyMode === 'btb') {
                      btbDaily = dailyState;
                    } else {
                      try {
                        const saved = localStorage.getItem('trading_daily_state_btb');
                        if (saved) btbDaily = JSON.parse(saved);
                      } catch (e) {}
                    }

                    // Load Channel Settings
                    let channelSettings = settings;
                    if (strategyMode !== 'channel') {
                      try {
                        const saved = localStorage.getItem('trading_settings_channel');
                        if (saved) channelSettings = JSON.parse(saved);
                      } catch (e) {}
                    }

                    // Load BTB Settings
                    let btbSettings = settings;
                    if (strategyMode !== 'btb') {
                      try {
                        const saved = localStorage.getItem('trading_settings_btb');
                        if (saved) btbSettings = JSON.parse(saved);
                      } catch (e) {}
                    }

                    const todayStr = format(new Date(), 'yyyy-MM-dd');

                    const channelTrades = (channelDaily && channelDaily.date === todayStr) ? (channelDaily.trades || []) : [];
                    const btbTrades = (btbDaily && btbDaily.date === todayStr) ? (btbDaily.trades || []) : [];

                    const chMax = channelSettings.maxTradesPerDay ?? 4;
                    const chCount = channelTrades.length;
                    const chRemaining = Math.max(0, chMax - chCount);
                    const chWins = channelTrades.filter(t => t.result === 'TP').length;
                    const chLosses = channelTrades.filter(t => t.result === 'SL').length;

                    const btbMax = btbSettings.maxTradesPerDay ?? 4;
                    const btbCount = btbTrades.length;
                    const btbRemaining = Math.max(0, btbMax - btbCount);
                    const btbWins = btbTrades.filter(t => t.result === 'TP').length;
                    const btbLosses = btbTrades.filter(t => t.result === 'SL').length;

                    return (
                      <div className="w-full space-y-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-900/40"></div>
                          <span className="text-[18px] font-black text-amber-500/90 tracking-[0.2em] font-mono uppercase">
                            DAILY PERFORMANCE
                          </span>
                          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-900/40"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                          {/* Channel Strategy Status Card */}
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between text-left relative overflow-hidden">
                            {/* Visual Indicator Line */}
                            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-emerald-500/50"></div>
                            <div>
                              <span className="text-[18px] font-black text-slate-400 font-mono tracking-wider uppercase block">
                                CHANNEL MODE
                              </span>
                              <div className="flex gap-3 mt-2 text-xl">
                                <span className="text-emerald-400 font-bold font-mono">TP: {chWins}</span>
                                <span className="text-rose-500 font-bold font-mono">SL: {chLosses}</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-900/85 pt-2.5 mt-2.5">
                              <span className="text-[16px] text-slate-500 font-medium block">LEFT TRADES:</span>
                              <span className={cn(
                                "text-2xl font-mono font-black",
                                chRemaining === 0 ? "text-rose-500" : "text-emerald-400"
                              )}>
                                {chRemaining} <span className="text-[16px] text-slate-400">/ {chMax}</span>
                              </span>
                            </div>
                          </div>

                          {/* BTB Strategy Status Card */}
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between text-left relative overflow-hidden">
                            {/* Visual Indicator Line */}
                            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-indigo-500/50"></div>
                            <div>
                              <span className="text-[18px] font-black text-slate-400 font-mono tracking-wider uppercase block">
                                BTB MODE
                              </span>
                              <div className="flex gap-3 mt-2 text-xl">
                                <span className="text-emerald-400 font-bold font-mono">TP: {btbWins}</span>
                                <span className="text-rose-500 font-bold font-mono">SL: {btbLosses}</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-900/85 pt-2.5 mt-2.5">
                              <span className="text-[16px] text-slate-500 font-medium block">LEFT TRADES:</span>
                              <span className={cn(
                                "text-2xl font-mono font-black",
                                btbRemaining === 0 ? "text-rose-500" : "text-emerald-400"
                              )}>
                                {btbRemaining} <span className="text-[16px] text-slate-400">/ {btbMax}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ignored/Missed Alarm Notification */}
                        {recentAlarmTriggered.ignoredAlarm && (
                          <div className="w-full bg-amber-500/5 border border-amber-500/25 text-amber-300 rounded-2xl p-2.5 flex items-center gap-2 text-left leading-relaxed">
                            <AlertCircle size={14} className="text-amber-500 shrink-0" />
                            <span className="text-[10px] font-medium text-amber-200">
                              Missed previous alarm at <span className="font-mono font-bold underline">{recentAlarmTriggered.ignoredAlarm}</span>.
                            </span>
                          </div>
                        )}

                        {/* Dismiss Guide */}
                        <div className="w-full pt-1">
                          <div className="w-full bg-red-950/30 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/30 text-red-400 hover:text-red-300 py-2.5 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                            <Bell size={13} className="animate-bounce" />
                            <span>DISMISS ALARM & RESUME</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
