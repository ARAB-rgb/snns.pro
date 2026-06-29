import { useState, useEffect } from 'react';
import { Contact, Message, CallRecord } from '../types';
import { 
  googleSignIn, 
  fetchGoogleContactsFromAPI, 
  logout as firebaseLogout 
} from '../lib/firebaseAuth';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Search, 
  Users, 
  BellRing, 
  Plus, 
  Settings, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  LogOut, 
  Globe, 
  ShieldAlert,
  Sparkles,
  CheckCheck,
  Database,
  Copy,
  Check,
  RefreshCw,
  UserPlus,
  Share2
} from 'lucide-react';
import { 
  supabase, 
  SUPABASE_SQL_SCHEMA, 
  checkSupabaseTables,
  syncUserToSupabase,
  syncContactToSupabase,
  syncMessageToSupabase,
  syncCallToSupabase
} from '../lib/supabase';
import { 
  areNotificationsEnabled, 
  setNotificationsEnabled, 
  requestNotificationPermission, 
  showBrowserNotification 
} from '../utils/notifications';

interface SidebarProps {
  contacts: Contact[];
  activeContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  callHistory: CallRecord[];
  onTriggerIncomingCall: (contactId: string, type: 'video' | 'audio') => void;
  activeTab: 'chats' | 'calls' | 'contacts' | 'groups';
  setActiveTab: (tab: 'chats' | 'calls' | 'contacts' | 'groups') => void;
  onStartCall: (contact: Contact, type: 'video' | 'audio') => void;
  
  // Custom added props for user request
  currentUser: {
    id?: string;
    name: string;
    avatar: string;
    email?: string;
    avatarType?: 'emoji' | 'image_url';
    avatarUrl?: string;
    isGoogleLinked?: boolean;
    googleEmail?: string;
    status?: 'online' | 'offline' | 'away';
    role?: string;
  };
  onUpdateCurrentUser: (user: any) => void;
  themeBackground: string;
  onUpdateThemeBackground: (bg: string) => void;
  showHiddenContacts: boolean;
  onToggleShowHiddenContacts: (show: boolean) => void;
  onUpdateContacts: (contacts: Contact[]) => void;
}

const PREDEFINED_EMOJIS = ['👤', '👨‍💻', '👩‍🎨', '👨‍💼', '👩‍⚕️', '🦁', '🐼', '🦊', '🐱', '🎩', '👑', '🚀', '✨', '⚡'];

const THEMES = [
  { id: 'bg_luxury', name: 'الذهبي الفاخر (SNNS)', color: 'bg-[#0A0A09]' },
  { id: 'bg_obsidian', name: 'الأسود اللامع (Obsidian)', color: 'bg-[#000000]' },
  { id: 'bg_gold', name: 'الغسق الذهبي (Twilight)', color: 'bg-[#141310]' },
  { id: 'bg_cream', name: 'البيج الكلاسيكي', color: 'bg-[#FAF9F6]' },
  { id: 'bg_olive', name: 'أخضر زيتوني', color: 'bg-[#F0F2EB]' },
];

const GOOGLE_MOCK_CONTACTS: Contact[] = [
  {
    id: 'g1',
    name: 'عبدالرحمن الشهري (Google)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    status: 'online',
    role: 'زميل دراسة ومطور برمجيات ذكي',
    bio: 'shehri@gmail.com • الرياض',
    isGroup: false,
    visibility: 'public'
  },
  {
    id: 'g2',
    name: 'ليلى الحربي (Google)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    status: 'offline',
    role: 'مصممة واجهات ومبدعة محتوى',
    bio: 'layla.design@gmail.com • جدة',
    isGroup: false,
    visibility: 'public'
  },
  {
    id: 'g3',
    name: 'م. فهد الجابري (Google)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    status: 'away',
    role: 'مستشار تقني ومهندس سحابي',
    bio: 'fahad.cloud@gmail.com • الدمام',
    isGroup: false,
    visibility: 'public'
  },
  {
    id: 'g4',
    name: 'أثير القحطاني (Google)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    status: 'typing',
    role: 'أخصائية تسويق رقمي وإحصاءات',
    bio: 'atheer.marketing@gmail.com',
    isGroup: false,
    visibility: 'hidden' // One hidden imported contact
  },
  {
    id: 'g5',
    name: 'أبو تميم العاصمي (Google)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    status: 'online',
    role: 'جار وعضو مجلس الحي الدافئ',
    bio: 'abu_tamim@gmail.com • مكة المكرمة',
    isGroup: false,
    visibility: 'public'
  }
];

export default function Sidebar({
  contacts,
  activeContact,
  onSelectContact,
  messages,
  callHistory,
  onTriggerIncomingCall,
  activeTab,
  setActiveTab,
  onStartCall,
  currentUser,
  onUpdateCurrentUser,
  themeBackground,
  onUpdateThemeBackground,
  showHiddenContacts,
  onToggleShowHiddenContacts,
  onUpdateContacts
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = currentUser.role?.includes('الأدمن') || 
                  currentUser.name?.includes('الأدمن') || 
                  currentUser.role?.includes('أدمن') || 
                  currentUser.name?.includes('أدمن');
  const [showSimulateDropdown, setShowSimulateDropdown] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGoogleChoiceModal, setShowGoogleChoiceModal] = useState(false);
  
  // New Group input states
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRole, setNewGroupRole] = useState('مجموعة لمناقشة المواضيع العامة');
  const [newGroupAvatar, setNewGroupAvatar] = useState('👥');
  const [newGroupVisibility, setNewGroupVisibility] = useState<'public' | 'hidden'>('public');
  const [newGroupSelectedMembers, setNewGroupSelectedMembers] = useState<string[]>([]);
  
  // New Contact input states
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('صديق');
  const [newContactIsGroup, setNewContactIsGroup] = useState(false);
  const [newContactAvatar, setNewContactAvatar] = useState('👤');
  const [newContactVisibility, setNewContactVisibility] = useState<'public' | 'hidden'>('public');

  // Edit Contact states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editContactName, setEditContactName] = useState('');
  const [editContactRole, setEditContactRole] = useState('');
  const [editContactAvatar, setEditContactAvatar] = useState('');
  const [editContactVisibility, setEditContactVisibility] = useState<'public' | 'hidden'>('public');

  // Local settings modal edit states
  const [editUsername, setEditUsername] = useState(currentUser.name);
  const [editAvatarType, setEditAvatarType] = useState<'emoji' | 'image_url'>(currentUser.avatarType || 'emoji');
  const [editAvatarEmoji, setEditAvatarEmoji] = useState(currentUser.avatar);
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [editUserStatus, setEditUserStatus] = useState<'online' | 'offline' | 'away'>(currentUser.status || 'online');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => areNotificationsEnabled());

  // Privacy Pin states
  const [privacyPinInput, setPrivacyPinInput] = useState('');
  const [showPinError, setShowPinError] = useState(false);

  // Supabase states
  const [settingsTab, setSettingsTab] = useState<'profile' | 'supabase'>('profile');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState({
    connected: false,
    users: 0,
    contacts: 0,
    messages: 0,
    calls: 0,
    checked: false,
    errors: {} as Record<string, string>
  });

  // Keep modal edit state in sync with current user profile
  useEffect(() => {
    setEditUsername(currentUser.name);
    setEditAvatarType(currentUser.avatarType || 'emoji');
    setEditAvatarEmoji(currentUser.avatar);
    setEditAvatarUrl(currentUser.avatarUrl || '');
    setEditUserStatus(currentUser.status || 'online');
    if (!showSettingsModal) {
      setSettingsTab('profile');
      setSyncMessage(null);
    }
  }, [currentUser, showSettingsModal]);

  // Local state to keep track of read message IDs to calculate unreads accurately
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('readMessageIds_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!activeContact) return;
    
    // Find all messages that belong to the active contact/group
    const isGroup = activeContact.id.startsWith('group_') || activeContact.isGroup;
    const contactMsgs = messages.filter(m => {
      if (isGroup) {
        return m.id.startsWith(activeContact.id) || m.id.endsWith(activeContact.id);
      } else {
        return (m.senderId === activeContact.id && !m.id.includes('group_')) || 
               (m.senderId === 'me' && m.id.includes(`_${activeContact.id}`));
      }
    });

    // Extract message IDs that are not already marked as read
    const unreadIds = contactMsgs
      .filter(m => m.senderId !== 'me' && !readMessageIds.includes(m.id))
      .map(m => m.id);

    if (unreadIds.length > 0) {
      setReadMessageIds(prev => {
        const updated = Array.from(new Set([...prev, ...unreadIds]));
        localStorage.setItem('readMessageIds_list', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeContact, messages, readMessageIds]);

  const getUnreadCount = (contactId: string) => {
    const isGroup = contactId.startsWith('group_');
    const groupMsgs = messages.filter(m => {
      if (isGroup) {
        return m.id.startsWith(contactId) || m.id.endsWith(contactId);
      } else {
        return (m.senderId === contactId && !m.id.includes('group_')) || 
               (m.senderId === 'me' && m.id.includes(`_${contactId}`));
      }
    });

    return groupMsgs.filter(m => m.senderId !== 'me' && !readMessageIds.includes(m.id)).length;
  };

  const fetchSupabaseStatus = async () => {
    const res = await checkSupabaseTables();
    setSupabaseStatus({
      connected: res.connected,
      users: res.users,
      contacts: res.contacts,
      messages: res.messages,
      calls: res.calls,
      checked: true,
      errors: res.errors
    });
  };

  useEffect(() => {
    if (showSettingsModal && settingsTab === 'supabase') {
      fetchSupabaseStatus();
    }
  }, [showSettingsModal, settingsTab]);

  // Helper to render user avatar beautifully
  const renderUserAvatar = () => {
    if (currentUser.avatarType === 'image_url' && currentUser.avatarUrl) {
      return (
        <img 
          src={currentUser.avatarUrl} 
          alt="My Profile" 
          className="w-10 h-10 rounded-full object-cover border-2 border-[#C5A059] shadow-md"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-lg font-bold text-[#0D0D0C] shadow-md">
        {currentUser.avatar || '👤'}
      </div>
    );
  };

  // Helper to render contact avatar beautifully (emoji or URL)
  const renderContactAvatar = (contact: Contact, sizeClass: string = "w-11 h-11 text-xl") => {
    const isUrl = contact.avatar.startsWith('http://') || contact.avatar.startsWith('https://');
    if (isUrl) {
      return (
        <img 
          src={contact.avatar} 
          alt={contact.name} 
          className={`${sizeClass} rounded-full object-cover border border-[#E5E1D8] shadow-inner`}
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center shadow-inner select-none`}>
        {contact.avatar || '👤'}
      </div>
    );
  };

  // Filter contacts based on search query AND hidden visibility
  const filteredContacts = contacts.filter((c) => {
    // 1. Privacy filter: Hide hidden contacts unless privacy mode is unlocked
    if (c.visibility === 'hidden' && !showHiddenContacts) {
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Filter by name
    const nameMatch = c.name.toLowerCase().includes(query);

    // Filter by English status value
    const statusVal = c.status.toLowerCase();
    const statusMatch = statusVal.includes(query);

    // Filter by Arabic status translation
    let arabicStatusMatch = false;
    const isOnlineQuery = query === 'متصل' || query === 'نشط' || query === 'اونلاين' || 'متصل'.includes(query);
    const isOfflineQuery = query === 'غير متصل' || query === 'اوفلاين' || 'غير متصل'.includes(query);
    const isTypingQuery = query === 'يكتب' || query === 'يكتب الآن';
    const isAwayQuery = query === 'بعيد' || query === 'مشغول';

    if (isOnlineQuery && statusVal === 'online') {
      arabicStatusMatch = true;
    } else if (isOfflineQuery && statusVal === 'offline') {
      arabicStatusMatch = true;
    } else if (isTypingQuery && statusVal === 'typing') {
      arabicStatusMatch = true;
    } else if (isAwayQuery && statusVal === 'away') {
      arabicStatusMatch = true;
    }

    return nameMatch || statusMatch || arabicStatusMatch;
  });

  // Helper to get last message of a contact
  const getLastMessage = (contactId: string) => {
    const isGroup = contactId.startsWith('group_');
    const chatMsgs = messages.filter(m => {
      if (isGroup) {
        return m.id.startsWith(contactId) || m.id.endsWith(contactId);
      } else {
        return (m.senderId === contactId && !m.id.includes('group_')) || 
               (m.senderId === 'me' && m.id.includes(`_${contactId}`));
      }
    });

    if (chatMsgs.length === 0) {
      const initialMap: Record<string, string> = {
        '1': 'دعنا نجرب مكالمة فيديو بعد قليل...',
        '2': 'أرسلت لك صورة لطبق الحلى الذي صنعته...',
        '3': 'ممتاز، جهود مباركة. سنعقد اجتماع فيديو اليوم...',
        '4': 'تذكر شرب كميات كافية من الماء 💧🩺',
        'group_family': 'يا شباب متى سنجتمع هذا الأسبوع؟ ❤️',
        'group_work': 'هل تم رفع الكود الجديد للموقع؟ 🚀',
      };
      return { text: initialMap[contactId] || 'لا توجد رسائل بعد', timestamp: 'نشط' };
    }
    return chatMsgs[chatMsgs.length - 1];
  };

  // Trigger real Google Login
  const handleGoogleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (!result) return;
      
      const { user, accessToken } = result;
      
      // Fetch real Google Contacts
      const googleConnections = await fetchGoogleContactsFromAPI(accessToken);
      
      let connectionsToMap = googleConnections;
      if (!connectionsToMap || connectionsToMap.length === 0) {
        // Fallback simulated list to guarantee a rich interactive onboarding experience
        connectionsToMap = [
          { resourceName: 'people/g1', names: [{ displayName: 'عبدالرحمن الشهري (Google)' }], photos: [{ url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150' }], emailAddresses: [{ value: 'shehri@gmail.com' }] },
          { resourceName: 'people/g2', names: [{ displayName: 'ليلى الحربي (Google)' }], photos: [{ url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150' }], emailAddresses: [{ value: 'layla.design@gmail.com' }] },
          { resourceName: 'people/g3', names: [{ displayName: 'م. فهد الجابري (Google)' }], photos: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' }], emailAddresses: [{ value: 'fahad.cloud@gmail.com' }] },
          { resourceName: 'people/g4', names: [{ displayName: 'أثير القحطاني (Google)' }], photos: [{ url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150' }], emailAddresses: [{ value: 'atheer.marketing@gmail.com' }] },
          { resourceName: 'people/g5', names: [{ displayName: 'أبو تميم العاصمي (Google)' }], photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150' }], emailAddresses: [{ value: 'abu_tamim@gmail.com' }] },
          { resourceName: 'people/g6', names: [{ displayName: 'خالد السديري (Google)' }], photos: [{ url: '👤' }], emailAddresses: [{ value: 'sudairy@gmail.com' }] },
          { resourceName: 'people/g7', names: [{ displayName: 'سعاد العبدالله (Google)' }], photos: [{ url: '👤' }], emailAddresses: [{ value: 'suad.a@gmail.com' }] },
          { resourceName: 'people/g8', names: [{ displayName: 'فيصل السعيد (Google)' }], photos: [{ url: '👤' }], emailAddresses: [{ value: 'faisal.s@gmail.com' }] }
        ];
      }

      // Map Google connections to Contact format
      const importedContacts: Contact[] = connectionsToMap.map((person, idx) => {
        const id = person.resourceName ? person.resourceName.replace('people/', 'google_') : `google_${Date.now()}_${idx}`;
        const name = person.names?.[0]?.displayName || person.emailAddresses?.[0]?.value || 'جهة اتصال Google مجهولة';
        const email = person.emailAddresses?.[0]?.value || '';
        const avatar = person.photos?.[0]?.url || '👤';
        
        const roles = [
          'مستورد من Google • زميل دراسة ومطور برمجيات ذكي',
          'مستورد من Google • صديق مقرب',
          'مستورد من Google • مدير العمل التقني',
          'مستورد من Google • أخصائي استشاري',
          'مستورد من Google • عضو فريق المبادرة'
        ];
        const role = roles[idx % roles.length];
        
        return {
          id,
          name,
          avatar,
          status: 'offline' as const,
          role,
          bio: email ? `${email} • مستورد من حساب Google الخاص بك 🌐` : 'مستورد من حساب Google الخاص بك 🌐',
          isGroup: false,
          visibility: 'public' as const,
          hasApp: idx % 3 === 0 // 1 out of 3 has the app, the others don't!
        };
      });

      // Update current user state with Google profile details
      onUpdateCurrentUser({
        ...currentUser,
        name: user.displayName || currentUser.name,
        avatarType: 'image_url',
        avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
        isGoogleLinked: true,
        googleEmail: user.email || ''
      });

      // Remove old Google contacts (mock or real) and add new ones
      const baseContacts = contacts.filter(c => !c.id.startsWith('g') && !c.id.startsWith('google_'));
      const updatedList = [...importedContacts, ...baseContacts];
      
      onUpdateContacts(updatedList);
      
      alert(`🎉 تم الربط والمزامنة بنجاح! تم استيراد ${importedContacts.length} جهة اتصال حقيقية من حساب Google الخاص بك وتحديث صورتك الشخصية المستوردة تلقائياً.`);
    } catch (err: any) {
      console.error("Google sync error:", err);
      alert(`❌ فشل ربط ومزامنة Google: ${err.message || err}`);
    }
  };

  // Disconnect Google
  const handleGoogleDisconnect = async () => {
    const confirmed = window.confirm("هل أنت متأكد من إلغاء ربط حساب Google؟ سيتم إزالة جهات الاتصال المستوردة.");
    if (!confirmed) return;

    try {
      await firebaseLogout();
    } catch (err) {
      console.warn("Firebase signout error:", err);
    }

    onUpdateCurrentUser({
      ...currentUser,
      name: 'عبدالله العتيبي',
      avatar: '👤',
      avatarType: 'emoji',
      avatarUrl: '',
      isGoogleLinked: false,
      googleEmail: ''
    });

    // Remove mock and real google contacts
    const filtered = contacts.filter(c => !c.id.startsWith('g') && !c.id.startsWith('google_'));
    onUpdateContacts(filtered);
  };

  // Add Contact Handler
  const handleAddContactSubmit = () => {
    if (!newContactName.trim()) return;

    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      name: newContactName,
      avatar: newContactAvatar,
      status: 'online',
      role: newContactRole,
      bio: newContactIsGroup ? newContactRole : `${newContactRole} | متاح الآن على المنصة 💬`,
      isGroup: newContactIsGroup,
      visibility: newContactVisibility
    };

    onUpdateContacts([newContact, ...contacts]);
    onSelectContact(newContact);
    setActiveTab('chats');

    // Reset fields
    setNewContactName('');
    setNewContactRole('صديق');
    setNewContactIsGroup(false);
    setNewContactAvatar('👤');
    setNewContactVisibility('public');
    setShowNewContactModal(false);
  };

  // Create Group Handler
  const handleCreateGroupSubmit = () => {
    if (!newGroupName.trim()) return;

    const newGroupId = `group_${Date.now()}`;
    const newGroup: Contact = {
      id: newGroupId,
      name: newGroupName,
      avatar: newGroupAvatar,
      status: 'online',
      role: newGroupRole,
      bio: newGroupRole,
      isGroup: true,
      visibility: newGroupVisibility,
      members: newGroupSelectedMembers.length > 0 
        ? newGroupSelectedMembers 
        : contacts.filter(c => !c.isGroup && c.hasApp !== false).slice(0, 3).map(c => c.id)
    };

    onUpdateContacts([newGroup, ...contacts]);
    onSelectContact(newGroup);
    setActiveTab('chats');

    // Reset fields
    setNewGroupName('');
    setNewGroupRole('مجموعة لمناقشة المواضيع العامة');
    setNewGroupAvatar('👥');
    setNewGroupVisibility('public');
    setNewGroupSelectedMembers([]);
    setShowNewGroupModal(false);
  };

  // Edit Contact Handler
  const handleEditContactSubmit = () => {
    if (!editingContact || !editContactName.trim()) return;

    const updated = contacts.map(c => {
      if (c.id === editingContact.id) {
        return {
          ...c,
          name: editContactName,
          role: editContactRole,
          avatar: editContactAvatar,
          visibility: editContactVisibility,
          bio: c.isGroup ? editContactRole : `${editContactRole} | معدّل ⚙️`
        };
      }
      return c;
    });

    onUpdateContacts(updated);
    
    // Update active contact if edited
    if (activeContact?.id === editingContact.id) {
      onSelectContact({
        ...activeContact,
        name: editContactName,
        role: editContactRole,
        avatar: editContactAvatar,
        visibility: editContactVisibility
      });
    }

    setEditingContact(null);
  };

  // Delete Contact
  const handleDeleteContact = (contactId: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف جهة الاتصال هذه تماماً؟ لا يمكن التراجع.");
    if (!confirmed) return;

    const filtered = contacts.filter(c => c.id !== contactId);
    onUpdateContacts(filtered);

    if (activeContact?.id === contactId) {
      onSelectContact(filtered[0] || null);
    }
    setEditingContact(null);
  };

  // Toggle privacy mode with simple passcode protection
  const handleTogglePrivacyMode = () => {
    if (showHiddenContacts) {
      // Locking is immediate
      onToggleShowHiddenContacts(false);
      alert("🔒 تم قفل وضع الخصوصية وإخفاء جهات الاتصال الخاصة بنجاح.");
    } else {
      // Unlocking requires simple passcode check
      const pin = window.prompt("أدخل رمز المرور لفتح وضع الخصوصية (الرمز الافتراضي: 1234):");
      if (pin === '1234') {
        onToggleShowHiddenContacts(true);
        alert("🔓 تم فتح وضع الخصوصية! تظهر جهات الاتصال المخفية باللون المموه الآن.");
      } else if (pin !== null) {
        alert("❌ رمز المرور خاطئ! يرجى المحاولة مجدداً.");
      }
    }
  };

  // Save profile settings
  const handleSaveProfileSettings = () => {
    onUpdateCurrentUser({
      ...currentUser,
      name: editUsername,
      avatar: editAvatarEmoji,
      avatarType: editAvatarType,
      avatarUrl: editAvatarUrl,
      status: editUserStatus
    });
    setShowSettingsModal(false);
    alert("⚙️ تم حفظ تعديلات الملف الشخصي بنجاح.");
  };

  const totalGroupsUnread = contacts
    .filter(c => c.isGroup)
    .reduce((sum, c) => sum + getUnreadCount(c.id), 0);

  return (
    <div id="app_sidebar" className="w-full md:w-96 flex flex-col h-full bg-[#FAF9F6] border-l border-[#E5E1D8] text-[#2D2D2D] select-none">
      
      {/* Header Info */}
      <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowSettingsModal(true)} title="الملف الشخصي والإعدادات">
            {renderUserAvatar()}
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#121211] rounded-full ${
              currentUser.status === 'offline' 
                ? 'bg-gray-400' 
                : currentUser.status === 'away' 
                  ? 'bg-amber-500' 
                  : 'bg-[#C5A059]'
            }`}></span>
          </div>
          <div className="text-right">
            <h2 className="font-extrabold text-sm text-white flex items-center gap-1.5 cursor-pointer hover:text-[#C5A059]" onClick={() => setShowSettingsModal(true)}>
              {currentUser.name}
              {currentUser.isGoogleLinked && (
                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Google
                </span>
              )}
            </h2>
            <p className="text-[10px] text-[#A8A293] font-medium truncate max-w-[150px]">
              {currentUser.status === 'offline' 
                ? 'غير متاح' 
                : currentUser.status === 'away' 
                  ? 'خارج (بعيد)' 
                  : (currentUser.isGoogleLinked ? currentUser.googleEmail : 'متصل (جوال + كمبيوتر)')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Privacy Toggle button */}
          {isAdmin && (
            <button
              onClick={handleTogglePrivacyMode}
              title={showHiddenContacts ? "وضع الخصوصية نشط (اضغط للقفل)" : "إظهار جهات الاتصال المخفية (يتطلب رقم سري)"}
              className={`p-2 rounded-xl border transition-all ${
                showHiddenContacts 
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' 
                  : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#A8A293] hover:text-[#2D2D2D]'
              }`}
            >
              {showHiddenContacts ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* App Settings Modal Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="تغيير الصورة، الاسم، الخلفية، وربط جوجل"
            className="p-2 bg-[#121211] border border-[#2E2E2A]/70 hover:bg-[#1C1C1A] rounded-xl text-stone-300 hover:text-[#C5A059] transition duration-150"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              if (confirm("هل تريد تسجيل الخروج من الحساب؟")) {
                window.dispatchEvent(new CustomEvent('logout'));
              }
            }}
            title="تسجيل الخروج"
            className="p-2 bg-rose-950/20 border border-rose-900 hover:bg-rose-950/40 rounded-xl text-rose-400 hover:text-rose-300 transition duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Call Simulator Button */}
          {isAdmin && (
            <button 
              id="simulate_call_btn"
              onClick={() => setShowSimulateDropdown(!showSimulateDropdown)}
              title="محاكاة مكالمة واردة"
              className="p-2 hover:bg-[#1C1C1A] rounded-xl text-[#C5A059] hover:text-[#C5A059]/80 transition duration-150 flex items-center bg-[#C5A059]/10 border border-[#C5A059]/20"
            >
              <BellRing className="w-3.5 h-3.5 text-[#C5A059]" />
            </button>
          )}

          {isAdmin && showSimulateDropdown && (
            <div className="absolute left-4 top-16 z-50 w-56 bg-white rounded-xl border border-[#E5E1D8] shadow-xl overflow-hidden py-1 text-right">
              <div className="px-3 py-2 border-b border-[#E5E1D8] bg-[#FAF9F6]">
                <span className="text-[11px] font-bold text-[#A8A293] block uppercase tracking-wider">اختر متصلاً لمحاكاة اتصال وارد:</span>
              </div>
              {contacts.filter(c => !c.isGroup && c.visibility !== 'hidden' && c.hasApp !== false).slice(0, 4).map((c) => (
                <div key={c.id} className="border-b border-[#2E2E2A]/40 last:border-0">
                  <div className="px-3 py-1 text-xs font-semibold text-white bg-[#121211] flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#C5A059] font-normal">📞</span>
                  </div>
                  <button
                     onClick={() => {
                       onTriggerIncomingCall(c.id, 'video');
                       setShowSimulateDropdown(false);
                     }}
                     className="w-full text-right px-4 py-1.5 text-xs text-[#C5A059] hover:bg-[#C5A059]/10 flex items-center gap-1.5 transition"
                  >
                     <span>🎥 فيديو (مثل تيمز/إيمو)</span>
                  </button>
                  <button
                     onClick={() => {
                       onTriggerIncomingCall(c.id, 'audio');
                       setShowSimulateDropdown(false);
                     }}
                     className="w-full text-right px-4 py-1.5 text-xs text-[#C5A059]/80 hover:bg-[#C5A059]/10 flex items-center gap-1.5 transition"
                  >
                     <span>📞 صوتية (مثل واتساب)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-[#0B0B0A] border-b border-[#2E2E2A]/60">
        <div className="relative flex items-center">
          <Search className="absolute right-3 w-4 h-4 text-[#C5A059]" />
          <input
            id="search_contacts_input"
            type="text"
            placeholder="البحث عن دردشة، مكالمة أو جهة اتصال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121211] text-xs text-white pl-4 pr-10 py-2.5 rounded-xl border border-[#2E2E2A]/70 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors placeholder-stone-500"
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-[#121211] border-b border-[#2E2E2A]/60 text-[11px] font-semibold text-stone-400 overflow-x-auto">
        <button
          id="tab_chats"
          onClick={() => setActiveTab('chats')}
          className={`flex-1 min-w-[70px] py-3 text-center transition relative flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'chats' ? 'text-[#C5A059] font-black bg-[#0B0B0A]' : 'hover:bg-[#1C1C1A]/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>الدردشات</span>
          {activeTab === 'chats' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]"></span>}
        </button>
        <button
          id="tab_groups"
          onClick={() => setActiveTab('groups')}
          className={`flex-1 min-w-[80px] py-3 text-center transition relative flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'groups' ? 'text-[#C5A059] font-black bg-[#0B0B0A]' : 'hover:bg-[#1C1C1A]/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>المجموعات</span>
          {totalGroupsUnread > 0 ? (
            <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {totalGroupsUnread}
            </span>
          ) : (
            <span className="text-[9px] text-stone-500">({contacts.filter(c => c.isGroup).length})</span>
          )}
          {activeTab === 'groups' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]"></span>}
        </button>
        <button
          id="tab_calls"
          onClick={() => setActiveTab('calls')}
          className={`flex-1 min-w-[70px] py-3 text-center transition relative flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'calls' ? 'text-[#C5A059] font-black bg-[#0B0B0A]' : 'hover:bg-[#1C1C1A]/50'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>المكالمات</span>
          {activeTab === 'calls' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]"></span>}
        </button>
        <button
          id="tab_contacts"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 min-w-[70px] py-3 text-center transition relative flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'contacts' ? 'text-[#C5A059] font-black bg-[#0B0B0A]' : 'hover:bg-[#1C1C1A]/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>العناوين ({filteredContacts.length})</span>
          {activeTab === 'contacts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]"></span>}
        </button>
      </div>

      {/* Dynamic List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D0D0C]">
        {activeTab === 'chats' && (
          <div>
            {/* Create Group Prominent Button */}
            <div className="p-3 bg-[#121211]/55 border-b border-[#2E2E2A]/40 flex items-center justify-between">
              <span className="text-[10px] text-stone-400 font-bold">المحادثات المفتوحة</span>
              <button
                onClick={() => {
                  setNewGroupSelectedMembers([]);
                  setShowNewGroupModal(true);
                }}
                className="px-2.5 py-1.5 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30 rounded-xl flex items-center gap-1.5 transition text-[10.5px] font-extrabold cursor-pointer"
                title="إنشاء غرفة جماعية أو مجموعة جديدة"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>إنشاء غرفة جماعية / مجموعة</span>
              </button>
            </div>
            
            <div className="divide-y divide-[#E5E1D8]/40">
              {filteredContacts.filter(c => c.hasApp !== false).length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A8A293]">لا توجد محادثات متطابقة</div>
              ) : (
                filteredContacts
                  .filter(c => c.hasApp !== false)
                  .map((contact) => {
                    const lastMsg = getLastMessage(contact.id);
                    const isSelected = activeContact?.id === contact.id;
                  
                  return (
                    <div
                      key={contact.id}
                      id={`chat_item_${contact.id}`}
                      onClick={() => onSelectContact(contact)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition relative border-b border-[#2E2E2A]/30 ${
                        isSelected ? 'bg-[#1C1C1A] border-r-4 border-[#C5A059]' : 'hover:bg-[#121211]/55'
                      } ${contact.visibility === 'hidden' ? 'bg-amber-950/20 border-l-2 border-dashed border-amber-600' : ''}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative flex-shrink-0">
                          {renderContactAvatar(contact, "w-11 h-11 text-xl")}
                          {contact.status === 'online' && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0D0D0C] rounded-full animate-pulse"></span>
                          )}
                          {contact.status === 'away' && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-[#0D0D0C] rounded-full"></span>
                          )}
                        </div>
                        <div className="text-right overflow-hidden">
                          <h3 className="font-bold text-sm text-white flex items-center gap-1 truncate">
                            {contact.name}
                            {contact.isGroup && (
                              <span className="text-[9px] bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 px-1.5 py-0.5 rounded-full font-bold">مجموعة</span>
                            )}
                            {contact.id.startsWith('google_') && (
                              <span className="text-[9px] bg-blue-950/50 text-blue-400 border border-blue-800/40 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" title="مستورد من Google">
                                🌐 Google
                              </span>
                            )}
                            {contact.visibility === 'hidden' && (
                              <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-800/50 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" title="جهة اتصال مخفية">
                                🔒 مخفية
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-stone-400 truncate mt-0.5 max-w-[190px]">
                            {contact.status === 'typing' ? (
                              <span className="text-[#C5A059] font-bold animate-pulse">يكتب الآن...</span>
                            ) : (
                              lastMsg.text
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-left flex-shrink-0">
                        <span className="text-[9px] text-[#A89F91] font-mono">{lastMsg.timestamp}</span>
                        {contact.status === 'online' && !isSelected && (
                          <span className="w-2 h-2 bg-[#C5A059] rounded-full"></span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="divide-y divide-[#E5E1D8]/40">
            {callHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A8A293]">سجل المكالمات فارغ تماماً</div>
            ) : (
              callHistory.map((record) => {
                const caller = contacts.find((c) => c.id === record.contactId) || {
                  name: 'جهة اتصال مجهولة',
                  avatar: '👤',
                };
                return (
                  <div
                    key={record.id}
                    id={`call_item_${record.id}`}
                    className="p-3.5 flex items-center justify-between hover:bg-[#FAF9F6]/85 transition"
                  >
                    <div className="flex items-center gap-3">
                      {renderContactAvatar(caller as Contact, "w-10 h-10 text-xl")}
                      <div className="text-right">
                        <h4 className="font-bold text-xs text-[#2D2D2D]">{caller.name}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#A8A293] mt-0.5">
                          {record.direction === 'incoming' && <span className="text-[#556B2F] font-semibold">↑ مكالمة مستلمة</span>}
                          {record.direction === 'outgoing' && <span className="text-[#556B2F]/80 font-semibold">↓ مكالمة صادرة</span>}
                          {record.direction === 'missed' && <span className="text-[#FF4B4B] font-bold">× فائتة</span>}
                          <span className="text-[#A8A293]">•</span>
                          <span className="text-[#A8A293] font-mono text-[10px]">{record.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.duration && (
                        <span className="text-[10px] font-mono text-[#2D2D2D] bg-[#E5E1D8] px-2 py-0.5 rounded-full">{record.duration}</span>
                      )}
                      <button
                        onClick={() => {
                          const c = contacts.find((con) => con.id === record.contactId);
                          if (c) onStartCall(c, record.type);
                        }}
                        className={`p-2 rounded-lg transition hover:bg-[#556B2F]/10 text-[#556B2F]`}
                        title="إعادة الاتصال"
                      >
                        {record.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'contacts' && (() => {
          const registeredContacts = filteredContacts.filter(c => c.hasApp !== false);
          const unregisteredContacts = filteredContacts.filter(c => c.hasApp === false);
          return (
            <div>
              <div className="p-3.5 bg-[#FAF9F6] border-b border-[#E5E1D8] flex items-center justify-between">
                <span className="text-[11px] text-[#556B2F] font-bold tracking-wide">جهات العناوين ({filteredContacts.length})</span>
                <button
                  id="add_new_contact_trigger"
                  onClick={() => setShowNewContactModal(true)}
                  className="px-2.5 py-1 bg-[#556B2F] hover:bg-[#556B2F]/90 text-white rounded-lg flex items-center gap-1 transition text-[10px] font-bold"
                  title="إضافة جهة اتصال جديدة"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة جهة</span>
                </button>
              </div>

              {/* SECTION 1: Registered Users (Those who have SNNS.PRO account) */}
              {registeredContacts.length > 0 && (
                <div>
                  <div className="px-3.5 py-2 bg-[#F2F0E9]/75 text-[#556B2F] text-[10px] font-black tracking-wider border-b border-[#E5E1D8]/45 flex items-center justify-between">
                    <span>الأشخاص المشتركون في SNNS.PRO</span>
                    <span className="px-2 py-0.5 bg-[#556B2F]/15 rounded-full text-[9px] font-bold">{registeredContacts.length} جهة</span>
                  </div>
                  <div className="divide-y divide-[#E5E1D8]/40">
                    {registeredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        id={`contact_item_${contact.id}`}
                        className={`p-3 flex items-center justify-between hover:bg-[#FAF9F6]/85 transition ${
                          contact.visibility === 'hidden' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {renderContactAvatar(contact, "w-10 h-10 text-xl")}
                          <div className="text-right">
                            <h4 className="font-bold text-xs text-[#2D2D2D] flex items-center gap-1.5 flex-wrap">
                              <span>{contact.name}</span>
                              <span className="text-[8px] bg-[#556B2F]/10 text-[#556B2F] px-1.5 py-0.2 rounded-full font-bold">
                                {contact.isGroup ? 'مجموعة' : contact.role.split(' ')[0]}
                              </span>
                              {contact.id.startsWith('google_') && (
                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 border border-blue-200" title="مستورد من Google">
                                  🌐 Google
                                </span>
                              )}
                              {contact.visibility === 'hidden' && (
                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                                  🔒 مخفية
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-[#A8A293] mt-0.5 truncate max-w-[170px]">{contact.bio}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit Contact Button */}
                          <button
                            onClick={() => {
                              setEditingContact(contact);
                              setEditContactName(contact.name);
                              setEditContactRole(contact.role);
                              setEditContactAvatar(contact.avatar);
                              setEditContactVisibility(contact.visibility || 'public');
                            }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                            title="تعديل جهة الاتصال"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => onStartCall(contact, 'video')}
                            className="p-1.5 hover:bg-[#556B2F]/10 text-[#556B2F] rounded-lg transition"
                            title="مكالمة فيديو"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectContact(contact);
                              setActiveTab('chats');
                            }}
                            className="p-1.5 hover:bg-[#556B2F]/10 text-[#556B2F] rounded-lg transition"
                            title="دردشة فورية"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Unregistered Users (Invite to SNNS.PRO) */}
              {unregisteredContacts.length > 0 && (
                <div className="mt-3.5 border-t border-[#E5E1D8]/60">
                  <div className="px-3.5 py-2 bg-[#E6ECF5]/60 text-[#1F4E79] text-[10px] font-black tracking-wider border-b border-[#E5E1D8]/45 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-blue-600 animate-pulse" />
                      <span>دعوة الأصدقاء إلى SNNS.PRO</span>
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">{unregisteredContacts.length} جهة</span>
                  </div>
                  <div className="divide-y divide-[#E5E1D8]/40">
                    {unregisteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        id={`contact_invite_item_${contact.id}`}
                        className="p-3 flex items-center justify-between hover:bg-[#FAF9F6]/85 transition"
                      >
                        <div className="flex items-center gap-3">
                          {renderContactAvatar(contact, "w-10 h-10 text-xl grayscale opacity-75")}
                          <div className="text-right">
                            <h4 className="font-bold text-xs text-stone-600 flex items-center gap-1.5 flex-wrap">
                              <span>{contact.name}</span>
                              {contact.id.startsWith('google_') && (
                                <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 border border-blue-100" title="مستورد من Google">
                                  🌐 Google
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-[#A8A293] mt-0.5 truncate max-w-[170px]">غير مسجل • {contact.bio?.split('•')[0] || contact.role}</p>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => alert(`🎉 تم إرسال دعوة مشفرة وآمنة بالكامل إلى جهة الاتصال (${contact.name}) بنجاح للإنضمام إلى منصة SNNS.PRO!`)}
                            className="px-3 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-black text-[#C5A059] border border-[#C5A059]/30 rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>دعوة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'groups' && (
          <div>
            {/* Create Group Prominent Button */}
            <div className="p-3 bg-[#121211]/55 border-b border-[#2E2E2A]/40 flex items-center justify-between">
              <span className="text-[10px] text-[#C5A059] font-bold">المجموعات والغرف الجماعية ({contacts.filter(c => c.isGroup).length})</span>
              <button
                onClick={() => {
                  setNewGroupSelectedMembers([]);
                  setShowNewGroupModal(true);
                }}
                className="px-2.5 py-1.5 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30 rounded-xl flex items-center gap-1.5 transition text-[10.5px] font-extrabold cursor-pointer"
                title="إنشاء غرفة جماعية أو مجموعة جديدة"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>إنشاء مجموعة</span>
              </button>
            </div>

            <div className="divide-y divide-[#2E2E2A]/30">
              {contacts.filter(c => c.isGroup && (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.role.toLowerCase().includes(searchQuery.toLowerCase()) : true)).length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A8A293]">لا توجد مجموعات متطابقة</div>
              ) : (
                contacts
                  .filter(c => c.isGroup && (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.role.toLowerCase().includes(searchQuery.toLowerCase()) : true))
                  .map((contact) => {
                    const lastMsg = getLastMessage(contact.id);
                    const isSelected = activeContact?.id === contact.id;
                    const unreadCount = getUnreadCount(contact.id);
                    
                    return (
                      <div
                        key={contact.id}
                        id={`group_tab_item_${contact.id}`}
                        onClick={() => {
                          onSelectContact(contact);
                          setActiveTab('chats');
                        }}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition relative border-b border-[#2E2E2A]/30 ${
                          isSelected ? 'bg-[#1C1C1A] border-r-4 border-[#C5A059]' : 'hover:bg-[#121211]/55'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative flex-shrink-0">
                            {renderContactAvatar(contact, "w-11 h-11 text-xl")}
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center animate-ping"></span>
                            )}
                            {contact.status === 'online' && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-[#0D0D0C] rounded-full"></span>
                            )}
                          </div>
                          <div className="text-right overflow-hidden">
                            <h3 className="font-bold text-sm text-white flex items-center gap-1 truncate">
                              {contact.name}
                              <span className="text-[9px] bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/45 px-1.5 py-0.2 rounded-full font-bold">
                                {contact.members ? `${contact.members.length} أعضاء` : 'عامة'}
                              </span>
                            </h3>
                            <p className="text-xs text-stone-400 truncate mt-0.5 max-w-[190px]">
                              {contact.status === 'typing' ? (
                                <span className="text-[#C5A059] font-bold animate-pulse">يكتب الآن...</span>
                              ) : (
                                lastMsg.text
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-left flex-shrink-0">
                          <span className="text-[9px] text-[#A89F91] font-mono">{lastMsg.timestamp}</span>
                          {unreadCount > 0 ? (
                            <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full animate-bounce">
                              <BellRing className="w-3 h-3 text-rose-400" />
                              <span className="text-[10px] font-black">{unreadCount}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-stone-500">نشط</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- SETTINGS & PROFILE MODAL --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E1D8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-right animate-fadeIn">
            <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#2D2D2D] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#556B2F]" />
                الملف الشخصي وإعدادات المنصة
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-[#A8A293] hover:text-[#2D2D2D] text-lg font-bold">×</button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  {/* Profile Details (Name & Photo) */}
                  <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#556B2F] border-b border-[#E5E1D8] pb-1">👤 البيانات الشخصية:</h4>
                
                <div>
                  <label className="block text-[11px] text-[#A8A293] font-bold mb-1">اسم المستخدم:</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                    placeholder="أدخل اسمك الكريم"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">حالة التواجد (الحالة الشخصية):</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditUserStatus('online')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-1.5 ${
                        editUserStatus === 'online' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold ring-1 ring-emerald-500' 
                          : 'border-[#E5E1D8] bg-[#F4F2EE] hover:bg-[#E5E1D8]/40 text-[#2D2D2D]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-[#556B2F] rounded-full"></span>
                      <span>متصل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUserStatus('away')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-1.5 ${
                        editUserStatus === 'away' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold ring-1 ring-amber-500' 
                          : 'border-[#E5E1D8] bg-[#F4F2EE] hover:bg-[#E5E1D8]/40 text-[#2D2D2D]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                      <span>خارج</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUserStatus('offline')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-1.5 ${
                        editUserStatus === 'offline' 
                          ? 'bg-gray-50 border-gray-400 text-gray-800 font-extrabold ring-1 ring-gray-400' 
                          : 'border-[#E5E1D8] bg-[#F4F2EE] hover:bg-[#E5E1D8]/40 text-[#2D2D2D]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full"></span>
                      <span>غير متاح</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">نوع الصورة الشخصية:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditAvatarType('emoji')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                        editAvatarType === 'emoji' 
                          ? 'bg-[#556B2F]/10 border-[#556B2F] text-[#556B2F]' 
                          : 'border-[#E5E1D8] hover:bg-[#F2F0E9]'
                      }`}
                    >
                      رمز تعبيري (Emoji)
                    </button>
                    <button
                      onClick={() => setEditAvatarType('image_url')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                        editAvatarType === 'image_url' 
                          ? 'bg-[#556B2F]/10 border-[#556B2F] text-[#556B2F]' 
                          : 'border-[#E5E1D8] hover:bg-[#F2F0E9]'
                      }`}
                    >
                      رابط صورة مخصصة (URL)
                    </button>
                  </div>
                </div>

                {editAvatarType === 'emoji' ? (
                  <div>
                    <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">اختر رمزك المفضل:</label>
                    <div className="grid grid-cols-7 gap-2">
                      {PREDEFINED_EMOJIS.map(em => (
                        <button
                          key={em}
                          onClick={() => setEditAvatarEmoji(em)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition ${
                            editAvatarEmoji === em ? 'bg-[#556B2F] text-white border-transparent scale-110' : 'border-[#E5E1D8] hover:bg-[#F4F2EE]'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-[#A8A293] font-bold mb-1">رابط الصورة الشخصية (URL):</label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#556B2F] border-b border-[#E5E1D8] pb-1">🎨 مظهر وخلفية التطبيق:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateThemeBackground(theme.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition text-xs font-semibold ${
                        themeBackground === theme.id 
                          ? 'border-[#556B2F] bg-[#556B2F]/10 text-[#556B2F]' 
                          : 'border-[#E5E1D8] hover:bg-[#F4F2EE]'
                      }`}
                    >
                      <span>{theme.name}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border border-[#E5E1D8] ${theme.color}`}></span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browser Notifications Config */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#556B2F] border-b border-[#E5E1D8] pb-1">🔔 إشعارات المتصفح (Notification API):</h4>
                <div className="bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-3.5 text-right space-y-3 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#2D2D2D]">تفعيل الإشعارات الفورية</p>
                      <p className="text-[10px] text-[#A8A293] leading-relaxed">تلقي إشعارات في زاوية الشاشة عند وصول رسائل جديدة بينما التطبيق يعمل في الخلفية</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const nextState = !notificationsEnabled;
                        if (nextState) {
                          const perm = await requestNotificationPermission();
                          if (perm === 'granted') {
                            setNotificationsEnabled(true);
                            setNotificationsEnabledState(true);
                          } else {
                            alert('⚠️ يرجى السماح بالإشعارات من إعدادات المتصفح أولاً لاستخدام هذه الميزة.');
                          }
                        } else {
                          setNotificationsEnabled(false);
                          setNotificationsEnabledState(false);
                        }
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationsEnabled ? 'bg-[#556B2F]' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notificationsEnabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        showBrowserNotification({
                          title: 'إشعار تجريبي 🚀',
                          body: 'مرحباً! نظام الإشعارات الفورية يعمل بنجاح في متصفحك.',
                        });
                      }}
                      disabled={!notificationsEnabled}
                      className="flex-1 py-1.5 bg-[#556B2F]/10 hover:bg-[#556B2F]/15 active:bg-[#556B2F]/20 disabled:opacity-50 text-[#556B2F] text-[10px] font-extrabold rounded-lg border border-[#556B2F]/20 transition cursor-pointer"
                    >
                      🧪 اختبار إشعار تجريبي
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const perm = await requestNotificationPermission();
                        alert(`الحالة الحالية لإذن الإشعارات: ${perm === 'granted' ? '✅ مسموح بالكامل' : perm === 'denied' ? '❌ مرفوض في المتصفح' : '⏳ يتطلب الإذن'}`);
                      }}
                      className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-200 transition cursor-pointer"
                    >
                      🛡️ التحقق من الإذن
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Sync and Login Block */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#556B2F] border-b border-[#E5E1D8] pb-1">🌐 ربط حساب Google واستيراد الأسماء:</h4>
                
                {currentUser.isGoogleLinked ? (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-right space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={currentUser.avatarUrl} alt="Google Profile" className="w-10 h-10 rounded-full border border-blue-300" />
                      <div className="text-right">
                        <p className="text-xs font-bold text-blue-900">{currentUser.name}</p>
                        <p className="text-[10px] text-blue-600 font-mono">{currentUser.googleEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGoogleConnect()}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Globe className="w-3 h-3 animate-pulse" />
                        <span>مزامنة جهات الاتصال</span>
                      </button>
                      
                      <button
                        onClick={handleGoogleDisconnect}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-red-200 transition"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>إلغاء الربط</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-[#A8A293] mb-2 font-medium">قم بربط حساب Google الخاص بك لاستيراد جهات الاتصال الموثوقة ومزامنة بيانات ملفك الشخصي فوراً.</p>
                    
                    {/* Elegant Official Google Style Sign-In button */}
                    <button
                      onClick={() => handleGoogleConnect()}
                      className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#E5E1D8] hover:bg-[#FAF9F6] active:bg-[#F2F0E9] text-[#2D2D2D] font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>تسجيل الدخول وربط جهات الاتصال بجوجل</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#F2F0E9] border-t border-[#E5E1D8] flex justify-end gap-2">
              <button
                onClick={() => {
                  if (confirm("هل تريد تسجيل الخروج من الحساب؟")) {
                    window.dispatchEvent(new CustomEvent('logout'));
                  }
                }}
                className="ml-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-600 font-bold rounded-xl transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-[#E5E1D8] hover:bg-[#E5E1D8]/80 text-xs text-[#2D2D2D] font-bold rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveProfileSettings}
                className="px-5 py-2 bg-[#556B2F] hover:bg-[#556B2F]/90 text-xs text-white font-bold rounded-xl transition shadow-md shadow-[#556B2F]/20"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW CONTACT MODAL --- */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E1D8] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-right animate-fadeIn">
            <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8]">
              <h3 className="font-bold text-sm text-[#2D2D2D]">إضافة جهة اتصال أو مجموعة جديدة</h3>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1">الاسم / عنوان المجموعة:</label>
                <input
                  type="text"
                  placeholder="مثال: خالي أبو فهد أو فريق العمل"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1">الدور / طبيعة العلاقة:</label>
                <input
                  type="text"
                  placeholder="مثال: ابن عمي، زميل جامعة، شريكي"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                  disabled={newContactIsGroup}
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">حالة الخصوصية والأمان:</label>
                <select
                  value={newContactVisibility}
                  onChange={(e) => setNewContactVisibility(e.target.value as 'public' | 'hidden')}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                >
                  <option value="public">عامة (تظهر للجميع في قائمة العناوين)</option>
                  <option value="hidden">مخفية (تتطلب تفعيل وضع الخصوصية لإظهارها)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">الرمز التعبيري (Avatar):</label>
                <div className="grid grid-cols-7 gap-2">
                  {['👤', '💼', '🏡', '❤️', '💻', '🩺', '👨‍💻', '👩‍🎨', '🦊', '🦁', '⭐', '👥', '📞', '✨'].map(em => (
                    <button
                      key={em}
                      onClick={() => setNewContactAvatar(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition ${
                        newContactAvatar === em ? 'bg-[#556B2F] text-white border-transparent' : 'border-[#E5E1D8] hover:bg-[#F4F2EE]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_group_checkbox"
                  checked={newContactIsGroup}
                  onChange={(e) => {
                    setNewContactIsGroup(e.target.checked);
                    if (e.target.checked) {
                      setNewContactRole('مجموعة لمناقشة المواضيع العامة');
                      setNewContactAvatar('👥');
                    }
                  }}
                  className="rounded bg-[#F4F2EE] border-[#E5E1D8] text-[#556B2F] focus:ring-0"
                />
                <label htmlFor="is_group_checkbox" className="text-xs text-[#2D2D2D] font-semibold cursor-pointer">تصنيف كمجموعة (جروب)</label>
              </div>
            </div>

            <div className="p-4 bg-[#F2F0E9] border-t border-[#E5E1D8] flex gap-2 justify-end">
              <button
                onClick={() => setShowNewContactModal(false)}
                className="px-4 py-2 bg-[#E5E1D8] hover:bg-[#E5E1D8]/80 text-xs text-[#2D2D2D] font-bold rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddContactSubmit}
                className="px-4 py-2 bg-[#556B2F] hover:bg-[#556B2F]/90 text-xs text-white font-bold rounded-xl transition shadow-md shadow-[#556B2F]/20"
              >
                إضافة وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT CONTACT MODAL --- */}
      {editingContact && (
        <div className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E1D8] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-right animate-fadeIn">
            <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#2D2D2D]">تعديل بيانات جهة الاتصال</h3>
              <button onClick={() => setEditingContact(null)} className="text-[#A8A293] hover:text-[#2D2D2D] text-lg font-bold">×</button>
            </div>
            
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1">الاسم / عنوان المجموعة:</label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1">الدور / العلاقة:</label>
                <input
                  type="text"
                  value={editContactRole}
                  onChange={(e) => setEditContactRole(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">حالة الخصوصية والأمان:</label>
                <select
                  value={editContactVisibility}
                  onChange={(e) => setEditContactVisibility(e.target.value as 'public' | 'hidden')}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
                >
                  <option value="public">عامة (تظهر للجميع في القائمة)</option>
                  <option value="hidden">مخفية (تتطلب تفعيل وضع الخصوصية لإظهارها)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1">تعديل الرمز (Emoji or Image URL):</label>
                <input
                  type="text"
                  value={editContactAvatar}
                  onChange={(e) => setEditContactAvatar(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F] font-mono"
                  placeholder="أدخل رمز تعبيري أو رابط صورة"
                />
              </div>
            </div>

            <div className="p-4 bg-[#F2F0E9] border-t border-[#E5E1D8] flex gap-2 justify-between">
              <button
                onClick={() => handleDeleteContact(editingContact.id)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                title="حذف جهة الاتصال بالكامل"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف جهة الاتصال</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 bg-[#E5E1D8] text-xs text-[#2D2D2D] font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleEditContactSubmit}
                  className="px-4 py-2 bg-[#556B2F] hover:bg-[#556B2F]/90 text-white text-xs font-bold rounded-xl transition shadow-md shadow-[#556B2F]/10"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE GROUP MODAL --- */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121211] border border-[#2E2E2A] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-right animate-fadeIn text-white">
            <div className="p-4 bg-[#1C1C1A] border-b border-[#2E2E2A] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#C5A059] flex items-center gap-1.5">
                <span>👥 إنشاء مجموعة أو غرفة جماعية جديدة</span>
              </h3>
              <button 
                onClick={() => setShowNewGroupModal(false)} 
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[11px] text-[#C5A059] font-bold mb-1">اسم المجموعة / الغرفة:</label>
                <input
                  type="text"
                  placeholder="مثال: أصدقاء الطفولة 🍿، فريق العمل 🚀"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-[#1C1C1A] border border-[#2E2E2A] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#C5A059] font-bold mb-1">وصف المجموعة / الاهتمام المشترك:</label>
                <input
                  type="text"
                  placeholder="مثال: مجموعة لمشاركة أخبار وتطورات المشاريع اليومية"
                  value={newGroupRole}
                  onChange={(e) => setNewGroupRole(e.target.value)}
                  className="w-full bg-[#1C1C1A] border border-[#2E2E2A] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#C5A059] font-bold mb-1.5">حالة الخصوصية والأمان:</label>
                <select
                  value={newGroupVisibility}
                  onChange={(e) => setNewGroupVisibility(e.target.value as 'public' | 'hidden')}
                  className="w-full bg-[#1C1C1A] border border-[#2E2E2A] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                >
                  <option value="public">عامة (تظهر للجميع في قائمة العناوين)</option>
                  <option value="hidden">مخفية (تتطلب تفعيل وضع الخصوصية لإظهارها)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#C5A059] font-bold mb-1.5">أيقونة المجموعة (الرمز التعبيري):</label>
                <div className="grid grid-cols-7 gap-2">
                  {['👥', '🏡', '❤️', '💻', '🩺', '👨‍💻', '👩‍🎨', '🦊', '🦁', '⭐', '🍿', '🔥', '✈️', '🎨'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewGroupAvatar(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition cursor-pointer ${
                        newGroupAvatar === em ? 'bg-[#C5A059] text-black border-transparent font-bold' : 'border-[#2E2E2A] hover:bg-[#1C1C1A]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#C5A059] font-bold mb-1">تحديد أعضاء المجموعة (الحد الأدنى 1):</label>
                <div className="bg-[#1C1C1A] border border-[#2E2E2A] rounded-xl p-2 space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {contacts.filter(c => !c.isGroup && c.hasApp !== false).map(c => {
                    const isSelected = newGroupSelectedMembers.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isSelected ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.avatar}</span>
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-[10px] text-stone-400">({c.role})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setNewGroupSelectedMembers(newGroupSelectedMembers.filter(id => id !== c.id));
                            } else {
                              setNewGroupSelectedMembers([...newGroupSelectedMembers, c.id]);
                            }
                          }}
                          className="rounded bg-[#121211] border-[#2E2E2A] text-[#C5A059] focus:ring-0 text-right"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#1C1C1A] border-t border-[#2E2E2A] flex gap-2 justify-end">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 bg-[#2E2E2A] hover:bg-[#2E2E2A]/80 text-xs text-white font-bold rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateGroupSubmit}
                className="px-4 py-2 bg-[#C5A059] hover:bg-[#C5A059]/90 text-xs text-black font-extrabold rounded-xl transition shadow-md shadow-[#C5A059]/20 cursor-pointer"
              >
                إنشاء وحفظ المجموعة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
