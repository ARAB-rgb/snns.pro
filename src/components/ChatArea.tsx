import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message } from '../types';
import { 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image as ImageIcon, 
  File as FileIcon, 
  Check, 
  CheckCheck, 
  ChevronLeft, 
  MoreVertical, 
  User, 
  Play, 
  Pause, 
  X,
  Volume2,
  AlertTriangle
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface ChatAreaProps {
  activeContact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice' | 'file', extra?: any) => void;
  onStartCall: (contact: Contact, type: 'video' | 'audio') => void;
  onBackToSidebar: () => void; // for responsive mobile view
  isRealMode?: boolean;
  roomId?: string | null;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    role: string;
  };
}

export interface WallpaperOption {
  id: string;
  name: string;
  className: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  { id: 'olive', name: 'الحديقة الزيتونية', className: "bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200')] bg-cover bg-blend-overlay bg-[#FAF9F6]/95" },
  { id: 'beige', name: 'البيج الكلاسيكي', className: "bg-[url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200')] bg-cover bg-blend-overlay bg-[#FAF9F6]/93" },
  { id: 'lavender', name: 'ضباب الخزامى', className: "bg-[url('https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1200')] bg-cover bg-blend-overlay bg-[#F5F2F9]/95" },
  { id: 'cosmic', name: 'الغبار الكوني', className: "bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200')] bg-cover bg-blend-overlay bg-[#FAF9F6]/90" },
  { id: 'slate', name: 'رمادي هادئ', className: "bg-[#E5E1D8]/20" }
];

const EMOJI_LIST = ['😀', '😂', '🤣', '👍', '🙏', '❤️', '🔥', '🎉', '💡', '🌹', '💻', '🚗', '🤔', '👀', '👌', '🤝'];

export default function ChatArea({
  activeContact,
  messages,
  onSendMessage,
  onStartCall,
  onBackToSidebar,
  isRealMode = false,
  roomId = null,
  currentUser
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [soundLevel, setSoundLevel] = useState(0);
  const [isUsingSimulation, setIsUsingSimulation] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState(() => localStorage.getItem('chatWallpaper') || 'olive');
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  
  // States for complaint/report center
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordTimerRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio/recording resources
  const cleanupRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch (e) {
      console.warn("Error closing AudioContext:", e);
    }
    audioContextRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    setSoundLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContact]);

  // Voice recording timer simulator
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  if (!activeContact) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#FAF9F6] text-[#2D2D2D] p-8 select-none text-center">
        <div className="w-24 h-24 rounded-full bg-[#E5E1D8] border border-[#E5E1D8] flex items-center justify-center text-4xl mb-6 shadow-xl text-[#556B2F] animate-pulse">
          💬
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">تطبيق المراسلات والمكالمات المتكامل</h2>
        <p className="text-sm text-[#A8A293] max-w-sm leading-relaxed">
          اختر جهة اتصال أو مجموعة من القائمة الجانبية لبدء المراسلة ومحاكاة مكالمات الصوت والفيديو بجودة عالية شبيهة بـ تيمز وواتساب.
        </p>
        <div className="mt-8 px-4 py-2 bg-[#556B2F]/10 border border-[#556B2F]/20 rounded-full text-xs text-[#556B2F] flex items-center gap-2 font-bold">
          <Volume2 className="w-3.5 h-3.5" />
          <span>يدعم المؤثرات الصوتية والتقاط الكاميرا الحقيقية</span>
        </div>
      </div>
    );
  }

  // Filter messages belonging only to the selected conversation flow
  const filteredMessages = messages.filter(m => {
    if (activeContact.isGroup) {
      // Group message logic: either it belongs to the group directly, or sent inside group
      return m.id.startsWith(activeContact.id) || m.id.endsWith(activeContact.id);
    } else {
      // Individual chat: messages between me and contact
      return (m.senderId === activeContact.id && !m.id.includes('group_')) || 
             (m.senderId === 'me' && m.id.includes(`_${activeContact.id}`));
    }
  });

  const handleSendComplaint = async () => {
    if (!complaintText.trim()) {
      alert('يرجى كتابة تفاصيل الشكوى أو البلاغ أولاً.');
      return;
    }
    setSubmittingComplaint(true);
    try {
      const complaintId = `complaint_${Date.now()}`;
      const complaintsCol = collection(db, 'complaints');
      await setDoc(doc(complaintsCol, complaintId), {
        id: complaintId,
        text: complaintText,
        userId: currentUser.id || 'anonymous',
        userName: currentUser.name || 'مستعمل مجهول',
        userEmail: currentUser.email || '',
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      alert('✨ تم تقديم الشكوى/البلاغ للإدارة بنجاح وجاري تدقيقه وحسمه من المشرفين.');
      setComplaintText('');
      setShowComplaintModal(false);
    } catch (err: any) {
      console.error(err);
      alert(`⚠️ خطأ أثناء تقديم البلاغ: ${err.message || String(err)}`);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  // Trigger microphone recording with real MediaRecorder or simulation fallback
  const startVoiceRecording = async () => {
    setIsUsingSimulation(false);
    setSoundLevel(0);
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported on this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsRecording(true);
      sounds.playMessageSentSound(); // micro audio feedback

      // Set up MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.start();

      // Set up Audio Analyser for live visualizer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setSoundLevel(average); // typically ranges from 0 to 255
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      }
    } catch (error) {
      console.warn("Microphone access failed, falling back to simulation:", error);
      // Fallback to simulation
      setIsRecording(true);
      setIsUsingSimulation(true);
      sounds.playMessageSentSound();
    }
  };

  const cancelVoiceRecording = () => {
    cleanupRecording();
    setIsRecording(false);
  };

  const finishVoiceRecording = () => {
    if (isUsingSimulation) {
      setIsRecording(false);
      onSendMessage(`رسالة صوتية محاكاة (${recordingSeconds} ثانية)`, 'voice', { duration: recordingSeconds });
      cleanupRecording();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Send actual recording
        onSendMessage(`رسالة صوتية (${recordingSeconds} ثانية)`, 'voice', { 
          duration: recordingSeconds || 1,
          mediaUrl: audioUrl
        });
        cleanupRecording();
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(false);
      cleanupRecording();
    }
  };

  // Plays a real recorded voice note or simulation fallback
  const playVoiceNote = (id: string, mediaUrl?: string, duration?: number) => {
    if (playingVoiceId === id) {
      // Pause/Stop
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const simTimer = (window as any)[`voice_timer_${id}`];
      if (simTimer) {
        clearTimeout(simTimer);
        delete (window as any)[`voice_timer_${id}`];
      }
      setPlayingVoiceId(null);
    } else {
      // Stop previously playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (playingVoiceId) {
        const prevTimer = (window as any)[`voice_timer_${playingVoiceId}`];
        if (prevTimer) {
          clearTimeout(prevTimer);
          delete (window as any)[`voice_timer_${playingVoiceId}`];
        }
      }

      setPlayingVoiceId(id);

      if (mediaUrl) {
        // Play real recorded audio
        const audio = new Audio(mediaUrl);
        audioPlayerRef.current = audio;
        audio.play().catch(err => {
          console.warn("Audio play error:", err);
        });
        audio.onended = () => {
          setPlayingVoiceId(null);
        };
      } else {
        // Simulation fallback for mockup messages
        sounds.playConnectedSound();
        const simDuration = (duration || 3) * 1000;
        const timer = setTimeout(() => {
          setPlayingVoiceId(null);
          sounds.playDisconnectedSound();
        }, simDuration);
        (window as any)[`voice_timer_${id}`] = timer;
      }
    }
  };

  // Mock sending image attachment
  const simulateSendImage = () => {
    onSendMessage('صورة مرفقة', 'image', { 
      mediaUrl: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400&auto=format&fit=crop&q=60' 
    });
    setShowAttachmentMenu(false);
  };

  // Mock sending file attachment
  const simulateSendFile = () => {
    onSendMessage('ملف المشروع.pdf', 'file', {
      fileName: 'تقرير_التصميم_الفني_والتجاوب.pdf',
      fileSize: '2.4 MB'
    });
    setShowAttachmentMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F6] text-[#2D2D2D] select-none relative" dir="rtl">
      
      {/* Top Header Active Chat Info */}
      <div className="p-4 bg-[#FAF9F6] border-b border-[#E5E1D8] flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Back button for mobile view */}
          <button 
            onClick={onBackToSidebar}
            className="md:hidden p-2 hover:bg-[#E5E1D8] rounded-lg text-[#2D2D2D] transition ml-1"
            title="رجوع"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>

          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-2xl shadow-md select-none">
              {activeContact.avatar}
            </div>
            {activeContact.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#FAF9F6] rounded-full"></span>
            )}
            {activeContact.status === 'away' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-[#FAF9F6] rounded-full"></span>
            )}
          </div>

          <div className="text-right">
            <h3 className="font-bold text-sm text-[#2D2D2D] flex items-center gap-1.5">
              {activeContact.name}
              <span className="text-[10px] text-[#556B2F] bg-[#556B2F]/10 px-2 py-0.5 rounded-full font-bold">{activeContact.bio?.split('|')[0]}</span>
            </h3>
            <p className="text-[11px] text-[#A8A293]">
              {activeContact.status === 'typing' ? (
                <span className="text-[#556B2F] font-bold animate-pulse">يكتب الآن...</span>
              ) : (
                activeContact.status === 'online' ? 'نشط الآن' : 'غير متصل حالياً'
              )}
            </p>
          </div>
        </div>

        {/* Action icons like Teams and Imo for Video calls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStartCall(activeContact, 'video')}
            className="p-2.5 hover:bg-[#556B2F]/15 text-[#556B2F] hover:text-[#556B2F]/80 rounded-xl border border-[#556B2F]/20 bg-[#556B2F]/5 transition-colors shadow-sm flex items-center gap-1.5"
            title="اتصال مرئي تيمز / إيمو"
          >
            <Video className="w-4 h-4 text-[#556B2F]" />
            <span className="text-xs font-bold hidden sm:inline text-[#556B2F]">مكالمة فيديو</span>
          </button>
          <button
            onClick={() => onStartCall(activeContact, 'audio')}
            className="p-2.5 hover:bg-[#556B2F]/15 text-[#556B2F]/90 hover:text-[#556B2F]/75 rounded-xl border border-[#556B2F]/20 bg-[#556B2F]/5 transition-colors shadow-sm flex items-center gap-1.5"
            title="اتصال صوتي واتساب"
          >
            <Phone className="w-4 h-4 text-[#556B2F]/90" />
            <span className="text-xs font-bold hidden sm:inline text-[#556B2F]/90">صوتية</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
              className="p-2.5 hover:bg-[#E5E1D8] rounded-xl text-[#2D2D2D] transition-colors flex items-center gap-1 border border-[#E5E1D8] bg-white shadow-sm"
              title="تغيير خلفية الدردشة"
            >
              🎨 <span className="text-xs font-bold hidden md:inline text-[#2D2D2D]">الخلفيات</span>
            </button>
            
            {showWallpaperMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E5E1D8] rounded-2xl shadow-xl z-50 p-2 text-right animate-fadeIn">
                <p className="text-[11px] font-bold text-[#A8A293] px-2.5 py-1.5 border-b border-[#F2F0E9] mb-1">اختر خلفية للدردشة</p>
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => {
                      setChatWallpaper(wp.id);
                      localStorage.setItem('chatWallpaper', wp.id);
                      setShowWallpaperMenu(false);
                    }}
                    className={`w-full text-right px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      chatWallpaper === wp.id ? 'bg-[#556B2F]/10 text-[#556B2F] font-bold' : 'hover:bg-[#F2F0E9] text-[#2D2D2D]'
                    }`}
                  >
                    <span>{wp.name}</span>
                    {chatWallpaper === wp.id && <Check className="w-3.5 h-3.5 text-[#556B2F]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Complaint Button */}
          <button
            onClick={() => setShowComplaintModal(true)}
            className="p-2.5 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 border border-rose-200 bg-rose-50/30 shadow-sm cursor-pointer animate-pulse"
            title="تقديم شكوى أو بلاغ عن محتوى مسيء"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold hidden md:inline">تقديم بلاغ 🛡️</span>
          </button>
        </div>
      </div>

      {/* Messages Scrolling Container */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar transition-all duration-300 ${
        (WALLPAPERS.find(wp => wp.id === chatWallpaper) || WALLPAPERS[0]).className
      }`}>
        
        {isRealMode && (
          <div className="flex justify-center select-none animate-fadeIn mb-2">
            <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-4 py-1.5 rounded-full shadow-md border border-emerald-500 flex items-center gap-1.5 animate-pulse">
              🌐 اتصال حقيقي مباشر (رقم الغرفة: {roomId})
            </span>
          </div>
        )}

        {/* Info banner */}
        <div className="flex justify-center select-none">
          <span className="text-[10px] font-bold tracking-wider text-[#556B2F] bg-[#F2F0E9] px-3 py-1 rounded-full border border-[#E5E1D8] shadow-xs flex items-center gap-1">
            {isRealMode ? '⚡ الربط المباشر نشط (تبادل فوري للبيانات والصوت والفيديو)' : '🔒 تشفير متكامل من طرف لطرف (محاكاة واتساب الآمنة)'}
          </span>
        </div>

        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? 'justify-start text-right' : 'justify-end text-right'}`}
            >
              <div className="flex gap-2.5 max-w-[80%] items-end">
                {/* Avatar for remote participant */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-sm shadow-xs select-none text-[#2D2D2D]">
                    {msg.senderId === activeContact.id ? activeContact.avatar : '👤'}
                  </div>
                )}

                <div className={`rounded-2xl p-3 shadow-md relative flex flex-col ${
                  isMe 
                    ? 'bg-[#556B2F] text-white rounded-br-none shadow-[#556B2F]/10' 
                    : 'bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-bl-none'
                }`}>
                  {/* Sender name for group chats */}
                  {!isMe && activeContact.isGroup && (
                    <span className="text-[10px] font-extrabold text-[#556B2F] mb-1 block">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Rendering based on message types */}
                  {msg.type === 'text' && (
                    <p className="text-xs sm:text-sm leading-relaxed select-text font-normal">
                      {msg.text}
                    </p>
                  )}

                  {msg.type === 'image' && (
                    <div className="space-y-1">
                      <img 
                        src={msg.mediaUrl} 
                        alt="مرفق" 
                        referrerPolicy="no-referrer"
                        className="rounded-xl w-60 h-40 object-cover border border-[#E5E1D8] shadow-inner"
                      />
                      <span className="text-xs block text-[#A8A293] font-semibold italic">📸 صورة مرسلة</span>
                    </div>
                  )}

                  {msg.type === 'voice' && (
                    <div className={`flex items-center gap-3 w-56 p-1.5 rounded-xl border ${
                      isMe ? 'bg-black/10 border-white/10 text-white' : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#2D2D2D]'
                    }`}>
                      <button
                        onClick={() => playVoiceNote(msg.id, msg.mediaUrl, msg.duration)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                          playingVoiceId === msg.id 
                            ? 'bg-[#556B2F] text-white' 
                            : (isMe ? 'bg-white text-black hover:bg-white/90' : 'bg-[#E5E1D8] text-[#2D2D2D] hover:bg-[#E5E1D8]/80')
                        }`}
                        title="تشغيل الرسالة الصوتية"
                      >
                        {playingVoiceId === msg.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[-1px]" />}
                      </button>
                      <div className="flex-1 text-right">
                        <span className="text-xs block font-bold">رسالة صوتية</span>
                        {/* Mock audio wave animation */}
                        <div className="flex gap-0.5 mt-1 h-3 items-end">
                          {[1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                            <span 
                              key={idx} 
                              className={`w-0.5 bg-current rounded-full transition-all duration-300 ${
                                playingVoiceId === msg.id ? 'animate-pulse' : 'opacity-45'
                              }`} 
                              style={{ height: playingVoiceId === msg.id ? `${val * 20}%` : '20%' }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono self-end ${isMe ? 'text-white/80' : 'text-[#A8A293]'}`}>
                        00:{msg.duration && msg.duration < 10 ? `0${msg.duration}` : msg.duration || '03'}
                      </span>
                    </div>
                  )}

                  {msg.type === 'file' && (
                    <div className={`flex items-center gap-3 p-2 rounded-xl border w-60 ${
                      isMe ? 'bg-black/10 border-white/10 text-white' : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#2D2D2D]'
                    }`}>
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-red-500 flex-shrink-0">
                        <FileIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-xs font-bold truncate">{msg.fileName || msg.text}</h4>
                        <span className={`text-[9px] font-mono block mt-0.5 ${isMe ? 'text-white/80' : 'text-[#A8A293]'}`}>{msg.fileSize || '1.8 MB'}</span>
                      </div>
                    </div>
                  )}

                  {/* Metadata and double-ticks */}
                  <div className="flex items-center justify-end gap-1 mt-2 self-end">
                    <span className={`text-[9px] font-mono ${isMe ? 'text-white/80' : 'text-[#A8A293]'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-[#FAF9F6]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {activeContact.status === 'typing' && (
          <div className="flex w-full justify-end text-right">
            <div className="flex gap-2.5 max-w-[80%] items-end">
              <div className="w-7 h-7 rounded-full bg-[#E5E1D8] border border-white flex items-center justify-center text-sm shadow-xs select-none text-[#2D2D2D]">
                {activeContact.avatar}
              </div>
              <div className="bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-2xl rounded-bl-none p-3.5 shadow-md flex items-center gap-1.5">
                <span className="text-xs text-[#A8A293] font-bold">{activeContact.name} يكتب الآن</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#556B2F] rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-[#556B2F] rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-[#556B2F] rounded-full animate-bounce delay-300"></span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Inputs Bar */}
      <div className="p-3 bg-[#FAF9F6] border-t border-[#E5E1D8] flex flex-col relative z-20">
        
        {/* Emoji drawer popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-4 bg-white border border-[#E5E1D8] p-2 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-fadeIn">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectEmoji(emoji)}
                className="hover:scale-125 text-lg transition p-1"
              >
                {emoji}
              </button>
            ))}
            <button 
              onClick={() => setShowEmojiPicker(false)}
              className="text-[#A8A293] hover:text-[#2D2D2D] text-xs ml-1 bg-[#E5E1D8]/45 p-1 rounded-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Attachment menu */}
        {showAttachmentMenu && (
          <div className="absolute bottom-16 right-12 bg-white border border-[#E5E1D8] p-2 rounded-xl shadow-2xl flex flex-col gap-1 z-50 animate-fadeIn w-36">
            <button
              onClick={simulateSendImage}
              className="px-3 py-1.5 hover:bg-[#FAF9F6] text-xs text-[#2D2D2D] flex items-center gap-2 rounded-lg"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>إرفاق صورة 📸</span>
            </button>
            <button
              onClick={simulateSendFile}
              className="px-3 py-1.5 hover:bg-[#FAF9F6] text-xs text-[#2D2D2D] flex items-center gap-2 rounded-lg"
            >
              <FileIcon className="w-3.5 h-3.5 text-[#556B2F]/80" />
              <span>إرفاق ملف 📄</span>
            </button>
          </div>
        )}

        {/* Recorder pulsing overlay */}
        {isRecording ? (
          <div className="flex items-center justify-between bg-rose-50/90 border border-rose-200 p-2.5 rounded-xl shadow-inner animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-700 font-bold text-xs">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
              <span className="font-semibold">جاري تسجيل رسالة صوتية... </span>
              
              {/* Real-time mic wave visualizer */}
              <div className="flex items-center gap-1 h-6 px-1 bg-rose-100/50 rounded-lg">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                  const levelFactor = isUsingSimulation 
                    ? (Math.sin(Date.now() / 150 + bar) * 0.5 + 0.5) 
                    : (soundLevel / 120);
                  const height = Math.max(4, Math.min(24, levelFactor * 24 * (0.4 + Math.random() * 0.6)));
                  return (
                    <span
                      key={bar}
                      className="w-0.5 bg-rose-600 rounded-full transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>

              <span className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px]">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
              
              {isUsingSimulation && (
                <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full font-bold border border-amber-200">
                  محاكاة
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelVoiceRecording}
                className="px-3 py-1.5 bg-[#E5E1D8] hover:bg-[#E5E1D8]/80 text-[#2D2D2D] text-xs font-bold rounded-lg transition"
              >
                إلغاء
              </button>
              <button
                onClick={finishVoiceRecording}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-md shadow-rose-500/25"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            
            {/* Attach Action */}
            <button
              onClick={() => {
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowEmojiPicker(false);
              }}
              className={`p-2.5 rounded-xl transition ${
                showAttachmentMenu ? 'bg-[#E5E1D8] text-[#556B2F]' : 'hover:bg-[#E5E1D8]/50 text-[#A8A293]'
              }`}
              title="إرفاق ملفات"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Emoji Action */}
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachmentMenu(false);
              }}
              className={`p-2.5 rounded-xl transition ${
                showEmojiPicker ? 'bg-[#E5E1D8] text-[#556B2F]' : 'hover:bg-[#E5E1D8]/50 text-[#A8A293]'
              }`}
              title="ملصقات ورموز"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Input Form */}
            <div className="flex-1 relative flex items-center">
              <input
                id="message_text_input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب رسالة فورية هنا..."
                className="w-full bg-[#F4F2EE] border border-[#E5E1D8] rounded-xl py-2.5 pl-4 pr-4 text-xs sm:text-sm text-[#2D2D2D] placeholder-[#A8A293] focus:outline-none focus:ring-1 focus:ring-[#556B2F] focus:border-[#556B2F] transition-colors"
              />
            </div>

            {/* Voice Record trigger */}
            <button
              onClick={startVoiceRecording}
              className="p-2.5 hover:bg-[#E5E1D8]/50 text-[#A8A293] hover:text-[#556B2F] rounded-xl transition"
              title="تسجيل رسالة صوتية"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send trigger */}
            <button
              id="send_message_btn"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                inputText.trim() 
                  ? 'bg-[#556B2F] hover:bg-[#556B2F]/90 text-white scale-105 shadow-md shadow-[#556B2F]/25' 
                  : 'bg-[#E5E1D8] text-[#A8A293] cursor-not-allowed'
              }`}
              title="إرسال"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Complaint / Report Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-100 shadow-2xl space-y-4 animate-scaleIn text-right">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <h3 className="font-extrabold text-base">تقديم بلاغ رسمي للإدارة والمشرفين</h3>
            </div>
            <p className="text-xs text-[#A8A293] leading-relaxed">
              إذا واجهت أي محتوى مسيء، إزعاج، أو سلوك غير لائق من جهة اتصال، يرجى ملء التفاصيل أدناه. سيقوم الأدمن والمسؤولون بمراجعة شكواك فوراً واتخاذ الإجراءات اللازمة.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 block">تفاصيل الشكوى أو الإساءة:</label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="اكتب هنا بوضوح سبب الشكوى، التفاصيل، أو الرابط المسيء..."
                rows={4}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSendComplaint}
                disabled={submittingComplaint}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingComplaint ? 'جاري التقديم...' : 'تقديم البلاغ فورا 🛡️'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setComplaintText('');
                  setShowComplaintModal(false);
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
