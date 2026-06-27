import { useState, useEffect, useRef } from 'react';
import { Contact, Message, CallRecord, CallState } from './types';
import { INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_CALL_RECORDS } from './data';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VideoCallScreen from './components/VideoCallScreen';
import { sounds } from './utils/audio';
import { 
  Menu, 
  MessageSquare, 
  Phone, 
  Users, 
  Volume2, 
  VolumeX, 
  Activity,
  Smartphone,
  Laptop
} from 'lucide-react';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });

  const [myClientId] = useState(() => `user_${Math.random().toString(36).substring(2, 7)}`);
  const [wsConnected, setWsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContact, setActiveContact] = useState<Contact | null>(INITIAL_CONTACTS[0]);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [callHistory, setCallHistory] = useState<CallRecord[]>(INITIAL_CALL_RECORDS);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'contacts'>('chats');
  
  // Responsive sidebar toggler for small screens
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sound play helper toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Call state
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    contact: null,
    type: 'video',
    duration: 0,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });

  const callTimerRef = useRef<any>(null);

  // Auto inject a real peer contact when in room mode
  useEffect(() => {
    if (roomId) {
      const realContact: Contact = {
        id: 'peer',
        name: 'صديق مباشر (اتصال حقيقي)',
        avatar: '🟢',
        status: wsConnected ? 'online' : 'away',
        role: 'شريك الغرفة',
        bio: `متصل حقيقي مباشر | تبادل فوري للبيانات ⚡`,
        isGroup: false,
      };

      setContacts((prev) => {
        if (prev.some(c => c.id === 'peer')) {
          return prev.map(c => c.id === 'peer' ? { ...c, status: wsConnected ? 'online' : 'away' } : c);
        }
        return [realContact, ...prev];
      });
      setActiveContact(realContact);
    }
  }, [roomId, wsConnected]);

  // WebSockets signaling client connection
  useEffect(() => {
    if (!roomId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    console.log('Connecting to WebSocket signaling room:', roomId, 'at:', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection opened!');
      setWsConnected(true);
      // Join the signaling room
      socket.send(JSON.stringify({
        type: 'join',
        roomId,
        clientId: myClientId
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket client received:', data);

        switch (data.type) {
          case 'joined_confirmation':
            console.log('Joined room confirmation details:', data);
            break;
          case 'user_joined':
            console.log('A new peer user has joined the room:', data.clientId);
            setWsConnected(true);
            break;
          case 'chat_message':
            // Receive real peer message
            const peerMsg = data.payload;
            setMessages((prev) => [
              ...prev,
              {
                id: `real_${Date.now()}`,
                senderId: data.clientId,
                senderName: peerMsg.senderName || 'الطرف الآخر',
                text: peerMsg.text,
                type: peerMsg.type || 'text',
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              }
            ]);
            sounds.playMessageReceivedSound();
            break;
          case 'call_action':
            const { action, type: peerCallType } = data.payload;
            console.log('Call action received:', action, peerCallType);
            
            if (action === 'incoming_call') {
              const peerContact: Contact = {
                id: 'peer',
                name: 'صديق مباشر (اتصال حقيقي)',
                avatar: '🟢',
                status: 'online',
                role: 'شريك الغرفة',
                bio: `متصل حقيقي مباشر | تبادل فوري للبيانات ⚡`,
                isGroup: false,
              };
              setCallState({
                status: 'ringing_incoming',
                contact: peerContact,
                type: peerCallType || 'video',
                duration: 0,
                isMuted: false,
                isVideoOff: false,
                isScreenSharing: false,
              });
            } else if (action === 'accept_call') {
              setCallState(prev => ({ ...prev, status: 'connected' }));
              console.log('Peer accepted! Setting up caller WebRTC connection...');
              await setupWebRTC(true);
            } else if (action === 'reject_call') {
              setCallState(prev => ({ ...prev, status: 'ended' }));
              closeWebRTC();
              setTimeout(() => {
                setCallState(prev => ({ ...prev, status: 'idle', contact: null }));
              }, 1000);
            } else if (action === 'end_call') {
              setCallState(prev => ({ ...prev, status: 'ended' }));
              closeWebRTC();
              setTimeout(() => {
                setCallState(prev => ({ ...prev, status: 'idle', contact: null }));
              }, 1000);
            }
            break;
          case 'signal':
            await handlePeerSignal(data.payload);
            break;
        }
      } catch (err) {
        console.error('Error parsing room message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket client connection closed.');
      setWsConnected(false);
    };

    return () => {
      socket.close();
      wsRef.current = null;
      closeWebRTC();
    };
  }, [roomId]);

  const setupWebRTC = async (isOfferer: boolean) => {
    try {
      console.log('WebRTC Setup: Capturing user media camera & mic stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.type === 'video',
        audio: true
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'signal',
            roomId,
            clientId: myClientId,
            payload: {
              candidate: event.candidate
            }
          }));
        }
      };

      pc.ontrack = (event) => {
        console.log('WebRTC track received from peer! Stream:', event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      if (isOfferer) {
        console.log('WebRTC Offerer: Creating local offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsRef.current?.send(JSON.stringify({
          type: 'signal',
          roomId,
          clientId: myClientId,
          payload: {
            sdp: pc.localDescription
          }
        }));
      }
    } catch (err) {
      console.error('Failed to initialize WebRTC local streams:', err);
    }
  };

  const handlePeerSignal = async (payload: any) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('WebRTC signal payload received, but peerConnection is not ready yet.');
        return;
      }

      if (payload.sdp) {
        console.log('Setting WebRTC Remote description SDP type:', payload.sdp.type);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        
        if (payload.sdp.type === 'offer') {
          console.log('Creating local answer SDP description...');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsRef.current?.send(JSON.stringify({
            type: 'signal',
            roomId,
            clientId: myClientId,
            payload: {
              sdp: pc.localDescription
            }
          }));
        }
      } else if (payload.candidate) {
        console.log('Adding WebRTC remote ICE Candidate...');
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    } catch (err) {
      console.error('Error handling peer signal description:', err);
    }
  };

  const closeWebRTC = () => {
    console.log('Closing and disposing WebRTC resources...');
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  // Handle active call duration timer
  useEffect(() => {
    if (callState.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState.status]);

  // Listen to new contact insertion event from Sidebar modal
  useEffect(() => {
    const handleAddContact = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const newContact: Contact = {
        id: `contact_${Date.now()}`,
        name: detail.name,
        avatar: detail.avatar || '👤',
        status: 'online',
        role: detail.role || 'صديق',
        bio: `${detail.role} | نشط على المنصة ⚡`,
        isGroup: detail.isGroup || false,
      };
      setContacts((prev) => [newContact, ...prev]);
      setActiveContact(newContact);
      setActiveTab('chats');
    };

    window.addEventListener('addContact', handleAddContact);
    return () => window.removeEventListener('addContact', handleAddContact);
  }, []);

  // Format call duration for log saving
  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${remainingSecs < 10 ? `0${remainingSecs}` : remainingSecs}`;
  };

  // Orcherstrate sending a message and triggering a response from Gemini
  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'voice' | 'file' = 'text', extra: any = {}) => {
    if (!activeContact) return;

    const messageSessionId = activeContact.isGroup 
      ? `msg_group_${activeContact.id}_${Date.now()}`
      : `msg_${activeContact.id}_${Date.now()}`;

    const newMsg: Message = {
      id: messageSessionId,
      senderId: 'me',
      senderName: 'أنا',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type,
      mediaUrl: extra.mediaUrl,
      duration: extra.duration,
      fileName: extra.fileName,
      fileSize: extra.fileSize,
      status: 'sent',
    };

    // Update message state
    setMessages((prev) => [...prev, newMsg]);
    sounds.playMessageSentSound();

    // If in real-time room mode, broadcast over WebSockets and block AI response simulation
    if (roomId && activeContact.id === 'peer') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          roomId,
          clientId: myClientId,
          payload: {
            text,
            type,
            senderName: 'صديق مباشر'
          }
        }));
      }
      return;
    }

    // Trigger typing response simulation
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, status: 'typing' } : c))
    );

    // Simulate standard WhatsApp network delay for realism
    setTimeout(async () => {
      try {
        // Collect current chat history context
        const currentHistory = messages.filter(m => {
          if (activeContact.isGroup) {
            return m.id.startsWith(activeContact.id) || m.id.endsWith(activeContact.id);
          } else {
            return (m.senderId === activeContact.id && !m.id.includes('group_')) || 
                   (m.senderId === 'me' && m.id.includes(`_${activeContact.id}`));
          }
        });
        
        // Append user's new message to historical bundle
        const updatedHistory = [...currentHistory, newMsg];

        // API Call to dynamic full-stack backend
        const response = await fetch('/api/chat-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactName: activeContact.name,
            contactRole: activeContact.role,
            messageHistory: updatedHistory,
            isGroup: activeContact.isGroup
          }),
        });

        const data = await response.json();
        const responseText = data.text || "تمام 👍";

        // Determine sender for groups
        let responderId = activeContact.id;
        let responderName = activeContact.name;

        if (activeContact.isGroup && activeContact.members) {
          // Choose a random member of the group as the speaker
          const membersList = contacts.filter(c => activeContact.members?.includes(c.id));
          if (membersList.length > 0) {
            const chosen = membersList[Math.floor(Math.random() * membersList.length)];
            responderId = chosen.id;
            responderName = chosen.name;
          }
        }

        const replyMsg: Message = {
          id: `reply_${activeContact.id}_${Date.now()}`,
          senderId: responderId,
          senderName: responderName,
          text: responseText,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          status: 'read',
        };

        setMessages((prev) => [...prev, replyMsg]);
        sounds.playMessageReceivedSound();

      } catch (error) {
        console.error("Error receiving reply:", error);
      } finally {
        // Set contact back to online
        setContacts((prev) =>
          prev.map((c) => (c.id === activeContact.id ? { ...c, status: 'online' } : c))
        );
      }
    }, 2500);
  };

  // Start outbound call (e.g. User clicks Call icon)
  const handleStartCall = (contact: Contact, callType: 'video' | 'audio') => {
    // Open full call screen overlay
    setCallState({
      status: 'ringing_outgoing',
      contact,
      type: callType,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    });

    // If calling the real room partner, initiate WebSockets call signaling instead of mock timers
    if (roomId && contact.id === 'peer') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_action',
          roomId,
          clientId: myClientId,
          payload: {
            action: 'incoming_call',
            type: callType
          }
        }));
      }
      return;
    }

    // Automatically transition to connected call after 4 seconds of ringing tone simulation
    setTimeout(() => {
      setCallState((prev) => {
        if (prev.status === 'ringing_outgoing') {
          // Append to Call Records
          const newRecord: CallRecord = {
            id: `call_${Date.now()}`,
            contactId: contact.id,
            type: callType,
            direction: 'outgoing',
            timestamp: `اليوم، ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
          };
          setCallHistory((history) => [newRecord, ...history]);
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 4000);
  };

  // Simulate remote user ringing the user (Call incoming simulation panel trigger)
  const handleTriggerIncomingCall = (contactId: string, callType: 'video' | 'audio') => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    setCallState({
      status: 'ringing_incoming',
      contact,
      type: callType,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    });
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!callState.contact) return;

    const isPeer = roomId && callState.contact.id === 'peer';

    // Append call record
    const newRecord: CallRecord = {
      id: `call_${Date.now()}`,
      contactId: callState.contact.id,
      type: callState.type,
      direction: 'incoming',
      timestamp: `اليوم، ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
    };
    setCallHistory((prev) => [newRecord, ...prev]);

    setCallState((prev) => ({
      ...prev,
      status: 'connected',
    }));

    if (isPeer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_action',
          roomId,
          clientId: myClientId,
          payload: {
            action: 'accept_call'
          }
        }));
      }
      console.log('Real Call Accepted! Initiating WebRTC responder answerer configuration...');
      await setupWebRTC(false);
    }
  };

  // Reject incoming call
  const handleRejectCall = () => {
    const isPeer = roomId && callState.contact?.id === 'peer';

    if (callState.contact) {
      const newRecord: CallRecord = {
        id: `call_${Date.now()}`,
        contactId: callState.contact.id,
        type: callState.type,
        direction: 'missed',
        timestamp: `اليوم، ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
      };
      setCallHistory((prev) => [newRecord, ...prev]);
    }

    if (isPeer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_action',
          roomId,
          clientId: myClientId,
          payload: {
            action: 'reject_call'
          }
        }));
      }
      closeWebRTC();
    }

    setCallState((prev) => ({
      ...prev,
      status: 'ended',
    }));

    setTimeout(() => {
      setCallState((prev) => ({ ...prev, status: 'idle', contact: null }));
    }, 1000);
  };

  // End active call
  const handleEndCall = () => {
    const isPeer = roomId && callState.contact?.id === 'peer';
    const activeSecs = callState.duration;

    // Update the last call record with active duration details
    if (callState.contact && activeSecs > 0) {
      setCallHistory((prev) => {
        if (prev.length > 0) {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            duration: formatCallDuration(activeSecs),
          };
          return updated;
        }
        return prev;
      });
    }

    if (isPeer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_action',
          roomId,
          clientId: myClientId,
          payload: {
            action: 'end_call'
          }
        }));
      }
      closeWebRTC();
    }

    setCallState((prev) => ({
      ...prev,
      status: 'ended',
    }));

    setTimeout(() => {
      setCallState((prev) => ({ ...prev, status: 'idle', contact: null }));
    }, 1000);
  };

  const handleToggleMute = () => {
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleToggleVideo = () => {
    setCallState((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  };

  const handleToggleScreenShare = () => {
    setCallState((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  };

  const selectContactFromSidebar = (contact: Contact) => {
    setActiveContact(contact);
    setSidebarOpen(false); // Auto close sidebar for mobile view screens
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#FAF9F6] text-[#2D2D2D] overflow-hidden font-sans select-none" dir="rtl">
      
      {/* Top Main App Navigation Frame Bar */}
      <div className="bg-[#FAF9F6] p-3.5 border-b border-[#E5E1D8] flex items-center justify-between select-none px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#556B2F] flex items-center justify-center text-lg shadow-md text-white">
            📞
          </div>
          <div className="text-right">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-wide text-[#2D2D2D] flex items-center gap-1.5">
              منصة الاتصال المرئي والدردشة المتكاملة
              <span className="text-[9px] bg-[#556B2F]/10 text-[#556B2F] border border-[#556B2F]/20 px-2 py-0.5 rounded-full font-bold">إصدار تجريبي ذكي</span>
            </h1>
            <p className="text-[10px] text-[#A8A293] font-medium">محاكاة متكاملة لـ تيمز، إيمو، وواتساب</p>
          </div>
        </div>

        {/* Technical features indicators */}
        <div className="flex items-center gap-3">
          {roomId ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("تم نسخ الرابط! أرسله لصديقك وافتحا نفس الصفحة لبدء دردشة ومكالمة WebRTC حقيقية فوراً.");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer border border-emerald-500/30"
              title="نسخ رابط دعوة الغرفة"
            >
              <span className="animate-pulse">🟢</span>
              <span>رابط الغرفة نشط (اضغط للنسخ)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const randId = Math.random().toString(36).substring(2, 8);
                const url = `${window.location.origin}${window.location.pathname}?room=${randId}`;
                window.history.pushState({}, '', url);
                setRoomId(randId);
              }}
              className="bg-[#556B2F] hover:bg-[#556B2F]/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="إنشاء غرفة اتصال مرئي ومراسلة حقيقية"
            >
              🌐 اتصال حقيقي (غرفة WebRTC)
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 bg-[#F2F0E9] px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs">
            <Laptop className="w-3.5 h-3.5 text-[#556B2F]" />
            <span className="text-[#2D2D2D] font-medium">سطح المكتب</span>
            <span className="text-[#E5E1D8]">|</span>
            <Smartphone className="w-3.5 h-3.5 text-[#556B2F]" />
            <span className="text-[#2D2D2D] font-medium">الجوال</span>
          </div>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled 
                ? 'bg-[#556B2F]/10 border-[#556B2F]/30 text-[#556B2F] hover:bg-[#556B2F]/20' 
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
            }`}
            title={soundEnabled ? "كتم أصوات التطبيق" : "تفعيل أصوات التطبيق"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hamburger to slide Sidebar on mobile manually */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2.5 hover:bg-[#E5E1D8]/50 rounded-xl border border-[#E5E1D8] text-[#2D2D2D]"
            title="القائمة الجانبية"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR CONTAINER */}
        <div className={`absolute md:relative inset-y-0 right-0 z-40 w-full md:w-auto transition-transform duration-300 transform shrink-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
          <Sidebar
            contacts={contacts}
            activeContact={activeContact}
            onSelectContact={selectContactFromSidebar}
            messages={messages}
            callHistory={callHistory}
            onTriggerIncomingCall={handleTriggerIncomingCall}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onStartCall={handleStartCall}
          />
        </div>

        {/* CHAT AREA CONTAINER */}
        <div className="flex-1 h-full overflow-hidden">
          <ChatArea
            activeContact={activeContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            onBackToSidebar={() => setSidebarOpen(true)}
            isRealMode={!!roomId}
            roomId={roomId || undefined}
          />
        </div>
      </div>

      {/* FULL SCREEN VIDEO CALL SCREEN COMPONENT */}
      <VideoCallScreen
        callState={callState}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        localStreamFromParent={localStream || undefined}
        remoteStreamFromParent={remoteStream || undefined}
        isRealMode={!!roomId}
      />

    </div>
  );
}
