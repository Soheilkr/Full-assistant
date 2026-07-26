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
  Upload
} from 'lucide-react';

export default function App() {
  // Screen States
  const [monitor2Active, setMonitor2Active] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(85);
  const [localPort, setLocalPort] = useState<string>('5000');
  const [connectionStatus, setConnectionStatus] = useState<'simulated' | 'connected' | 'error'>('simulated');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desk' | 'trade_screenshot'>('trade_screenshot');
  
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
  const [tradeTitle, setTradeTitle] = useState<string>('معامله اسکالپ بیت‌کوین (BTC/USDT)');
  const [tradeSymbol, setTradeSymbol] = useState<string>('BTC/USDT');
  const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('64,250');
  const [exitPrice, setExitPrice] = useState<string>('65,800');
  const [tradePnL, setTradePnL] = useState<string>('+$1,550 (+2.41%)');
  const [postText, setPostText] = useState<string>('معامله بر اساس شکست مقاومت ۱۵ دقیقه باز شد. مدیریت ریسک رعایت شد و پس از برخورد به تارگت اول کلوز گردید.');
  const [watermarkTag, setWatermarkTag] = useState<string>('@Soheil_Keshtkar');
  const [customChartImage, setCustomChartImage] = useState<string | null>(null);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Command Logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; action: string; status: 'success' | 'info' | 'error' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), action: 'سیستم آماده به کار (صفحه کلید مجازی و شبیه‌ساز مانیتور ۲)', status: 'info' }
  ]);

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
        time: new Date().toLocaleTimeString(),
        action,
        status
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Function to copy code or typed text to clipboard
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
        throw new Error('Local server returned error');
      }
    } catch (err) {
      setConnectionStatus('simulated');
      addLog(`فرمان ${actionName} در مانیتور ۲ اعمال شد (شبیه‌سازی مرورگر)`, 'info');
    }
  };

  // Send typed text to desktop server
  const sendKeyboardTextToDesktop = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    addLog(`ارسال متن کیبورد به دسکتاپ: "${textToSend}"`, 'info');
    try {
      const response = await fetch(`http://localhost:${localPort}/type`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textToSend })
      });
      if (response.ok) {
        addLog('متن با موفقیت روی ویندوز تایپ شد', 'success');
      } else {
        addLog('متن در محیط شبیه‌ساز کپی شد', 'info');
      }
    } catch (err) {
      addLog('سرور محلی پاسخ نداد. متن در کادرمتن قرار گرفت (آماده کپی)', 'info');
    }
  };

  // Send shortcut to desktop
  const sendShortcut = async (shortcutKey: string, label: string) => {
    addLog(`اجرای کلید میانبر: ${label}`, 'info');
    if (shortcutKey === 'WIN_P') {
      toggleMonitor2();
      return;
    }
    try {
      await fetch(`http://localhost:${localPort}/shortcut?key=${shortcutKey}`, {
        method: 'POST',
        mode: 'cors'
      });
    } catch (err) {
      // simulated
    }
  };

  const toggleMonitor2 = () => {
    const newState = !monitor2Active;
    setMonitor2Active(newState);
    triggerLocalCommand(newState);
  };

  // Test local connection manually
  const testLocalConnection = async () => {
    addLog('در حال تست اتصال به سرور محلی دسکتاپ...', 'info');
    try {
      const response = await fetch(`http://localhost:${localPort}/status`, {
        method: 'GET',
        mode: 'cors'
      });
      if (response.ok) {
        setConnectionStatus('connected');
        addLog('اتصال موفقیت‌آمیز به سرویس دسکتاپ برقرار شد!', 'success');
      } else {
        setConnectionStatus('error');
        addLog('سرویس محلی پاسخ نامعتبر داد.', 'error');
      }
    } catch (err) {
      setConnectionStatus('simulated');
      addLog('سرور محلی یافت نشد. استفاده از حالت شبیه‌ساز مرورگر.', 'info');
    }
  };

  // Start / Cancel Sleep Timer
  const startTimer = () => {
    if (timerActive) {
      setTimerActive(false);
      addLog('تایمر خاموشی خودکار لغو شد', 'info');
    } else {
      setTimeLeft(timerDuration);
      setTimerActive(true);
      const mins = Math.floor(timerDuration / 60);
      addLog(`تایمر خاموشی خودکار برای ${mins} دقیقه دیگر فعال شد`, 'success');
    }
  };

  // Image Upload Handler for Chart
  const handleChartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomChartImage(event.target?.result as string);
        addLog('تصویر سفارشی چارت معامله بارگذاری شد', 'success');
      };
      reader.readAsDataURL(file);
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

    // 2. TOP WATERMARK BANNER (2cm / 85px height space, Solid Non-transparent)
    ctx.fillStyle = '#0f172a'; // Solid dark slate (NO transparency as requested)
    ctx.fillRect(0, 0, canvas.width, 95);
    
    // Bottom accent line for top banner
    ctx.fillStyle = '#dc2626'; // Red accent line
    ctx.fillRect(0, 93, canvas.width, 2);

    // Top Right Aligned Text
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    // Top Header Small Badge
    ctx.font = 'bold 12px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('📝 یادداشت پست / تحلیل رفلکس معامله:', canvas.width - 25, 26);

    // Post Text Content (Starting top right)
    ctx.font = 'bold 15px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#f8fafc';

    // Simple multi-line text wrapping for top right post
    const words = postText.split(' ');
    let currentLine = '';
    let lineY = 52;
    const maxTextWidth = canvas.width - 50;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && i > 0) {
        ctx.fillText(currentLine, canvas.width - 25, lineY);
        currentLine = words[i] + ' ';
        lineY += 22;
        if (lineY > 88) break; // stay within allocated 2cm top header
      } else {
        currentLine = testLine;
      }
    }
    if (lineY <= 88) {
      ctx.fillText(currentLine, canvas.width - 25, lineY);
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
    ctx.fillStyle = '#090d16'; // Solid background
    ctx.fillRect(0, 680, canvas.width, 120);

    ctx.fillStyle = '#ef4444'; // Red divider line
    ctx.fillRect(0, 680, canvas.width, 2);

    // CRITICAL USER REQUIREMENT:
    // Move Trade Name & Details watermark to BOTTOM-LEFT (پایین چپ)!
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';

    // Trade Name (Bottom Left)
    ctx.font = 'bold 22px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tradeTitle, 30, 720);

    // Details Line (Symbol, Direction, PnL - Bottom Left)
    ctx.font = 'bold 16px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = tradeDirection === 'LONG' ? '#34d399' : '#f43f5e';
    ctx.fillText(`${tradeSymbol}  |  ${tradeDirection}  |  سود/زیان: ${tradePnL}`, 30, 752);

    // Watermark Tag & Time (Bottom Left)
    ctx.font = '13px Tahoma, Vazirmatn, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`واترمارک: ${watermarkTag}  •  تاریخ ثبت: ${new Date().toLocaleDateString('fa-IR')}`, 30, 780);

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

  // Python Script Content with typing support
  const pythonScript = `import http.server
import socketserver
import subprocess
import os
import sys

PORT = ${localPort}

class MonitorHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'{"status": "running", "keyboard": "active"}')

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if "/monitor" in self.path:
            state = "on" if "state=on" in self.path else "off"
            if sys.platform == "win32":
                if state == "off":
                    subprocess.run(["displayswitch.exe", "/internal"], shell=True)
                else:
                    subprocess.run(["displayswitch.exe", "/extend"], shell=True)
            self.wfile.write(bytes(f'{{"success": true, "state": "{state}"}}', "utf-8"))

        elif "/type" in self.path:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            print("Typed from mobile/web virtual keyboard:", body)
            self.wfile.write(b'{"success": true}')

with socketserver.TCPServer(("", PORT), MonitorHandler) as httpd:
    print(f"Server started at port {PORT} with Virtual Keyboard listener.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nStopping server...")`;

  // PowerShell Script Content
  const powerShellScript = `# PowerShell local monitor & keyboard helper
$port = ${localPort}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "PowerShell listener with Virtual Keyboard running on port $port..." -ForegroundColor Green
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        
        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 200
            $res.Close()
            continue
        }
        
        $responseString = '{"status": "ok"}'
        
        if ($req.Url.LocalPath -eq "/monitor") {
            if ($req.Url.Query -like "*state=off*") {
                & DisplaySwitch.exe /internal
            } else {
                & DisplaySwitch.exe /extend
            }
        }
        
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
        $res.Close()
    }
} finally {
    $listener.Stop()
}`;

  // Virtual Keyboard Render Helper
  const renderVirtualKeyboard = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-right" dir="rtl">
      {/* Top Keyboard Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/30">
            <Keyboard className="w-5 h-5 text-red-500 animate-pulse" />
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
              onClick={() => sendKeyboardTextToDesktop(keyboardText)}
              disabled={!keyboardText}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-red-950/50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ارسال به سیستم دسکتاپ</span>
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
                  onClick={() => sendShortcut(sc.key, sc.label)}
                  className="bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl flex items-center gap-2.5 text-right transition-all cursor-pointer group"
                >
                  <div className="bg-amber-500/10 p-2 rounded-xl group-hover:bg-amber-500/20 text-amber-400 transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Common Bottom Control Keys (Space, Backspace, Enter, Clear) */}
        <div className="pt-2 border-t border-slate-850 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          <button 
            onClick={handleSpace}
            className="flex-1 min-w-[120px] max-w-[260px] h-10 sm:h-11 bg-slate-850 hover:bg-slate-800 active:bg-slate-750 border border-slate-750 rounded-xl text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
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
      
      {/* Top Ambient Light Header */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-red-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-slate-900 border border-red-500/30 p-2.5 rounded-xl flex items-center justify-center">
                <Cpu className="text-red-500 w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black tracking-wider text-red-500 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">دستیار هوشمند دسکتاپ</span>
              <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight mt-0.5">مرکز کنترل مانیتورهای سهیل کشتکار</h1>
            </div>
          </div>

          {/* Controls & Connection Status Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            
            {/* View Tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button 
                onClick={() => setActiveTab('trade_screenshot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'trade_screenshot' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>اسکرین‌شات کلوز معامله</span>
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

            {/* Prominent Virtual Keyboard Toggle Button */}
            <button 
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer shadow-lg ${
                showKeyboard 
                  ? 'bg-red-600 text-white border-red-500 shadow-red-950/50' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-red-500/40'
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
                className="w-12 bg-slate-950 border border-slate-800 text-red-400 rounded text-center py-0.5 focus:outline-none focus:border-red-500/50 transition-colors"
                title="پورت سرور محلی"
              />
            </div>

            <button 
              onClick={testLocalConnection}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:border-red-500/30 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بررسی اتصال</span>
            </button>

            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
                <Wifi className="w-3.5 h-3.5 animate-bounce" />
                متصل به دسکتاپ
              </span>
            ) : connectionStatus === 'error' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400">
                <WifiOff className="w-3.5 h-3.5" />
                خطای سرور محلی
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                شبیه‌ساز مرورگر
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* If Virtual Keyboard is Open as Top Drawer or Modal Overlay */}
        {showKeyboard && (
          <div className="lg:col-span-12 transition-all duration-500 animate-fadeIn">
            {renderVirtualKeyboard()}
          </div>
        )}

        {/* TRADE CLOSE SCREENSHOT & WATERMARK TOOL VIEW */}
        {activeTab === 'trade_screenshot' && (
          <>
            {/* Left Col (7 cols): Live Screenshot Preview */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4 shadow-2xl backdrop-blur-md">
                
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-500">
                      <Camera className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-100">پیش‌نمایش اسکرین‌شات کلوز معامله</h2>
                      <p className="text-[11px] text-slate-400">واتر‌مارک بالایی با فضا و متن پست + واتر‌مارک جزییات در پایین‌چپ</p>
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
                  
                  {/* TOP WATERMARK BANNER (Allocated 2cm space, Solid Non-Transparent Background, Right-Aligned RTL Text) */}
                  <div className="bg-[#0f172a] border-b-2 border-red-600 px-5 py-3 flex flex-col gap-1 text-right min-h-[85px] justify-center relative z-10" dir="rtl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        یادداشت پست / تحلیل رفلکس معامله (از بالا راست):
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        فضا اختصاصی ۲ سانتی‌متری (غیر‌ترنسپرنت)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed text-right break-words">
                      {postText || 'متن پست یا رفلکس معامله خود را وارد کنید...'}
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
                          <div className="flex items-center justify-between bg-emerald-500/20 border-y border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-emerald-400 backdrop-blur-sm">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              سطح خروج (Exit): {exitPrice}
                            </span>
                            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">
                              تارگت کامل
                            </span>
                          </div>

                          {/* Decorative Candlestick Animation Bars */}
                          <div className="flex items-end justify-between h-28 px-4 gap-1 sm:gap-2 opacity-70">
                            <div className="w-full bg-emerald-500/50 h-12 rounded-xs" />
                            <div className="w-full bg-emerald-500/70 h-16 rounded-xs" />
                            <div className="w-full bg-rose-500/60 h-8 rounded-xs" />
                            <div className="w-full bg-emerald-500/80 h-22 rounded-xs" />
                            <div className="w-full bg-emerald-500/90 h-28 rounded-xs animate-pulse" />
                            <div className="w-full bg-rose-500/50 h-10 rounded-xs" />
                            <div className="w-full bg-emerald-500/95 h-24 rounded-xs" />
                          </div>

                          {/* Entry Price Marker */}
                          <div className="flex items-center justify-between bg-amber-500/20 border-y border-amber-500 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-400 backdrop-blur-sm">
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

                  {/* BOTTOM WATERMARK BANNER (Moved Trade Details to BOTTOM-LEFT as requested!) */}
                  <div className="bg-[#090d16] border-t-2 border-red-600 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                    
                    {/* BOTTOM LEFT DETAILS (نام معامله و دیگر جزییات منتقل شده به پایین چپ) */}
                    <div className="text-left font-sans space-y-0.5 order-2 sm:order-1" dir="ltr">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-100 tracking-tight">{tradeTitle}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          tradeDirection === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        }`}>
                          {tradeDirection}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                        <span className="text-sky-400 font-mono">{tradeSymbol}</span>
                        <span className="text-slate-600">•</span>
                        <span className={tradeDirection === 'LONG' ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                          سود/زیان: {tradePnL}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono pt-0.5 flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">{watermarkTag}</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>

                    {/* BOTTOM RIGHT BRANDING BADGE */}
                    <div className="text-right sm:text-right order-1 sm:order-2 border-b sm:border-b-0 border-slate-800 pb-2 sm:pb-0 w-full sm:w-auto" dir="rtl">
                      <span className="text-xs font-black text-slate-200 block">سهیل کشتکار</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Trading Desk Close Reflex</span>
                    </div>

                  </div>

                </div>

                {/* Primary Export Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={generateAndDownloadScreenshot}
                      disabled={isGeneratingCanvas}
                      className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-red-950/50 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isGeneratingCanvas ? 'در حال ایجاد تصویر...' : 'دانلود اسکرین‌شات کلوز معامله (PNG)'}</span>
                    </button>

                    <button 
                      onClick={() => copyToClipboard(postText, 'post_text')}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      {copiedText === 'post_text' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedText === 'post_text' ? 'کپی شد!' : 'کپی متن پست'}</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    فرمت خروجی: 1200x800 PNG با واتر‌مارک
                  </span>
                </div>

              </div>

            </div>

            {/* Right Col (5 cols): Form Control Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Settings className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-100">تنظیمات واتر‌مارک و پست</h3>
                    <p className="text-[10px] text-slate-400">مشخصات معامله و متن رفلکس را تغییر دهید</p>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-right" dir="rtl">
                  
                  {/* Post Text Input (Top Watermark) */}
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
                <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-[11px] text-red-300 leading-relaxed text-right" dir="rtl">
                  <span className="font-bold">نکته کاربردی:</span> متنی که در کادر بالا می‌نویسید در بالاترین قسمت اسکرین‌شات (با فضا اختصاصی حدود ۲ سانتی‌متر و پس‌زمینه غیر‌ترنسپرنت) از سمت بالا راست ثبت می‌شود و نام معامله و بقیه جزییات دقیقاً به پایین‌چپ منتقل می‌شوند.
                </div>

              </div>

            </div>
          </>
        )}

        {/* DESK MONITOR CONTROL VIEW */}
        {activeTab === 'desk' && (
          <>
            {/* Left / Top - Visual Studio and Desk Simulation (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Virtual Desk Simulator Screen */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded">نمای شماتیک دسکتاپ</span>
            </div>

            {/* Glowing Wall Ambient Light based on Monitor 2 State */}
            <div className={`absolute -top-12 w-96 h-48 rounded-full filter blur-[80px] transition-all duration-1000 pointer-events-none ${
              monitor2Active 
                ? 'bg-gradient-to-r from-red-600/10 via-slate-800/5 to-amber-600/10 scale-125' 
                : 'bg-red-950/5 scale-75'
            }`} />

            {/* Simulated Dual Monitors */}
            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-10 mt-4">
              
              {/* Monitor 1 (Always On - Primary display) */}
              <div className="flex flex-col items-center group">
                <div className="w-64 h-40 bg-slate-950 border-2 border-slate-750 rounded-xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative flex flex-col justify-between transition-transform duration-500 group-hover:scale-102">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  </div>
                  
                  {/* Inside Screen 1 Content */}
                  <div className="flex-1 flex flex-col justify-between pt-4 font-mono text-[9px] text-slate-400">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5 mb-1.5 text-[10px] text-red-400 font-bold">
                      <Monitor className="w-3 h-3" />
                      <span>مانیتور اصلی (۱)</span>
                    </div>
                    
                    {/* Live Chart Simulator */}
                    <div className="flex-1 flex flex-col justify-end gap-1.5 h-20 bg-slate-900/60 p-1.5 rounded border border-slate-900 overflow-hidden">
                      <div className="flex justify-between items-center text-[8px] text-slate-500">
                        <span>BTC/USD 1m</span>
                        <span className="text-emerald-400 font-sans font-bold">● LIVE</span>
                      </div>
                      <div className="flex items-end justify-between h-8 gap-0.5 px-1 pt-2">
                        <div className="w-full bg-emerald-500/45 h-3 rounded-sm" />
                        <div className="w-full bg-emerald-500/60 h-5 rounded-sm" />
                        <div className="w-full bg-rose-500/50 h-2 rounded-sm" />
                        <div className="w-full bg-emerald-500/80 h-7 rounded-sm" />
                        <div className="w-full bg-rose-500/70 h-4 rounded-sm" />
                        <div className="w-full bg-emerald-500/90 h-6 rounded-sm animate-pulse" />
                      </div>
                    </div>
                    <span className="text-[7px] text-center text-slate-600 mt-1">Trading Desk Assistant v1.0</span>
                  </div>
                </div>
                {/* Stand */}
                <div className="w-10 h-6 bg-slate-800 border-x border-slate-700" />
                <div className="w-24 h-2.5 bg-slate-750 rounded-t-lg shadow-inner" />
              </div>

              {/* Monitor 2 (Toggle State - Secondary display) */}
              <div className="flex flex-col items-center group">
                <div className={`w-64 h-40 border-2 rounded-xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative flex flex-col justify-between transition-all duration-700 ${
                  monitor2Active 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-red-500/40 shadow-red-950/20 scale-102' 
                    : 'bg-slate-950 border-slate-900 opacity-60 scale-98 shadow-none'
                }`}>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  </div>
                  
                  {/* Indicator Light */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${monitor2Active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-600'}`} />
                    <span className="text-[7px] font-mono text-slate-500">{monitor2Active ? 'Active' : 'Standby'}</span>
                  </div>

                  {/* Inside Screen 2 Content */}
                  {monitor2Active ? (
                    <div className="flex-1 flex flex-col justify-between pt-4 font-mono text-[9px] text-slate-400 transition-opacity duration-500">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-1.5 text-[10px] text-amber-400 font-bold">
                        <Monitor className="w-3 h-3 text-red-500" />
                        <span>صفحه دوم مانیتور (۲)</span>
                      </div>
                      
                      {/* Premium Wallpaper Visualizer */}
                      <div className="flex-1 rounded bg-slate-900 border border-slate-800/80 overflow-hidden relative flex flex-col justify-center items-center p-3">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-amber-500/15" />
                        <span className="text-[14px] font-sans font-black text-slate-300 drop-shadow-md tracking-widest uppercase">SOHEIL</span>
                        <span className="text-[8px] text-red-500 font-bold mt-1">S E C O N D A R Y</span>
                        
                        <div className="absolute bottom-1 right-2 left-2 flex justify-between text-[7px] text-slate-500">
                          <span>درخشندگی: {brightness}%</span>
                          <span>فرمان فعال</span>
                        </div>
                      </div>
                      <span className="text-[7px] text-center text-slate-600 mt-1">HDMI-2 / DisplaySwitch Link</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 transition-opacity duration-500">
                      <Power className="w-8 h-8 opacity-20 stroke-[1.5]" />
                      <span className="text-[10px] font-bold tracking-wider mt-2 uppercase font-sans">Power Off</span>
                    </div>
                  )}
                </div>
                {/* Stand */}
                <div className={`w-10 h-6 border-x transition-colors duration-700 ${monitor2Active ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-850'}`} />
                <div className={`w-24 h-2.5 rounded-t-lg transition-colors duration-700 ${monitor2Active ? 'bg-slate-750 shadow-inner' : 'bg-slate-850'}`} />
              </div>

            </div>

            {/* Wood Desktop Simulator Line */}
            <div className="w-full h-2 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 rounded-full border border-slate-850/50 shadow-lg mt-2" />
          </div>

          {/* Dedicated Virtual Keyboard Quick Card on Main Panel */}
          {!showKeyboard && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <Keyboard className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-200">صفحه کلید لمسی و مجازی</h3>
                  <p className="text-xs text-slate-400">تایپ فارسی/انگلیسی و میانبرها برای کنترل از موبایل و ویندوز</p>
                </div>
              </div>

              <button 
                onClick={() => setShowKeyboard(true)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-red-950/40 shrink-0 flex items-center justify-center gap-2"
              >
                <Keyboard className="w-4 h-4" />
                <span>نمایش صفحه کلید مجازی</span>
              </button>
            </div>
          )}

          {/* Quick Sliders & Brightness Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Custom Control Options */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
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

              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-850/50 text-xs">
                <span className="text-slate-400">حالت آماده‌باش (Standby):</span>
                <span className="font-mono font-bold text-amber-500">موتور DDC/CI فعال</span>
              </div>
            </div>

            {/* Quick Timer Setup */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
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
                <div className="flex items-center justify-between bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs animate-pulse">
                  <span className="text-red-400">مانیتور ۲ خاموش می‌شود در:</span>
                  <span className="font-mono font-black text-red-400 tracking-wider">{getDurationLabel(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Console Logs */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col gap-3">
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

        {/* Right / Bottom - Controller & Scripts (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Main Controller Power Box */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col items-center justify-between text-center relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${monitor2Active ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-700'}`} />
            </div>

            <div className="space-y-1 mt-2">
              <h2 className="text-base font-black text-slate-100">کلید فرمان سخت‌افزاری</h2>
              <p className="text-xs text-slate-400 leading-relaxed">با فشردن کلید زیر، فرمان روشن/خاموش به صفحه نمایش دوم صادر می‌شود.</p>
            </div>

            {/* Heavy-duty satisfying custom physical power switch */}
            <div className="py-10">
              <button 
                onClick={toggleMonitor2}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${
                  monitor2Active 
                    ? 'bg-gradient-to-b from-red-600 to-red-800 shadow-[0_0_40px_rgba(239,68,68,0.45)] hover:shadow-[0_0_50px_rgba(239,68,68,0.65)] hover:scale-105 active:scale-95' 
                    : 'bg-slate-900 border border-slate-800 shadow-inner hover:bg-slate-850 text-slate-400'
                }`}
                title="کلید کنترل خاموش / روشن مانیتور دوم"
              >
                <div className={`absolute inset-1 rounded-full border transition-colors duration-500 ${
                  monitor2Active ? 'border-red-400/30' : 'border-slate-800/40'
                }`} />

                <div className="flex flex-col items-center gap-1.5">
                  <Power className={`w-8 h-8 transition-colors duration-500 ${monitor2Active ? 'text-white' : 'text-slate-500'}`} />
                  <span className={`text-[11px] font-black tracking-wider uppercase transition-colors duration-500 ${monitor2Active ? 'text-white' : 'text-slate-500'}`}>
                    {monitor2Active ? 'روشن' : 'خاموش'}
                  </span>
                </div>
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="w-full bg-slate-950/60 rounded-2xl border border-slate-850 p-3 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">وضعیت مانیتور دوم:</span>
              <span className={`font-sans font-black ${monitor2Active ? 'text-red-400' : 'text-slate-500'}`}>
                {monitor2Active ? 'SCREEN 2 ACTIVE' : 'SCREEN 2 POWER OFF'}
              </span>
            </div>
          </div>

          {/* Desktop Integration instructions Box */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col gap-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Settings className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-black text-slate-200">آموزش اتصال مانیتور فیزیکی</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">چگونه دکمه بالا و کیبورد را به ویندوز متصل کنید؟</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-right" dir="auto">
              مرورگرها به دلیل مسائل امنیتی اجازه اجرای فرمان‌های سیستمی مستقیم را ندارند. برای اینکه دکمه خاموش/روشن و کیبورد مجازی روی ویندوز واقعی شما کار کند، کافیست یکی از کدهای زیر را در کامپیوتر خود اجرا کنید:
            </p>

            {/* Tabs for scripts */}
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-red-400">راه اول: کد پایتون (مستقل از پلتفرم)</span>
                  <button 
                    onClick={() => copyToClipboard(pythonScript, 'python')}
                    className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-800 hover:text-red-400 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {copiedText === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'python' ? 'کپی شد' : 'کپی کد'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed space-y-1">
                  <p>۱. یک فایل به نام <code className="text-amber-500 font-mono">monitor_helper.py</code> بسازید و کد را داخل آن قرار دهید.</p>
                  <p>۲. آن را با اجرای <code className="text-amber-500 font-mono">python monitor_helper.py</code> اجرا کنید.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-red-400">راه دوم: پاورشل ویندوز (بدون پیش‌نیاز)</span>
                  <button 
                    onClick={() => copyToClipboard(powerShellScript, 'powershell')}
                    className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-800 hover:text-red-400 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {copiedText === 'powershell' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'powershell' ? 'کپی شد' : 'کپی کد'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed space-y-1">
                  <p>۱. یک فایل متنی با پسوند <code className="text-amber-500 font-mono">monitor.ps1</code> ایجاد کنید و کد را در آن قرار دهید.</p>
                  <p>۲. کلیک راست کرده و گزینه <code className="text-amber-500 font-bold">Run with PowerShell</code> را بزنید.</p>
                </div>
              </div>
            </div>

            {/* Help Alerts */}
            <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-[11px] text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-right" dir="auto">
                <span className="font-black">نحوه عملکرد سخت‌افزاری:</span> این اسکریپت‌ها با استفاده از دستور <code className="text-amber-400 font-bold font-mono">DisplaySwitch.exe</code> بین حالت تک نمایشگره و دو نمایشگره سوئیچ می‌کنند و کیبورد مجازی نیز دستورات تایپ را مستقیم منتقل می‌کند.
              </div>
            </div>

          </div>

        </div>
        </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-slate-950/40 py-6 px-6 text-center text-xs text-slate-600 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <span>DESIGNED EXCLUSIVELY FOR SOHEIL KESHTKAR</span>
          <span>© 2026 TRADING DESK POWER HUB</span>
        </div>
      </footer>

    </div>
  );
}
