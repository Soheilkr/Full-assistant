import { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Screen States
  const [monitor2Active, setMonitor2Active] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(85);
  const [localPort, setLocalPort] = useState<string>('5000');
  const [connectionStatus, setConnectionStatus] = useState<'simulated' | 'connected' | 'error'>('simulated');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Timer States
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerDuration, setTimerDuration] = useState<number>(300); // 5 minutes default
  
  // Command Logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; action: string; status: 'success' | 'info' | 'error' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), action: 'سیستم آماده به کار (حالت شبیه‌ساز فعال)', status: 'info' }
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
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  // Function to copy code to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Local command triggering
  const triggerLocalCommand = async (state: boolean) => {
    const actionName = state ? 'روشن' : 'خاموش';
    try {
      // Send a request to the local helper script running on the user's desktop
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

  // Persian duration label helper
  const getDurationLabel = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Python Script Content
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
        self.wfile.write(b'{"status": "running"}')

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Check endpoint
        if "/monitor" in self.path:
            # Check state in query or body
            state = "on" if "state=on" in self.path else "off"
            
            # Execute command based on OS to toggle second monitor
            if sys.platform == "win32":
                # Windows command: Using standard nircmd or displayswitch
                if state == "off":
                    # Swithes to single display mode (turns off monitor 2)
                    subprocess.run(["displayswitch.exe", "/internal"], shell=True)
                else:
                    # Switches to extend mode (turns on monitor 2)
                    subprocess.run(["displayswitch.exe", "/extend"], shell=True)
            else:
                # macOS or Linux command (e.g. xrandr)
                if state == "off":
                    subprocess.run("xrandr --output HDMI-2 --off", shell=True)
                else:
                    subprocess.run("xrandr --output HDMI-2 --auto --right-of HDMI-1", shell=True)
                    
            self.wfile.write(bytes(f'{{"success": true, "state": "{state}"}}', "utf-8"))

with socketserver.TCPServer(("", PORT), MonitorHandler) as httpd:
    print(f"Server started at port {PORT}. Waiting for commands from Trading Assistant...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nStopping server...")`;

  // PowerShell Script Content
  const powerShellScript = `# PowerShell local monitor server
$port = ${localPort}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "PowerShell listener is running on port $port..." -ForegroundColor Green
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        # CORS Headers
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
            $state = "on"
            if ($req.Url.Query -like "*state=off*") {
                $state = "off"
                # Switch Windows to Single display (Monitor 2 turns off)
                & DisplaySwitch.exe /internal
                Write-Host "Monitor 2 state sent: OFF" -ForegroundColor Yellow
            } else {
                # Switch Windows to Extend display (Monitor 2 turns on)
                & DisplaySwitch.exe /extend
                Write-Host "Monitor 2 state sent: ON" -ForegroundColor Green
            }
            $responseString = '{"success": true, "state": "' + $state + '"}'
        }
        
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
        $res.Close()
    }
} finally {
    $listener.Stop()
}`;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 overflow-x-hidden" dir="rtl">
      
      {/* Top Ambient Light Header */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-red-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
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
              <h1 className="text-lg font-black text-slate-100 tracking-tight mt-0.5">مرکز کنترل مانیتورهای سهیل کشتکار</h1>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">پورت محلی:</span>
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
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:border-red-500/30 active:scale-95 cursor-pointer"
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
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
                        {/* Abstract glow art */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-amber-500/15" />
                        <span className="text-[14px] font-sans font-black text-slate-300 drop-shadow-md tracking-widest uppercase">SOHEIL</span>
                        <span className="text-[8px] text-red-500 font-bold mt-1">S E C O N D A R Y</span>
                        
                        {/* Small simulated widgets */}
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
                {/* Inner Bezel Glow */}
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
                <p className="text-[10px] text-slate-500 mt-0.5">چگونه دکمه بالا را به دسکتاپ ویندوز متصل کنید؟</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-right" dir="auto">
              مرورگرها به دلیل مسائل امنیتی اجازه اجرای فرمان‌های سیستمی مستقیم را ندارند. برای اینکه این کلید روی مانیتور واقعی شما کار کند، کافیست یکی از کدهای سبک زیر را در کامپیوتر خود اجرا کنید تا دستورات مرورگر را به مانیتور شما ارسال کند:
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
                <span className="font-black">نحوه عملکرد سخت‌افزاری:</span> این اسکریپت‌ها با استفاده از دستور استاندارد <code className="text-amber-400 font-bold font-mono">DisplaySwitch.exe</code> ویندوز، بین حالت تک نمایشگره و دو نمایشگره سوئیچ می‌کنند و بدین ترتیب مانیتور دوم فیزیکی شما فوراً خاموش و روشن می‌شود.
              </div>
            </div>

          </div>

        </div>

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
