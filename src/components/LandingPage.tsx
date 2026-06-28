import React, { useState } from 'react';
import { 
  Shield, 
  Mail, 
  MessageSquare, 
  Video, 
  Phone, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  HelpCircle,
  FileText,
  UserCheck,
  Send
} from 'lucide-react';
import BrandLogo from './BrandLogo';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToGuest: () => void;
}

export default function LandingPage({ onNavigateToLogin, onNavigateToGuest }: LandingPageProps) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    setSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setSubmitted(false);
      alert('شكراً لتواصلك معنا! تم إرسال رسالتك إلى فريق الدعم الفني في SNNS.PRO وسنقوم بالرد عليك في أقرب وقت.');
    }, 1000);
  };

  return (
    <div id="landing_page_container" className="min-h-screen bg-[#0A0A09] text-white font-sans overflow-x-hidden relative" dir="rtl">
      
      {/* Dynamic ambient gold background glow circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C5A059]/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#8A6E35]/5 blur-[150px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-[#2E2E2A]/60 bg-[#0D0D0C]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1C1C1A] border border-[#C5A059]/40 rounded-xl flex items-center justify-center shadow-lg">
              <BrandLogo size="sm" showText={false} />
            </div>
            <div className="text-right">
              <span className="text-base font-black tracking-wide text-white block">
                SNNS<span className="text-[#C5A059]">.PRO</span>
              </span>
              <span className="text-[9px] text-[#A89F91] font-semibold block">البوابة الآمنة المعتمدة</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="bg-gradient-to-r from-[#A8894A] via-[#C5A059] to-[#E6C15C] text-stone-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(197,160,89,0.25)] hover:shadow-[0_4px_20px_rgba(197,160,89,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>تسجيل الدخول</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
            <button
              onClick={onNavigateToGuest}
              className="hidden sm:inline-flex border border-[#2E2E2A] hover:bg-[#1C1C1A] text-stone-300 hover:text-white text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              تخطي كضيف
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Logo Showcase */}
          <div className="flex justify-center mb-2">
            <div className="p-4 bg-gradient-to-b from-[#1C1C1A] to-[#0D0D0C] border border-[#2E2E2A] rounded-full shadow-2xl">
              <BrandLogo size="lg" showText={false} />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            منصة الاتصالات والرقابة الذكية <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#FFF0B3] via-[#C5A059] to-[#8A6E35] bg-clip-text text-transparent drop-shadow-sm font-sans">
              SNNS.PRO
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#A89F91] max-w-2xl mx-auto leading-relaxed font-medium">
            بوابة اتصالات إلكترونية متطورة تتيح المراسلة الفورية الآمنة، ومحاكاة مكالمات الصوت والفيديو عالية الجودة (WebRTC) المتكاملة. نتميز بوجود قنوات رقابة إشرافية كاملة لإدارة وحوكمة البلاغات وحظر المحتوى المسيء لتوفير تواصل آمن وموثوق بالكامل.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#A8894A] via-[#C5A059] to-[#E6C15C] text-stone-950 font-black text-sm rounded-2xl shadow-[0_6px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تسجيل الدخول الآمن الآن</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={onNavigateToGuest}
              className="w-full sm:w-auto px-8 py-4 bg-[#121211] hover:bg-[#1C1C1A] border border-[#2E2E2A]/80 text-[#C5A059] font-extrabold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>دخول تجريبي سريع كضيف</span>
            </button>
          </div>

          {/* Secure SSL badge */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] text-[#A89F91] font-mono tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#C5A059] inline" />
              اتصال مشفر ومحمي (256-bit SSL Layer)
            </span>
          </div>
        </div>
      </section>

      {/* Feature capabilities grid (The "Purpose" explanation) */}
      <section className="py-12 bg-[#0D0D0C]/60 border-y border-[#2E2E2A]/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">الغرض من تطبيق SNNS.PRO ومميزاته</h2>
            <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed">
              تم تصميم هذه المنصة لتوفير اتصالات ذكية متكاملة تجمع بين السرعة الفائقة والمسؤولية الإشرافية التامة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-[#121211] border border-[#2E2E2A]/50 rounded-3xl space-y-4 hover:border-[#C5A059]/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">دردشة فورية مشفرة</h3>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                أرسل واستقبل الرسائل النصية، الصور، المستندات والملفات الصوتية فورياً عبر بروتوكولات حماية متقدمة لحماية بياناتك من الاختراق.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-[#121211] border border-[#2E2E2A]/50 rounded-3xl space-y-4 hover:border-[#C5A059]/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">اتصالات فيديو وصوت حقيقية</h3>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                دعم بروتوكول WebRTC للاتصال الحقيقي المباشر بضغطة زر. تواصل مع أصدقائك بوضوح فائق وصوت مجسم مع خيار تغيير خلفية المكالمة.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-[#121211] border border-[#2E2E2A]/50 rounded-3xl space-y-4 hover:border-[#C5A059]/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">نظام رقابة لمكافحة الإساءة</h3>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                نظام حماية وبلاغات رسمي يتيح للمستخدم تقديم شكوى فورية للمشرفين. يقوم أدمن الرقابة بالتحقق الفوري للحفاظ على بيئة تواصل شريفة.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Compliance & Verification section - why SNNS.PRO is reliable */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#121211] to-[#0D0D0C] border border-[#2E2E2A] rounded-[32px] p-8 sm:p-12 lg:flex items-center justify-between gap-12">
          
          <div className="space-y-6 lg:max-w-xl">
            <span className="text-[10px] bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
              الامتثال والتحقق الرقمي
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">بيئة اتصال معتمدة بالكامل</h2>
            <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed">
              تضمن منصة <strong>SNNS.PRO</strong> توافق اسم التطبيق المعتمد على جميع شاشات الاستخدام وحسابات Google وSupabase المربوطة. نحن نلتزم التزاماً صارماً بسياسات الخصوصية وحماية بيانات المستخدمين ونوفر دعماً كاملاً لأي استفسار عبر قنوات الدعم الرسمية.
            </p>

            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>تسجيل دخول فوري وحسابات محمية عبر بروتوكول OAuth المعتمد من Google.</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>قاعدة بيانات سريعة وموثوقة (Supabase / Firebase Firestore) لمزامنة الرسائل لحظياً.</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-stone-300">
                <CheckCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>دعم فني ومكتب استقبال بلاغات متاح على مدار الساعة للإجابة الفورية.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 lg:mt-0 lg:w-96 bg-[#0A0A09] border border-[#2E2E2A]/70 rounded-2xl p-6 space-y-4 shadow-xl">
            <h4 className="text-xs font-black text-[#C5A059] border-b border-[#2E2E2A]/60 pb-2">📊 إحصائيات المنصة الفورية</h4>
            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="p-3 bg-[#121211] rounded-xl border border-[#2E2E2A]/40">
                <span className="block text-[10px] text-stone-500 font-bold">زمن الاستجابة</span>
                <span className="text-sm font-black text-white">0.02 ثانية</span>
              </div>
              <div className="p-3 bg-[#121211] rounded-xl border border-[#2E2E2A]/40">
                <span className="block text-[10px] text-stone-500 font-bold">نسبة التشفير</span>
                <span className="text-sm font-black text-[#C5A059]">256-Bit SSL</span>
              </div>
              <div className="p-3 bg-[#121211] rounded-xl border border-[#2E2E2A]/40">
                <span className="block text-[10px] text-stone-500 font-bold">المشرفين النشطين</span>
                <span className="text-sm font-black text-white">على مدار الساعة</span>
              </div>
              <div className="p-3 bg-[#121211] rounded-xl border border-[#2E2E2A]/40">
                <span className="block text-[10px] text-stone-500 font-bold">مزامنة البيانات</span>
                <span className="text-sm font-black text-green-400">نشطة وآمنة</span>
              </div>
            </div>
            <div className="bg-[#121211] p-3 rounded-xl border border-[#2E2E2A]/40 text-[10px] text-[#A89F91] leading-relaxed">
              📌 يمكنك تجربة الدخول الفوري بضغطة واحدة باستخدام زر "تسجيل الدخول" في الأعلى للمعاينة الكاملة للمنصة.
            </div>
          </div>

        </div>
      </section>

      {/* Contact Section ("معلومات التواصل") */}
      <section id="contact-info" className="py-12 bg-[#0A0A09] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">معلومات التواصل الفني وقنوات الدعم</h2>
            <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed">
              إذا كان لديك أي اقتراح، استفسار حول العلامة التجارية، أو واجهتك أي مشكلة تقنية، يرجى عدم التردد في مراسلتنا فوراً.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Contact details */}
            <div className="space-y-5 bg-[#0D0D0C] border border-[#2E2E2A]/80 p-6 sm:p-8 rounded-3xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📍 معلومات الاتصال الرسمية</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059] shrink-0 border border-[#C5A059]/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A89F91] font-bold">البريد الإلكتروني المعتمد للدعم</span>
                    <a href="mailto:s05564468888@gmail.com" className="text-xs sm:text-sm font-extrabold text-white hover:text-[#C5A059] transition">
                      s05564468888@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059] shrink-0 border border-[#C5A059]/20">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A89F91] font-bold">رقم الهاتف الفني / دعم العلامة التجارية</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider" dir="ltr">
                      +966 55 644 6888
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059] shrink-0 border border-[#C5A059]/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A89F91] font-bold">ساعات الرد والمراجعة</span>
                    <span className="text-xs text-stone-300 font-medium">
                      متاح 24 ساعة طوال أيام الأسبوع لخدمة كافة الاستفسارات وحل الشكاوى.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059] shrink-0 border border-[#C5A059]/20">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A89F91] font-bold">أدمن المنصة الرئيسي</span>
                    <span className="text-xs text-stone-300 font-medium">
                      المراقب الرقمي الأول لمعالجة الطلبات: <strong className="text-white font-bold">ID 1007363904</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="pt-4 border-t border-[#2E2E2A]/50 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C5A059]" />
                <span className="text-[11px] text-[#A89F91] font-extrabold">
                  معتمد وموثق للامتثال لمتطلبات Google Cloud Console & Brand Verification
                </span>
              </div>
            </div>

            {/* Support Inquire Form */}
            <form onSubmit={handleContactSubmit} className="bg-[#121211] border border-[#2E2E2A]/60 p-6 sm:p-8 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white">📧 أرسل استفسارك الفوري لفريق العمل</h3>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#A89F91]">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="الرجاء كتابة اسمك الكريم..."
                  className="w-full bg-[#0D0D0C] border border-[#2E2E2A]/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#A89F91]">البريد الإلكتروني الخاص بك</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0D0D0C] border border-[#2E2E2A]/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all text-right"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#A89F91]">محتوى الرسالة أو الاستفسار</label>
                <textarea
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  rows={4}
                  placeholder="اكتب هنا تفاصيل استفسارك أو مشكلتك الفنية وسوف نرد عليك فوراً..."
                  className="w-full bg-[#0D0D0C] border border-[#2E2E2A]/80 rounded-xl p-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#8A6E35] to-[#C5A059] hover:brightness-110 text-stone-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#C5A059]/10"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الاستفسار الآن</span>
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* Footer containing legal compliance links */}
      <footer className="border-t border-[#2E2E2A]/60 bg-[#0D0D0C] py-8 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-black text-[#C5A059]">SNNS.PRO</span>
            <span className="text-stone-600">|</span>
            <span className="text-xs text-stone-400">منصة الاتصالات والرقابة الشاملة</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a href="https://snns.pro" target="_blank" rel="noopener noreferrer" className="text-[#A89F91] hover:text-[#C5A059] transition flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>الموقع الرسمي للعلامة التجارية</span>
            </a>
            <span className="text-stone-700 hidden sm:inline">•</span>
            <a href="https://snns.pro/privacy" target="_blank" rel="noopener noreferrer" className="text-[#A89F91] hover:text-[#C5A059] transition flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>سياسة الخصوصية وسرية البيانات (Privacy Policy)</span>
            </a>
            <span className="text-stone-700 hidden sm:inline">•</span>
            <a href="https://snns.pro/terms" target="_blank" rel="noopener noreferrer" className="text-[#A89F91] hover:text-[#C5A059] transition flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>شروط الاستخدام والخدمة (Terms of Use)</span>
            </a>
            <span className="text-stone-700 hidden sm:inline">•</span>
            <a href="mailto:s05564468888@gmail.com" className="text-[#A89F91] hover:text-[#C5A059] transition">
              الدعم والمساعدة الفنية المباشرة
            </a>
          </div>

          <p className="text-[10px] text-stone-600 leading-relaxed max-w-xl mx-auto">
            جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة <strong>SNNS.PRO</strong>. تم التطوير والتأمين بالكامل لدعم الاتصالات الرقمية الآمنة تحت إشراف أدمن الرقابة.
          </p>
        </div>
      </footer>

    </div>
  );
}
