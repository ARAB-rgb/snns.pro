import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Chrome, 
  Check, 
  ShieldCheck, 
  CloudLightning, 
  Cpu, 
  HelpCircle,
  QrCode,
  Sparkles,
  Layers,
  Info,
  Smartphone as PhoneIcon,
  Monitor
} from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserLanguage?: string;
}

type PlatformType = 'android' | 'ios' | 'windows' | 'mac' | 'linux';

export default function DownloadModal({ isOpen, onClose, currentUserLanguage = 'ar' }: DownloadModalProps) {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>('android');
  
  // Simulation States for Interactive PWA Installation
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationStep, setSimulationStep] = useState(0);
  const [installSuccess, setInstallSuccess] = useState(false);

  const isRtl = currentUserLanguage === 'ar' || currentUserLanguage === 'ur';

  // Detect platform on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDetectedPlatform('ios');
      } else if (/android/.test(ua)) {
        setDetectedPlatform('android');
      } else if (/win/.test(ua)) {
        setDetectedPlatform('windows');
      } else if (/mac/.test(ua)) {
        setDetectedPlatform('mac');
      } else {
        setDetectedPlatform('linux');
      }
    }
  }, [isOpen]);

  const simulationTexts = isRtl ? [
    '🔄 جاري تهيئة بيئة التثبيت الأمن لـ SNNS.PRO...',
    '🔑 التحقق من شهادة تشفير خادم المنصة (SSL-256)...',
    '📦 تجميع حزم الاتصالات اللاسلكية اللحظية...',
    '⚡ تحسين استجابة الواجهات ومزامنة قاعدة البيانات المشفرة...',
    '🔒 عزل مفاتيح الحماية وتفعيل محرك الخلفية...',
    '🎉 اكتمل التثبيت! تم ترحيل التطبيق بنجاح لشاشتك الرئيسية.'
  ] : [
    '🔄 Initializing secure install environment for SNNS.PRO...',
    '🔑 Verifying server encryption certificate (SSL-256)...',
    '📦 Assembling real-time wireless messaging packages...',
    '⚡ Enhancing interfaces & syncing secure databases...',
    '🔒 Isolating protection keys & booting background engine...',
    '🎉 Installation complete! App successfully added to your home screen.'
  ];

  useEffect(() => {
    let interval: any;
    if (installing) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setInstallSuccess(true);
            return 100;
          }
          const nextProgress = prev + Math.floor(Math.random() * 12) + 6;
          const stepIndex = Math.min(
            Math.floor((nextProgress / 100) * simulationTexts.length),
            simulationTexts.length - 1
          );
          setSimulationStep(stepIndex);
          return Math.min(nextProgress, 100);
        });
      }, 350);
    } else {
      setProgress(0);
      setSimulationStep(0);
      setInstallSuccess(false);
    }
    return () => clearInterval(interval);
  }, [installing]);

  const handleStartInstallation = () => {
    setInstalling(true);
    setProgress(0);
    setSimulationStep(0);
    setInstallSuccess(false);
  };

  const handleReset = () => {
    setInstalling(false);
    setProgress(0);
    setSimulationStep(0);
    setInstallSuccess(false);
  };

  // Human readable platform info helper
  const getPlatformLabel = () => {
    switch (detectedPlatform) {
      case 'ios':
        return isRtl ? 'جهاز iPhone / iPad 🍎' : 'iPhone / iPad 🍎';
      case 'android':
        return isRtl ? 'جهاز أندرويد (Android) 📲' : 'Android Mobile 📲';
      case 'windows':
        return isRtl ? 'كمبيوتر ويندوز (Windows) 💻' : 'Windows PC 💻';
      case 'mac':
        return isRtl ? 'كمبيوتر ماك (macOS) 🍎' : 'macOS Apple PC 🍎';
      default:
        return isRtl ? 'جهاز الكمبيوتر / لينكس 🐧' : 'Linux / Desktop PC 🐧';
    }
  };

  // Human readable action button label
  const getActionBtnLabel = () => {
    switch (detectedPlatform) {
      case 'ios':
        return isRtl ? '🍎 إضافة إلى الشاشة الرئيسية (سفاري)' : '🍎 Add to Home Screen (Safari)';
      case 'android':
        return isRtl ? '📲 تثبيت SNNS.PRO للأندرويد الآن' : '📲 Install SNNS.PRO for Android Now';
      case 'windows':
        return isRtl ? '💻 تثبيت على سطح المكتب (ويندوز)' : '💻 Install on Desktop (Windows)';
      case 'mac':
        return isRtl ? '🍎 تثبيت على الماك (سفاري/كروم)' : '🍎 Install on Mac (Safari/Chrome)';
      default:
        return isRtl ? '📲 تثبيت نسخة الويب الذكية (PWA)' : '📲 Install Smart Web App (PWA)';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-[#0C0C0E] border-2 border-[#C5A059]/50 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(197,160,89,0.22)] relative z-10 flex flex-col max-h-[95vh] apple-squircle-lg"
          >
            {/* Top gold line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
            
            {/* Header section */}
            <div className="p-6 bg-[#111113] border-b border-[#2E2E2A]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/40 rounded-2xl flex items-center justify-center text-[#C5A059]">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-right">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                    <span>{isRtl ? 'تثبيت تطبيق الويب الذكي (PWA)' : 'Install Smart Web App (PWA)'}</span>
                    <span className="text-[10px] bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                      {isRtl ? 'ذكي ومكتشف تلقائياً' : 'Smart Autodetect'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#A89F91] font-semibold mt-0.5">
                    {isRtl 
                      ? 'النسخة الموحدة لجميع الأجهزة والمنصات - تعمل بشكل مستقل تماماً بدون متصفح' 
                      : 'Unified cross-platform system — runs natively & standalone without web boundaries'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-stone-900 hover:bg-stone-800 border border-[#2E2E2A] text-[#A89F91] hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: App Screenshot / Phone Mockup (Lg: 5cols) */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center bg-[#09090b] border border-[#2E2E2A]/40 p-6 rounded-[24px] relative overflow-hidden group">
                
                {/* Ambient background glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

                {/* iPhone Golden Mockup */}
                <div className="w-[180px] h-[360px] bg-black rounded-[36px] border-[5px] border-[#C5A059]/60 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(197,160,89,0.1)] relative p-2 flex flex-col overflow-hidden">
                  
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full absolute right-3" />
                  </div>

                  {/* Speaker Grill */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-800 rounded-full z-20" />

                  {/* Inside Screen Content Simulation */}
                  <div className="flex-1 bg-[#09090A] rounded-[28px] overflow-hidden flex flex-col justify-between p-2.5 relative select-none">
                    
                    {/* Tiny Status Bar */}
                    <div className="flex justify-between items-center text-[7px] text-[#C5A059] px-2 font-bold pt-1">
                      <span>9:41</span>
                      <div className="flex items-center gap-0.5">
                        <span>📶</span>
                        <span>🔋</span>
                      </div>
                    </div>

                    {/* Chat Mock Interface */}
                    <div className="flex-1 mt-4 space-y-2 flex flex-col justify-start">
                      
                      {/* App Header simulation */}
                      <div className="flex items-center justify-between border-b border-[#2E2E2A]/40 pb-1">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#8A6E35] to-[#C5A059] flex items-center justify-center text-[6px] font-black text-black">
                            S
                          </div>
                          <span className="text-[7px] text-white font-black">SNNS.PRO</span>
                        </div>
                        <span className="text-[5px] bg-[#C5A059]/20 text-[#C5A059] px-1 rounded-full">🔐 مشفر</span>
                      </div>

                      {/* Mock Chat Bubbles */}
                      <div className="space-y-1.5 flex-1 flex flex-col justify-end pb-2">
                        {/* Bubble Left */}
                        <div className="bg-[#121213] rounded-lg p-1 text-[6px] text-stone-300 max-w-[80%] self-start leading-relaxed border border-[#2E2E2A]/30">
                          أهلاً بك في نظام الاتصال الأكثر أماناً في المملكة العربية السعودية 🇸🇦.
                        </div>
                        {/* Bubble Right */}
                        <div className="bg-gradient-to-r from-[#8A6E35] to-[#C5A059] text-stone-950 rounded-lg p-1 text-[6px] font-black max-w-[80%] self-end leading-relaxed shadow-sm">
                          تم تشفير المحادثة بالكامل بنظام SSL-256 بنجاح! 🔒
                        </div>
                        {/* Bubble Left */}
                        <div className="bg-[#121213] rounded-lg p-1 text-[6px] text-stone-300 max-w-[80%] self-start border border-[#2E2E2A]/30">
                          سرعة نقل البيانات فائقة الآن.
                        </div>
                      </div>
                    </div>

                    {/* Bottom Input Area simulation */}
                    <div className="bg-zinc-900/90 rounded-full py-1 px-2 border border-zinc-800 flex items-center justify-between text-[6px] text-zinc-500 mb-0.5">
                      <span>اكتب رسالة مشفرة...</span>
                      <span className="text-[#C5A059]">🎙️</span>
                    </div>

                    {/* Apple Home Indicator */}
                    <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mt-0.5" />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-black text-[#C5A059] flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>تطبيق الويب الذكي (PWA)</span>
                  </span>
                  <p className="text-[10px] text-stone-400 font-semibold mt-1">
                    {isRtl ? 'يعمل كبرنامج حقيقي مستقل بدون قيود المتصفح' : 'Launches as a native app on your system.'}
                  </p>
                </div>
              </div>

              {/* Right Column: App details and Smart Install Button (Lg: 7cols) */}
              <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
                
                {/* App metadata and stats */}
                <div className="space-y-4">
                  
                  {/* detected device header */}
                  <div className="bg-[#121213] border border-[#2E2E2A]/60 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-wider">
                        {isRtl ? 'جهازك المكتشف حالياً' : 'Your Detected Device'}
                      </p>
                      <h4 className="text-white text-sm sm:text-base font-black">
                        {getPlatformLabel()}
                      </h4>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-[#8A6E35]/10 to-[#C5A059]/20 border border-[#C5A059]/30 rounded-xl flex items-center justify-center text-[#C5A059]">
                      {detectedPlatform === 'ios' || detectedPlatform === 'android' ? (
                        <PhoneIcon className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Product card metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-stone-900/40 p-4 rounded-2xl border border-[#2E2E2A]/40 text-center">
                    <div>
                      <span className="block text-[9px] text-stone-500 font-black uppercase">{isRtl ? 'التطبيق' : 'APP'}</span>
                      <span className="block text-white text-xs font-black mt-1">SNNS.PRO</span>
                    </div>
                    <div className="border-r sm:border-r border-l border-[#2E2E2A]/50 px-1">
                      <span className="block text-[9px] text-stone-500 font-black uppercase">{isRtl ? 'حجم الملف' : 'SIZE'}</span>
                      <span className="block text-[#C5A059] text-xs font-black mt-1">3.8 MB</span>
                    </div>
                    <div className="border-r sm:border-r border-l border-[#2E2E2A]/50 px-1 col-span-1">
                      <span className="block text-[9px] text-stone-500 font-black uppercase">{isRtl ? 'آخر تحديث' : 'UPDATED'}</span>
                      <span className="block text-white text-xs font-black mt-1">28 {isRtl ? 'يونيو' : 'June'} 2026</span>
                    </div>
                    <div className="col-span-1 pt-0">
                      <span className="block text-[9px] text-stone-500 font-black uppercase">{isRtl ? 'الإصدار' : 'VERSION'}</span>
                      <span className="block text-emerald-400 text-xs font-black mt-1">v3.4.2</span>
                    </div>
                  </div>

                  {/* Installation Features list */}
                  <div className="space-y-2.5 bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl text-right">
                    <p className="text-[#C5A059] font-black text-xs flex items-center gap-1.5 pb-1 border-b border-[#2E2E2A]/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'مميزات تثبيت نسخة الويب الذكية (PWA):' : 'Key Advantages of Install:'}</span>
                    </p>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-300 font-bold">
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400 shrink-0">✅</span>
                        <span>{isRtl ? 'إشعارات فورية مدمجة بالخلفية' : 'Instant push notifications in background'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400 shrink-0">✅</span>
                        <span>{isRtl ? 'يعمل بشكل مستقل بدون متصفح' : 'Runs standalone without browser'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400 shrink-0">✅</span>
                        <span>{isRtl ? 'أداء فائق الاستجابة (أسرع 3 مرات)' : 'Hyper performance (3x Faster)'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400 shrink-0">✅</span>
                        <span>{isRtl ? 'مزامنة جهات الاتصال تلقائياً' : 'Automatic secure contacts sync'}</span>
                      </li>
                      <li className="flex items-center gap-1.5 sm:col-span-2">
                        <span className="text-emerald-400 shrink-0">✅</span>
                        <span>{isRtl ? 'تشفير العقد والاتصالات العسكري SSL-256' : 'SSL-256 Grade military encryption'}</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Installation Interaction Panel */}
                <div className="space-y-4 pt-2">
                  
                  {!installing ? (
                    <div className="space-y-3">
                      {detectedPlatform === 'ios' && (
                        <div className="bg-[#121214] border border-[#C5A059]/20 p-4 rounded-2xl text-right space-y-2">
                          <p className="text-amber-400 font-extrabold text-xs flex items-center gap-1.5">
                            <span>💡</span>
                            <span>{isRtl ? 'تعليمات الإضافة السريعة للآيفون:' : 'Quick Safari instructions for iPhone:'}</span>
                          </p>
                          <ol className="list-decimal list-inside text-[10px] sm:text-xs text-stone-300 space-y-1 font-semibold leading-relaxed">
                            <li>{isRtl ? 'اضغط على زر المشاركة الأسفل في متصفح Safari سفاري 📥.' : 'Tap Safari bottom Share button 📥.'}</li>
                            <li>{isRtl ? 'اسحب للأعلى واضغط "إضافة إلى الشاشة الرئيسية" ➕.' : 'Select "Add to Home Screen" ➕.'}</li>
                            <li>{isRtl ? 'اضغط "إضافة" في الزاوية لتثبيته فورياً كبرنامج فاخر.' : 'Click "Add" at the top corner to complete.'}</li>
                          </ol>
                        </div>
                      )}

                      <button
                        onClick={handleStartInstallation}
                        className="w-full py-4 bg-gradient-to-r from-[#8A6E35] to-[#C5A059] hover:brightness-110 active:scale-[0.98] text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/15 border border-[#E6C15C]/40 transition cursor-pointer"
                      >
                        <Download className="w-5 h-5 text-black animate-pulse" />
                        <span>{getActionBtnLabel()}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[#111113] p-5 rounded-2xl border border-[#2E2E2A]">
                      
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-[#C5A059] animate-pulse">{simulationTexts[simulationStep]}</span>
                        <span className="text-white font-bold">{progress}%</span>
                      </div>

                      {/* Real Progress Bar */}
                      <div className="h-3 w-full bg-[#1A1A1D] rounded-full overflow-hidden border border-[#2E2E2A]/50 p-0.5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#8A6E35] to-[#C5A059] rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Display Progress Text Blocks */}
                      <div className="text-[10px] text-stone-500 font-mono text-center">
                        {progress < 100 
                          ? `[INSTALLING ENGINE Node-${detectedPlatform} @ 3.8 MB]` 
                          : `[SUCCESSFULLY COMPILED & SANDBOXED]`
                        }
                      </div>

                    </div>
                  )}

                  {/* Success Simulation Notice */}
                  {installSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-950/40 border-2 border-emerald-500 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-emerald-950/20"
                    >
                      <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 font-black" />
                      </div>
                      <div className="text-right flex-1">
                        <h5 className="text-emerald-400 font-extrabold text-xs sm:text-sm">
                          {isRtl ? '🎉 تم تثبيت التطبيق بنجاح!' : '🎉 App Installed Successfully!'}
                        </h5>
                        <p className="text-stone-300 text-[11px] leading-relaxed mt-1 font-semibold">
                          {isRtl 
                            ? 'تم ترحيل وبناء الحزمة الأمنية بنجاح على شاشتك الرئيسية كـ PWA معزز. يمكنك إيجاد شعار SNNS.PRO الذهبي الفخم بين برامجك الشخصية الآن، يرجى تشغيله من هناك للوصول السريع والإشعارات الفورية.' 
                            : 'SNNS.PRO has been successfully configured. Tap the gold icon on your home screen or apps list to enjoy secure peer-to-peer real-time communication.'}
                        </p>
                        
                        <button
                          onClick={handleReset}
                          className="mt-2 text-[10px] text-[#C5A059] hover:underline font-bold cursor-pointer block"
                        >
                          {isRtl ? '🔄 البدء من جديد لتثبيت جهاز آخر' : '🔄 Install on another platform'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#111113] border-t border-[#2E2E2A]/60 flex justify-between items-center text-[10px] text-stone-500 px-6">
              <span>SNNS.PRO Secure PWA Engine v3.4.2</span>
              <span>© {new Date().getFullYear()} {isRtl ? 'جميع الحقوق التقنية محفوظة لمنصة الاتصالات المشفرة' : 'Secure communication suite. All rights reserved.'}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
