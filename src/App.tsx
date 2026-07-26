import { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Power, 
  Terminal, 
  Settings, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  Clock, 
  Sliders, 
  AlertCircle,
  RefreshCw,
  Keyboard,
  Delete,
  CornerDownLeft,
  Space,
  Laptop,
  Send,
  Command,
  Camera,
  Download,
  FileText,
  Upload,
  Database,
  Trash2,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  Crosshair
} from 'lucide-react';

export interface TradeRecord {
  id: string;
  date: string;
  time: string;
  tradingMode: string;
  strategyName: string;
  tradeTitle: string;
  tradeSymbol: string;
  tradeDirection: 'LONG' | 'SHORT';
  entryPrice: string;
  exitPrice: string;
  tradePnL: string;
  watermarkTag: string;
  postText: string;
}

export default function App() {
  // Screen & View States
  const [monitor2Active, setMonitor2Active] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(85);
  const [localPort, setLocalPort] = useState<string>('5000');
  const [connectionStatus, setConnectionStatus] = useState<'simulated' | 'connected' | 'error'>('simulated');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trade_screenshot' | 'archive' | 'desk'>('trade_screenshot');
  
  // Timer States
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerDuration, setTimerDuration] = useState<number>(300); // 5 minutes default
  
  // Virtual Keyboard States
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [keyboardLayout, setKeyboardLayout] = useState<'fa' | 'en' | 'num' | 'shortcuts'>('fa');
  const [keyboardText, setKeyboardText] = useState<string>('');
  const [isShift, setIsShift] = useState<boolean>(false);

  // Trade Close Screenshot & Watermark Generator States
  const [tradingMode, setTradingMode] = useState<string>('مد اسپایک (Spike Mode)');
  const [strategyName, setStrategyName] = useState<string>('استراتژی شکست و اسپایک (Spike & Breakout)');
  const [tradeTitle, setTradeTitle] = useState<string>('معامله اسکالپ بیت‌کوین (BTC/USDT)');
  const [tradeSymbol, setTradeSymbol] = useState<string>('BTC/USDT');
  const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('64,250');
  const [exitPrice, setExitPrice] = useState<string>('65,800');
  const [tradePnL, setTradePnL] = useState<string>('+$1,550 (+2.41%)');
  const [postText, setPostText] = useState<string>('معامله در مد اسپایک بر اساس شکست مقاومت ۱۵ دقیقه باز شد. پوزیشن پس از برخورد به تارگت کامل کلوز گردید.');
  const [watermarkTag, setWatermarkTag] = useState<string>('@Soheil_Keshtkar');
  const [customChartImage, setCustomChartImage] = useState<string | null>(null);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trade Archive State (Stored in LocalStorage)
  const [tradeArchive, setTradeArchive] = useState<TradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('soheil_trading_archive');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading trade archive:', e);
    }
    return [
      {
        id: '1',
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        tradingMode: 'مد اسپایک (Spike Mode)',
        strategyName: 'اسپایک مومنتوم و شکست (Spike Breakout)',
        tradeTitle: 'کلوز معامله اسپایک بیت‌کوین',
        tradeSymbol: 'BTC/USDT',
        tradeDirection: 'LONG',
        entryPrice: '64,250',
        exitPrice: '65,800',
        tradePnL: '+$1,550 (+2.41%)',
        watermarkTag: '@Soheil_Keshtkar',
        postText: 'معامله در مد اسپایک بر اساس شکست مقاومت ۱۵ دقیقه باز شد. پوزیشن پس از برخورد به تارگت کامل کلوز گردید.'
      }
    ];
  });

  // Command Logs State
  const [logs, setLogs] = useState<Array<{ id: string; time: string; action: string; status: 'success' | 'info' | 'error' }>>([
    { id: '1', time: new Date().toLocaleTimeString('fa-IR'), action: 'سیستم آماده به کار (کنترل مانیتور ۲، واتر‌مارک و آرشیو اکسل اسپایک)', status: 'info' }
  ]);

  // Sync Trade Archive to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('soheil_trading_archive', JSON.stringify(tradeArchive));
    } catch (e) {
      console.error('Error saving trade archive:', e);
    }
  }, [tradeArchive]);

  // Handle countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setMonitor2Active(false);
            addLog('خاموشی خودکار مانیتور ۲ از طریق تایمر', 'success');
            triggerLocalCommand(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const addLog = (action: string, status: 'success' | 'info' | 'error' = 'info') => {
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString('fa-IR'),
        action,
        status
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Copy code or text
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Local command triggering
  const triggerLocalCommand = async (state: boolean) => {
    const actionName = state ? 'روشن' : 'خاموش';
    try {
      const response = await fetch(`http://localhost:${localPort}/monitor?state=${state ? 'on' : 'off'}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: state ? 'on' : 'off' })
      });

      if (response.ok) {
        setConnectionStatus('connected');
        addLog(`ارسال فرمان ${actionName} به مانیتور ۲ با موفقیت انجام شد`, 'success');
      } else {
        throw new Error('Local server error');
      }
    } catch (err) {
      setConnectionStatus('simulated');
      addLog(`فرمان ${actionName} در مانیتور ۲ اعمال شد (شبیه‌ساز مرورگر)`, 'info');
    }
  };

  // Test Connection
  const testLocalConnection = async () => {
    addLog('در حال بررسی اتصال به سرور محلی دسکتاپ...', 'info');
    try {
      const res = await fetch(`http://localhost:${localPort}/`, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        setConnectionStatus('connected');
        addLog('اتصال به سرور محلی دسکتاپ برقرار است', 'success');
      } else {
        setConnectionStatus('error');
        addLog('سرور محلی پورت ' + localPort + ' پاسخ نداد', 'error');
      }
    } catch (e) {
      setConnectionStatus('simulated');
      addLog('سرور محلی یافت نشد. سیستم در حالت شبیه‌ساز مرورگر فعال است', 'info');
    }
  };

  // Toggle Monitor 2
  const toggleMonitor2 = () => {
    const newState = !monitor2Active;
    setMonitor2Active(newState);
    triggerLocalCommand(newState);
  };

  // Start Auto Sleep Timer
  const startTimer = () => {
    if (timerActive) {
      setTimerActive(false);
      setTimeLeft(0);
      addLog('تایمر خاموشی خودکار لغو شد', 'info');
    } else {
      setTimeLeft(timerDuration);
      setTimerActive(true);
      const mins = Math.floor(timerDuration / 60);
      addLog(`تایمر خاموشی خودکار برای ${mins} دقیقه دیگر فعال شد`, 'success');
    }
  };

  // Image Upload for Chart
  const handleChartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomChartImage(event.target.result as string);
          addLog('تصویر جدید چارت معامله بارگذاری شد', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // SAVE CURRENT TRADE TO ARCHIVE & EXCEL
  const saveTradeToArchive = () => {
    const newRecord: TradeRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      tradingMode: tradingMode,
      strategyName: strategyName,
      tradeTitle: tradeTitle,
      tradeSymbol: tradeSymbol,
      tradeDirection: tradeDirection,
      entryPrice: entryPrice,
      exitPrice: exitPrice,
      tradePnL: tradePnL,
      watermarkTag: watermarkTag,
      postText: postText
    };

    setTradeArchive((prev) => [newRecord, ...prev]);
    addLog(`معامله در حالت "${tradingMode}" با متن پست ترید به آرشیو و اکسل اضافه شد!`, 'success');
  };

  // EXPORT ARCHIVE TO EXCEL (CSV with UTF-8 BOM)
  const exportArchiveToExcel = () => {
    if (tradeArchive.length === 0) {
      addLog('هیچ معامله‌ای در آرشیو جهت خروجی اکسل وجود ندارد', 'error');
      return;
    }

    const headers = [
      'تاریخ',
      'زمان',
      'حالت معامله',
      'نام استراتژی',
      'عنوان معامله',
      'نماد',
      'پوزیشن',
      'قیمت ورود',
      'قیمت خروج',
      'سود / زیان',
      'تگ واترمارک',
      'یادداشت و تحلیل پست ترید'
    ];

    const rows = tradeArchive.map((t) => [
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.tradingMode}"`,
      `"${t.strategyName}"`,
      `"${t.tradeTitle.replace(/"/g, '""')}"`,
      `"${t.tradeSymbol}"`,
      `"${t.tradeDirection}"`,
      `"${t.entryPrice}"`,
      `"${t.exitPrice}"`,
      `"${t.tradePnL}"`,
      `"${t.watermarkTag}"`,
      `"${t.postText.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Trade_Archive_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog('فایل اکسل (CSV UTF-8) با موفقیت دانلود شد!', 'success');
  };

  // Delete Record from Archive
  const deleteTradeRecord = (id: string) => {
    setTradeArchive((prev) => prev.filter((item) => item.id !== id));
    addLog('معامله از آرشیو حذف شد', 'info');
  };

  // Clear Entire Archive
  const clearEntireArchive = () => {
    if (window.confirm('آیا از پاکسازی کامل آرشیو معاملات مطمئن هستید؟')) {
      setTradeArchive([]);
      addLog('کل آرشیو معاملات پاکسازی گردید', 'info');
    }
  };

  // Trade Close Canvas Screenshot Generator
  const generateAndDownloadScreenshot = () => {
    setIsGeneratingCanvas(true);
    addLog('در حال ساخت اسکرین‌شات کلوز معامله با واتر‌مارک اختصاصی...', 'info');

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      addLog('خطا در ایجاد Canvas اسکرین‌شات', 'error');
      setIsGeneratingCanvas(false);
      return;
    }

    // 1. Overall Dark Canvas Background
    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. TOP WATERMARK BANNER (2cm / 95px height space, Solid Non-transparent)
    ctx.fillStyle = '#0f172a'; // Solid dark slate background
    ctx.fillRect(0, 0, canvas.width, 95);
    
    // Bottom accent line for top banner
    ctx.fillStyle = '#dc2626'; // Red accent line
    ctx.fillRect(0, 93, canvas.width, 2);

    // Top Right Aligned Text Drawing for Post-Trade Notes
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    // Top Header Badge Title
    ctx.font = 'bold 12px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('📝 یادداشت پست / تحلیل رفلکس معامله (از بالا راست):', canvas.width - 25, 24);

    // Post Text Content (Multi-line rendering with support for \n linebreaks)
    ctx.font = 'bold 14px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#f8fafc';

    // Split post text into paragraphs by newline
    const paragraphs = (postText || 'متن پست یا تحلیل معامله خود را وارد کنید...').split('\n');
    let lineY = 48;
    const maxLineWidth = canvas.width - 50;

    for (const paragraph of paragraphs) {
      if (lineY > 88) break;
      const words = paragraph.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && i > 0) {
          ctx.fillText(currentLine, canvas.width - 25, lineY);
          currentLine = words[i] + ' ';
          lineY += 20;
          if (lineY > 88) break;
        } else {
          currentLine = testLine;
        }
      }
      if (lineY <= 88 && currentLine.trim()) {
        ctx.fillText(currentLine, canvas.width - 25, lineY);
        lineY += 20;
      }
    }

    // 3. MIDDLE AREA - Chart & Position Graphic (height 585px from y=95 to y=680)
    if (customChartImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 95, canvas.width, 585);
        finishCanvasDrawing(canvas, ctx);
      };
      img.onerror = () => {
        drawSimulatedChartCanvas(ctx, 95, 585, canvas.width);
        finishCanvasDrawing(canvas, ctx);
      };
      img.src = customChartImage;
    } else {
      drawSimulatedChartCanvas(ctx, 95, 585, canvas.width);
      finishCanvasDrawing(canvas, ctx);
    }
  };

  const drawSimulatedChartCanvas = (ctx: CanvasRenderingContext2D, startY: number, height: number, width: number) => {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, startY, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = startY + 50; y < startY + height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 80; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + height);
      ctx.stroke();
    }

    // Draw Simulated Candlesticks
    const candles = [
      { x: 120, open: 280, close: 320, high: 340, low: 270, isGreen: true },
      { x: 200, open: 320, close: 300, high: 330, low: 290, isGreen: false },
      { x: 280, open: 300, close: 360, high: 380, low: 290, isGreen: true },
      { x: 360, open: 360, close: 410, high: 420, low: 350, isGreen: true },
      { x: 440, open: 410, close: 380, high: 430, low: 370, isGreen: false },
      { x: 520, open: 380, close: 450, high: 460, low: 370, isGreen: true },
      { x: 600, open: 450, close: 500, high: 520, low: 440, isGreen: true },
      { x: 680, open: 500, close: 470, high: 510, low: 460, isGreen: false },
      { x: 760, open: 470, close: 530, high: 540, low: 460, isGreen: true },
      { x: 840, open: 530, close: 580, high: 590, low: 520, isGreen: true },
      { x: 920, open: 580, close: 560, high: 600, low: 550, isGreen: false },
      { x: 1000, open: 560, close: 630, high: 640, low: 550, isGreen: true },
      { x: 1080, open: 630, close: 660, high: 670, low: 620, isGreen: true }
    ];

    candles.forEach((c) => {
      const topY = startY + (height - (c.high - 180));
      const bottomY = startY + (height - (c.low - 180));
      const openY = startY + (height - (c.open - 180));
      const closeY = startY + (height - (c.close - 180));

      ctx.strokeStyle = c.isGreen ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, topY);
      ctx.lineTo(c.x, bottomY);
      ctx.stroke();

      ctx.fillStyle = c.isGreen ? '#22c55e' : '#ef4444';
      const bY = Math.min(openY, closeY);
      const bH = Math.max(Math.abs(closeY - openY), 6);
      ctx.fillRect(c.x - 14, bY, 28, bH);
    });

    // Price lines
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#f59e0b'; // Entry
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, startY + 370);
    ctx.lineTo(width, startY + 370);
    ctx.stroke();

    ctx.strokeStyle = '#10b981'; // Exit
    ctx.beginPath();
    ctx.moveTo(0, startY + 130);
    ctx.lineTo(width, startY + 130);
    ctx.stroke();
    ctx.setLineDash([]);

    // Entry / Exit Badges
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, startY + 355, 150, 30);
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(`ورود: ${entryPrice}`, 50, startY + 375);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(40, startY + 115, 150, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`خروج: ${exitPrice}`, 50, startY + 135);
  };

  const finishCanvasDrawing = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // 4. BOTTOM WATERMARK BAR (Solid background, Height 120px from y=680 to y=800)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 680, canvas.width, 120);

    ctx.fillStyle = '#ef4444'; // Red divider line
    ctx.fillRect(0, 680, canvas.width, 2);

    // CRITICAL USER REQUIREMENT:
    // STRATEGY NAME & TRADE DETAILS MOVED EXCLUSIVELY TO BOTTOM-LEFT (پایین چپ)!
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';

    // Line 1: Strategy Name & Trading Mode (Bottom Left - x=30, y=715)
    ctx.font = 'bold 18px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#f59e0b'; // Golden Amber for Strategy Name
    ctx.fillText(`استراتژی: ${strategyName} (${tradingMode})`, 30, 715);

    // Line 2: Trade Title (Bottom Left - x=30, y=742)
    ctx.font = 'bold 16px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tradeTitle, 30, 742);

    // Line 3: Details Line (Symbol, Position, PnL - Bottom Left - x=30, y=766)
    ctx.font = 'bold 14px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = tradeDirection === 'LONG' ? '#34d399' : '#f43f5e';
    ctx.fillText(`${tradeSymbol}  |  ${tradeDirection}  |  سود/زیان: ${tradePnL}`, 30, 766);

    // Line 4: Watermark Tag & Time (Bottom Left - x=30, y=788)
    ctx.font = '12px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`واترمارک: ${watermarkTag}  •  تاریخ ثبت: ${new Date().toLocaleDateString('fa-IR')}`, 30, 788);

    // Right side branding logo (Bottom Right)
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('سهیل کشتکار | Trading Desk', canvas.width - 30, 730);
    ctx.font = '12px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('گزارش کلوز معامله ثبت شده', canvas.width - 30, 755);

    // Download Image
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Trade_Close_${tradeSymbol.replace('/', '_')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      addLog('اسکرین‌شات کلوز معامله با واتر‌مارک دانلود شد!', 'success');
    } catch (err) {
      addLog('امکان دانلود مستقیم تصویر وجود نداشت.', 'error');
    }

    setIsGeneratingCanvas(false);
  };

  const getDurationLabel = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Virtual Keyboard Layouts Data
  const persianRows = [
    ['چ', 'ج', 'ح', 'خ', 'ه', 'ع', 'غ', 'ف', 'ق', 'ث', 'ص', 'ض'],
    ['گ', 'ک', 'م', 'ن', 'ت', 'ا', 'ل', 'ب', 'ی', 'س', 'ش'],
    ['پ', 'و', 'د', 'ذ', 'ر', 'ز', 'ژ', 'ط', 'ظ']
  ];

  const englishRowsLower = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const englishRowsUpper = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const numberRows = [
    ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['+', '-', '*', '/', '=', '%', '@', '#', '$', '!', '؟']
  ];

  const quickShortcuts = [
    { label: 'سوییچ مانیتور (Win+P)', key: 'WIN_P', icon: Monitor },
    { label: 'نمایش دسکتاپ (Win+D)', key: 'WIN_D', icon: Laptop },
    { label: 'کپی (Ctrl+C)', key: 'CTRL_C', icon: Copy },
    { label: 'چسباندن (Ctrl+V)', key: 'CTRL_V', icon: Check },
    { label: 'انتخاب همه (Ctrl+A)', key: 'CTRL_A', icon: Command },
    { label: 'تسک‌منجر (Ctrl+Shift+Esc)', key: 'TASK_MGR', icon: Terminal }
  ];

  const handleKeyPress = (char: string) => {
    setKeyboardText((prev) => prev + char);
  };

  const handleBackspace = () => {
    setKeyboardText((prev) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setKeyboardText((prev) => prev + ' ');
  };

  const handleEnter = () => {
    setKeyboardText((prev) => prev + '\n');
  };

  // Virtual Keyboard Render Helper
  const renderVirtualKeyboard = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-right" dir="rtl">
      {/* Top Keyboard Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/30">
            <Keyboard className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
              صفحه کلید مجازی (Virtual Keyboard)
              <span className="text-[9px] bg-red-950 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">
                هم‌آهنگ موبایل و ویندوز
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">تایپ مستقیم فارسی، انگلیسی، اعداد و کلیدهای میانبر سیستمی</p>
          </div>
        </div>

        {/* Layout Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button 
            onClick={() => setKeyboardLayout('fa')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              keyboardLayout === 'fa' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇮🇷 فارسی
          </button>
          <button 
            onClick={() => setKeyboardLayout('en')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              keyboardLayout === 'en' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇬🇧 English
          </button>
          <button 
            onClick={() => setKeyboardLayout('num')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              keyboardLayout === 'num' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔢 اعداد/نمادها
          </button>
          <button 
            onClick={() => setKeyboardLayout('shortcuts')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              keyboardLayout === 'shortcuts' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ میانبرها
          </button>
        </div>
      </div>

      {/* Input Display Area */}
      <div className="space-y-2">
        <div className="relative">
          <textarea 
            value={keyboardText}
            onChange={(e) => setKeyboardText(e.target.value)}
            placeholder="متن خود را با کیبورد مجازی تایپ کنید..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none font-sans"
            dir="auto"
          />
          {keyboardText && (
            <button 
              onClick={() => setKeyboardText('')}
              className="absolute left-3 top-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 p-1 rounded-lg text-xs transition-colors cursor-pointer"
              title="پاکسازی کل متن"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls for Typed Text */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => copyToClipboard(keyboardText, 'keyboard_text')}
              disabled={!keyboardText}
              className="bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95"
            >
              {copiedText === 'keyboard_text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'keyboard_text' ? 'کپی شد!' : 'کپی متن'}</span>
            </button>

            <button 
              onClick={() => {
                setPostText((prev) => (prev ? prev + '\n' + keyboardText : keyboardText));
                addLog('متن کیبورد مجازی به یادداشت پست ترید منتقل شد', 'success');
              }}
              disabled={!keyboardText}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-red-950/50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>انتقال به متن پست ترید</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {keyboardText.length} کاراکتر
          </span>
        </div>
      </div>

      {/* Keyboard Key Pad Display */}
      <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-850/80 space-y-2">
        
        {/* Persian Layout */}
        {keyboardLayout === 'fa' && (
          <div className="space-y-2 dir-rtl">
            {persianRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center flex-wrap gap-1 sm:gap-1.5">
                {row.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyPress(char)}
                    className="min-w-[2.2rem] sm:min-w-[2.75rem] h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 active:bg-red-600 active:scale-95 border border-slate-800 hover:border-red-500/40 rounded-xl text-slate-100 font-black text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* English Layout */}
        {keyboardLayout === 'en' && (
          <div className="space-y-2 dir-ltr">
            <div className="flex justify-end mb-1">
              <button 
                onClick={() => setIsShift(!isShift)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isShift ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                ⇧ SHIFT {isShift ? '(ON)' : ''}
              </button>
            </div>
            {(isShift ? englishRowsUpper : englishRowsLower).map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center flex-wrap gap-1 sm:gap-1.5">
                {row.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyPress(char)}
                    className="min-w-[2.2rem] sm:min-w-[2.75rem] h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 active:bg-red-600 active:scale-95 border border-slate-800 hover:border-red-500/40 rounded-xl text-slate-100 font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Numbers & Symbols Layout */}
        {keyboardLayout === 'num' && (
          <div className="space-y-2">
            {numberRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center flex-wrap gap-1 sm:gap-1.5">
                {row.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyPress(char)}
                    className="min-w-[2.2rem] sm:min-w-[2.75rem] h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 active:bg-amber-600 active:scale-95 border border-slate-800 hover:border-amber-500/40 rounded-xl text-amber-400 font-mono font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Quick Windows Shortcuts */}
        {keyboardLayout === 'shortcuts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 py-2">
            {quickShortcuts.map((sc) => {
              const IconComp = sc.icon;
              return (
                <button
                  key={sc.key}
                  onClick={() => {
                    addLog(`اجرای میانبر: ${sc.label}`, 'info');
                    if (sc.key === 'WIN_P') toggleMonitor2();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl flex items-center gap-2.5 text-right transition-all cursor-pointer group"
                >
                  <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Common Bottom Control Keys */}
        <div className="pt-2 border-t border-slate-850 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          <button 
            onClick={handleSpace}
            className="flex-1 min-w-[120px] max-w-[260px] h-10 sm:h-11 bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-xl text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Space className="w-4 h-4 text-slate-400" />
            <span>فاصله (Space)</span>
          </button>

          <button 
            onClick={handleBackspace}
            className="px-4 h-10 sm:h-11 bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Delete className="w-4 h-4" />
            <span>پاکسازی حرف</span>
          </button>

          <button 
            onClick={handleEnter}
            className="px-4 h-10 sm:h-11 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span>خط بعدی (Enter)</span>
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 overflow-x-hidden" dir="rtl">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-red-500/30 p-2.5 rounded-xl flex items-center justify-center">
              <Cpu className="text-red-500 w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black tracking-wider text-red-500 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">دستیار هوشمند دسکتاپ</span>
              <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight mt-0.5">مرکز کنترل مانیتورها و آرشیو معاملات سهیل کشتکار</h1>
            </div>
          </div>

          {/* Navigation & Connection Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button 
                onClick={() => setActiveTab('trade_screenshot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'trade_screenshot' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>کلوز معامله و واترمارک</span>
              </button>

              <button 
                onClick={() => setActiveTab('archive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'archive' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>آرشیو معاملات و اکسل ({tradeArchive.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab('desk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'desk' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>کنترل مانیتور ۲</span>
              </button>
            </div>

            {/* Virtual Keyboard Toggle */}
            <button 
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer shadow-lg ${
                showKeyboard 
                  ? 'bg-red-600 text-white border-red-500' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800'
              }`}
            >
              <Keyboard className="w-4 h-4 text-red-400" />
              <span>کیبورد</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">پورت:</span>
              <input 
                type="text" 
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                className="w-12 bg-slate-950 border border-slate-800 text-red-400 rounded text-center py-0.5 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <button 
              onClick={testLocalConnection}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تست اتصال</span>
            </button>

            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                متصل به دسکتاپ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                شبیه‌ساز مرورگر
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Virtual Keyboard Drawer */}
        {showKeyboard && (
          <div className="lg:col-span-12">
            {renderVirtualKeyboard()}
          </div>
        )}

        {/* TRADE CLOSE SCREENSHOT & WATERMARK TOOL VIEW */}
        {activeTab === 'trade_screenshot' && (
          <>
            {/* Left Col (7 cols): Live Screenshot Preview */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
                
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-500">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-100">پیش‌نمایش زنده اسکرین‌شات کلوز معامله</h2>
                      <p className="text-[11px] text-slate-400">واتر‌مارک بالایی با فضا و متن پست + واتر‌مارک استراتژی در پایین‌چپ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>بارگذاری چارت</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleChartImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Simulated Final Canvas / Screenshot Card Preview */}
                <div className="w-full bg-[#070b13] border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col font-sans">
                  
                  {/* TOP WATERMARK BANNER (Allocated 2cm space, Solid Non-Transparent Slate Background, Right-Aligned RTL Text) */}
                  <div className="bg-[#0f172a] border-b-2 border-red-600 px-5 py-3 flex flex-col gap-1 text-right min-h-[95px] justify-center relative z-10" dir="rtl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        یادداشت پست / تحلیل رفلکس معامله (از بالا راست):
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        فضا اختصاصی ۲ سانتی‌متری
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed text-right break-words whitespace-pre-wrap">
                      {postText || 'متن پست یا تحلیل معامله خود را وارد کنید...'}
                    </p>
                  </div>

                  {/* MIDDLE CHART VISUALIZER */}
                  <div className="relative min-h-[300px] sm:min-h-[360px] bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
                    
                    {customChartImage ? (
                      <div className="absolute inset-0 z-0">
                        <img src={customChartImage} alt="Uploaded Trade Chart" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <>
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                        {/* Position Entry & Exit Line Visualizer */}
                        <div className="relative z-10 flex flex-col justify-between h-full py-4 space-y-12">
                          
                          {/* Exit Price Marker */}
                          <div className="flex items-center justify-between bg-emerald-500/20 border-y border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              سطح خروج (Exit): {exitPrice}
                            </span>
                            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">
                              تارگت کامل
                            </span>
                          </div>

                          {/* Candlestick Graphic Bars */}
                          <div className="flex items-end justify-between h-28 px-4 gap-1 sm:gap-2 opacity-70">
                            <div className="w-full bg-emerald-500/50 h-12 rounded-xs" />
                            <div className="w-full bg-emerald-500/70 h-16 rounded-xs" />
                            <div className="w-full bg-rose-500/60 h-8 rounded-xs" />
                            <div className="w-full bg-emerald-500/80 h-22 rounded-xs" />
                            <div className="w-full bg-emerald-500/90 h-28 rounded-xs" />
                            <div className="w-full bg-rose-500/50 h-10 rounded-xs" />
                            <div className="w-full bg-emerald-500/95 h-24 rounded-xs" />
                          </div>

                          {/* Entry Price Marker */}
                          <div className="flex items-center justify-between bg-amber-500/20 border-y border-amber-500 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              سطح ورود (Entry): {entryPrice}
                            </span>
                            <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                              نقطه ماشه
                            </span>
                          </div>

                        </div>
                      </>
                    )}

                  </div>

                  {/* BOTTOM WATERMARK BANNER (Strategy Name & Trade Details positioned EXCLUSIVELY on Bottom-Left!) */}
                  <div className="bg-[#090d16] border-t-2 border-red-600 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                    
                    {/* BOTTOM LEFT WATERMARK DETAILS (استراتژی، عنوان و جزییات در پایین‌چپ) */}
                    <div className="text-left font-sans space-y-1 order-2 sm:order-1" dir="ltr">
                      
                      {/* Strategy Name Banner (Amber Highlight) */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
                          استراتژی: {strategyName} ({tradingMode})
                        </span>
                      </div>

                      {/* Trade Title */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-100">{tradeTitle}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          tradeDirection === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        }`}>
                          {tradeDirection}
                        </span>
                      </div>
                      
                      {/* Symbol & PnL */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                        <span className="text-sky-400 font-mono">{tradeSymbol}</span>
                        <span className="text-slate-600">•</span>
                        <span className={tradeDirection === 'LONG' ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                          سود/زیان: {tradePnL}
                        </span>
                      </div>

                      {/* Watermark Tag & Date */}
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
                        <span className="text-amber-400 font-bold">{watermarkTag}</span>
                        <span>•</span>
                        <span>تاریخ ثبت: {new Date().toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>

                    {/* BOTTOM RIGHT BRANDING BADGE */}
                    <div className="text-right sm:text-right order-1 sm:order-2 border-b sm:border-b-0 border-slate-800 pb-2 sm:pb-0 w-full sm:w-auto" dir="rtl">
                      <span className="text-xs font-black text-slate-200 block">سهیل کشتکار</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Trading Desk Reflex Report</span>
                    </div>

                  </div>

                </div>

                {/* Primary Export & Save Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* DOWNLOAD SCREENSHOT BUTTON */}
                    <button 
                      onClick={generateAndDownloadScreenshot}
                      disabled={isGeneratingCanvas}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-red-950/50 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isGeneratingCanvas ? 'در حال ساخت تصویر...' : 'دانلود اسکرین‌شات واتر‌مارک دار (PNG)'}</span>
                    </button>

                    {/* SAVE TO ARCHIVE & EXCEL BUTTON */}
                    <button 
                      onClick={saveTradeToArchive}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-950/50"
                    >
                      <Database className="w-4 h-4" />
                      <span>ذخیره در آرشیو معامله و اکسل</span>
                    </button>

                    {/* COPY POST TEXT */}
                    <button 
                      onClick={() => copyToClipboard(postText, 'post_text')}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      {copiedText === 'post_text' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedText === 'post_text' ? 'کپی شد!' : 'کپی متن پست'}</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    واتر‌مارک دقیق با فضا ۲ سانت بالایی + پایین‌چپ
                  </span>
                </div>

              </div>

            </div>

            {/* Right Col (5 cols): Form Control Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Settings className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-100">تنظیمات واتر‌مارک، استراتژی و پست‌ترید</h3>
                    <p className="text-[10px] text-slate-400">اطلاعات معامله و متن پست تحلیلی را وارد کنید</p>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-right" dir="rtl">
                  
                  {/* Trading Mode Selector (اسپایک، اسکالپ، سوئینگ، آر‌تی‌ام) */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>حالت معامله (Trading Mode):</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                      {[
                        'مد اسپایک (Spike Mode)',
                        'مد اسکالپ (Scalp Mode)',
                        'مد سوئینگ (Swing Mode)',
                        'مد آر‌تی‌ام (RTM Mode)'
                      ].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setTradingMode(mode)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                            tradingMode === mode ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strategy Name (واترمارک پایین-چپ) */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>نام استراتژی (واتر‌مارک پایین-چپ):</span>
                    </label>
                    <input 
                      type="text" 
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500/50"
                      placeholder="مثلاً: اسپایک شکست مقاومت / RTM / ICT..."
                    />
                  </div>

                  {/* Post Text Input (Top Watermark 2cm) */}
                  <div>
                    <label className="block text-xs font-bold text-red-400 mb-1 flex items-center justify-between">
                      <span>متن پست / تحلیل رفلکس (واتر‌مارک بالا - ۲ سانت):</span>
                      <span className="text-[10px] text-slate-500">راست‌چین</span>
                    </label>
                    <textarea 
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none font-sans"
                      placeholder="متن پست یا توضیحات معامله خود را تایپ کنید..."
                    />
                  </div>

                  {/* Trade Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      عنوان معامله (واتر‌مارک پایین-چپ):
                    </label>
                    <input 
                      type="text" 
                      value={tradeTitle}
                      onChange={(e) => setTradeTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  {/* Symbol & Direction */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        نماد / جفت‌ارز:
                      </label>
                      <input 
                        type="text" 
                        value={tradeSymbol}
                        onChange={(e) => setTradeSymbol(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        پوزیشن:
                      </label>
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => setTradeDirection('LONG')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            tradeDirection === 'LONG' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          LONG
                        </button>
                        <button 
                          onClick={() => setTradeDirection('SHORT')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            tradeDirection === 'SHORT' ? 'bg-rose-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          SHORT
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Entry & Exit Price */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        قیمت ورود:
                      </label>
                      <input 
                        type="text" 
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        قیمت خروج:
                      </label>
                      <input 
                        type="text" 
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* PnL & Watermark Tag */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        سود / زیان (PnL):
                      </label>
                      <input 
                        type="text" 
                        value={tradePnL}
                        onChange={(e) => setTradePnL(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-red-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        تگ واتر‌مارک:
                      </label>
                      <input 
                        type="text" 
                        value={watermarkTag}
                        onChange={(e) => setWatermarkTag(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-red-500/50 font-mono"
                      />
                    </div>
                  </div>

                </div>

                {/* Information Tip */}
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-[11px] text-emerald-300 leading-relaxed text-right" dir="rtl">
                  <span className="font-bold">بروزرسانی جدید:</span> متن پست ترید در بالا راست، و نام استراتژی ({strategyName}) به همراه جزییات معامله دقیقاً در **پایین-چپ** قرار می‌گیرد و با دکمه "ذخیره در آرشیو معامله و اکسل" تمامی یادداشت‌های مد اسپایک در خروجی فایل اکسل ثبت می‌شود.
                </div>

              </div>

            </div>
          </>
        )}

        {/* TRADE ARCHIVE & EXCEL EXPORT VIEW */}
        {activeTab === 'archive' && (
          <div className="lg:col-span-12 flex flex-col gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
              
              {/* Archive Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-100">آرشیو جامع معاملات و خروجی اکسل</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ثبت گزارشات کامل معامله شامل حالت اسپایک، استراتژی و متن یادداشت پست‌ترید</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportArchiveToExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-950/50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>دانلود خروجی اکسل (CSV UTF-8)</span>
                  </button>

                  <button 
                    onClick={clearEntireArchive}
                    className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>پاکسازی آرشیو</span>
                  </button>
                </div>
              </div>

              {/* Archive Data Table */}
              {tradeArchive.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <Database className="w-8 h-8 mx-auto text-slate-600" />
                  <p>هیچ معامله‌ای در آرشیو ثبت نشده است.</p>
                  <p className="text-[11px] text-slate-600">از تب "کلوز معامله و واترمارک"، روی دکمه "ذخیره در آرشیو معامله و اکسل" کلیک کنید.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                        <th className="p-3">تاریخ و زمان</th>
                        <th className="p-3">حالت معامله</th>
                        <th className="p-3">نام استراتژی</th>
                        <th className="p-3">عنوان / نماد</th>
                        <th className="p-3">پوزیشن</th>
                        <th className="p-3">قیمت ورود / خروج</th>
                        <th className="p-3">سود/زیان (PnL)</th>
                        <th className="p-3">یادداشت و تحلیل پست‌ترید</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {tradeArchive.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            <div>{item.date}</div>
                            <div className="text-[10px] text-slate-500">{item.time}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.tradingMode}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-amber-300 max-w-[150px] truncate">
                            {item.strategyName}
                          </td>
                          <td className="p-3 font-bold text-slate-200 whitespace-nowrap">
                            <div>{item.tradeTitle}</div>
                            <span className="text-[10px] text-sky-400 font-mono">{item.tradeSymbol}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.tradeDirection === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            }`}>
                              {item.tradeDirection}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                            <div className="text-amber-400">ورود: {item.entryPrice}</div>
                            <div className="text-emerald-400">خروج: {item.exitPrice}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {item.tradePnL}
                          </td>
                          <td className="p-3 text-slate-300 max-w-[280px] leading-relaxed text-[11px]">
                            <p className="line-clamp-2">{item.postText}</p>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button 
                              onClick={() => deleteTradeRecord(item.id)}
                              className="bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="حذف از آرشیو"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* DESK MONITOR CONTROL VIEW */}
        {activeTab === 'desk' && (
          <>
            {/* Left / Top - Visual Studio and Desk Simulation (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">نمای شماتیک دسکتاپ</span>
                </div>

                {/* Simulated Dual Monitors */}
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-10 mt-4">
                  
                  {/* Monitor 1 (Primary display) */}
                  <div className="flex flex-col items-center group">
                    <div className="w-64 h-40 bg-slate-950 border-2 border-slate-750 rounded-xl p-2 shadow-2xl relative flex flex-col justify-between">
                      <div className="flex-1 flex flex-col justify-between pt-4 font-mono text-[9px] text-slate-400">
                        <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5 mb-1.5 text-[10px] text-red-400 font-bold">
                          <Monitor className="w-3 h-3" />
                          <span>مانیتور اصلی (۱)</span>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end gap-1.5 h-20 bg-slate-900/60 p-1.5 rounded border border-slate-900 overflow-hidden">
                          <div className="flex justify-between items-center text-[8px] text-slate-500">
                            <span>BTC/USD 1m</span>
                            <span className="text-emerald-400 font-sans font-bold">LIVE</span>
                          </div>
                          <div className="flex items-end justify-between h-8 gap-0.5 px-1 pt-2">
                            <div className="w-full bg-emerald-500/45 h-3 rounded-sm" />
                            <div className="w-full bg-emerald-500/60 h-5 rounded-sm" />
                            <div className="w-full bg-rose-500/50 h-2 rounded-sm" />
                            <div className="w-full bg-emerald-500/80 h-7 rounded-sm" />
                            <div className="w-full bg-rose-500/70 h-4 rounded-sm" />
                            <div className="w-full bg-emerald-500/90 h-6 rounded-sm" />
                          </div>
                        </div>
                        <span className="text-[7px] text-center text-slate-600 mt-1">Trading Desk Assistant v1.0</span>
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-slate-800 border-x border-slate-700" />
                    <div className="w-24 h-2.5 bg-slate-750 rounded-t-lg shadow-inner" />
                  </div>

                  {/* Monitor 2 (Secondary display) */}
                  <div className="flex flex-col items-center group">
                    <div className={`w-64 h-40 border-2 rounded-xl p-2 shadow-2xl relative flex flex-col justify-between transition-all duration-300 ${
                      monitor2Active 
                        ? 'bg-slate-900 border-red-500/40 shadow-red-950/20' 
                        : 'bg-slate-950 border-slate-900 opacity-60'
                    }`}>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${monitor2Active ? 'bg-emerald-400' : 'bg-amber-600'}`} />
                        <span className="text-[7px] font-mono text-slate-500">{monitor2Active ? 'Active' : 'Standby'}</span>
                      </div>

                      {monitor2Active ? (
                        <div className="flex-1 flex flex-col justify-between pt-4 font-mono text-[9px] text-slate-400">
                          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-1.5 text-[10px] text-amber-400 font-bold">
                            <Monitor className="w-3 h-3 text-red-500" />
                            <span>صفحه دوم مانیتور (۲)</span>
                          </div>
                          
                          <div className="flex-1 rounded bg-slate-900 border border-slate-800 overflow-hidden relative flex flex-col justify-center items-center p-3">
                            <span className="text-[14px] font-sans font-black text-slate-300 tracking-widest uppercase">SOHEIL</span>
                            <span className="text-[8px] text-red-500 font-bold mt-1">S E C O N D A R Y</span>
                            
                            <div className="absolute bottom-1 right-2 left-2 flex justify-between text-[7px] text-slate-500">
                              <span>درخشندگی: {brightness}%</span>
                              <span>فرمان فعال</span>
                            </div>
                          </div>
                          <span className="text-[7px] text-center text-slate-600 mt-1">HDMI-2 / DisplaySwitch Link</span>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                          <Power className="w-8 h-8 opacity-20 stroke-[1.5]" />
                          <span className="text-[10px] font-bold tracking-wider mt-2 uppercase font-sans">Power Off</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-10 h-6 border-x ${monitor2Active ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-850'}`} />
                    <div className={`w-24 h-2.5 rounded-t-lg ${monitor2Active ? 'bg-slate-750 shadow-inner' : 'bg-slate-850'}`} />
                  </div>

                </div>

                <div className="w-full h-2 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 rounded-full border border-slate-850/50 mt-2" />
              </div>

              {/* Sliders & Timer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-red-500" />
                    تنظیمات پیشرفته نمایشگر ۲
                  </h3>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>شبیه‌ساز درخشندگی</span>
                      <span className="font-mono text-red-400 font-bold">{brightness}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      disabled={!monitor2Active}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-850 text-xs">
                    <span className="text-slate-400">حالت آماده‌باش (Standby):</span>
                    <span className="font-mono font-bold text-amber-500">موتور DDC/CI فعال</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    تایمر خاموشی خودکار
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={timerDuration} 
                      onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                      disabled={timerActive}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/50 cursor-pointer disabled:opacity-50"
                    >
                      <option value={30}>۳۰ ثانیه (جهت تست سریع)</option>
                      <option value={300}>۵ دقیقه</option>
                      <option value={900}>۱۵ دقیقه</option>
                      <option value={1800}>۳۰ دقیقه</option>
                      <option value={3600}>۱ ساعت</option>
                    </select>

                    <button 
                      onClick={startTimer}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        timerActive 
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/30 hover:bg-rose-900' 
                          : 'bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800'
                      }`}
                    >
                      {timerActive ? 'لغو تایمر' : 'فعال‌سازی'}
                    </button>
                  </div>

                  {timerActive && (
                    <div className="flex items-center justify-between bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-red-400">مانیتور ۲ خاموش می‌شود در:</span>
                      <span className="font-mono font-black text-red-400 tracking-wider">{getDurationLabel(timeLeft)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Console Logs */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-red-500" />
                  کنسول گزارش رویدادها
                </h3>
                <div className="h-32 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[10px] overflow-y-auto space-y-2 flex flex-col-reverse custom-scrollbar">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 border-b border-slate-900/50 pb-1 last:border-0 leading-relaxed">
                      <span className="text-slate-500 text-[9px] shrink-0">{log.time}</span>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                        log.status === 'success' ? 'bg-emerald-400' : log.status === 'error' ? 'bg-rose-500' : 'bg-sky-400'
                      }`} />
                      <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-rose-400' : 'text-slate-300'}>
                        {log.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right / Bottom - Controller (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="space-y-1 mt-2">
                  <h2 className="text-base font-black text-slate-100">کلید فرمان سخت‌افزاری</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">با فشردن کلید زیر، فرمان روشن/خاموش به صفحه نمایش دوم صادر می‌شود.</p>
                </div>

                <div className="py-10">
                  <button 
                    onClick={toggleMonitor2}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      monitor2Active 
                        ? 'bg-gradient-to-b from-red-600 to-red-800 shadow-xl hover:scale-105 active:scale-95' 
                        : 'bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Power className={`w-8 h-8 ${monitor2Active ? 'text-white' : 'text-slate-500'}`} />
                      <span className={`text-[11px] font-black tracking-wider uppercase ${monitor2Active ? 'text-white' : 'text-slate-500'}`}>
                        {monitor2Active ? 'روشن' : 'خاموش'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">وضعیت مانیتور دوم:</span>
                  <span className={`font-sans font-black ${monitor2Active ? 'text-red-400' : 'text-slate-500'}`}>
                    {monitor2Active ? 'SCREEN 2 ACTIVE' : 'SCREEN 2 POWER OFF'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                  <Settings className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-200">راهنمای استفاده اتصال مانیتور</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed text-right" dir="rtl">
                  دستورات صادر شده از این مرکز کنترل، از طریق پورت محلی ۵۰۰۰ ارسال شده و مانیتور دوم را با متدهای سیستمی مدیریت می‌کند.
                </p>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-600 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <span>DESIGNED EXCLUSIVELY FOR SOHEIL KESHTKAR</span>
          <span>© 2026 TRADING DESK POWER HUB</span>
        </div>
      </footer>

    </div>
  );
}
