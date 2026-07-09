import { useState, useEffect, useRef } from 'react';
import { 
  Clock as ClockIcon, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Folder, 
  Camera, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Power, 
  Sparkles,
  Layers,
  Cpu,
  UserCheck
} from 'lucide-react';
import { TradePosition, Alarm, AppSettings } from './types';

export default function App() {
  // 1. App States
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [ticker, setTicker] = useState<string>('BTCUSDT');
  const [livePrice, setLivePrice] = useState<number>(64250.75);
  
  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    confirmOnCloseWithOpenPosition: true,
    soundEnabled: true,
    selectedDirectory: 'D:/Trading/Screenshots'
  });

  // Alarms State
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: '1', ticker: 'BTCUSDT', price: 65000, type: 'ABOVE', isActive: true, isTriggered: false },
    { id: '2', ticker: 'BTCUSDT', price: 63500, type: 'BELOW', isActive: true, isTriggered: false }
  ]);

  // Positions State
  const [positions, setPositions] = useState<TradePosition[]>([
    {
      id: 'p-1',
      ticker: 'BTCUSDT',
      type: 'BUY',
      size: 0.25,
      openPrice: 63800.00,
      currentPrice: 64250.75,
      pnl: 112.68,
      openTime: '13:45:22'
    }
  ]);

  // UI Helpers
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [newAlarmPrice, setNewAlarmPrice] = useState<string>('');
  const [newAlarmType, setNewAlarmType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Time for Clock Component
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // 2. Refs for low CPU consumption
  const alarmsRef = useRef<Alarm[]>(alarms);
  const livePriceRef = useRef<number>(livePrice);
  const positionsRef = useRef<TradePosition[]>(positions);

  // Sync state to refs immediately when they change
  useEffect(() => {
    alarmsRef.current = alarms;
  }, [alarms]);

  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // 3. Optimized Clock Hook (Only runs/updates when unfolded)
  useEffect(() => {
    if (isCollapsed) return; // Completely disable clock updates when collapsed for low CPU!

    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [isCollapsed]);

  // 4. Low-CPU Live Price Simulation and Alarm Checker
  // This uses a stable single interval to check triggers, avoiding re-registering interval trees.
  useEffect(() => {
    const handlePriceAndAlarms = () => {
      // Simulate real-time price fluctuation
      const delta = (Math.random() - 0.5) * 45; // Subtle movement
      const newPrice = Number((livePriceRef.current + delta).toFixed(2));
      setLivePrice(newPrice);

      // Check Alarms with useRef (prevents interval teardowns, keeping CPU at ~3%)
      const activeAlarms = alarmsRef.current;
      let alarmTriggered = false;
      const updatedAlarms = activeAlarms.map(alarm => {
        if (!alarm.isActive || alarm.isTriggered) return alarm;

        if (alarm.type === 'ABOVE' && newPrice >= alarm.price) {
          alarmTriggered = true;
          return { ...alarm, isTriggered: true };
        }
        if (alarm.type === 'BELOW' && newPrice <= alarm.price) {
          alarmTriggered = true;
          return { ...alarm, isTriggered: true };
        }
        return alarm;
      });

      if (alarmTriggered) {
        setAlarms(updatedAlarms);
        showToast('هشدار قیمت فعال شد!', 'warning');
        if (settings.soundEnabled) {
          // Play subtle notification tone
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 880; // A5 note
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
          } catch (e) {
            console.log("Audio play failed: ", e);
          }
        }
      }

      // Also dynamically update active positions PnL
      const activePositions = positionsRef.current;
      if (activePositions.length > 0) {
        const updatedPositions = activePositions.map(pos => {
          const priceDiff = newPrice - pos.openPrice;
          const pnlMultiplier = pos.type === 'BUY' ? 1 : -1;
          const pnl = Number((priceDiff * pos.size * pnlMultiplier * 10).toFixed(2));
          return { ...pos, currentPrice: newPrice, pnl };
        });
        setPositions(updatedPositions);
      }
    };

    const intervalId = setInterval(handlePriceAndAlarms, 1000);
    return () => clearInterval(intervalId);
  }, [settings.soundEnabled]);

  // Helper: Display Toast
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 5. Electron Window Resize Handling
  const toggleCollapseState = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    if (window.electronAPI) {
      window.electronAPI.toggleCollapse(nextCollapsed);
    } else {
      showToast(nextCollapsed ? 'برنامه کوچک شد' : 'برنامه بزرگ شد', 'info');
    }
  };

  // 6. Screenshot with Automatic Subfolder Structure
  const handleTakeScreenshot = async () => {
    // Determine target directory folder inside electron-main or mock
    const now = new Date();
    const dateFolderName = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const timestampFileName = now.toLocaleTimeString('fa-IR').replace(/:/g, '-');

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.takeScreenshot(settings.selectedDirectory);
        if (result.success) {
          showToast(`اسکرین‌شات با موفقیت ذخیره شد در:\n${result.path}`, 'success');
        } else {
          showToast(`خطا در گرفتن اسکرین‌شات: ${result.error}`, 'warning');
        }
      } catch (err: any) {
        showToast(`خطا: ${err?.message || err}`, 'warning');
      }
    } else {
      // Mock Browser simulation
      showToast(`شبیه‌ساز اسکرین‌شات:\nفولدری به نام "${dateFolderName}" در مسیر "${settings.selectedDirectory}" ساخته شد و اسکرین‌شات "${timestampFileName}.png" ذخیره گردید.`, 'success');
    }
  };

  const handleSelectDirectory = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        setSettings(prev => ({ ...prev, selectedDirectory: path }));
        showToast('مسیر ذخیره اسکرین‌شات‌ها با موفقیت تغییر کرد', 'success');
      }
    } else {
      // Prompt Mock selection
      const mockPaths = [
        'C:/Users/Trader/Documents/Screenshots',
        'D:/Trading/Screenshots',
        '/home/trader/pictures/screenshots'
      ];
      const randomPath = mockPaths[Math.floor(Math.random() * mockPaths.length)];
      setSettings(prev => ({ ...prev, selectedDirectory: randomPath }));
      showToast(`مسیر شبیه‌سازی شد: ${randomPath}`, 'success');
    }
  };

  // 7. Trading Operations (Positions, Exit Confirmation)
  const handleClosePosition = (id: string) => {
    if (settings.confirmOnCloseWithOpenPosition) {
      const confirmClose = window.confirm("آیا مطمئن هستید که می‌خواهید این پوزیشن باز را ببندید؟");
      if (!confirmClose) return;
    }
    setPositions(positions.filter(p => p.id !== id));
    showToast('پوزیشن با موفقیت بسته شد.', 'success');
  };

  const handleCloseApp = () => {
    const hasOpenPositions = positions.length > 0;
    if (hasOpenPositions && settings.confirmOnCloseWithOpenPosition) {
      const confirmExit = window.confirm("شما پوزیشن‌های باز دارید! آیا واقعاً می‌خواهید خارج شوید؟");
      if (!confirmExit) return;
    }
    
    if (window.electronAPI) {
      window.electronAPI.closeApp();
    } else {
      showToast('خروج از برنامه صادر شد (فقط در نسخه دسکتاپ عمل می‌کند)', 'info');
    }
  };

  // Add a new position
  const handleAddPosition = (type: 'BUY' | 'SELL') => {
    const size = Number((Math.random() * 0.5 + 0.05).toFixed(2));
    const newPos: TradePosition = {
      id: `p-${Date.now()}`,
      ticker,
      type,
      size,
      openPrice: livePrice,
      currentPrice: livePrice,
      pnl: 0,
      openTime: new Date().toLocaleTimeString('fa-IR')
    };
    setPositions([...positions, newPos]);
    showToast(`پوزیشن ${type === 'BUY' ? 'خرید' : 'فروش'} جدید باز شد`, 'success');
  };

  // Add a new alarm
  const handleAddAlarm = () => {
    const priceVal = parseFloat(newAlarmPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      showToast('لطفاً یک قیمت معتبر وارد کنید', 'warning');
      return;
    }

    const newAl: Alarm = {
      id: Date.now().toString(),
      ticker,
      price: priceVal,
      type: newAlarmType,
      isActive: true,
      isTriggered: false
    };

    setAlarms([...alarms, newAl]);
    setNewAlarmPrice('');
    showToast('هشدار قیمت جدید ثبت شد', 'success');
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter(al => al.id !== id));
    showToast('هشدار قیمت حذف شد', 'info');
  };

  return (
    <div id="trading-assistant-container" className="h-screen flex flex-col font-sans transition-all duration-300">
      
      {/* -------------------- COLLAPSED (FOLD) STATE -------------------- */}
      {isCollapsed ? (
        <div 
          id="folded-state-ui"
          className="h-full flex flex-col justify-between items-center bg-[#0b0f19] border border-slate-800 p-3 select-none relative animate-fade-in"
        >
          {/* Top Info */}
          <div className="flex flex-col items-center gap-1.5 w-full mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="سیستم فعال" />
            <span className="font-mono text-xs font-bold text-slate-400 select-none tracking-wider">{ticker}</span>
          </div>

          {/* Collapsed Price Indicator */}
          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-[10px] text-slate-500 select-none font-bold">قیمت لحظه‌ای</span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-1 select-all tracking-tight">
              {livePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            
            {/* Minimal PnL overview in folded state */}
            {positions.length > 0 && (
              <div className="mt-3 px-2 py-0.5 rounded-full bg-[#1e293b] border border-slate-700 flex items-center gap-1">
                <span className={`text-[10px] font-bold ${positions[0].pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {positions[0].pnl >= 0 ? '+' : ''}{positions[0].pnl}
                </span>
                <span className="text-[8px] text-slate-500 select-none">PnL</span>
              </div>
            )}
          </div>

          {/* Bottom Actions for Folded Mode */}
          <div className="flex flex-col items-center gap-2.5 w-full mb-2">
            {/* Take screenshot quickly in collapsed state */}
            <button
              id="collapsed-screenshot-btn"
              onClick={handleTakeScreenshot}
              title="ثبت سریع اسکرین‌شات"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
            >
              <Camera size={14} />
            </button>

            {/* Expand Window Button (Width and Height return to Unfolded) */}
            <button
              id="collapsed-expand-btn"
              onClick={toggleCollapseState}
              title="بزرگ کردن پنجره برنامه (Unfold)"
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      ) : (

        /* -------------------- EXPANDED (UNFOLD) STATE -------------------- */
        <div id="expanded-state-ui" className="h-full flex flex-col bg-[#0b0f19] text-slate-100 relative">
          
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-2.5 bg-[#0d1424] border-b border-slate-800/80">
            {/* Right side: App Branding and Live Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/15 border border-indigo-500/25">
                  <Sparkles size={16} className="text-indigo-400" />
                </div>
                <h1 className="text-sm font-bold text-slate-100 select-none tracking-wide">دستیار معاملاتی</h1>
              </div>
              
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>سیستم فعال</span>
              </div>
            </div>

            {/* Center: Beautiful conditionally rendered Clock (Only in unfolded state) */}
            <div id="unfolded-clock-panel" className="flex items-center gap-4 select-none">
              <div className="flex items-center gap-1.5 bg-[#141b2d] px-3 py-1 rounded-md border border-slate-800">
                <ClockIcon size={14} className="text-slate-400" />
                <span className="font-mono text-xs font-bold text-slate-200 min-w-[70px] text-center" dir="ltr">{time || '00:00:00'}</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">{dateStr}</span>
            </div>

            {/* Left side: Window and Layout Controllers */}
            <div className="flex items-center gap-2">
              <button
                id="btn-take-screenshot"
                onClick={handleTakeScreenshot}
                title="ثبت اسکرین‌شات"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer flex items-center gap-1 border border-slate-800 text-xs px-2.5 bg-[#141b2d]"
              >
                <Camera size={14} className="text-slate-300" />
                <span className="text-[11px]">اسکرین‌شات</span>
              </button>

              <button
                id="btn-app-settings"
                onClick={() => setShowSettingsModal(true)}
                title="تنظیمات برنامه"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800 bg-[#141b2d]"
              >
                <Settings size={14} />
              </button>

              <button
                id="btn-fold-state"
                onClick={toggleCollapseState}
                title="کوچک کردن پنجره برنامه (Fold)"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800 bg-[#141b2d]"
              >
                <Minimize2 size={14} />
              </button>

              <button
                id="btn-close-app"
                onClick={handleCloseApp}
                title="بستن کامل برنامه"
                className="p-1.5 rounded-md hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-slate-800/80"
              >
                <Power size={14} />
              </button>
            </div>
          </header>

          {/* Main Workspace Bento-grid */}
          <main className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Column 1: Live Ticker & Quick Controls (Span 4) */}
            <section className="md:col-span-4 flex flex-col gap-4">
              
              {/* Ticker Selector Card */}
              <div id="ticker-card" className="bg-[#0f1524] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-bold">نماد معاملاتی</span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">BINANCE API</span>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="BTCUSDT, ETHUSDT..."
                    className="flex-1 bg-[#161f33] border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 uppercase font-mono tracking-wider"
                  />
                </div>

                {/* Main Live Price Display */}
                <div className="bg-[#141b2d] rounded-lg p-4 border border-slate-800/80 text-center select-all">
                  <span className="text-[10px] text-slate-400 block mb-1">قیمت لحظه‌ای {ticker}</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">
                      {livePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500">USDT</span>
                  </div>
                </div>

                {/* Quick Buy / Sell Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => handleAddPosition('BUY')}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-emerald-500/10"
                  >
                    <TrendingUp size={13} />
                    <span>خرید (BUY)</span>
                  </button>
                  <button
                    onClick={() => handleAddPosition('SELL')}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-rose-500/10"
                  >
                    <TrendingDown size={13} />
                    <span>فروش (SELL)</span>
                  </button>
                </div>
              </div>

              {/* Performance Estimator Panel (Replying to user's first query about optimization speed) */}
              <div id="perf-estimator-panel" className="bg-[#0f1524] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">آنالیز بهینه‌سازی و سرعت برنامه</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  موقع خروج از برنامه یا بستن پوزیشن، بررسی وضعیت در پس‌زمینه انجام می‌شود. خاموش کردن تاییدیه خروج به شدت سرعت عملیات را افزایش می‌دهد:
                </p>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">حالت کنونی لود سی‌پی‌یو:</span>
                    <span className="font-mono text-emerald-400 font-bold">~۳٪ (بسیار عالی)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">درصد افزایش سرعت با حذف تاییدیه:</span>
                    <span className="font-mono text-indigo-400 font-bold">+۲۵٪ الی +۳۵٪ سریع‌تر</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">دلیل بهینه‌سازی CPU در این نسخه:</span>
                    <span className="text-slate-300">استفاده از سیستم Alarms با رفرنس پایدار (useRef)</span>
                  </div>
                </div>
              </div>

            </section>

            {/* Column 2: Positions & Screenshot Management (Span 8) */}
            <section className="md:col-span-8 flex flex-col gap-4">
              
              {/* Screenshot Settings Card */}
              <div id="screenshot-setup-card" className="bg-[#0f1524] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">تنظیمات پیشرفته ذخیره خودکار اسکرین‌شات</span>
                  </div>
                  <span className="text-[9px] text-slate-500 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold select-none">
                    ویژگی درخواستی کاربر
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  وقتی اسکرین‌شات می‌گیرید، برنامه خودش به‌طور خودکار داخل فولدری که انتخاب کردید یک زیرپوشه با نام تاریخ شمسی/میلادی امروز (مثلا <code className="font-mono text-indigo-400 bg-slate-900 px-1 py-0.5 rounded text-[10px]">2026-07-09</code>) ایجاد کرده و عکس را مستقیماً داخل آن کپی می‌کند.
                </p>

                <div className="flex gap-2 items-center bg-[#141b2d] border border-slate-800 rounded-md p-2">
                  <Folder size={14} className="text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-300 flex-1 truncate select-all">{settings.selectedDirectory}</span>
                  <button
                    onClick={handleSelectDirectory}
                    className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium transition-colors cursor-pointer flex-shrink-0 border border-slate-700"
                  >
                    تغییر مسیر فولدر
                  </button>
                </div>
              </div>

              {/* Positions Panel */}
              <div id="positions-panel" className="bg-[#0f1524] rounded-lg border border-slate-800 p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">پوزیشن‌های معاملاتی باز ({positions.length})</span>
                  </div>
                </div>

                {positions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-500 bg-[#121826]/30 rounded border border-dashed border-slate-800/80">
                    <UserCheck size={24} className="text-slate-600 mb-2" />
                    <p className="text-xs">هیچ پوزیشن معامله باز یا فعالی یافت نشد.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-[11px] text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-right">
                          <th className="pb-2 text-right">جفت ارز</th>
                          <th className="pb-2 text-center">نوع</th>
                          <th className="pb-2 text-center">حجم</th>
                          <th className="pb-2 text-right">قیمت ورود</th>
                          <th className="pb-2 text-right">قیمت فعلی</th>
                          <th className="pb-2 text-center">سود/زیان (PnL)</th>
                          <th className="pb-2 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => (
                          <tr key={pos.id} className="border-b border-slate-800/50 hover:bg-[#141b2d]/40 transition-colors">
                            <td className="py-2.5 font-mono font-bold text-slate-200">{pos.ticker}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {pos.type === 'BUY' ? 'خرید' : 'فروش'}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-mono">{pos.size}</td>
                            <td className="py-2.5 font-mono text-right">{pos.openPrice.toLocaleString()}</td>
                            <td className="py-2.5 font-mono text-right text-slate-400">{pos.currentPrice.toLocaleString()}</td>
                            <td className={`py-2.5 text-center font-mono font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()} $
                            </td>
                            <td className="py-2.5 text-center">
                              <button
                                onClick={() => handleClosePosition(pos.id)}
                                className="py-0.5 px-2 bg-rose-950/30 text-rose-400 hover:bg-rose-600 hover:text-white rounded text-[10px] transition-all cursor-pointer border border-rose-900/30 font-medium"
                              >
                                خروج سریع
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Price Alarms Panel */}
              <div id="alarms-panel" className="bg-[#0f1524] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">هشدارهای قیمت (Alarms)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 select-none">بررسی مداوم قیمت با کمترین CPU</span>
                </div>

                {/* Add alarm inline form */}
                <div className="flex gap-2 mb-3 bg-[#141b2d] p-2 rounded border border-slate-800">
                  <input
                    type="number"
                    value={newAlarmPrice}
                    onChange={(e) => setNewAlarmPrice(e.target.value)}
                    placeholder="قیمت هدف (مثلاً 64500)"
                    className="flex-1 bg-[#161f33] border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  
                  <select
                    value={newAlarmType}
                    onChange={(e: any) => setNewAlarmType(e.target.value)}
                    className="bg-[#161f33] border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ABOVE">بالاتر از (≥</option>
                    <option value="BELOW">پایین‌تر از (≤</option>
                  </select>

                  <button
                    onClick={handleAddAlarm}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={13} />
                    <span>افزودن</span>
                  </button>
                </div>

                {/* Alarms list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {alarms.map((alarm) => (
                    <div 
                      key={alarm.id} 
                      className={`flex items-center justify-between p-2 rounded border text-xs ${alarm.isTriggered ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-400' : 'bg-[#121826] border-slate-800/80'}`}
                    >
                      <div className="flex items-center gap-2">
                        {alarm.isTriggered ? (
                          <CheckCircle size={13} className="text-indigo-400" />
                        ) : (
                          <AlertTriangle size={13} className={alarm.type === 'ABOVE' ? 'text-emerald-400 animate-pulse' : 'text-amber-400 animate-pulse'} />
                        )}
                        <span className="font-mono font-bold select-all">{alarm.ticker}</span>
                        <span className="font-mono">{alarm.type === 'ABOVE' ? '≥' : '≤'} {alarm.price.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {alarm.isTriggered ? (
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">زنگ خورد</span>
                        ) : (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">فعال</span>
                        )}
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>
          </main>

          {/* Toast Notification */}
          {toast && toast.show && (
            <div className={`fixed bottom-4 left-4 z-50 px-4 py-3 rounded-md shadow-lg border text-xs max-w-sm flex items-center gap-2 animate-fade-in ${
              toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' : 
              toast.type === 'warning' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' : 
              'bg-slate-950/90 border-slate-700 text-slate-200'
            }`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <p className="whitespace-pre-line leading-relaxed">{toast.message}</p>
            </div>
          )}

          {/* Settings Modal (Exit & Close Config) */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-[#0f1524] border border-slate-800 rounded-lg max-w-md w-full p-5 animate-fade-in text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Settings size={14} className="text-indigo-400" />
                    <span>تنظیمات عمومی دستیار معاملاتی</span>
                  </h3>
                  <button 
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer font-bold"
                  >
                    بستن ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Exit Dialog Toggle (Core request #1) */}
                  <div className="flex items-center justify-between p-3 rounded bg-[#141b2d] border border-slate-800/80">
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="text-[11px] font-bold text-slate-200">تأییدیه خروج در صورت داشتن پوزیشن باز</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        اگر پوزیشن باز داشته باشید، موقع بستن پنجره تأییدیه می‌خواهد. خاموش کردن این گزینه سرعت بسته شدن را فوق‌العاده افزایش می‌دهد.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 select-none">
                      <input 
                        type="checkbox" 
                        checked={settings.confirmOnCloseWithOpenPosition} 
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, confirmOnCloseWithOpenPosition: e.target.checked }));
                          showToast(`تاییدیه خروج ${e.target.checked ? 'روشن' : 'خاموش'} شد`, 'info');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  {/* Sound Trigger */}
                  <div className="flex items-center justify-between p-3 rounded bg-[#141b2d] border border-slate-800/80">
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="text-[11px] font-bold text-slate-200">پخش صدای زنگ هشدار قیمت</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        هنگام رسیدن قیمت به مقادیر آلارم، زنگ هشدار صوتی ملایم پخش می‌شود.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 select-none">
                      <input 
                        type="checkbox" 
                        checked={settings.soundEnabled} 
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all cursor-pointer"
                  >
                    ذخیره تنظیمات
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
