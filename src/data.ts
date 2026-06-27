import { Contact, Message, CallRecord } from './types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'أحمد الراشد',
    avatar: '👨‍💻',
    status: 'online',
    role: 'صديق مقرب يحب التقنية والسفر وعفوي بالحديث',
    bio: 'العمر قصير، عش حياتك بسلام وبساطة 🕊️',
    isGroup: false
  },
  {
    id: '2',
    name: 'سارة الأحمد',
    avatar: '👩‍🎨',
    status: 'online',
    role: 'أختي الكبرى، تهتم بالعائلة والطبخ والأنشطة الاجتماعية وتحب الاطمئنان دائماً',
    bio: 'العائلة هي الملاذ الآمن والأول دائماً 🌸',
    isGroup: false
  },
  {
    id: '3',
    name: 'المهندس خالد',
    avatar: '👨‍💼',
    status: 'away',
    role: 'مدير العمل، جاد وعملي ويتكلم بالفصحى المبسطة أو بلهجة مهنية جادة، يركز على الإنتاجية والمشاريع',
    bio: 'متاح للمكالمات العاجلة فقط 💼 | العمل عبادة',
    isGroup: false
  },
  {
    id: '4',
    name: 'د. مريم حسن',
    avatar: '👩‍⚕️',
    status: 'online',
    role: 'طبيبة العائلة، ناصحة ولطيفة وتهتم بالصحة والتغذية، لغتها هادئة ومطمئنة',
    bio: 'الصحة تاج على رؤوس الأصحاء 🩺✨',
    isGroup: false
  },
  {
    id: 'group_family',
    name: 'العائلة الدافئة 🏡',
    avatar: '❤️',
    status: 'online',
    role: 'مجموعة تجمع أفراد العائلة، الأجواء فيها مرحة ودافئة ومتعاونة ويسألون عن بعضهم',
    bio: 'جروب العائلة الرسمي لمشاركة الأخبار والفعاليات والضحك',
    isGroup: true,
    members: ['1', '2', '4']
  },
  {
    id: 'group_work',
    name: 'فريق عمل المشاريع 🚀',
    avatar: '💻',
    status: 'away',
    role: 'مجموعة العمل الرسمية، النقاشات فيها تدور حول البرمجة والتصميم والتسليمات والمهام',
    bio: 'لجنة تطوير الأنظمة والبرمجيات الذكية ⚙️',
    isGroup: true,
    members: ['1', '3']
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: '1',
    senderName: 'أحمد الراشد',
    text: 'يا صاحبي، هل رأيت تحديث تيمز الجديد؟ أضافوا فلاتر ذكاء اصطناعي رهيبة لمكالمات الفيديو!',
    timestamp: '10:15 ص',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm2',
    senderId: 'me',
    senderName: 'أنا',
    text: 'نعم! جربتها البارحة، الجودة ممتازة والتقاط الصوت أصبح أنقى بكثير.',
    timestamp: '10:18 ص',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm3',
    senderId: '1',
    senderName: 'أحمد الراشد',
    text: 'رائع جداً! دعنا نجرب مكالمة فيديو بعد قليل عبر هذا التطبيق لنرى أداء الكاميرا والصوت 📞💻',
    timestamp: '10:20 ص',
    type: 'text',
    status: 'read'
  },
  
  // Sarah
  {
    id: 'm4',
    senderId: '2',
    senderName: 'سارة الأحمد',
    text: 'أهلاً يا بطل! لا تنسى الغداء اليوم معنا بالبيت، الوالدة صنعت المقلوبة المفضلة لديك 🥘😍',
    timestamp: '09:00 ص',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm5',
    senderId: 'me',
    senderName: 'أنا',
    text: 'يا سلام! قادم بكل تأكيد، سأنهي بعض العمل وآتي مباشرة.',
    timestamp: '09:05 ص',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm6',
    senderId: '2',
    senderName: 'سارة الأحمد',
    text: 'بانتظارك! أرسلت لك صورة لطبق الحلى الذي صنعته البارحة، أخبرني برأيك عندما تأتي.',
    timestamp: '09:06 ص',
    type: 'text',
    status: 'read'
  },

  // Khaled (Manager)
  {
    id: 'm7',
    senderId: '3',
    senderName: 'المهندس خالد',
    text: 'السلام عليكم. يرجى مراجعة لوحة التحكم للتطبيق والتأكد من توافق الاتصال في وضع ملء الشاشة على الهواتف الذكية.',
    timestamp: 'أمس',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm8',
    senderId: 'me',
    senderName: 'أنا',
    text: 'وعليكم السلام مهندس خالد. قمت بمراجعتها والوضع متجاوب بالكامل وتعمل الكاميرا بشكل ممتاز الآن.',
    timestamp: 'أمس',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm9',
    senderId: '3',
    senderName: 'المهندس خالد',
    text: 'ممتاز، جهود مباركة. سنعقد اجتماع فيديو اليوم لمناقشة تسليم المرحلة النهائية عند الساعة 2 ظهراً.',
    timestamp: 'أمس',
    type: 'text',
    status: 'read'
  },

  // Dr. Maryam
  {
    id: 'm10',
    senderId: '4',
    senderName: 'د. مريم حسن',
    text: 'مرحباً بك. تذكر شرب كميات كافية من الماء أثناء جلوسك الطويل أمام الشاشة للعمل 💧🩺',
    timestamp: '08:30 ص',
    type: 'text',
    status: 'read'
  },
  {
    id: 'm11',
    senderId: 'me',
    senderName: 'أنا',
    text: 'شكراً جزيلاً دكتورة مريم على النصيحة الغالية، أحرص على ذلك دائماً.',
    timestamp: '08:45 ص',
    type: 'text',
    status: 'read'
  }
];

export const INITIAL_CALL_RECORDS: CallRecord[] = [
  {
    id: 'c1',
    contactId: '1',
    type: 'video',
    direction: 'outgoing',
    timestamp: 'اليوم، 10:30 ص',
    duration: '04:12'
  },
  {
    id: 'c2',
    contactId: '2',
    type: 'audio',
    direction: 'incoming',
    timestamp: 'اليوم، 09:12 ص',
    duration: '02:45'
  },
  {
    id: 'c3',
    contactId: '3',
    type: 'video',
    direction: 'missed',
    timestamp: 'أمس، 02:00 م'
  }
];
