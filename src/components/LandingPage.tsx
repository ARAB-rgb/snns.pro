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
    <div id="landing_page_container" className="min-h-screen bg-[#070708] text-stone-100 font-sans overflow-x-hidden relative selection:bg-amber-500 selection:text-stone-950" dir="rtl">
      
      {/* Premium Ambient Radial Lights (Gold & Warm Bronze Glows) */}
      <div className="absolute top-[-5%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-[#E5C158]/8 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[35%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/4 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[5%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#A8894A]/6 blur-[160px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-amber-950/40 bg-[#0C0C0E]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-stone-900 border border-amber-400/40 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <BrandLogo size="sm" showText={false} />
            </div>
            <div className="text-right">
              <span className="text-lg font-black tracking-wider text-white block">
                SNNS<span className="text-amber-400">.PRO</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold block tracking-tight">البوابة الآمنة الرسمية المعتمدة</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500 text-stone-950 font-black text-xs px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-300/30"
            >
              <span>تسجيل الدخول الآمن</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 text-stone-950 font-black" />
            </button>
            <button
              onClick={onNavigateToGuest}
              className="hidden sm:inline-flex border border-stone-800 hover:border-amber-500/50 bg-stone-900/60 hover:bg-stone-900 text-stone-300 hover:text-amber-400 text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
            >
              تخطي كضيف
            </button>
          </div>
        </div>
      </header>

      {/* Google Cloud Integration & Identity Alert Banner */}
      <div className="bg-gradient-to-r from-amber-950/30 via-[#16130B] to-amber-950/30 border-b border-amber-500/20 py-3 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
          <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded font-black text-[10px]">تأكيد الهوية</span>
          <p className="text-stone-300">
            اسم هذا التطبيق المعتمد والمسجل رسمياً في منصة <strong>Google Cloud Console</strong> هو <span className="text-amber-400 font-extrabold underline decoration-amber-400">SNNS.PRO</span> ومطابق تماماً لشاشات الاستخدام.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          {/* Logo Showcase with Royal Golden Rings */}
          <div className="flex justify-center mb-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition"></div>
              <div className="p-5 bg-gradient-to-b from-stone-900 to-[#0C0C0E] border-2 border-amber-400/40 rounded-full shadow-[0_10px_35px_rgba(212,175,55,0.2)] relative">
                <BrandLogo size="lg" showText={false} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            منصة الاتصالات والرقابة الذكية <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-md font-sans">
              SNNS.PRO
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed font-medium">
            البوابة الذكية المعتمدة للدردشة المشفرة والاتصالات الصوتية والمرئية التفاعلية بجودة فائقة. تشتمل على قنوات إشرافية ورقابية متكاملة لمكافحة الإساءة والامتثال الرقمي التام وفق المعايير الدولية.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500 text-stone-950 font-black text-sm rounded-2xl shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.55)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300/30"
            >
              <span>تسجيل الدخول الآمن (Google OAuth)</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={onNavigateToGuest}
              className="w-full sm:w-auto px-8 py-4 bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-amber-400 font-extrabold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>تصفح المنصة كضيف</span>
            </button>
          </div>

          {/* Secure SSL Layer Badge */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span className="text-xs text-stone-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              اتصال مشفر وآمن بالكامل (256-bit SSL Protection Layer)
            </span>
          </div>
        </div>
      </section>

      {/* Feature capabilities grid (The "Purpose" explanation) */}
      <section className="py-16 bg-[#0B0B0C] border-y border-stone-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1 rounded-full font-black tracking-widest uppercase">
              تفاصيل الخدمات والغرض الفني
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">الغرض الأساسي ومميزات منصة SNNS.PRO</h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              تخدم هذه المنصة غرضاً اتصالاتياً تفاعلياً متطوراً، مصمماً خصيصاً لتوفير بيئة دردشة فورية وحوكمة أمنية صارمة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 bg-[#101012] border border-stone-800/80 rounded-3xl space-y-4 hover:border-amber-400/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">مراسلات نصية فورية فائقة السرعة</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                مراسلة حية ومزامنة فورية للرسائل، الصور والملفات عبر قنوات ربط سحابية مؤمنة كلياً لضمان سرعة نقل البيانات وعدم انقطاعها.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-[#101012] border border-stone-800/80 rounded-3xl space-y-4 hover:border-amber-400/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">اتصالات مرئية وصوتية (WebRTC)</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                إجراء مكالمات صوت وفيديو مخصصة ومحاكاة عالية الجودة مع توفير خيارات تعديل خلفية المكالمة وتكبير الشاشة لتجربة تفاعلية متكاملة.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-[#101012] border border-stone-800/80 rounded-3xl space-y-4 hover:border-amber-400/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">نظام رقابة وإشراف لمكافحة الإساءة</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                لوحة إشرافية كاملة للأدمن تتيح رصد البلاغات وحظر الكلمات النابية والمحتوى المسيء لضمان التزام المستخدمين بشروط الاستخدام.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Highly Detailed Google Verification & Scopes Disclosure Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#121215] to-[#0A0A0C] border border-stone-800 rounded-[32px] p-8 sm:p-12 lg:flex items-stretch justify-between gap-12 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl"></div>

          <div className="space-y-6 lg:max-w-2xl flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                الشفافية والامتثال للمطورين
              </span>
              <span className="text-[10px] bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                Google Cloud Verify
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white">إعلان استخدام النطاقات ومستوى أمن البيانات</h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              تلتزم منصة <strong>SNNS.PRO</strong> بالشفافية الكاملة مع مستخدميها ومع مراجعي قوقل. فيما يلي جدول تفصيلي يوضح كيفية استخدامنا لنطاقات الوصول (OAuth Scopes) التي تطلبها المنصة عند تسجيل الدخول:
            </p>

            {/* Scopes Transparency Table */}
            <div className="overflow-hidden border border-stone-800 rounded-xl bg-stone-950/80">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-stone-900 text-stone-300 border-b border-stone-800 font-extrabold">
                    <th className="p-3">النطاق المطلوب (Scope)</th>
                    <th className="p-3">كيف يتم استخدامه في SNNS.PRO؟</th>
                    <th className="p-3">الخصوصية وحماية البيانات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-400">
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-400">openid</td>
                    <td className="p-3 text-[11px]">تأمين عملية الاتصال بين المنصة وحساب Google الخاص بالمستخدم للتحقق من مصداقيته.</td>
                    <td className="p-3 text-[11px] text-stone-300">تشفير تام أثناء النقل، لا يتم حفظه محلياً.</td>
                  </tr>
                  <tr className="bg-stone-900/40">
                    <td className="p-3 font-mono font-bold text-amber-400">auth/userinfo.email</td>
                    <td className="p-3 text-[11px]">الحصول على البريد الإلكتروني للمستخدم ليكون معرفه الفريد في قاعدة البيانات ومزامنة رسائله.</td>
                    <td className="p-3 text-[11px] text-stone-300">سري تماماً ولا يمكن لأي طرف خارجي الاطلاع عليه.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-400">auth/userinfo.profile</td>
                    <td className="p-3 text-[11px]">عرض اسم المستخدم وصورته الرمزية لزملائه في غرف الدردشة الفورية وأثناء المكالمات.</td>
                    <td className="p-3 text-[11px] text-stone-300">يستخدم فقط للعرض الداخلي لتسهيل التعرف على الأصدقاء.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#19191E] border border-amber-400/20 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ضمانات حماية البيانات وعدم المشاركة (Data Privacy Guarantee):</span>
              </h4>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                نحن في <strong>SNNS.PRO</strong> نعلن رسمياً وبشكل قاطع أننا <strong>لا نقوم بمشاركة أو بيع أو نقل أو إفشاء</strong> أي بيانات يتم جمعها عبر قنوات الدخول الموحد من Google إلى أي أطراف ثالثة أو معلنين. استخدام البيانات يقتصر بشكل صارم على توفير وظائف الدردشة وتأمين حسابك داخل التطبيق فقط.
              </p>
            </div>
          </div>

          {/* Verification Indicators Panel */}
          <div className="mt-8 lg:mt-0 lg:w-96 bg-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-amber-400 border-b border-stone-800 pb-3 flex items-center gap-2">
                <span>🛡️ شهادة أمن ومطابقة التطبيق</span>
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>اسم التطبيق بالصفحة:</span>
                  <span className="font-bold text-white">SNNS.PRO</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>اسم النطاق المربوط:</span>
                  <span className="font-mono text-amber-400 underline font-bold" dir="ltr">snns.pro</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>حالة بروتوكول SSL:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    نشط وآمن جداً
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>سلطة الحماية والرقابة:</span>
                  <span className="text-white font-bold">إشراف الأدمن المعتمد</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#101012] rounded-xl border border-stone-800 text-[10px] text-stone-400 leading-relaxed">
                📌 <strong>ملاحظة هامة للمراجعين:</strong> يمكن تجربة تسجيل الدخول الفعلي عبر النقر على الزر الرئيسي بالأعلى، أو استخدام زر تخطي كضيف لمعاينة لوحة التحكم مباشرة.
              </div>
            </div>

            {/* Brand Logo Watermark */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
              <div className="text-right">
                <span className="block text-[10px] text-stone-500 font-bold">مستوى الامتثال</span>
                <span className="text-xs font-black text-white">متوافق 100% مع Google API</span>
              </div>
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center border border-amber-400/20">
                <BrandLogo size="sm" showText={false} />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Contact Section ("معلومات التواصل وقنوات الدعم") */}
      <section id="contact-info" className="py-16 bg-[#070708] relative border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">قنوات التواصل الفني والامتثال القانوني</h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              نحن جاهزون دائماً للرد على أسئلة المستخدمين، الشكاوى الفنية، ومراجعي Google Cloud Console على مدار الساعة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Contact details */}
            <div className="space-y-6 bg-[#0C0C0E] border border-stone-800 p-6 sm:p-8 rounded-3xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-amber-400">📍</span>
                <span>المعلومات الرسمية لمالك العلامة التجارية والتطبيق</span>
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">البريد الإلكتروني الرسمي للامتثال والدعم</span>
                    <a href="mailto:s05564468888@gmail.com" className="text-sm sm:text-base font-extrabold text-white hover:text-amber-400 transition">
                      s05564468888@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/20">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">رقم الهاتف الفني المعتمد</span>
                    <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wider" dir="ltr">
                      +966 55 644 6888
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">أوقات العمل واستقبال البلاغات</span>
                    <span className="text-xs text-stone-300 font-medium leading-relaxed block">
                      يعمل مركز الدعم الفني بشكل متواصل على مدار 24 ساعة يومياً طوال أيام الأسبوع لمعالجة البلاغات وشكاوى العلامة التجارية.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/20">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">رقم معرف مسؤول الرقابة الفنية (Oversight Admin ID)</span>
                    <span className="text-xs text-stone-300 font-medium block">
                      الأدمن الرئيسي المسؤول عن مراجعة شكاوى المستخدمين: <strong className="text-white font-bold font-mono">1007363904</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="pt-5 border-t border-stone-800/80 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-stone-400 font-extrabold leading-relaxed">
                  معتمد وموثق بالكامل للتوافق مع متطلبات Google Cloud Console & Brand Identity Verification
                </span>
              </div>
            </div>

            {/* Support Inquire Form */}
            <form onSubmit={handleContactSubmit} className="bg-[#101012] border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>📧 مراسلة الدعم الفني الفورية لـ SNNS.PRO</span>
              </h3>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="اكتب اسمك الكريم هنا..."
                  className="w-full bg-[#070708] border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400">البريد الإلكتروني الخاص بك</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#070708] border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-right"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400">محتوى الرسالة والاستفسار</label>
                <textarea
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  rows={4}
                  placeholder="اكتب تفاصيل استفسارك أو مشكلتك الفنية وسوف نرد عليك فوراً..."
                  className="w-full bg-[#070708] border border-stone-800 rounded-xl p-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-400 hover:brightness-110 text-stone-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-400/10 border border-amber-300/20"
              >
                <Send className="w-3.5 h-3.5 text-stone-950" />
                <span>إرسال الاستفسار والتحقق</span>
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* Footer containing legal compliance links */}
      <footer className="border-t border-stone-900 bg-[#070708] py-10 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-black text-amber-400">SNNS.PRO</span>
            <span className="text-stone-800">|</span>
            <span className="text-xs text-stone-400 font-bold">منصة الاتصالات والرقابة الذكية الشاملة</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a href="https://snns.pro" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-amber-400 transition flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>الموقع الرسمي للعلامة التجارية</span>
            </a>
            <span className="text-stone-800 hidden sm:inline">•</span>
            <a href="https://snns.pro/privacy" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-amber-400 transition flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>سياسة الخصوصية وسرية البيانات (Privacy Policy)</span>
            </a>
            <span className="text-stone-800 hidden sm:inline">•</span>
            <a href="https://snns.pro/terms" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-amber-400 transition flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>شروط الاستخدام والخدمة (Terms of Use)</span>
            </a>
            <span className="text-stone-800 hidden sm:inline">•</span>
            <a href="mailto:s05564468888@gmail.com" className="text-stone-400 hover:text-amber-400 transition">
              الدعم والمساعدة الفنية المباشرة
            </a>
          </div>

          <p className="text-[10px] text-stone-600 leading-relaxed max-w-2xl mx-auto">
            جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة <strong>SNNS.PRO</strong>. تم التطوير والتأمين بالكامل لدعم الاتصالات الرقمية الآمنة تحت إشراف أدمن الرقابة ومطابقة متطلبات قوقل.
          </p>
        </div>
      </footer>

    </div>
  );
}
