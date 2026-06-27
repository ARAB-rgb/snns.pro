import { useState } from 'react';
import { Contact, Message, CallRecord } from '../types';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Search, 
  Users, 
  Clock, 
  UserPlus, 
  BellRing, 
  PhoneCall, 
  CheckCheck, 
  UserCheck, 
  Plus, 
  Settings, 
  Activity 
} from 'lucide-react';

interface SidebarProps {
  contacts: Contact[];
  activeContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  callHistory: CallRecord[];
  onTriggerIncomingCall: (contactId: string, type: 'video' | 'audio') => void;
  activeTab: 'chats' | 'calls' | 'contacts';
  setActiveTab: (tab: 'chats' | 'calls' | 'contacts') => void;
  onStartCall: (contact: Contact, type: 'video' | 'audio') => void;
}

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
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulateDropdown, setShowSimulateDropdown] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('صديق');
  const [newContactIsGroup, setNewContactIsGroup] = useState(false);

  // Filter contacts based on search query (by name or status in Arabic/English)
  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Filter by name
    const nameMatch = c.name.toLowerCase().includes(query);

    // Filter by English status value
    const statusVal = c.status.toLowerCase();
    const statusMatch = statusVal.includes(query);

    // Filter by Arabic status value translation
    let arabicStatusMatch = false;
    const isOnlineQuery = query === 'متصل' || query === 'نشط' || query === 'اونلاين' || 'متصل'.includes(query) || 'نشط'.includes(query) || 'اونلاين'.includes(query);
    const isOfflineQuery = query === 'غير متصل' || query === 'اوفلاين' || 'غير متصل'.includes(query) || 'اوفلاين'.includes(query);
    const isTypingQuery = query === 'يكتب' || query === 'يكتب الآن' || 'يكتب'.includes(query) || 'يكتب الآن'.includes(query);
    const isAwayQuery = query === 'بعيد' || query === 'بالخارج' || query === 'مشغول' || 'بعيد'.includes(query) || 'بالخارج'.includes(query) || 'مشغول'.includes(query);

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
    const contactMsgs = messages.filter(
      (m) => m.senderId === contactId || (m.senderId === 'me' && activeContact?.id === contactId)
    );
    // Wait, for groups, check sender is in group or it's a group conversation
    const isGroup = contactId.startsWith('group_');
    const groupMsgs = messages.filter((m) => {
      if (isGroup) {
        // If it's group, we can track messages specifically for the group
        return m.id.includes(contactId) || (m.senderId === 'me' && activeContact?.id === contactId);
      }
      return false;
    });

    const relevantMsgs = isGroup ? groupMsgs : messages.filter(
      (m) => (m.senderId === contactId && activeContact?.id === 'me') || // fallback or direct
             (m.senderId === contactId && !m.id.includes('group_')) ||
             (m.senderId === 'me' && activeContact?.id === contactId)
    );

    // Dynamic precise message linking: let's filter messages by senderId = contactId or (senderId = 'me' and target is contactId in our UI flow)
    // To keep it simple and correct, we find messages belonging to this chat session
    const chatMsgs = messages.filter(m => {
      if (isGroup) {
        return m.id.startsWith(contactId) || m.id.endsWith(contactId);
      } else {
        return (m.senderId === contactId && !m.id.includes('group_')) || 
               (m.senderId === 'me' && m.id.includes(`_${contactId}`));
      }
    });

    if (chatMsgs.length === 0) {
      // Return a placeholder or mock initial message based on data
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

  // Get active chats (contacts who have messages)
  const activeChatContacts = filteredContacts.filter((c) => {
    // For simplicity, display all contacts as available chats, sorting by last activity
    return true;
  });

  return (
    <div id="app_sidebar" className="w-full md:w-96 flex flex-col h-full bg-[#FAF9F6] border-l border-[#E5E1D8] text-[#2D2D2D] select-none">
      
      {/* Header Info */}
      <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#556B2F] flex items-center justify-center text-lg font-bold text-white shadow-md">
              👤
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#556B2F] border-2 border-[#F2F0E9] rounded-full"></span>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#2D2D2D] flex items-center gap-1.5">
              المستخدم الحالي
              <span className="text-[10px] bg-[#556B2F]/10 text-[#556B2F] px-1.5 py-0.5 rounded-full font-bold">أنا</span>
            </h2>
            <p className="text-[11px] text-[#A8A293]">متصل (جوال + كمبيوتر)</p>
          </div>
        </div>

        {/* Call Simulator & Settings Controls */}
        <div className="flex items-center gap-2 relative">
          <button 
            id="simulate_call_btn"
            onClick={() => setShowSimulateDropdown(!showSimulateDropdown)}
            title="محاكاة مكالمة واردة"
            className="p-2 hover:bg-[#E5E1D8] rounded-lg text-[#556B2F] hover:text-[#556B2F]/80 transition duration-150 flex items-center gap-1 bg-[#556B2F]/10 border border-[#556B2F]/20"
          >
            <BellRing className="w-4 h-4 animate-bounce text-[#556B2F]" />
            <span className="text-xs font-bold hidden sm:inline text-[#556B2F]">مكالمة واردة</span>
          </button>

          {showSimulateDropdown && (
            <div className="absolute left-0 top-12 z-50 w-56 bg-white rounded-xl border border-[#E5E1D8] shadow-xl overflow-hidden py-1 text-right">
              <div className="px-3 py-2 border-b border-[#E5E1D8] bg-[#FAF9F6]">
                <span className="text-[11px] font-bold text-[#A8A293] block uppercase tracking-wider">اختر جهة اتصال للاتصال بك:</span>
              </div>
              {contacts.filter(c => !c.isGroup).map((c) => (
                <div key={c.id} className="border-b border-[#E5E1D8]/40 last:border-0">
                  <div className="px-3 py-1.5 text-xs font-semibold text-[#2D2D2D] bg-[#F2F0E9] flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#A8A293] font-normal">{c.avatar}</span>
                  </div>
                  <button
                    onClick={() => {
                      onTriggerIncomingCall(c.id, 'video');
                      setShowSimulateDropdown(false);
                    }}
                    className="w-full text-right px-4 py-2 text-xs text-[#556B2F] hover:bg-[#556B2F]/10 flex items-center gap-2 transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>مكالمة فيديو (مثل تيمز/إيمو)</span>
                  </button>
                  <button
                    onClick={() => {
                      onTriggerIncomingCall(c.id, 'audio');
                      setShowSimulateDropdown(false);
                    }}
                    className="w-full text-right px-4 py-2 text-xs text-[#556B2F]/80 hover:bg-[#556B2F]/10 flex items-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>مكالمة صوتية (مثل واتساب)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-[#FAF9F6] border-b border-[#E5E1D8]">
        <div className="relative flex items-center">
          <Search className="absolute right-3 w-4 h-4 text-[#A8A293]" />
          <input
            id="search_contacts_input"
            type="text"
            placeholder="البحث عن دردشة، مكالمة أو جهة اتصال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F2EE] text-xs text-[#2D2D2D] pl-4 pr-10 py-2.5 rounded-xl border border-[#E5E1D8] focus:outline-none focus:ring-1 focus:ring-[#556B2F] focus:border-[#556B2F] transition-colors"
          />
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex bg-[#F2F0E9] border-b border-[#E5E1D8] text-xs font-semibold text-[#A8A293]">
        <button
          id="tab_chats"
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-center transition relative flex items-center justify-center gap-1.5 ${
            activeTab === 'chats' ? 'text-[#556B2F] font-bold bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>الدردشات</span>
          {activeTab === 'chats' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#556B2F]"></span>}
        </button>
        <button
          id="tab_calls"
          onClick={() => setActiveTab('calls')}
          className={`flex-1 py-3 text-center transition relative flex items-center justify-center gap-1.5 ${
            activeTab === 'calls' ? 'text-[#556B2F] font-bold bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]/40'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>المكالمات</span>
          {activeTab === 'calls' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#556B2F]"></span>}
        </button>
        <button
          id="tab_contacts"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-3 text-center transition relative flex items-center justify-center gap-1.5 ${
            activeTab === 'contacts' ? 'text-[#556B2F] font-bold bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>جهات الاتصال</span>
          {activeTab === 'contacts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#556B2F]"></span>}
        </button>
      </div>

      {/* Dynamic List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAF9F6]">
        {activeTab === 'chats' && (
          <div className="divide-y divide-[#E5E1D8]/40">
            {activeChatContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A8A293]">لا توجد محادثات مطابقة لبحثك</div>
            ) : (
              activeChatContacts.map((contact) => {
                const lastMsg = getLastMessage(contact.id);
                const isSelected = activeContact?.id === contact.id;
                
                return (
                  <div
                    key={contact.id}
                    id={`chat_item_${contact.id}`}
                    onClick={() => onSelectContact(contact)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-[#F2F0E9] border-r-4 border-[#556B2F]' : 'hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-2xl shadow-inner select-none">
                          {contact.avatar}
                        </div>
                        {contact.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#FAF9F6] rounded-full animate-pulse"></span>
                        )}
                        {contact.status === 'away' && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-[#FAF9F6] rounded-full"></span>
                        )}
                      </div>
                      <div className="text-right overflow-hidden">
                        <h3 className="font-bold text-sm text-[#2D2D2D] flex items-center gap-1.5 truncate">
                          {contact.name}
                          {contact.isGroup && (
                            <span className="text-[10px] bg-[#556B2F]/10 text-[#556B2F] px-1.5 py-0.5 rounded-full font-bold">مجموعة</span>
                          )}
                        </h3>
                        <p className="text-xs text-[#A8A293] truncate mt-0.5 max-w-[200px]">
                          {contact.status === 'typing' ? (
                            <span className="text-[#556B2F] font-bold animate-pulse">يكتب الآن...</span>
                          ) : (
                            lastMsg.text
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-left flex-shrink-0">
                      <span className="text-[10px] text-[#A8A293] font-mono">{lastMsg.timestamp}</span>
                      {contact.status === 'online' && !isSelected && (
                        <span className="w-2.5 h-2.5 bg-[#556B2F] rounded-full"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
                      <div className="w-10 h-10 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-xl shadow-inner">
                        {caller.avatar}
                      </div>
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
                        className={`p-2 rounded-lg transition ${
                          record.type === 'video'
                            ? 'hover:bg-[#556B2F]/10 text-[#556B2F]'
                            : 'hover:bg-[#556B2F]/10 text-[#556B2F]/80'
                        }`}
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

        {activeTab === 'contacts' && (
          <div>
            <div className="p-3 bg-[#FAF9F6] border-b border-[#E5E1D8] flex items-center justify-between">
              <span className="text-[11px] text-[#556B2F] font-bold uppercase tracking-wide">قائمة العناوين والجهات ({contacts.length})</span>
              <button
                id="add_new_contact_trigger"
                onClick={() => setShowNewContactModal(true)}
                className="p-1 hover:bg-[#E5E1D8] text-[#556B2F] hover:text-[#556B2F]/80 rounded-lg flex items-center gap-1 transition"
                title="إضافة جهة اتصال أو جروب"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">إضافة جهة</span>
              </button>
            </div>

            <div className="divide-y divide-[#E5E1D8]/40">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  id={`contact_item_${contact.id}`}
                  className="p-3 flex items-center justify-between hover:bg-[#FAF9F6]/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-xl shadow-inner">
                      {contact.avatar}
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-xs text-[#2D2D2D] flex items-center gap-1">
                        {contact.name}
                        <span className="text-[9px] bg-[#556B2F]/10 text-[#556B2F] px-1.5 py-0.2 rounded-full font-bold">
                          {contact.isGroup ? 'مجموعة' : contact.role.split(' ')[0]}
                        </span>
                      </h4>
                      <p className="text-[10px] text-[#A8A293] mt-0.5 truncate max-w-[180px]">{contact.bio}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartCall(contact, 'video')}
                      className="p-1.5 hover:bg-[#556B2F]/10 text-[#556B2F] rounded-lg transition"
                      title="مكالمة فيديو تيمز"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onStartCall(contact, 'audio')}
                      className="p-1.5 hover:bg-[#556B2F]/10 text-[#556B2F]/80 rounded-lg transition"
                      title="مكالمة صوتية واتساب"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectContact(contact);
                        setActiveTab('chats');
                      }}
                      className="p-1.5 hover:bg-[#556B2F]/10 text-[#556B2F]/90 rounded-lg transition"
                      title="إرسال رسالة"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Contact Dialog Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E1D8] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-right animate-fadeIn">
            <div className="p-4 bg-[#F2F0E9] border-b border-[#E5E1D8]">
              <h3 className="font-bold text-sm text-[#2D2D2D]">إضافة جهة اتصال أو مجموعة جديدة</h3>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">الاسم / عنوان المجموعة:</label>
                <input
                  type="text"
                  placeholder="مثال: خالي أبو فهد أو مجموعة التخطيط"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F] focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A8A293] font-bold mb-1.5">الدور / طبيعة العلاقة:</label>
                <input
                  type="text"
                  placeholder="مثال: ابن عمي، زميل جامعة، شريكي"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl p-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#556B2F] focus:border-[#556B2F]"
                  disabled={newContactIsGroup}
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_group_checkbox"
                  checked={newContactIsGroup}
                  onChange={(e) => {
                    setNewContactIsGroup(e.target.checked);
                    if (e.target.checked) setNewContactRole('مجموعة لمناقشة المواضيع العامة');
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
                onClick={() => {
                  if (!newContactName.trim()) return;
                  const event = new CustomEvent('addContact', {
                    detail: {
                      name: newContactName,
                      role: newContactRole,
                      isGroup: newContactIsGroup,
                      avatar: newContactIsGroup ? '👥' : '👤',
                    }
                  });
                  window.dispatchEvent(event);
                  
                  // Reset states
                  setNewContactName('');
                  setNewContactRole('صديق');
                  setNewContactIsGroup(false);
                  setShowNewContactModal(false);
                }}
                className="px-4 py-2 bg-[#556B2F] hover:bg-[#556B2F]/90 text-xs text-white font-bold rounded-xl transition shadow-md shadow-[#556B2F]/20"
              >
                إضافة وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
