import { useState, useEffect, useRef } from 'react';
import { Contact, Message, CallRecord, CallState } from './types';
import { INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_CALL_RECORDS } from './data';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VideoCallScreen from './components/VideoCallScreen';
import LoginScreen from './components/LoginScreen';
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
import { syncUserToSupabase, syncMessageToSupabase, syncCallToSupabase } from './lib/supabase';
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
  WifiOff
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
      role: ''
    };
  });

  const [themeBackground, setThemeBackground] = useState(() => {
    return localStorage.getItem('themeBackground_class') || 'bg_cream';
  });

  const [showHiddenContacts, setShowHiddenContacts] = useState(() => {
    return localStorage.getItem('showHiddenContacts_state') === 'true';
  });

  const [activeContact, setActiveContact] = useState<Contact | null>(INITIAL_CONTACTS[0] || null);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const [callHistory, setCallHistory] = useState<CallRecord[]>(INITIAL_CALL_RECORDS);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'contacts'>('chats');

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

  useEffect(() => {
    localStorage.setItem('themeBackground_class', themeBackground);
  }, [themeBackground]);

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
    
    const handleGoogleOAuth = () => {
      console.log('Google OAuth Flow initiated.');
    };
    window.addEventListener('triggerGoogleOAuth', handleGoogleOAuth);

    const handleLogout = () => {
      setIsLoggedIn(false);
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
    bg_cream: "bg-[#FAF9F6] text-[#2D2D2D]",
    bg_olive: "bg-[#F0F2EB] text-[#2D2D2D]",
    bg_lavender: "bg-[#F4F1F7] text-[#2D2D2D]",
    bg_sakura: "bg-[#FAF5F6] text-[#2D2D2D]",
    bg_cosmic: "bg-[#14121A] text-[#FAF9F6] dark-theme-active"
  };

  const currentBgClass = THEME_CLASSES[themeBackground] || THEME_CLASSES.bg_cream;

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn_state', 'true');
    localStorage.setItem('currentUser_profile', JSON.stringify(user));
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`w-screen h-screen flex flex-col ${currentBgClass} overflow-hidden font-sans select-none`} dir="rtl">
      
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
            onClick={toggleSimulateOffline}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              isSimulatedOffline || !isOnline
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
                : 'bg-[#556B2F]/10 border-[#556B2F]/30 text-[#556B2F] hover:bg-[#556B2F]/20'
            }`}
            title={(isSimulatedOffline || !isOnline) ? "محاكاة إعادة الاتصال بالشبكة" : "محاكاة قطع الاتصال بالشبكة"}
          >
            {isSimulatedOffline || !isOnline ? <WifiOff className="w-4 h-4 text-rose-600" /> : <Wifi className="w-4 h-4 text-[#556B2F]" />}
            <span className="text-[10px] font-extrabold hidden md:inline">
              {isSimulatedOffline || !isOnline ? 'منقطع' : 'متصل بالشبكة'}
            </span>
          </button>

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
