const fs = require("fs");
const path = require("path");

const filesToPatch = [
  "./assets/index-DAH02_t9.js",
  "./public/assets/index-DAH02_t9.js"
];

filesToPatch.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`\nPatching file: ${filePath}`);
  let content = fs.readFileSync(filePath, "utf8");

  // 1. Welcome Screen Outer Scrollbar Toggle (Remove scrollbar when b === "welcome")
  const targetScroll = 'className:"p-5 md:p-8 h-full overflow-y-auto max-h-[92vh] custom-scrollbar"';
  const replaceScroll = 'className:"p-5 md:p-8 h-full custom-scrollbar "+(b==="welcome"?"overflow-hidden":"overflow-y-auto max-h-[92vh]")';
  
  if (content.includes(targetScroll)) {
    content = content.replace(targetScroll, replaceScroll);
    console.log("✅ Welcome Screen Outer Scrollbar Toggle patch applied.");
  } else {
    console.log("❌ Target for scrollbar toggle not found.");
  }

  // 2. High-Class Indigo Gradient Background for Welcome/Settings/Archive
  const bgUnpatched = 's==="btb"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C2BEB4] via-[#D0CDC3] to-[#D5D2C9]":s==="spike"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#171E2A] via-[#0D1118] to-[#06080C]":"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#08150E] via-[#040906] to-[#010302]"';
  const bgRedBlack = 'b==="welcome"||b==="system-settings"||b==="archive"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f0404] via-[#070101] to-black":b==="welcome"||b==="system-settings"||b==="archive"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a0606] via-[#150202] to-[#050000]":s==="btb"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C2BEB4] via-[#D0CDC3] to-[#D5D2C9]":s==="spike"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#171E2A] via-[#0D1118] to-[#06080C]":"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#08150E] via-[#040906] to-[#010302]"';
  const bgIndigoReplace = 'b==="welcome"||b==="system-settings"||b==="archive"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a194d] via-[#080820] to-[#010108]":s==="btb"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C2BEB4] via-[#D0CDC3] to-[#D5D2C9]":s==="spike"?"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#171E2A] via-[#0D1118] to-[#06080C]":"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#08150E] via-[#040906] to-[#010302]"';

  if (content.includes(bgRedBlack)) {
    content = content.replace(bgRedBlack, bgIndigoReplace);
    console.log("✅ Replaced previous red/black page background with luxury Indigo gradient.");
  } else if (content.includes(bgUnpatched)) {
    content = content.replace(bgUnpatched, bgIndigoReplace);
    console.log("✅ Replaced unpatched page background with luxury Indigo gradient.");
  } else {
    console.log("⚠️ Page background target not found.");
  }

  // 3. High-Class Indigo Card for Welcome/Settings/Archive & BTB Beige Border Removal
  const cardUnpatched = 's==="btb"?"bg-[#ECE9E0] border border-[#B1AC9E] shadow-black/5":s==="spike"?"bg-[#131926] border border-[#242D3E] shadow-2xl":"bg-[#0B130E] border border-[#1A3224] shadow-emerald-950/20"';
  const cardRedBlack = 'b==="welcome"||b==="system-settings"||b==="archive"?"bg-[#090202]/95 border border-[#3e0d0d] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(153,27,27,0.06)]":b==="welcome"||b==="system-settings"||b==="archive"?"bg-[#120202]/95 border border-[#5c0d0d] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(153,27,27,0.06)]":s==="btb"?"bg-[#ECE9E0] border border-[#B1AC9E] shadow-black/5":s==="spike"?"bg-[#131926] border border-[#242D3E] shadow-2xl":"bg-[#0B130E] border border-[#1A3224] shadow-emerald-950/20"';
  const cardIndigoPatched = 'b==="welcome"||b==="system-settings"||b==="archive"?"bg-[#0e0e2e]/95 border border-[#232463] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(99,102,241,0.08)]":s==="btb"?"bg-[#ECE9E0] border border-transparent shadow-black/5":s==="spike"?"bg-[#131926] border border-[#242D3E] shadow-2xl":"bg-[#0B130E] border border-[#1A3224] shadow-emerald-950/20"';
  const cardIndigoReplace = 'b==="welcome"||b==="system-settings"||b==="archive"?"bg-[#0e0e2e]/95 border border-transparent shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(99,102,241,0.08)]":s==="btb"?"bg-[#ECE9E0] border border-transparent shadow-black/5":s==="spike"?"bg-[#131926] border border-[#242D3E] shadow-2xl":"bg-[#0B130E] border border-[#1A3224] shadow-emerald-950/20"';

  if (content.includes(cardIndigoPatched)) {
    content = content.replace(cardIndigoPatched, cardIndigoReplace);
    console.log("✅ Removed card border (made transparent) on Welcome/Settings/Archive.");
  } else if (content.includes(cardRedBlack)) {
    content = content.replace(cardRedBlack, cardIndigoReplace);
    console.log("✅ Replaced red/black card with border-transparent Indigo card.");
  } else if (content.includes(cardUnpatched)) {
    content = content.replace(cardUnpatched, cardIndigoReplace);
    console.log("✅ Replaced unpatched card with border-transparent Indigo card.");
  } else {
    console.log("⚠️ Card background target not found.");
  }

  // 3b. Style isolation for parent container so theme classes like mode-btb/mode-spike do not leak onto Welcome/Settings/Archive
  const targetParent = 'className:q("min-h-screen font-sans p-4 md:p-8 flex items-center justify-center text-left transition-all duration-500",s==="btb"?"mode-btb text-[#1A1A18]":s==="spike"?"mode-spike text-[#F8FAFC]":"mode-channel text-[#E2E8F0]"';
  const replaceParent = 'className:q((b==="welcome"?"h-screen overflow-hidden":"min-h-screen")+" font-sans p-4 md:p-8 flex items-center justify-center text-left transition-all duration-500",(b==="welcome"||b==="system-settings"||b==="archive")?"":s==="btb"?"mode-btb text-[#1A1A18]":s==="spike"?"mode-spike text-[#F8FAFC]":"mode-channel text-[#E2E8F0]"';
  
  if (content.includes(targetParent)) {
    content = content.replace(targetParent, replaceParent);
    console.log("✅ Theme Isolation & Outer Scroll-Lock patch applied.");
  } else {
    console.log("❌ Target for theme isolation not found.");
  }

  // 3c. Card height constraint on welcome screen so it never overflows or scrolls the viewport
  const cardMaxHeightT = 'className:q("w-full max-w-md md:max-w-2xl lg:max-w-4xl transition-all duration-500 overflow-hidden relative rounded-[30px] md:rounded-[40px] shadow-2xl",';
  const cardMaxHeightR = 'className:q("w-full max-w-md md:max-w-2xl lg:max-w-4xl transition-all duration-500 overflow-hidden relative rounded-[30px] md:rounded-[40px] shadow-2xl "+(b==="welcome"?"h-[85dvh] flex flex-col":""),';
  const cardMaxHeightPatched = 'className:q("w-full max-w-md md:max-w-2xl lg:max-w-4xl transition-all duration-500 overflow-hidden relative rounded-[30px] md:rounded-[40px] shadow-2xl "+(b==="welcome"?"max-h-[92dvh] flex flex-col":""),';

  if (content.includes(cardMaxHeightPatched)) {
    content = content.replace(cardMaxHeightPatched, cardMaxHeightR);
    console.log("✅ Updated card welcome height constraint to h-[85dvh].");
  } else if (content.includes(cardMaxHeightT)) {
    content = content.replace(cardMaxHeightT, cardMaxHeightR);
    console.log("✅ Card Welcome Height Constraint patch applied (h-[85dvh]).");
  } else {
    console.log("❌ Target for card welcome height constraint not found.");
  }

  // 4. Shrink Strategy Boxes / Grid & Elements inside Fl Component

  // Welcome spacing (space-y-4 py-3 px-2 flex flex-col items-center relative w-full h-full justify-center)
  const welcomeOuterT = 'className:"space-y-4 py-3 px-2 flex flex-col items-center relative w-full h-full justify-center"';
  const welcomeOuterR = 'className:"space-y-4 py-2 px-2 flex flex-col items-center relative w-full h-full justify-between flex-1"';
  if (content.includes(welcomeOuterT)) {
    content = content.replace(welcomeOuterT, welcomeOuterR);
    console.log("✅ Welcome outer container layout set to justify-between flex-1.");
  } else {
    // If already patched once:
    const welcomeOuterPatchedT = 'className:"space-y-2 py-2 px-2 flex flex-col items-center relative w-full h-full justify-center"';
    if (content.includes(welcomeOuterPatchedT)) {
      content = content.replace(welcomeOuterPatchedT, welcomeOuterR);
      console.log("✅ Updated welcome outer container layout from center to justify-between flex-1.");
    }
  }

  // Centering & height propagation on the router
  const routerContainerT = 'className:"space-y-4",children:[b!=="welcome"&&b!=="system-settings"&&b!=="archive"&&la()';
  const routerContainerR = 'className:"space-y-4 "+(b==="welcome"?"h-full flex flex-col":""),children:[b!=="welcome"&&b!=="system-settings"&&b!=="archive"&&la()';
  if (content.includes(routerContainerT)) {
    content = content.replace(routerContainerT, routerContainerR);
    console.log("✅ Router container height set to h-full for centering.");
  }

  const routerFramerT = 'initial:{opacity:0,x:20},animate:{opacity:1,x:0},exit:{opacity:0,x:-20},transition:{duration:.2},children:[b==="welcome"&&Fl()';
  const routerFramerR = 'initial:{opacity:0,x:20},animate:{opacity:1,x:0},exit:{opacity:0,x:-20},transition:{duration:.2},className:(b==="welcome"?"h-full flex flex-col flex-1":""),children:[b==="welcome"&&Fl()';
  if (content.includes(routerFramerT)) {
    content = content.replace(routerFramerT, routerFramerR);
    console.log("✅ Router Framer Motion div height set to h-full for centering.");
  }

  // Welcome logo & title container spacing (text-center space-y-10 select-none group max-w-2xl w-full)
  const welcomeTitleContainerT = 'className:"text-center space-y-10 select-none group max-w-2xl w-full"';
  const welcomeTitleContainerR = 'className:"text-center space-y-4 select-none group max-w-2xl w-full"';
  if (content.includes(welcomeTitleContainerT)) {
    content = content.replace(welcomeTitleContainerT, welcomeTitleContainerR);
    console.log("✅ Welcome title/logo container spacing shrunk.");
  }

  // Unified Premium Large Red Amber Logo Patch (REVERTED TO ORIGINAL)
  const logoUnpatched = 'o.jsxs("div",{className:"relative inline-flex justify-center items-center",children:[o.jsx("div",{className:"absolute -inset-4 bg-gradient-to-r from-red-600 via-amber-600 to-red-800 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"}),o.jsxs("div",{className:"relative bg-slate-950/90 border-2 border-red-900/40 p-3.5 rounded-[28px] flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform duration-500 group-hover:scale-105",children:[o.jsx("div",{className:"absolute inset-0.5 rounded-[24px] border border-red-500/10 pointer-events-none"}),o.jsx(Et,{className:"text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]",size:38})]})]})';
  const logoPatched = 'o.jsxs("div",{className:"relative inline-flex justify-center items-center",children:[o.jsx("div",{className:"absolute -inset-2 bg-gradient-to-r from-red-600 via-amber-600 to-red-800 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"}),o.jsxs("div",{className:"relative bg-slate-950/90 border border-red-900/40 p-2 rounded-xl flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform duration-500 group-hover:scale-105",children:[o.jsx("div",{className:"absolute inset-0.5 rounded-lg border border-red-500/10 pointer-events-none"}),o.jsx(Et,{className:"text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]",size:24})]})]})';
  const logoPremiumLargeIndigo = 'o.jsxs("div",{className:"relative inline-flex justify-center items-center",children:[o.jsx("div",{className:"absolute -inset-4 bg-gradient-to-r from-[#2b2c6e] via-[#5f61e6] to-[#2b2c6e] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse"}),o.jsxs("div",{className:"relative bg-[#0e0f24]/95 border border-[#2b2c6e] p-4 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-950/60 transition-transform duration-500 group-hover:scale-105",children:[o.jsx("div",{className:"absolute inset-0.5 rounded-xl border border-indigo-500/10 pointer-events-none"}),o.jsx(Et,{className:"text-indigo-400 drop-shadow-[0_0_18px_rgba(99,102,241,0.9)]",size:38})]})]})';
  const logoPremiumLargeRedAmber = 'o.jsxs("div",{className:"relative inline-flex justify-center items-center",children:[o.jsx("div",{className:"absolute -inset-4 bg-gradient-to-r from-red-600 via-amber-600 to-red-800 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse"}),o.jsxs("div",{className:"relative bg-slate-950/95 border border-red-900/40 p-4 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-950/60 transition-transform duration-500 group-hover:scale-105",children:[o.jsx("div",{className:"absolute inset-0.5 rounded-xl border border-red-500/10 pointer-events-none"}),o.jsx(Et,{className:"text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.9)]",size:38})]})]})';

  if (content.includes(logoPremiumLargeRedAmber)) {
    content = content.replace(logoPremiumLargeRedAmber, logoUnpatched);
    console.log("✅ Reverted logo design and color back to the original red-and-amber version.");
  } else if (content.includes(logoPremiumLargeIndigo)) {
    content = content.replace(logoPremiumLargeIndigo, logoUnpatched);
    console.log("✅ Reverted logo design and color back to the original red-and-amber version.");
  } else if (content.includes(logoPatched)) {
    content = content.replace(logoPatched, logoUnpatched);
    console.log("✅ Reverted logo design and color back to the original red-and-amber version.");
  } else {
    console.log("ℹ️ Logo already in original unpatched state.");
  }

  // Main header title text size (text-2xl sm:text-4xl, size:13 to text-xl sm:text-2xl, size:11)
  const headerTitleT = 'className:"text-2xl sm:text-4xl font-black uppercase tracking-[0.15em] bg-gradient-to-r from-slate-100 via-amber-200 to-slate-200 bg-clip-text text-transparent font-sans flex items-center gap-2 leading-none filter drop-shadow-sm",children:["Soheil Keshtkar",o.jsx(Bt,{className:"text-red-500 animate-pulse shrink-0",size:13})]';
  const headerTitleR = 'className:"text-lg sm:text-2xl font-black uppercase tracking-[0.15em] bg-gradient-to-r from-slate-100 via-amber-200 to-slate-200 bg-clip-text text-transparent font-sans flex items-center gap-2 leading-none filter drop-shadow-sm",children:["Soheil Keshtkar",o.jsx(Bt,{className:"text-red-500 animate-pulse shrink-0",size:11})]';
  if (content.includes(headerTitleT)) {
    content = content.replace(headerTitleT, headerTitleR);
    console.log("✅ Welcome title text size shrunk.");
  }

  // Welcome title-subtitle container spacing (space-y-1.5)
  const welcomeSubContainerT = 'className:"flex flex-col items-center whitespace-nowrap space-y-1.5"';
  const welcomeSubContainerR = 'className:"flex flex-col items-center whitespace-nowrap space-y-1"';
  if (content.includes(welcomeSubContainerT)) {
    content = content.replace(welcomeSubContainerT, welcomeSubContainerR);
    console.log("✅ Welcome title-subtitle vertical spacing shrunk.");
  }

  // Channel Button Target
  const channelBtnT = 'o.jsxs("button",{onClick:()=>{ls("channel")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-emerald-500/40 p-4.5 rounded-[28px] text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-center min-h-[105px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-emerald-500/[0.02] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-3",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-emerald-400 group-hover:border-emerald-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Ps,{size:18})}),o.jsxs("div",{className:"flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-emerald-500 animate-pulse"}),o.jsx("span",{className:"text-[8px] font-black uppercase tracking-wider text-slate-450",children:"Channel"})]})]}),o.jsx("h3",{className:"text-lg font-black text-slate-100 group-hover:text-emerald-400 transition-colors",children:Vc("Channel Strategy",h.appLanguage)})]})]})';
  const channelBtnR = 'o.jsxs("button",{onClick:()=>{ls("channel")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-emerald-500/40 p-2.5 rounded-xl text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-center min-h-[82px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-emerald-500/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-1.5",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-emerald-400 group-hover:border-emerald-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Ps,{size:14})}),o.jsxs("div",{className:"flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-emerald-500 animate-pulse"}),o.jsx("span",{className:"text-[7px] font-black uppercase tracking-wider text-slate-450",children:"Channel"})]})]}),o.jsx("h3",{className:"text-xs font-black text-slate-100 group-hover:text-emerald-400 transition-colors",children:Vc("Channel Strategy",h.appLanguage)})]})]})';
  if (content.includes(channelBtnT)) {
    content = content.replace(channelBtnT, channelBtnR);
    console.log("✅ Channel strategy card size and styling shrunk.");
  }

  // BTB Button Target
  const btbBtnT = 'o.jsxs("button",{onClick:()=>{ls("btb")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-indigo-500/40 p-4.5 rounded-[28px] text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-indigo-950/20 flex flex-col justify-center min-h-[105px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-indigo-500/[0.02] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-3",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-indigo-400 group-hover:border-indigo-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Br,{size:18})}),o.jsxs("div",{className:"flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-indigo-500 animate-pulse"}),o.jsx("span",{className:"text-[8px] font-black uppercase tracking-wider text-slate-450",children:"BTB"})]})]}),o.jsx("h3",{className:"text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-colors",children:Vc("BTB Strategy",h.appLanguage)})]})]})';
  const btbBtnR = 'o.jsxs("button",{onClick:()=>{ls("btb")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-indigo-500/40 p-2.5 rounded-xl text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-indigo-950/20 flex flex-col justify-center min-h-[82px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-indigo-500/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-1.5",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-indigo-400 group-hover:border-indigo-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Br,{size:14})}),o.jsxs("div",{className:"flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-indigo-500 animate-pulse"}),o.jsx("span",{className:"text-[7px] font-black uppercase tracking-wider text-slate-450",children:"BTB"})]})]}),o.jsx("h3",{className:"text-xs font-black text-slate-100 group-hover:text-indigo-400 transition-colors",children:Vc("BTB Strategy",h.appLanguage)})]})]})';
  if (content.includes(btbBtnT)) {
    content = content.replace(btbBtnT, btbBtnR);
    console.log("✅ BTB strategy card size and styling shrunk.");
  }

  // Spike Button Target
  const spikeBtnT = 'o.jsxs("button",{onClick:()=>{ls("spike")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 p-4.5 rounded-[28px] text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-amber-950/20 flex flex-col justify-center min-h-[105px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-amber-500/[0.02] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-3",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-amber-400 group-hover:border-amber-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Br,{size:18})}),o.jsxs("div",{className:"flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-amber-500 animate-pulse"}),o.jsx("span",{className:"text-[8px] font-black uppercase tracking-wider text-slate-450",children:"Spike"})]})]}),o.jsx("h3",{className:"text-lg font-black text-slate-100 group-hover:text-amber-400 transition-colors",children:"Spike"})]})]})';
  const spikeBtnR = 'o.jsxs("button",{onClick:()=>{ls("spike")},className:"group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 p-2.5 rounded-xl text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-amber-950/20 flex flex-col justify-center min-h-[82px] cursor-pointer",children:[o.jsx("div",{className:"absolute inset-0 bg-amber-500/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"}),o.jsx("div",{className:"absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"}),o.jsxs("div",{className:"relative z-10 w-full flex flex-col pointer-events-none space-y-1.5",children:[o.jsxs("div",{className:"flex items-center justify-between w-full",children:[o.jsx("div",{className:"w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-450 group-hover:text-amber-400 group-hover:border-amber-500/20 flex items-center justify-center shadow-inner transition-all duration-300",children:o.jsx(Br,{size:14})}),o.jsxs("div",{className:"flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm",children:[o.jsx("span",{className:"w-1 h-1 rounded-full bg-amber-500 animate-pulse"}),o.jsx("span",{className:"text-[7px] font-black uppercase tracking-wider text-slate-450",children:"Spike"})]})]}),o.jsx("h3",{className:"text-xs font-black text-slate-100 group-hover:text-amber-400 transition-colors",children:"Spike"})]})]})';
  if (content.includes(spikeBtnT)) {
    content = content.replace(spikeBtnT, spikeBtnR);
    console.log("✅ Spike strategy card size and styling shrunk.");
  }

  // Welcome page grid gap (className:"grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full")
  const welcomeGridGapT = 'className:"grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full"';
  const welcomeGridGapR = 'className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full"';
  if (content.includes(welcomeGridGapT)) {
    content = content.replace(welcomeGridGapT, welcomeGridGapR);
    console.log("✅ Grid layout gap shrunk.");
  }

  // Footer bar spacing (pt-4 to pt-2.5) and bottom alignment (mt-auto)
  const bottomBarT = 'className:"w-full flex gap-3 pt-4 border-t border-slate-900/60 max-w-2xl select-none"';
  const bottomBarR = 'className:"w-full flex gap-3 pt-2 border-t border-slate-900/60 max-w-2xl select-none mt-auto"';
  if (content.includes(bottomBarT)) {
    content = content.replace(bottomBarT, bottomBarR);
    console.log("✅ Settings/Archive button bar padding shrunk and pushed to bottom via mt-auto.");
  } else {
    const bottomBarPatchedT = 'className:"w-full flex gap-3 pt-2 border-t border-slate-900/60 max-w-2xl select-none"';
    const bottomBarPatchedR = 'className:"w-full flex gap-3 pt-2 border-t border-slate-900/60 max-w-2xl select-none mt-auto"';
    if (content.includes(bottomBarPatchedT)) {
      content = content.replace(bottomBarPatchedT, bottomBarPatchedR);
      console.log("✅ Updated patched Settings/Archive button bar with mt-auto.");
    }
  }

  // Settings/Archive buttons padding (py-2.5 px-4 rounded-xl to py-1.5 px-3 rounded-lg)
  const archiveBtnT = 'o.jsxs("button",{onClick:()=>{w("welcome"),x("archive")},className:"flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"';
  const archiveBtnR = 'o.jsxs("button",{onClick:()=>{w("welcome"),x("archive")},className:"flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"';
  if (content.includes(archiveBtnT)) {
    content = content.replace(archiveBtnT, archiveBtnR);
    console.log("✅ Archive button padding and radius shrunk.");
  }

  const sysSettingsBtnT = 'o.jsxs("button",{onClick:()=>{w("welcome"),x("system-settings")},className:"flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"';
  const sysSettingsBtnR = 'o.jsxs("button",{onClick:()=>{w("welcome"),x("system-settings")},className:"flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-sm"';
  if (content.includes(sysSettingsBtnT)) {
    content = content.replace(sysSettingsBtnT, sysSettingsBtnR);
    console.log("✅ System Settings button padding and radius shrunk.");
  }


  // 5. Spike Mode Trade Condition renaming:
  // "Wide" -> "Insid5min" & "Tight" -> "Break"
  
  // A. Options selector buttons:
  const condSelectorT = '{value:"Wide",label:s==="btb"?"FL":"Wide",colorClass:"indigo"},{value:"Tight",label:s==="btb"?"Shadow":"Tight",colorClass:"violet"}';
  const condSelectorR = '{value:"Wide",label:s==="btb"?"FL":s==="spike"?"Insid5min":"Wide",colorClass:"indigo"},{value:"Tight",label:s==="btb"?"Shadow":s==="spike"?"Break":"Tight",colorClass:"violet"}';
  
  if (content.includes(condSelectorT)) {
    content = content.replace(condSelectorT, condSelectorR);
    console.log("✅ Option selector labels updated dynamically.");
  }

  // B. Rendering labels pattern 1 (S.tradeCondition):
  const renderLabel1T = 'S.tradeCondition==="Wide"?s==="btb"?"FL":"Wide":S.tradeCondition==="Tight"?s==="btb"?"Shadow":"Tight":"Reng"';
  const renderLabel1R = 'S.tradeCondition==="Wide"?s==="btb"?"FL":s==="spike"?"Insid5min":"Wide":S.tradeCondition==="Tight"?s==="btb"?"Shadow":s==="spike"?"Break":"Tight":"Reng"';

  if (content.includes(renderLabel1T)) {
    content = content.replace(renderLabel1T, renderLabel1R);
    console.log("✅ Render label S.tradeCondition updated.");
  }

  // C. Rendering labels pattern 2 (F.tradeCondition):
  const renderLabel2T = 'F.tradeCondition==="Wide"?s==="btb"?"FL":"Wide":F.tradeCondition==="Tight"?s==="btb"?"Shadow":"Tight":"Reng"';
  const renderLabel2R = 'F.tradeCondition==="Wide"?s==="btb"?"FL":s==="spike"?"Insid5min":"Wide":F.tradeCondition==="Tight"?s==="btb"?"Shadow":s==="spike"?"Break":"Tight":"Reng"';

  if (content.includes(renderLabel2T)) {
    content = content.replace(renderLabel2T, renderLabel2R);
    console.log("✅ Render label F.tradeCondition updated.");
  }

  // D. Rendering labels pattern 3 (Ae.tradeCondition):
  const renderLabel3T = 'Ae.tradeCondition==="Wide"?Ae.strategyMode==="btb"?"FL":"Wide":Ae.tradeCondition==="Tight"?Ae.strategyMode==="btb"?"Shadow":"Tight":"Reng"';
  const renderLabel3R = 'Ae.tradeCondition==="Wide"?Ae.strategyMode==="btb"?"FL":Ae.strategyMode==="spike"?"Insid5min":"Wide":Ae.tradeCondition==="Tight"?Ae.strategyMode==="btb"?"Shadow":Ae.strategyMode==="spike"?"Break":"Tight":"Reng"';

  if (content.includes(renderLabel3T)) {
    content = content.replace(renderLabel3T, renderLabel3R);
    console.log("✅ Render label Ae.tradeCondition updated.");
  }

  // E. Rendering labels pattern 4 (T.tradeCondition):
  const renderLabel4T = 'T.tradeCondition==="Wide"?G=T.strategyMode==="btb"?"FL":"Wide":T.tradeCondition==="Tight"?G=T.strategyMode==="btb"?"Shadow":"Tight"';
  const renderLabel4R = 'T.tradeCondition==="Wide"?G=T.strategyMode==="btb"?"FL":T.strategyMode==="spike"?"Insid5min":"Wide":T.tradeCondition==="Tight"?G=T.strategyMode==="btb"?"Shadow":T.strategyMode==="spike"?"Break":"Tight"';

  if (content.includes(renderLabel4T)) {
    content = content.replace(renderLabel4T, renderLabel4R);
    console.log("✅ Render label T.tradeCondition updated.");
  }

  // F. Parser enhancement to accept "inside", "insid5min", "break", etc. in imports
  const parserT = 'ue.includes("wide")||ue.includes("عریض")||ue.includes("واید")?ge="Wide":ue.includes("tight")||ue.includes("تنگ")?ge="Tight"';
  const parserR = 'ue.includes("wide")||ue.includes("عریض")||ue.includes("واید")||ue.includes("inside")||ue.includes("insid5min")?ge="Wide":ue.includes("tight")||ue.includes("تنگ")||ue.includes("break")||ue.includes("تاید")?ge="Tight"';

  if (content.includes(parserT)) {
    content = content.replace(parserT, parserR);
    console.log("✅ Text-to-condition parsing enhanced.");
  }

  // 6. BTB Mode: Change "Save Reflection", "Register New Trade", and "Confirm Log Trade" button boxes to Blue
  const btbSaveReflectionT = 's==="btb"?"bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"';
  const btbSaveReflectionR = 's==="btb"?"bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black shadow-xl shadow-blue-600/25 hover:scale-[1.02] active:scale-95"';

  const btbRegisterTradeT = 'Vn?s==="btb"?"bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25';
  const btbRegisterTradeR = 'Vn?s==="btb"?"bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black shadow-xl shadow-blue-600/25';

  const btbConfirmTradeT = 'N?s==="btb"?"bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-xl shadow-indigo-600/25';
  const btbConfirmTradeR = 'N?s==="btb"?"bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black shadow-xl shadow-blue-600/25';

  const btbStartSessionT = 's==="btb"?"bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-indigo-600/25 hover:scale-[1.02] active:scale-95"';
  const btbStartSessionR = 's==="btb"?"bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black shadow-blue-600/25 hover:scale-[1.02] active:scale-95"';

  if (content.includes(btbSaveReflectionT)) {
    content = content.replace(btbSaveReflectionT, btbSaveReflectionR);
    console.log("✅ Changed BTB Save Reflections button to Blue gradient.");
  }
  if (content.includes(btbRegisterTradeT)) {
    content = content.replace(btbRegisterTradeT, btbRegisterTradeR);
    console.log("✅ Changed BTB Register Trade button to Blue gradient.");
  }
  if (content.includes(btbConfirmTradeT)) {
    content = content.replace(btbConfirmTradeT, btbConfirmTradeR);
    console.log("✅ Changed BTB Confirm Trade button to Blue gradient.");
  }
  if (content.includes(btbStartSessionT)) {
    content = content.replace(btbStartSessionT, btbStartSessionR);
    console.log("✅ Changed BTB Start Trading Session button to Blue gradient.");
  }

  // Also replace any text-indigo-100 subtext in these buttons with text-blue-100
  const subtext1T = 'Vn&&s==="btb"?"text-indigo-100"';
  const subtext1R = 'Vn&&s==="btb"?"text-blue-100"';
  if (content.includes(subtext1T)) {
    content = content.replace(subtext1T, subtext1R);
    console.log("✅ Updated subtext 1 to blue-100.");
  }

  const subtext2T = 'N&&!S&&s==="btb"?"text-indigo-100"';
  const subtext2R = 'N&&!S&&s==="btb"?"text-blue-100"';
  if (content.includes(subtext2T)) {
    content = content.replace(subtext2T, subtext2R);
    console.log("✅ Updated subtext 2 to blue-100.");
  }

  const subtext3T = 's==="btb"?"text-indigo-100"';
  const subtext3R = 's==="btb"?"text-blue-100"';
  if (content.includes(subtext3T)) {
    content = content.replace(subtext3T, subtext3R);
    console.log("✅ Updated subtext 3 to blue-100.");
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Successfully saved patched file: ${filePath}`);
});
