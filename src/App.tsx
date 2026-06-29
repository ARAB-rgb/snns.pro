import { useState, useEffect, useRef } from 'react';
import { Contact, Message, CallRecord, CallState, MessageReminder } from './types';
import { INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_CALL_RECORDS } from './data';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VideoCallScreen from './components/VideoCallScreen';
import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import BrandLogo from './components/BrandLogo';
import DownloadModal from './components/DownloadModal';
import { sounds } from './utils/audio';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { logout as firebaseLogout } from './lib/firebaseAuth';
import { supabase, syncUserToSupabase, syncMessageToSupabase, syncCallToSupabase } from './lib/supabase';
import { 
  requestNotificationPermission, 
  showBrowserNotification 
} from './utils/notifications';
import { LANGUAGES, getTranslation, TRANSLATIONS } from './utils/translations';
import { 
  Menu, 
  MessageSquare, 
  Phone, 
  Users, 
  Volume2, 
  VolumeX, 
  Activity,
  Smartphone,
  Laptop,
  Wifi,
  WifiOff,
  ChevronRight,
  Download
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

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn_state') === 'true';
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      id: '',
      name: '',
      avatar: '👤',
      email: '',
      avatarType: 'emoji' as 'emoji' | 'image_url',
      avatarUrl: '',
      isGoogleLinked: false,
      googleEmail: '',
      status: 'offline' as 'online' | 'offline' | 'away',
      role: '',
      language: ''
    };
  });

  const [themeBackground, setThemeBackground] = useState(() => {
    return localStorage.getItem('themeBackground_class') || 'bg_luxury';
  });

  const [showHiddenContacts, setShowHiddenContacts] = useState(() => {
    return localStorage.getItem('showHiddenContacts_state') === 'true';
  });

  const [activeContact, setActiveContact] = useState<Contact | null>(INITIAL_CONTACTS[0] || null);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const [callHistory, setCallHistory] = useState<CallRecord[]>(INITIAL_CALL_RECORDS);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'contacts' | 'groups'>('chats');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [welcomeNotification, setWelcomeNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    senderName: string;
    senderAvatar: string;
    fullMsg: string;
  } | null>(null);

  const [reminders, setReminders] = useState<MessageReminder[]>(() => {
    try {
      const saved = localStorage.getItem('message_reminders_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('message_reminders_list', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      let updated = false;
      const nextReminders = reminders.map(r => {
        if (!r.triggered && r.remindAt <= now) {
          updated = true;
          
          // Request permission dynamically just in case
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }

          // Trigger browser notification
          showBrowserNotification({
            title: `⏰ تذكير بالرسالة من ${r.senderName}`,
            body: r.messageText,
            tag: `reminder-${r.id}`
          });

          // In-app alert / custom notification
          setWelcomeNotification({
            show: true,
            title: `⏰ تذكير بميعاد الرسالة`,
            message: r.messageText,
            senderName: r.senderName,
            senderAvatar: '⏰',
            fullMsg: `تنبيه بالتذكير\n\nتذكير بالرسالة من ${r.senderName}\n\nنص الرسالة المنبه عنها: "${r.messageText}"`
          });

          // Play a nice sound
          try {
            sounds.playNotification();
          } catch (e) {
            console.warn("Could not play notification sound:", e);
          }

          return { ...r, triggered: true };
        }
        return r;
      });

      if (updated) {
        setReminders(nextReminders);
      }
    };

    const interval = setInterval(checkReminders, 2500);
    return () => clearInterval(interval);
  }, [reminders]);


  // Firebase Firestore Real-Time Subscriptions & Auto-Seeding
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    if (!currentUser.id) return;
    // A. Sync Current User Profile
    const userDocRef = doc(db, 'users', currentUser.id);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        setCurrentUser(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(userData)) {
            return { ...prev, ...userData } as any;
          }
          return prev;
        });
      } else {
        // Create initial profile in Firestore for new user if it doesn't exist
        setDoc(userDocRef, currentUser).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}`);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.id}`);
    });

    return () => {
      unsubscribeUser();
    };
  }, [currentUser.id]);

  useEffect(() => {
    // B. Sync Contacts
    const contactsColRef = collection(db, 'contacts');
    const unsubscribeContacts = onSnapshot(contactsColRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          INITIAL_CONTACTS.forEach((contact) => {
            const docRef = doc(db, 'contacts', contact.id);
            batch.set(docRef, contact);
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'contacts');
        }
      } else {
        const list: Contact[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Contact);
        });

        // Ensure new admin contacts are written to Firestore if not already present
        const hasAdmin1 = list.some((c) => c.id === '1007363904');
        const hasAdmin2 = list.some((c) => c.id === '139213');
        if (!hasAdmin1 || !hasAdmin2) {
          try {
            const batch = writeBatch(db);
            INITIAL_CONTACTS.forEach((contact) => {
              if (contact.id === '1007363904' || contact.id === '139213') {
                const docRef = doc(db, 'contacts', contact.id);
                batch.set(docRef, contact);
              }
            });
            batch.commit().catch(err => console.error("Batch commit failed", err));
          } catch (error) {
            console.error("Error seeding new admins:", error);
          }
        }

        setContacts(list);
        setDbConnected(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'contacts');
    });

    // C. Sync Messages
    const messagesColRef = collection(db, 'messages');
    const unsubscribeMessages = onSnapshot(messagesColRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          INITIAL_MESSAGES.forEach((msg) => {
            const docRef = doc(db, 'messages', msg.id);
            batch.set(docRef, msg);
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'messages');
        }
      } else {
        const list: Message[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Message);
        });

        // Ensure welcome messages from the new admins are seeded if missing
        const hasMsg12 = list.some((m) => m.id === 'm12');
        const hasMsg13 = list.some((m) => m.id === 'm13');
        if (!hasMsg12 || !hasMsg13) {
          try {
            const batch = writeBatch(db);
            INITIAL_MESSAGES.forEach((msg) => {
              if (msg.id === 'm12' || msg.id === 'm13') {
                const docRef = doc(db, 'messages', msg.id);
                batch.set(docRef, msg);
              }
            });
            batch.commit().catch(err => console.error("Batch commit failed for messages", err));
          } catch (error) {
            console.error("Error seeding new admin messages:", error);
          }
        }

        setMessages(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });

    // D. Sync Calls
    const callsColRef = collection(db, 'calls');
    const unsubscribeCalls = onSnapshot(callsColRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          INITIAL_CALL_RECORDS.forEach((call) => {
            const docRef = doc(db, 'calls', call.id);
            batch.set(docRef, call);
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'calls');
        }
      } else {
        const list: CallRecord[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CallRecord);
        });
        setCallHistory(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'calls');
    });

    return () => {
      unsubscribeContacts();
      unsubscribeMessages();
      unsubscribeCalls();
    };
  }, []);

  // Listen to Supabase Auth changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = session.user;
          handleLoginSuccess({
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'مستخدم Google',
            avatar: u.user_metadata?.avatar_url || '👤',
            email: u.email || '',
            avatarType: u.user_metadata?.avatar_url ? 'image_url' : 'emoji',
            avatarUrl: u.user_metadata?.avatar_url || '',
            isGoogleLinked: true,
            googleEmail: u.email || '',
            status: 'online',
            role: 'مستخدم مسجل'
          });
        }
      } catch (err) {
        console.error("Error checking Supabase session:", err);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        handleLoginSuccess({
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'مستخدم Google',
          avatar: u.user_metadata?.avatar_url || '👤',
          email: u.email || '',
          avatarType: u.user_metadata?.avatar_url ? 'image_url' : 'emoji',
          avatarUrl: u.user_metadata?.avatar_url || '',
          isGoogleLinked: true,
          googleEmail: u.email || '',
          status: 'online',
          role: 'مستخدم مسجل'
        });
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn_state');
        localStorage.removeItem('currentUser_profile');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('themeBackground_class', themeBackground);
  }, [themeBackground]);

  useEffect(() => {
    if (isLoggedIn) {
      requestNotificationPermission().catch(console.error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('showHiddenContacts_state', showHiddenContacts ? 'true' : 'false');
  }, [showHiddenContacts]);

  // Network connection state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastType('success');
      setToastMessage('🟢 تم استعادة الاتصال بالشبكة بنجاح!');
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastType('error');
      setToastMessage('🔴 انقطع الاتصال بالشبكة! تم تفعيل وضع عدم الاتصال.');
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => {
      const nextState = !prev;
      setToastType(nextState ? 'error' : 'success');
      setToastMessage(
        nextState 
          ? '🔴 تم قطع الاتصال بالشبكة (وضع المحاكاة نشط).' 
          : '🟢 تم استعادة الاتصال بالشبكة بنجاح!'
      );
      setTimeout(() => setToastMessage(null), 4000);
      return nextState;
    });
  };
  
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
            const peerSenderName = peerMsg.senderName || 'الطرف الآخر';
            setMessages((prev) => [
              ...prev,
              {
                id: `real_${Date.now()}`,
                senderId: data.clientId,
                senderName: peerSenderName,
                text: peerMsg.text,
                type: peerMsg.type || 'text',
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              }
            ]);
            sounds.playMessageReceivedSound();
            showBrowserNotification({
              title: peerSenderName,
              body: peerMsg.text || 'أرسل رسالة جديدة 💬',
              tag: `msg_${data.clientId}`,
            });
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
    
    const handleGoogleOAuth = () => {
      console.log('Google OAuth Flow initiated.');
    };
    window.addEventListener('triggerGoogleOAuth', handleGoogleOAuth);

    const handleLogout = () => {
      firebaseLogout().catch(err => console.error("Firebase logout error:", err));
      supabase.auth.signOut().catch(err => console.error("Supabase logout error:", err));
      setIsLoggedIn(false);
      setShowLogin(false);
      localStorage.removeItem('isLoggedIn_state');
      localStorage.removeItem('currentUser_profile');
      setCurrentUser({
        id: '',
        name: '',
        avatar: '👤',
        email: '',
        avatarType: 'emoji' as 'emoji' | 'image_url',
        avatarUrl: '',
        isGoogleLinked: false,
        googleEmail: '',
        status: 'offline' as 'online' | 'offline' | 'away',
        role: ''
      });
    };
    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('addContact', handleAddContact);
      window.removeEventListener('triggerGoogleOAuth', handleGoogleOAuth);
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  // Format call duration for log saving
  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${remainingSecs < 10 ? `0${remainingSecs}` : remainingSecs}`;
  };

  // Add emoji reaction to a message and sync to Firestore
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || [];
          const updatedReactions = currentReactions.includes(emoji)
            ? currentReactions.filter((r) => r !== emoji)
            : [...currentReactions, emoji];
          
          const updatedMsg = { ...m, reactions: updatedReactions };
          
          try {
            setDoc(doc(db, 'messages', messageId), updatedMsg, { merge: true }).catch((err) => {
              console.error("Failed to sync reaction to Firestore:", err);
            });
          } catch (err) {
            console.error("Firestore reaction write error:", err);
          }
          return updatedMsg;
        }
        return m;
      })
    );
  };

  // Orcherstrate sending a message and triggering a response from Gemini
  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'voice' | 'file' | 'video' = 'text', extra: any = {}) => {
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
      mediaUrl: extra.mediaUrl || '',
      duration: extra.duration || 0,
      fileName: extra.fileName || '',
      fileSize: extra.fileSize || '',
      status: 'sent',
    };

    // Update message state & write to Firestore
    setMessages((prev) => [...prev, newMsg]);
    sounds.playMessageSentSound();
    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      // Sync to Supabase asynchronously
      syncMessageToSupabase(newMsg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messages/${newMsg.id}`);
    }

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

    // Trigger typing response simulation & write to Firestore
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, status: 'typing' } : c))
    );
    try {
      await updateDoc(doc(db, 'contacts', activeContact.id), { status: 'typing' });
    } catch (err) {
      // Non-blocking fallback if custom contact doesn't exist yet
    }

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
        showBrowserNotification({
          title: replyMsg.senderName,
          body: replyMsg.text || 'أرسل رسالة جديدة 💬',
          tag: `msg_${responderId}`,
        });
        try {
          await setDoc(doc(db, 'messages', replyMsg.id), replyMsg);
          // Sync to Supabase asynchronously
          syncMessageToSupabase(replyMsg);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `messages/${replyMsg.id}`);
        }

      } catch (error) {
        console.error("Error receiving reply:", error);
      } finally {
        // Set contact back to online & write to Firestore
        setContacts((prev) =>
          prev.map((c) => (c.id === activeContact.id ? { ...c, status: 'online' } : c))
        );
        try {
          await updateDoc(doc(db, 'contacts', activeContact.id), { status: 'online' });
        } catch (err) {
          // Non-blocking
        }
      }
    }, 2500);
  };

  // Firestore Data Manipulation Helper handlers
  const handleUpdateCurrentUser = async (updated: any) => {
    try {
      await setDoc(doc(db, 'users', 'main_profile'), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/main_profile');
    }
  };

  const handleUpdateContacts = async (updatedList: Contact[]) => {
    try {
      const updatedIds = new Set(updatedList.map(c => c.id));
      const deletedContacts = contacts.filter(c => !updatedIds.has(c.id));
      
      const batch = writeBatch(db);
      updatedList.forEach(contact => {
        const docRef = doc(db, 'contacts', contact.id);
        batch.set(docRef, contact);
      });
      deletedContacts.forEach(contact => {
        const docRef = doc(db, 'contacts', contact.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contacts');
    }
  };

  const saveCallRecordToFirestore = async (newRecord: CallRecord) => {
    try {
      await setDoc(doc(db, 'calls', newRecord.id), newRecord);
      // Sync to Supabase asynchronously
      syncCallToSupabase(newRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `calls/${newRecord.id}`);
    }
  };

  const updateCallDurationInFirestore = async (recordId: string, durationStr: string) => {
    try {
      await updateDoc(doc(db, 'calls', recordId), { duration: durationStr });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `calls/${recordId}`);
    }
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
          saveCallRecordToFirestore(newRecord);
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
    saveCallRecordToFirestore(newRecord);

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
      saveCallRecordToFirestore(newRecord);
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
    if (callState.contact && activeSecs > 0 && callHistory.length > 0) {
      const lastRecordId = callHistory[0].id;
      const durationStr = formatCallDuration(activeSecs);
      updateCallDurationInFirestore(lastRecordId, durationStr);
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

  const THEME_CLASSES: Record<string, string> = {
    bg_luxury: "bg-[#0A0A09] text-[#F5F5F3] dark-theme-active",
    bg_obsidian: "bg-[#000000] text-[#E5E7EB] dark-theme-active",
    bg_gold: "bg-[#141310] text-[#F3EFE0] dark-theme-active",
    bg_cream: "bg-[#FAF9F6] text-[#2D2D2D]",
    bg_olive: "bg-[#F0F2EB] text-[#2D2D2D]"
  };

  const currentBgClass = THEME_CLASSES[themeBackground] || THEME_CLASSES.bg_luxury;

  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn_state', 'true');
    localStorage.setItem('currentUser_profile', JSON.stringify(user));

    if (user.importedContacts && user.importedContacts.length > 0) {
      setContacts((prev) => {
        const baseContacts = prev.filter(c => !c.id.startsWith('g') && !c.id.startsWith('google_'));
        return [...user.importedContacts, ...baseContacts];
      });
    }

    // Automated custom welcome message trigger on first login
    const welcomeKey = `welcome_sent_${user.id}`;
    if (!localStorage.getItem(welcomeKey)) {
      localStorage.setItem(welcomeKey, 'true');

      // Formulate a beautiful personalized greeting based on user profile details
      const greeting = `أهلاً بك يا ${user.name || 'العضو الكريم'} في منصة SNNS.PRO المعتمدة! 🛡️✨`;
      const details = `يسعدنا جداً انضمامك إلينا بصفة [${user.role || 'عضو جديد'}]. نؤكد لك أن حسابك المرتبط بالبريد الإلكتروني (${user.email || 'guest@snns.pro'}) آمن بالكامل ومحمي بطبقة تشفير معتمدة 256-bit SSL ومطابق تماماً لكل مواصفات منصة Google Cloud Console.`;
      const adminPromise = `أنا الأدمن 1007363904، المشرف الرئيسي للرقابة والدعم هنا. مهمتي التأكد من توفير تجربة خالية من الإساءات والرد على جميع شكاواك وبلاغاتك في أسرع وقت. يمكنك دائماً بدء محادثة أو مكالمة WebRTC معي أو مع فريق الدعم في أي وقت!`;
      const fullText = `${greeting}\n\n${details}\n\n${adminPromise}`;

      const welcomeMsg: Message = {
        id: `welcome_${user.id}_${Date.now()}`,
        senderId: '1007363904', // The main admin
        senderName: 'الأدمن 1007363904',
        text: fullText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        status: 'read'
      };

      // Play soft greeting sound and show premium welcome modal
      setTimeout(() => {
        try {
          sounds.playMessageReceivedSound();
        } catch (e) {
          console.warn("Audio synthesizer not ready yet:", e);
        }
        setWelcomeNotification({
          show: true,
          title: 'رسالة ترحيب مخصصة وتأكيد الأمان',
          message: greeting,
          senderName: 'الأدمن 1007363904',
          senderAvatar: '🛡️',
          fullMsg: fullText
        });
      }, 1200);

      // Append to state messages
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some(m => m.id.startsWith(`welcome_${user.id}`))) {
          return prev;
        }
        return [...prev, welcomeMsg];
      });

      // Persist to Firestore if available
      try {
        await setDoc(doc(db, 'messages', welcomeMsg.id), welcomeMsg);
        syncMessageToSupabase(welcomeMsg);
      } catch (err) {
        console.warn("Firestore welcome write bypassed:", err);
      }
    }
  };

  const handleGuestBypass = () => {
    handleLoginSuccess({
      id: 'guest_user',
      name: 'عبدالله العتيبي (ضيف)',
      avatar: '👤',
      email: 'guest@snns.pro',
      avatarType: 'emoji',
      avatarUrl: '',
      isGoogleLinked: false,
      googleEmail: '',
      status: 'online',
      role: 'زائر منصة'
    });
  };

  if (!isLoggedIn) {
    if (showLogin) {
      return (
        <div className="relative">
          {/* Back to landing page button floating on top */}
          <button 
            onClick={() => setShowLogin(false)} 
            className="fixed top-6 left-6 z-[60] bg-[#121211] hover:bg-[#1C1C1A] border border-[#2E2E2A]/60 text-[#C5A059] px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xl cursor-pointer border-b-2 border-[#C5A059]/40"
          >
            <span>العودة للرئيسية</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
      );
    }
    return (
      <LandingPage 
        onNavigateToLogin={() => setShowLogin(true)} 
        onNavigateToGuest={handleGuestBypass}
      />
    );
  }

  const currentLangCode = currentUser.language || 'ar';
  const currentLanguageObj = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];
  const appDir = currentLanguageObj.dir;

  return (
    <div className={`w-screen h-screen flex flex-col ${currentBgClass} overflow-hidden font-sans select-none`} dir={appDir}>
      
      {/* Top Main App Navigation Frame Bar - Luxury Dark Gold theme */}
      <div className="bg-[#0B0B0A] p-3.5 border-b border-[#2E2E2A]/70 flex items-center justify-between select-none px-4 shadow-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1C1C1A] border border-[#C5A059]/40 rounded-xl flex items-center justify-center shadow-lg">
            <BrandLogo size="sm" showText={false} />
          </div>
          <div className="text-right">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-wide text-white flex items-center gap-2">
              منصة الاتصالات والرقابة المشفرة <span className="text-[#C5A059] font-black">SNNS.PRO</span>
              <span className="text-[9px] bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/35 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">آمن ومعتمد</span>
            </h1>
            <p className="text-[10px] text-[#A89F91] font-semibold">نظام المراقبة الفورية ومكافحة التجاوزات والبلاغات</p>
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
              className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:bg-emerald-900/40"
              title="نسخ رابط دعوة الغرفة"
            >
              <span className="animate-pulse text-emerald-400">🟢</span>
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
              className="bg-gradient-to-r from-[#8A6E35] to-[#C5A059] hover:brightness-110 active:scale-95 text-stone-950 text-[11px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-[#E6C15C]/30"
              title="إنشاء غرفة اتصال مرئي ومراسلة حقيقية"
            >
              🌐 اتصال حقيقي (غرفة WebRTC)
            </button>
          )}

          {/* Admin Control Center Trigger */}
          {(currentUser.id === '1007363904' || currentUser.id === '139213' || currentUser.name?.includes('الأدمن') || currentUser.role?.includes('الأدمن')) && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer border border-amber-500/30"
              title="فتح لوحة تحكم الرقابة والمراقبة التامة (خاص بالأدمن)"
            >
              🛡️ لوحة الرقابة والتحكم
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 bg-[#121211] px-3 py-1.5 rounded-xl border border-[#2E2E2A]/60 text-xs">
            <Laptop className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[#A89F91] font-extrabold text-[11px]">سطح المكتب</span>
            <span className="text-[#2E2E2A]">|</span>
            <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[#A89F91] font-extrabold text-[11px]">الجوال</span>
          </div>

          {/* DOWNLOAD SECURITY APP BUTTON */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="bg-gradient-to-r from-[#8A6E35] to-[#C5A059] hover:brightness-110 active:scale-95 text-stone-950 text-[10px] sm:text-xs font-black px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all shadow-md cursor-pointer border border-[#E6C15C]/30"
            title={currentLangCode === 'ar' ? 'تحميل تطبيق الجوال والكمبيوتر المشفر' : 'Download Secure App'}
          >
            <Download className="w-3.5 h-3.5 text-stone-950 animate-bounce" />
            <span>{currentLangCode === 'ar' ? 'تحميل التطبيق' : 'Download App'}</span>
          </button>

          <button 
            onClick={toggleSimulateOffline}
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              isSimulatedOffline || !isOnline
                ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
                : 'bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20'
            }`}
            title={(isSimulatedOffline || !isOnline) ? "محاكاة إعادة الاتصال بالشبكة" : "محاكاة قطع الاتصال بالشبكة"}
          >
            {isSimulatedOffline || !isOnline ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4 text-[#C5A059]" />}
            <span className="text-[10px] font-black hidden md:inline">
              {isSimulatedOffline || !isOnline ? 'منقطع' : 'متصل آمن'}
            </span>
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20' 
                : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
            }`}
            title={soundEnabled ? "كتم أصوات التطبيق" : "تفعيل أصوات التطبيق"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C5A059] animate-pulse" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Hamburger to slide Sidebar on mobile manually */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2.5 hover:bg-[#1C1C1A] rounded-xl border border-[#2E2E2A]/70 text-stone-300"
            title="القائمة الجانبية"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Network Status Banner */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md transition-all duration-300 shrink-0">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-amber-200 animate-pulse shrink-0" />
            <div className="text-right">
              <span className="font-extrabold text-xs sm:text-sm">وضع عدم الاتصال بالشبكة نشط حالياً</span>
              <p className="text-[10px] sm:text-xs text-amber-100 font-medium">بعض الميزات المباشرة مثل مكالمات WebRTC والمزامنة الحية قد لا تعمل حتى تتم إعادة الاتصال بالشبكة.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (isSimulatedOffline) {
                toggleSimulateOffline();
              } else {
                alert("يرجى التحقق من اتصال الإنترنت لجهازك لإعادة الاتصال تلقائياً.");
              }
            }}
            className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-colors border border-white/20 whitespace-nowrap"
          >
            {isSimulatedOffline ? 'إعادة الاتصال (إنهاء المحاكاة)' : 'فحص الاتصال'}
          </button>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 transition-all duration-300 ${
            toastType === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toastType === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="text-lg shrink-0">
              {toastType === 'success' ? '✨' : toastType === 'error' ? '⚠️' : 'ℹ️'}
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-extrabold">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-[10px] font-bold text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded-md hover:bg-gray-100 shrink-0"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

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
            currentUser={currentUser}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            themeBackground={themeBackground}
            onUpdateThemeBackground={setThemeBackground}
            showHiddenContacts={showHiddenContacts}
            onToggleShowHiddenContacts={setShowHiddenContacts}
            onUpdateContacts={handleUpdateContacts}
          />
        </div>

        {/* CHAT AREA CONTAINER */}
        <div className="flex-1 h-full overflow-hidden">
          <ChatArea
            activeContact={activeContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            onReactToMessage={handleReactToMessage}
            onStartCall={handleStartCall}
            onBackToSidebar={() => setSidebarOpen(true)}
            isRealMode={!!roomId}
            roomId={roomId || undefined}
            currentUser={currentUser as any}
            reminders={reminders}
            onAddReminder={(reminder) => setReminders(prev => [reminder, ...prev])}
            onCancelReminder={(reminderId) => setReminders(prev => prev.filter(r => r.id !== reminderId))}
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

      {/* ADMIN CONTROL PANEL OVERLAY */}
      {showAdminPanel && (
        <AdminPanel
          currentUser={currentUser as any}
          onClose={() => setShowAdminPanel(false)}
          contacts={contacts}
        />
      )}

      {/* DOWNLOAD SECURE APP MODAL OVERLAY */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        currentUserLanguage={currentUser.language}
      />

      {/* AUTOMATED WELCOME NOTIFICATION OVERLAY */}
      {welcomeNotification && welcomeNotification.show && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 animate-fadeIn" dir="rtl">
          <div className="bg-[#0C0C0E] border-2 border-amber-400/30 rounded-[32px] p-6 sm:p-8 max-w-xl w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.25)] select-text">
            
            {/* Elegant luxury top glow */}
            <div className="absolute top-[-30%] left-1/4 right-1/4 h-36 bg-gradient-to-b from-amber-400/20 to-transparent blur-2xl pointer-events-none"></div>
            
            {/* Crown or shield top emblem */}
            <div className="flex justify-center mb-6 relative z-10">
              <div className="w-16 h-16 bg-stone-900 border-2 border-amber-400 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
                <span className="text-3xl">🛡️</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
              {welcomeNotification.title}
            </h2>
            
            {/* Sub-badge highlighting user identity */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs text-amber-400 font-bold mb-6">
              <span>رتبة الحساب:</span>
              <strong className="underline decoration-amber-400">{currentUser.role || 'عضو معتمد'}</strong>
              <span className="text-stone-600">|</span>
              <span>المعرّف الفريد:</span>
              <span className="font-mono text-[10px]">{currentUser.id || 'guest_user'}</span>
            </div>

            <div className="bg-[#101012] border border-stone-800 rounded-2xl p-5 sm:p-6 text-right space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
              <p className="text-sm font-black text-white leading-relaxed">
                {welcomeNotification.message}
              </p>
              
              <div className="border-t border-stone-800/80 pt-4 space-y-3">
                <span className="block text-[10px] bg-stone-900 text-stone-400 border border-stone-800 px-2 py-1 rounded w-fit font-bold">معلومات تسجيل الدخول والامتثال:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                    <span className="block text-[10px] text-stone-500 font-bold mb-0.5">البريد الإلكتروني المعتمد</span>
                    <span className="font-mono text-stone-300 font-bold">{currentUser.email || 'guest@snns.pro'}</span>
                  </div>
                  <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                    <span className="block text-[10px] text-stone-500 font-bold mb-0.5">بروتوكول الأمان والتحقق</span>
                    <span className="text-emerald-400 font-extrabold">Google Cloud Verified 🟢</span>
                  </div>
                </div>

                <p className="text-xs text-stone-400 leading-relaxed pt-2">
                  {welcomeNotification.fullMsg.split('\n\n')[2]}
                </p>
              </div>
            </div>

            {/* Acknowledgment Controls */}
            <div className="space-y-3 relative z-10">
              <button
                onClick={() => {
                  try {
                    sounds.playMessageSentSound();
                  } catch (e) {
                    // bypass
                  }
                  setWelcomeNotification(null);
                }}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500 text-stone-950 font-black text-sm rounded-2xl shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_4px_30px_rgba(212,175,55,0.6)] active:scale-95 transition-all cursor-pointer border border-amber-300/30"
              >
                الدخول إلى منصة الاتصالات والرقابة 🚀
              </button>
              
              <p className="text-[10px] text-stone-500 font-medium">
                بضغطك على الزر أعلاه، فإنك توافق على الالتزام بـ <a href="https://snns.pro/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">سياسة الخصوصية</a> وحوكمة عدم الإساءة في SNNS.PRO.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 🌐 FIRST-TIME LOGIN LANGUAGE SELECTION MODAL */}
      {isLoggedIn && !currentUser.language && (
        <div className="fixed inset-0 bg-[#0A0A09]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#121211] border-2 border-[#C5A059]/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-center p-6 sm:p-8 space-y-6 animate-fadeIn relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-[#1C1C1A] border-2 border-[#C5A059] rounded-2xl flex items-center justify-center shadow-lg text-4xl animate-bounce">
                🌐
              </div>
              <h2 className="text-xl font-extrabold text-white mt-2">اختر لغتك / Choose Your Language</h2>
              <p className="text-xs text-[#A8A293]">يرجى تحديد لغتك المفضلة لتصفح واستعمال منصة SNNS.PRO الآمنة</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[45vh] overflow-y-auto p-1.5 custom-scrollbar">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    const updatedUser = { ...currentUser, language: lang.code };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('currentUser_profile', JSON.stringify(updatedUser));
                    setDoc(doc(db, 'users', currentUser.id || 'main_profile'), updatedUser).catch(err => {
                      console.error("Failed to update user language in Firestore:", err);
                    });
                  }}
                  className="p-3.5 bg-[#1C1C1A] hover:bg-[#2E2E2A]/60 border border-[#2E2E2A] hover:border-[#C5A059]/50 rounded-xl flex items-center gap-2.5 transition text-right group cursor-pointer"
                >
                  <span className="text-2xl select-none group-hover:scale-110 transition shrink-0">{lang.flag}</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-white group-hover:text-[#C5A059] transition truncate">{lang.nativeName}</span>
                    <span className="text-[10px] text-[#A8A293] truncate">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="pt-2 text-stone-500 text-[10px]">
              يمكنك دائماً تغيير لغتك المفضلة لاحقاً من قسم الملف الشخصي والإعدادات.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
