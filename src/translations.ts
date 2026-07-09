// Dictionary of translations for Btb4
// default: Keep original text (mixed English/Persian as in original code)
// en: Complete English translation
// fa: Complete Persian translation

const translations: Record<string, { en: string; fa: string }> = {
  // General Navigation / Sidebar / Views
  "Welcome": { en: "Welcome", fa: "خوش‌آمدید" },
  "Rules": { en: "Rules", fa: "قوانین" },
  "Dashboard": { en: "Dashboard", fa: "داشبورد" },
  "Archive": { en: "Archive", fa: "آرشیو" },
  "History": { en: "History", fa: "تاریخچه" },
  "Settings": { en: "Settings", fa: "تنظیمات عمومی" },
  "System Settings": { en: "System Settings", fa: "تنظیمات سیستم" },
  "Strategy Switcher": { en: "Strategy Switcher", fa: "تغییر استراتژی" },
  "Reset Everything": { en: "Reset Everything", fa: "پاکسازی کامل" },
  "Close": { en: "Close", fa: "بستن" },
  "Cancel": { en: "Cancel", fa: "لغو" },
  "Save": { en: "Save", fa: "ذخیره" },
  "Back": { en: "Back", fa: "برگشت" },
  "Delete": { en: "Delete", fa: "حذف" },
  "Edit": { en: "Edit", fa: "ویرایش" },
  "Confirm": { en: "Confirm", fa: "تایید" },
  "Warning": { en: "Warning", fa: "هشدار" },

  // Pre-Trade Screen
  "Pre-Trade Checklist": { en: "Pre-Trade Checklist", fa: "چک‌لیست قبل از معامله" },
  "Confirm & Log Trade Entry": { en: "Confirm & Log Trade Entry", fa: "تأیید و ثبت ورود به معامله" },
  "Registering...": { en: "Registering...", fa: "در حال ثبت..." },
  "No Trade Allowed (Reng Channel)": { en: "No Trade Allowed (Ranging)", fa: "معامله مجاز نیست (کانال رنج)" },
  "Write your mental reflections or system rules checks...": {
    en: "Write your mental reflections or system rules checks...",
    fa: "یادداشت‌های ذهنی یا چک کردن قوانین سیستم را بنویسید..."
  },
  "Rule state selection...": { en: "Rule state selection...", fa: "انتخاب وضعیت قانون..." },

  // Post-Trade Screen
  "Post-Trade Mental Reflection": { en: "Post-Trade Mental Reflection", fa: "بازتاب ذهنی پس از معامله" },
  "Save Reflections & Complete": { en: "Save Reflections & Complete", fa: "ذخیره بازخورد ذهنی و تکمیل" },
  "Select trade result": { en: "Select trade result", fa: "نتیجه معامله را انتخاب کنید" },
  "What was the mental state?": { en: "What was the mental state?", fa: "وضعیت روحی شما چگونه بود؟" },

  // Welcome / Mode Selector
  "Select Strategy Mode": { en: "Select Strategy Mode", fa: "انتخاب حالت استراتژی" },
  "Channel Breakout": { en: "Channel Breakout", fa: "شکست کانال" },
  "BTB Mode": { en: "BTB Mode (Back to Bottom)", fa: "حالت بازگشت به پایین (BTB)" },
  "Enter Passcode": { en: "Enter Passcode", fa: "ورود رمز عبور" },
  "Incorrect passcode. Please try again.": { en: "Incorrect passcode. Please try again.", fa: "رمز عبور نادرست است. دوباره تلاش کنید." },

  // System Settings Sections
  "Capital & Risk Management": { en: "Capital & Risk Management", fa: "مدیریت سرمایه و ریسک" },
  "Personal & Discipline Rules": { en: "Personal & Discipline Rules", fa: "قوانین شخصی و انضباطی" },
  "Audio & Speaker Settings": { en: "Audio & Speaker Settings", fa: "تنظیمات صوتی و گوینده" },
  "Periodic & Custom Alarm Settings": { en: "Periodic & Custom Alarm Settings", fa: "تنظیمات آلارم دوره‌ای و ساعت مشخص" },
  "Passcode Protection": { en: "Passcode Protection", fa: "رمز عبور" },
  "Backup & Restore Data": { en: "Backup & Restore Data", fa: "پشتیبان‌گیری و بازیابی داده‌ها" },
  "Complete Data Factory Reset": { en: "Complete Data Factory Reset", fa: "پاکسازی کامل اطلاعات" },

  // Risk Management Detail Texts
  "Max daily trades limit": { en: "Max Daily Trades Limit", fa: "سقف معاملات روزانه" },
  "Max daily wins limit": { en: "Max Daily Wins Limit", fa: "سقف معاملات سودده روزانه" },
  "Max consecutive losses limit": { en: "Max Consecutive Losses Limit", fa: "سقف باخت متوالی روزانه" },

  // Audio settings detail texts
  "Voice feedback mode": { en: "Voice Feedback Mode", fa: "حالت پخش صوتی بازخورد" },
  "Enabled": { en: "Enabled", fa: "فعال" },
  "Disabled": { en: "Disabled", fa: "غیرفعال" },
  "Manual Only": { en: "Manual Only", fa: "فقط دستی" },
  "Voice Speaker Volume": { en: "Voice Speaker Volume", fa: "میزان صدای گوینده" },
  "Test Voice Speaker": { en: "Test Voice Speaker", fa: "تست صوتی گوینده" },

  // Screenshots settings detail
  "Automated Screenshots & Documenter (اسکرین‌شات خودکار معاملات)": {
    en: "Automated Screenshots & Documenter",
    fa: "اسکرین‌شات خودکار معاملات"
  },
  "فعالسازی اسکرین‌شات خودکار (Auto Screenshots)": {
    en: "Enable Auto Screenshots",
    fa: "فعالسازی اسکرین‌شات خودکار"
  },
  "تهیه خودکار اسکرین‌شات در زمان ثبت ورود و رفلکشن": {
    en: "Take screenshots automatically when logging entry or saving reflections",
    fa: "تهیه خودکار اسکرین‌شات در زمان ثبت ورود و رفلکشن"
  },
  "مسیر ذخیره‌سازی تصاویر (Save Directory Path)": {
    en: "Save Directory Path",
    fa: "مسیر ذخیره‌سازی تصاویر"
  },
  "تصاویر با نام‌هایی مانند": {
    en: "Images will be saved with names like",
    fa: "تصاویر با نام‌هایی مانند"
  },
  "ذخیره خواهند شد.": {
    en: "will be saved.",
    fa: "ذخیره خواهند شد."
  },
  "انتخاب مانیتور (Monitor Screen Selection)": {
    en: "Monitor Screen Selection",
    fa: "انتخاب مانیتور"
  },
  "در صورتی که چند مانیتور به لپ‌تاپ متصل است، شماره صفحه مورد نظر را انتخاب کنید (مانیتور ۱ صفحه اصلی است).": {
    en: "If multiple monitors are connected, select the screen number (Monitor 1 is the main screen).",
    fa: "در صورتی که چند مانیتور به لپ‌تاپ متصل است، شماره صفحه مورد نظر را انتخاب کنید (مانیتور ۱ صفحه اصلی است)."
  },
  "تهیه اسکرین‌شات تستی (Test Grab)": {
    en: "Test Grab Screenshot",
    fa: "تهیه اسکرین‌شات تستی"
  },

  // Risk Commitment Warning Persian texts to English
  "گوشزد جدی مدیریت ریسک": { en: "Serious Risk Management Alert", fa: "گوشزد جدی مدیریت ریسک" },
  "قبل از ثبت معامله این تعهدنامه را تایید کنید.": { en: "Please confirm this commitment before entering the trade.", fa: "قبل از ثبت معامله این تعهدنامه را تایید کنید." },
  "بله، متعهد می‌شوم و وارد ثبت معامله می‌شوم": { en: "Yes, I commit and proceed to log trade", fa: "بله، متعهد می‌شوم و وارد ثبت معامله می‌شوم" },
  "ایست! باخت متوالی ثبت شد": { en: "Stop! Consecutive losses limit reached", fa: "ایست! باخت متوالی ثبت شد" },
  "فرصت آخر: معامله شماره": { en: "Last Chance: Trade number", fa: "فرصت آخر: معامله شماره" },
  "شما در حال حاضر باخت متوالی ثبت کرده‌اید.": { en: "You have currently recorded consecutive losses.", fa: "شما در حال حاضر باخت متوالی ثبت کرده‌اید." },
  "هدف طلایی: معامله شماره": { en: "Golden Target: Trade number", fa: "هدف طلایی: معامله شماره" },
  "تبریک! سود عالی و شیرین و متوالی کسب کرده‌اید.": { en: "Congratulations! You earned consecutive wins.", fa: "تبریک! سود عالی و شیرین و متوالی کسب کرده‌اید." },
  "معامله پایانی روز": { en: "Final Trade of the Day", fa: "معامله پایانی روز" },
  "شما معامله انجام داده‌اید.": { en: "You have completed trades.", fa: "شما معامله انجام داده‌اید." },
  "گوشزد نهایی: این معامله آخرین ترید مجاز شما برای امروز است.": {
    en: "Final warning: This trade is your last permitted trade for today. Close your charts immediately after.",
    fa: "گوشزد نهایی: این معامله آخرین ترید مجاز شما برای امروز است. به یاد داشته باشید که پس از ثبت نتیجه این معامله، سیستم به طور قطعی قفل خواهد شد."
  },

  // Other Persian Strings in settings
  "برنامه مجهز به ۵ گروه صوتی است که هر کدام دارای ۵ متن پیام هستند. سیستم پس از ثبت هر سود یا زیان بر اساس سناریوی مشخص‌‌شده، به صورت کاملاً تصادفی یکی از جملات گروه انتخابی را از طریق موتور صوتی شبیه‌سازی می‌کند. عبارات زیر را به دلخواه خود ویرایش و تست صوتی کنید.": {
    en: "The program features 5 audio groups, each containing 5 message texts. Upon registering a win or loss, the system simulates speaker audio. Feel free to edit and test these below.",
    fa: "برنامه مجهز به ۵ گروه صوتی است که هر کدام دارای ۵ متن پیام هستند. سیستم پس از ثبت هر سود یا زیان بر اساس سناریوی مشخص‌‌شده، به صورت کاملاً تصادفی یکی از جملات گروه انتخابی را از طریق موتور صوتی شبیه‌سازی می‌کند. عبارات زیر را به دلخواه خود ویرایش و تست صوتی کنید."
  },
  "آرشیو روزهای قبل": { en: "Archive of Previous Days", fa: "آرشیو روزهای قبل" },
  "آرشیو ترکیبی معاملات": { en: "Combined Trading Archive", fa: "آرشیو ترکیبی معاملات" },
  "تاریخچه جزئیات معاملات": { en: "Detailed Trading History", fa: "تاریخچه جزئیات معاملات" },
  "تاریخ": { en: "Date", fa: "تاریخ" },
  "تعداد ترید": { en: "Trades Count", fa: "تعداد ترید" },
  "نتیجه": { en: "Result", fa: "نتیجه" },
  "سود": { en: "Wins", fa: "سود" },
  "ضرر": { en: "Losses", fa: "ضرر" },
  "وین ریت": { en: "Win Rate", fa: "وین ریت" },
  "استراتژی": { en: "Strategy", fa: "استراتژی" },
  "عملیات": { en: "Actions", fa: "عملیات" },
  "جزئیات": { en: "Details", fa: "جزئیات" },
  "وین‌ریت کل": { en: "Total Win Rate", fa: "وین‌ریت کل" },
  "تعداد کل معاملات": { en: "Total Trades count", fa: "تعداد کل معاملات" },
  "کل سودها": { en: "Total Wins count", fa: "کل سودها" },
  "کل ضررها": { en: "Total Losses count", fa: "کل ضررها" },
  "معاملات امروز": { en: "Today's Trades", fa: "معاملات امروز" },
  "اضافه کردن به معاملات شبیه‌سازی شده قبلی": { en: "Add simulated prior history", fa: "اضافه کردن به معاملات شبیه‌سازی شده قبلی" },
  "بارگذاری": { en: "Load", fa: "بارگذاری" },
  "پاک کردن همه سوابق": { en: "Clear All Records", fa: "پاک کردن همه سوابق" },
  "پشتیبان‌گیری کامل": { en: "Full Backup (Download JSON)", fa: "پشتیبان‌گیری کامل" },
  "بازیابی پشتیبان": { en: "Restore Backup (Upload JSON)", fa: "بازیابی پشتیبان" },
};

export function t(key: string, lang: 'default' | 'en' | 'fa' = 'default'): string {
  if (lang === 'default') {
    return key;
  }
  
  // Find key in dictionary
  const entry = translations[key];
  if (entry) {
    return lang === 'en' ? entry.en : entry.fa;
  }

  // Fallback search by substring or partial matching
  for (const k of Object.keys(translations)) {
    if (key.includes(k) || k.includes(key)) {
      return lang === 'en' ? translations[k].en : translations[k].fa;
    }
  }

  return key;
}
