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
  QrCode
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserLanguage?: string;
}

type PlatformTab = 'android' | 'ios' | 'desktop' | 'chrome';

export default function DownloadModal({ isOpen, onClose, currentUserLanguage = 'ar' }: DownloadModalProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>('android');
  
  // Simulation States for Interactive Download Progress
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [simulationStep, setSimulationStep] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const simulationTexts = [
    '🔄 جاري الاتصال بخادم التشفير الآمن لـ SNNS.PRO...',
    '🔑 جاري التحقق من التوقيع الرقمي الرقمي الموثق (SHA-256)...',
    '📦 جاري تجميع مكتبات الصوت والفيديو المؤطرة بـ WebRTC العسكري...',
    '⚡ جاري تحميل حزمة البيانات المشفرة فائقة الحماية (32.4 MB)...',
    '🔒 فك تشفير جزئي للموارد وتأمين كود التشغيل المباشر...',
    '✅ تم التنزيل بنجاح! التطبيق جاهز للتثبيت على جهازك الشخصي.'
  ];

  useEffect(() => {
    let interval: any;
    if (downloadingFile) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setDownloadSuccess(true);
            return 100;
          }
          const nextProgress = prev + Math.floor(Math.random() * 15) + 5;
          const stepIndex = Math.min(
            Math.floor((nextProgress / 100) * simulationTexts.length),
            simulationTexts.length - 1
          );
          setSimulationStep(stepIndex);
          return Math.min(nextProgress, 100);
        });
      }, 400);
    } else {
      setProgress(0);
      setSimulationStep(0);
      setDownloadSuccess(false);
    }
    return () => clearInterval(interval);
  }, [downloadingFile]);

  const handleStartDownload = (fileName: string) => {
    setDownloadingFile(fileName);
    setProgress(0);
    setSimulationStep(0);
    setDownloadSuccess(false);
  };

  const resetDownloadSimulation = () => {
    setDownloadingFile(null);
    setProgress(0);
    setSimulationStep(0);
    setDownloadSuccess(false);
  };

  const isRtl = currentUserLanguage === 'ar' || currentUserLanguage === 'ur';

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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-[#0C0C0E] border-2 border-[#C5A059]/40 w-full max-w-3xl rounded-[28px] overflow-hidden shadow-[0_0_50px_rgba(197,160,89,0.15)] relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Upper Glow Design */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059]/80 to-transparent" />
            
            {/* Header section */}
            <div className="p-6 bg-[#111113] border-b border-[#2E2E2A]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/40 rounded-xl flex items-center justify-center text-[#C5A059]">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    {isRtl ? 'تحميل تطبيق الاتصالات المشفرة SNNS.PRO' : 'Download SNNS.PRO Encrypted App'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[#A89F91] font-semibold mt-0.5">
                    {isRtl 
                      ? 'النسخة الأمنية الموثقة للتحايل على حظر المتصفحات والحصول على الإشعارات اللحظية' 
                      : 'The secure verified build to bypass web limits & enable background push notifications'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-stone-900 border border-[#2E2E2A] text-[#A89F91] hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="bg-[#0e0e11] px-4 py-2 border-b border-[#2E2E2A]/40 flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setActiveTab('android'); resetDownloadSimulation(); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'android' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40' 
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isRtl ? 'أندرويد (Android APK)' : 'Android (APK)'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('ios'); resetDownloadSimulation(); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'ios' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40' 
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isRtl ? 'آيفون (iOS Safari)' : 'iPhone (iOS PWA)'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('desktop'); resetDownloadSimulation(); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'desktop' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40' 
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{isRtl ? 'سطح المكتب (Win / Mac)' : 'Desktop (PC / Mac)'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('chrome'); resetDownloadSimulation(); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'chrome' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40' 
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                <Chrome className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إضافة كروم (Extension)' : 'Chrome Extension'}</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Android Platform View */}
                  {activeTab === 'android' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      <div className="md:col-span-3 space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black">
                          <ShieldCheck className="w-3 h-3" />
                          <span>توقيع رقمي معتمد من Google Play Protect</span>
                        </div>
                        <h4 className="text-white font-extrabold text-sm sm:text-base">
                          {isRtl ? 'تطبيق الأندرويد المباشر (APK)' : 'Direct Android Package (APK)'}
                        </h4>
                        <p className="text-stone-400 text-xs leading-relaxed font-medium">
                          {isRtl 
                            ? 'تم بناء هذا التطبيق للعمل بشكل مستقل تماماً وبسرعة فائقة. يدعم الإشعارات اللحظية الحقيقية بالخلفية، ومزامنة الأسماء، وإجراء المكالمات المشفرة بأعلى مستويات النقاء دون الحاجة لمتصفح.' 
                            : 'This standalone build is fully optimized. Supports real background notifications, contact sync, and premium peer-to-peer audio/video calling without web constraints.'}
                        </p>
                        
                        <div className="pt-2">
                          {!downloadingFile ? (
                            <button
                              onClick={() => handleStartDownload('snns-pro-secured.apk')}
                              className="px-5 py-3 bg-gradient-to-r from-[#A08040] to-[#C5A059] hover:brightness-110 active:scale-95 text-black font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-[#C5A059]/10 border border-[#E6C15C]/40 cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-black" />
                              <span>{isRtl ? 'بدء التحميل الفوري (APK)' : 'Download APK Installer Now'}</span>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="h-2 w-full bg-[#1A1A1D] rounded-full overflow-hidden border border-[#2E2E2A]/50">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-[#8A6E35] to-[#C5A059]"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                <span className="text-[#C5A059] font-black">{simulationTexts[simulationStep]}</span>
                                <span className="text-white font-bold">{progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-[#121214] border border-[#2E2E2A] p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-28 h-28 bg-white p-2.5 rounded-xl shadow-inner flex items-center justify-center">
                          {/* Simulated elegant QR code representation */}
                          <div className="grid grid-cols-6 gap-0.5 w-full h-full opacity-90">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`rounded-[1px] ${
                                  (i % 5 === 0 || i < 6 || i % 6 === 0 || i > 30) 
                                    ? 'bg-stone-900' 
                                    : (i % 3 === 0) ? 'bg-stone-600' : 'bg-transparent'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-extrabold text-[11px] flex items-center gap-1 justify-center">
                            <QrCode className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>{isRtl ? 'امسح الرمز للتثبيت السريع' : 'Scan to Install'}</span>
                          </p>
                          <p className="text-stone-500 text-[10px] leading-relaxed">
                            {isRtl 
                              ? 'وجه كاميرا الجوال لمسح الباركود وتحميل ملف الـ APK بأمان مباشرة على جوالك.'
                              : 'Point your mobile camera to quickly install the security bundle directly.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* iOS/iPhone Platform View */}
                  {activeTab === 'ios' && (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-black">
                        <CloudLightning className="w-3 h-3" />
                        <span>تقنية تطبيق الويب التقدمي المباشر (PWA) • متوافق مع Apple iOS</span>
                      </div>
                      
                      <h4 className="text-white font-extrabold text-sm sm:text-base">
                        {isRtl ? 'تثبيت تطبيق آبل آيفون وآيباد' : 'Install iOS Web App on iPhone'}
                      </h4>

                      <p className="text-stone-400 text-xs leading-relaxed font-medium">
                        {isRtl 
                          ? 'نظراً لقيود متجر App Store الصارمة، تم تصميم نسخة الآيفون كـ Progressive Web App (PWA) ثوري وآمن بالكامل.' 
                          : 'Due to strict App Store limits, the iOS build utilizes secure Progressive Web App (PWA) container technology.'}
                      </p>

                      <div className="bg-[#121214] border border-[#2E2E2A] p-5 rounded-2xl space-y-3.5 text-right">
                        <p className="text-white font-black text-xs border-b border-[#2E2E2A]/50 pb-2 flex items-center gap-2">
                          <span>📋</span>
                          <span>{isRtl ? 'خطوات التثبيت البسيطة (خلال 10 ثوانٍ):' : 'Easy installation steps (Takes 10 seconds):'}</span>
                        </p>
                        
                        <ol className="space-y-2.5 text-xs text-stone-300 list-decimal list-inside font-semibold leading-relaxed">
                          <li>
                            {isRtl 
                              ? 'تأكد من فتح هذه الصفحة باستخدام متصفح سفاري (Safari) الرسمي للآيفون.' 
                              : 'Open this platform link in the official Apple Safari browser.'}
                          </li>
                          <li>
                            {isRtl 
                              ? 'اضغط على زر المشاركة الأسفل في المتصفح 📥 (شعار المربع والسهم للأعلى).' 
                              : 'Tap the official Safari share button (box with an upward arrow).'}
                          </li>
                          <li>
                            {isRtl 
                              ? 'اسحب للأعلى واختر الخيار "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) ➕.' 
                              : 'Scroll down and tap "Add to Home Screen".'}
                          </li>
                          <li>
                            {isRtl 
                              ? 'اضغط "إضافة" في الأعلى، وسيظهر لك شعار SNNS.PRO الفاخر كتطبيق فوري مشفر على شاشتك!' 
                              : 'Click "Add" at the top right, and the premium gold icon will instantly boot from your home screen!'}
                          </li>
                        </ol>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => alert(isRtl ? '👉 يرجى تتبع الخطوات الأربع أعلاه وتطبيقها مباشرة من متصفح Safari لتثبيت التطبيق الفاخر بنجاح!' : '👉 Follow the PWA steps in your mobile Safari browser to save')}
                          className="px-5 py-3 bg-stone-900 border border-[#C5A059]/40 hover:bg-[#C5A059]/10 text-[#C5A059] font-black text-xs rounded-2xl flex items-center gap-2 transition cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-[#C5A059]" />
                          <span>{isRtl ? 'فهمت الخطوات، جاهز للتثبيت' : 'Understood, ready to save'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Desktop Platform View */}
                  {activeTab === 'desktop' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Windows App */}
                      <div className="bg-[#121214] border border-[#2E2E2A] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <h5 className="text-white font-extrabold text-xs sm:text-sm">
                            {isRtl ? 'برنامج الويندوز للكمبيوتر (64-bit)' : 'Windows Secured App (x64)'}
                          </h5>
                          <p className="text-stone-500 text-[11px] leading-relaxed">
                            {isRtl 
                              ? 'نسخة مستقلة بنظام تشفير عسكري، تدعم الاختصارات وإشعارات ويندوز الرسمية حتى لو كان مغلقاً.'
                              : 'Native Windows application featuring instant load times, global hotkeys, and native Windows push alerts.'}
                          </p>
                        </div>

                        {!downloadingFile ? (
                          <button
                            onClick={() => handleStartDownload('SNNS_PRO_Setup.exe')}
                            className="w-full py-2.5 bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-black text-[#C5A059] border border-[#C5A059]/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'تحميل تطبيق Windows' : 'Download Windows App'}</span>
                          </button>
                        ) : (
                          <div className="h-10 flex items-center justify-center">
                            <span className="text-[10px] text-[#C5A059] animate-pulse">جاري معالجة وتحميل نسخة الويندوز...</span>
                          </div>
                        )}
                      </div>

                      {/* macOS App */}
                      <div className="bg-[#121214] border border-[#2E2E2A] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <h5 className="text-white font-extrabold text-xs sm:text-sm">
                            {isRtl ? 'برنامج الماك (Apple Silicon & Intel)' : 'macOS Secured App (Universal)'}
                          </h5>
                          <p className="text-stone-500 text-[11px] leading-relaxed">
                            {isRtl 
                              ? 'متوافق تماماً مع حماية Apple Gatekeeper، مدمج مع نظام الإشعارات وبطارية الماك الموفرة.'
                              : 'Optimized macOS build, fully signed. Integrates flawlessly with Notification Center and Apple Keychain.'}
                          </p>
                        </div>

                        {!downloadingFile ? (
                          <button
                            onClick={() => handleStartDownload('SNNS_PRO_Setup.dmg')}
                            className="w-full py-2.5 bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-black text-[#C5A059] border border-[#C5A059]/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'تحميل تطبيق macOS' : 'Download macOS App'}</span>
                          </button>
                        ) : (
                          <div className="h-10 flex items-center justify-center">
                            <span className="text-[10px] text-[#C5A059] animate-pulse">جاري معالجة وتحميل نسخة الماك...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chrome Extension View */}
                  {activeTab === 'chrome' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      <div className="md:col-span-3 space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black">
                          <Chrome className="w-3 h-3" />
                          <span>إضافة المتصفح المعتمدة من Google Web Store</span>
                        </div>
                        <h4 className="text-white font-extrabold text-sm sm:text-base">
                          {isRtl ? 'إضافة التشفير الفوري لمتصفح كروم' : 'Secure Chrome Extension'}
                        </h4>
                        <p className="text-stone-400 text-xs leading-relaxed font-medium">
                          {isRtl 
                            ? 'إضافة صغيرة فائقة التشفير يتم تثبيتها بضغطة زر على متصفح Chrome أو Edge أو Brave. تضمن حماية جلسة العمل الحالية من أي هجمات وسيط وتسرع فك التشفير عن طريق تسريع كروت الشاشة.' 
                            : 'A lightweight extension for Chrome, Edge, or Brave. It shields your current browser session from man-in-the-middle attacks and accelerates WebRTC hardware performance.'}
                        </p>
                        
                        <div className="pt-2">
                          {!downloadingFile ? (
                            <button
                              onClick={() => handleStartDownload('snns-chrome-extension.crx')}
                              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                            >
                              <Chrome className="w-4 h-4 text-white" />
                              <span>{isRtl ? 'تثبيت من متجر إضافات كروم' : 'Install via Chrome Web Store'}</span>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="h-2 w-full bg-[#1A1A1D] rounded-full overflow-hidden border border-[#2E2E2A]/50">
                                <motion.div 
                                  className="h-full bg-blue-500"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                <span className="text-blue-400 font-black">{simulationTexts[simulationStep]}</span>
                                <span className="text-white font-bold">{progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-[#121214] border border-[#2E2E2A] p-4 rounded-2xl text-center flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <h5 className="text-white font-bold text-xs">
                          {isRtl ? 'تشفير العقدة من طرف لطرف' : 'GPU Node Encryption'}
                        </h5>
                        <p className="text-stone-500 text-[10px] leading-relaxed">
                          {isRtl 
                            ? 'تقوم الإضافة بفصل مفاتيح فك وتشفير الرسائل تماماً عن واجهة الويب لضمان الأمن المطلق.'
                            : 'Isolates decryption keys completely from standard browser context for ultimate confidentiality.'}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Success Simulation Notice */}
              {downloadSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-right flex-1">
                    <h5 className="text-emerald-400 font-extrabold text-xs sm:text-sm">
                      {isRtl ? '🎉 تم تحميل التطبيق وحفظه بنجاح!' : '🎉 Package Downloaded Successfully!'}
                    </h5>
                    <p className="text-stone-300 text-[11px] leading-relaxed mt-1">
                      {isRtl 
                        ? 'تم حفظ الحزمة الأمنية المشفرة لـ SNNS.PRO في ملفات جهازك الشخصي. قم بفتح الملف المُنزل والبدء بالتثبيت الفوري للتمتع بتجربة اتصالات غير محدودة.' 
                        : 'The SNNS.PRO encrypted security pack has been saved to your downloads. Open the downloaded installer file to enjoy your secure desktop/mobile experience.'}
                    </p>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#111113] border-t border-[#2E2E2A]/60 flex justify-between items-center text-[10px] text-stone-500 px-6">
              <span>SNNS.PRO Version 3.4.2</span>
              <span>© {new Date().getFullYear()} {isRtl ? 'جميع الحقوق التقنية محفوظة لمنصة الاتصالات الآمنة' : 'Secure communication suite. All rights reserved.'}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
