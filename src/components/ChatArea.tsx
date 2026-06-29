import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Contact, Message, MessageReminder } from '../types';
import BrandLogo from './BrandLogo';
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
  AlertTriangle,
  Camera,
  RefreshCw,
  Download,
  FileVideo,
  Bell,
  Clock,
  Calendar
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { getTranslation } from '../utils/translations';

const parseAiReport = (text: string) => {
  const severityMatch = text.match(/الدرجة:\s*([^\n]+)/);
  const categoryMatch = text.match(/التصنيف:\s*([^\n]+)/);
  const actionMatch = text.match(/الإجراء:\s*([^\n]+)/);
  const adviceMatch = text.match(/النصيحة:\s*([^\n]+)/);
  
  const replyIndex = text.indexOf("الرد:");
  let aiReply = replyIndex !== -1 ? text.substring(replyIndex + 5).trim() : "";
  
  if (!aiReply) {
    aiReply = text.replace(/🤖 \[تحليل الذكاء الاصطناعي للبلاغ - SNNS\]/g, '')
                  .replace(/الدرجة:[^\n]+/g, '')
                  .replace(/التصنيف:[^\n]+/g, '')
                  .replace(/الإجراء:[^\n]+/g, '')
                  .replace(/النصيحة:[^\n]+/g, '')
                  .trim();
  }
  
  return {
    severity: severityMatch ? severityMatch[1].trim() : "متوسطة",
    category: categoryMatch ? categoryMatch[1].trim() : "سلوك غير لائق",
    aiAction: actionMatch ? actionMatch[1].trim() : "تم إرسال بلاغ للدعم التقني",
    safetyAdvice: adviceMatch ? adviceMatch[1].trim() : "يرجى الحذر عند التعامل مع المستخدم",
    aiReply: aiReply || text
  };
};

interface ChatAreaProps {
  activeContact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice' | 'file' | 'video', extra?: any) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
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
    language?: string;
  };
  reminders?: MessageReminder[];
  onAddReminder?: (reminder: MessageReminder) => void;
  onCancelReminder?: (reminderId: string) => void;
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

// Helper to render avatar beautifully as either an image or fallback text/emoji
const renderAvatarContent = (avatarStr: string | undefined, altName: string = "Avatar") => {
  if (!avatarStr) return <span className="select-none">👤</span>;
  const isUrl = avatarStr.startsWith('http://') || avatarStr.startsWith('https://');
  if (isUrl) {
    return (
      <img 
        src={avatarStr} 
        alt={altName} 
        className="w-full h-full rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return <span className="select-none">{avatarStr}</span>;
};

export default function ChatArea({
  activeContact,
  messages,
  onSendMessage,
  onReactToMessage,
  onStartCall,
  onBackToSidebar,
  isRealMode = false,
  roomId = null,
  currentUser,
  reminders = [],
  onAddReminder,
  onCancelReminder
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
  
  // Reaction states
  const [selectedMessageReactionId, setSelectedMessageReactionId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);

  const startLongPress = (messageId: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageReactionId(messageId);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (e) {}
      }
    }, 550);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  
  // States for complaint/report center
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [aiComplaintResult, setAiComplaintResult] = useState<{
    severity: string;
    category: string;
    aiAction: string;
    safetyAdvice: string;
    aiReply: string;
  } | null>(null);
  const [showAiResultModal, setShowAiResultModal] = useState(false);

  // Camera Capture States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Message Reminder Modal States
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderMsg, setSelectedReminderMsg] = useState<Message | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState<number>(1); // default 1 min
  const [customRemindDateTime, setCustomRemindDateTime] = useState<string>('');


  // Auto handle camera stream setup/cleanup based on modal visibility
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (showCameraModal) {
      setCameraError(null);
      setCapturedImage(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        }).then((stream) => {
          activeStream = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }).catch((err: any) => {
          console.error("Camera access failed:", err);
          setCameraError("فشل الوصول إلى الكاميرا. يرجى التحقق من أذونات الكاميرا وتجربة فتح المنصة في نافذة مستقلة.");
        });
      } else {
        setCameraError("الكاميرا غير مدعومة في متصفحك الحالي.");
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

  const handleRecapture = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedImage(null);
    setCameraError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      }).then((stream) => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch((err: any) => {
        console.error("Camera recapture failed:", err);
        setCameraError("فشل إعادة تشغيل الكاميرا.");
      });
    } else {
      setCameraError("الكاميرا غير مدعومة.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        // Stop stream once captured
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }
    }
  };

  const handleSendCapturedImage = () => {
    if (capturedImage) {
      onSendMessage('صورة كاميرا مباشرة 📸', 'image', { mediaUrl: capturedImage });
      setShowCameraModal(false);
      setCapturedImage(null);
    }
  };

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      onSendMessage(file.name, 'image', { 
        mediaUrl: url,
        fileName: file.name,
        fileSize: sizeStr
      });
      setShowAttachmentMenu(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      onSendMessage(file.name, 'video', { 
        mediaUrl: url,
        fileName: file.name,
        fileSize: sizeStr
      });
      setShowAttachmentMenu(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      onSendMessage(file.name, 'file', { 
        mediaUrl: url,
        fileName: file.name,
        fileSize: sizeStr
      });
      setShowAttachmentMenu(false);
      e.target.value = '';
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    if (!url) return;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };
  
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
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0B0B0A] text-white p-8 select-none text-center relative overflow-hidden">
        {/* Subtle background luxury details */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#C5A059]/5 blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#8A6E35]/5 blur-[120px]"></div>

        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="mb-6 scale-110">
            <BrandLogo size="lg" showText={true} />
          </div>
          
          <h2 className="text-lg font-extrabold text-white mb-2">منصة الاتصال والرقابة المتقدمة</h2>
          <p className="text-xs text-[#A89F91] leading-relaxed max-w-sm mb-6">
            اختر جهة اتصال أو مجموعة من القائمة الجانبية للبدء. جميع المحادثات والمكالمات في هذه المنصة مشفرة ومؤمنة بالكامل تحت إشراف أدمن الرقابة.
          </p>

          <div className="px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full text-[10px] font-black tracking-wider text-[#C5A059] flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#C5A059]" />
            <span>نظام إلكتروني آمن مشفر فوري (256-bit SSL)</span>
          </div>
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
             (m.senderId === 'me' && m.id.includes(`_${activeContact.id}`)) ||
             (m.senderId === 'snns_ai_assistant' && m.id.includes(`_${activeContact.id}`));
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

      // Fetch AI Intelligent Report Analysis and Action
      try {
        const aiResponse = await fetch('/api/process-complaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaintText: complaintText,
            reportedContactName: activeContact.name,
            userName: currentUser.name || 'المستخدم'
          })
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          setAiComplaintResult(aiData);
          setShowAiResultModal(true);

          // Add AI reply message to current chat stream
          const aiMsgId = `ai_reply_${activeContact.id}_${Date.now()}`;
          const aiMsg: Message = {
            id: aiMsgId,
            senderId: 'snns_ai_assistant',
            senderName: 'مساعد SNNS الذكي',
            text: `🤖 [تحليل الذكاء الاصطناعي للبلاغ - SNNS]\n\nالدرجة: ${aiData.severity}\nالتصنيف: ${aiData.category}\nالإجراء: ${aiData.aiAction}\nالنصيحة: ${aiData.safetyAdvice}\n\nالرد: ${aiData.aiReply}`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
            status: 'read'
          };
          const messagesCol = collection(db, 'messages');
          await setDoc(doc(messagesCol, aiMsg.id), aiMsg);
          sounds.playMessageReceivedSound();
        } else {
          alert('✨ تم تقديم الشكوى/البلاغ للإدارة بنجاح وجاري تدقيقه وحسمه من المشرفين.');
        }
      } catch (aiErr) {
        console.warn("AI processing of complaint failed or bypassed:", aiErr);
        alert('✨ تم تقديم الشكوى/البلاغ للإدارة بنجاح وجاري تدقيقه وحسمه من المشرفين.');
      }

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

  const handleOpenReminderModal = (msg: Message) => {
    setSelectedReminderMsg(msg);
    setReminderMinutes(1);
    setCustomRemindDateTime('');
    setShowReminderModal(true);
  };

  const handleSaveReminder = () => {
    if (!selectedReminderMsg || !onAddReminder) return;

    let remindAtMs = 0;
    if (customRemindDateTime) {
      remindAtMs = new Date(customRemindDateTime).getTime();
    } else {
      remindAtMs = Date.now() + reminderMinutes * 60 * 1000;
    }

    if (isNaN(remindAtMs) || remindAtMs <= Date.now()) {
      alert("الرجاء اختيار وقت وتاريخ في المستقبل لتذكيرك به.");
      return;
    }

    const newReminder: MessageReminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      messageId: selectedReminderMsg.id,
      messageText: selectedReminderMsg.type === 'text' ? selectedReminderMsg.text : `[رسالة ${selectedReminderMsg.type === 'image' ? 'صورة' : selectedReminderMsg.type === 'voice' ? 'صوتية' : selectedReminderMsg.type === 'video' ? 'فيديو' : 'ملف'}]`,
      senderName: selectedReminderMsg.senderName,
      remindAt: remindAtMs,
      triggered: false
    };

    onAddReminder(newReminder);
    setShowReminderModal(false);
    setSelectedReminderMsg(null);

    // Prompt user nicely
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    } catch (e) {
      console.warn("Could not request notification permission dynamically:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A09] text-white select-none relative" dir="rtl">
      
      {/* Top Header Active Chat Info - Luxury gold style */}
      <div className="p-4 bg-[#0D0D0C] border-b border-[#2E2E2A]/70 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Back button for mobile view */}
          <button 
            onClick={onBackToSidebar}
            className="md:hidden p-2 hover:bg-[#1C1C1A] rounded-lg text-stone-300 transition ml-1"
            title="رجوع"
          >
            <ChevronLeft className="w-5 h-5 rotate-180 text-[#C5A059]" />
          </button>

          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-[#1C1C1A] border border-[#2E2E2A] flex items-center justify-center text-2xl shadow-md select-none overflow-hidden">
              {renderAvatarContent(activeContact.avatar, activeContact.name)}
            </div>
            {activeContact.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0D0D0C] rounded-full"></span>
            )}
            {activeContact.status === 'away' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-[#0D0D0C] rounded-full"></span>
            )}
          </div>

          <div className="text-right">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 flex-wrap">
              {activeContact.name}
              {activeContact.id.startsWith('google_') && (
                <span className="text-[9px] bg-blue-950/50 text-blue-400 border border-blue-800/40 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" title="مستورد من Google">
                  🌐 Google
                </span>
              )}
              <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/30 px-2 py-0.5 rounded-full font-black">{activeContact.bio?.split('|')[0]}</span>
            </h3>
            <p className="text-[11px] text-stone-400">
              {activeContact.status === 'typing' ? (
                <span className="text-[#C5A059] font-bold animate-pulse">يكتب الآن...</span>
              ) : (
                activeContact.status === 'online' ? 'نشط الآن' : 'غير متصل حالياً'
              )}
            </p>
          </div>
        </div>

        {/* Action icons like Teams and Imo for Video calls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartCall(activeContact, 'video')}
            className="px-4 py-2.5 hover:bg-[#C5A059]/20 text-[#C5A059] hover:text-[#E6C15C] rounded-full border border-[#C5A059]/30 bg-[#C5A059]/5 transition-all duration-300 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="اتصال مرئي تيمز / إيمو"
          >
            <Video className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs font-black hidden sm:inline text-[#C5A059]">مكالمة فيديو</span>
          </button>
          <button
            onClick={() => onStartCall(activeContact, 'audio')}
            className="px-4 py-2.5 hover:bg-[#C5A059]/20 text-[#C5A059]/90 hover:text-[#E6C15C] rounded-full border border-[#C5A059]/30 bg-[#C5A059]/5 transition-all duration-300 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="اتصال صوتي واتساب"
          >
            <Phone className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs font-black hidden sm:inline text-[#C5A059]">صوتية</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
              className="px-4 py-2.5 hover:bg-[#1C1C1A] rounded-full text-stone-300 transition-all duration-300 flex items-center gap-1.5 border border-[#2E2E2A]/70 bg-[#121211] shadow-md cursor-pointer active:scale-95"
              title="تغيير خلفية الدردشة"
            >
              🎨 <span className="text-xs font-black hidden md:inline text-stone-300">الخلفيات</span>
            </button>
            
            {showWallpaperMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-[#0D0D0C] border border-[#2E2E2A] rounded-2xl shadow-2xl z-50 p-2 text-right animate-fadeIn">
                <p className="text-[11px] font-black text-[#A89F91] px-2.5 py-1.5 border-b border-[#2E2E2A]/60 mb-1">اختر خلفية للدردشة</p>
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => {
                      setChatWallpaper(wp.id);
                      localStorage.setItem('chatWallpaper', wp.id);
                      setShowWallpaperMenu(false);
                    }}
                    className={`w-full text-right px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      chatWallpaper === wp.id ? 'bg-[#C5A059]/15 text-[#C5A059] font-black' : 'hover:bg-[#1C1C1A] text-stone-300'
                    }`}
                  >
                    <span>{wp.name}</span>
                    {chatWallpaper === wp.id && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Complaint Button */}
          <button
            onClick={() => setShowComplaintModal(true)}
            className="px-4 py-2.5 hover:bg-rose-900/30 rounded-full text-rose-500 hover:text-rose-400 transition-all duration-300 flex items-center gap-1.5 border border-rose-900/40 bg-rose-950/10 shadow-sm cursor-pointer animate-pulse active:scale-95"
            title="تقديم شكوى أو بلاغ عن محتوى مسيء"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
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
            <span className="text-[10px] font-black text-[#C5A059] bg-[#C5A059]/10 px-4 py-1.5 rounded-full shadow-md border border-[#C5A059]/30 flex items-center gap-1.5 animate-pulse">
              🌐 اتصال حقيقي مباشر (رقم الغرفة: {roomId})
            </span>
          </div>
        )}

        {/* Info banner */}
        <div className="flex justify-center select-none">
          <span className="text-[10px] font-extrabold tracking-wider text-[#C5A059] bg-[#121211] px-3 py-1 rounded-full border border-[#2E2E2A]/70 shadow-md flex items-center gap-1">
            {isRealMode ? '⚡ الربط المباشر نشط (تبادل فوري للبيانات والصوت والفيديو)' : '🔒 تشفير متكامل من طرف لطرف (محاكاة واتساب الآمنة)'}
          </span>
        </div>

        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16, x: isMe ? 25 : -25, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 25 }}
              className={`flex w-full ${isMe ? 'justify-start text-right' : 'justify-end text-right'}`}
            >
              <div className="flex gap-2.5 max-w-[80%] items-end">
                {/* Avatar for remote participant */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1A] border border-[#2E2E2A] flex items-center justify-center text-sm shadow-md select-none text-[#C5A059] overflow-hidden shrink-0">
                    {msg.senderId === 'snns_ai_assistant' 
                      ? '🤖' 
                      : msg.senderId === activeContact.id 
                        ? renderAvatarContent(activeContact.avatar, activeContact.name) 
                        : '👤'
                    }
                  </div>
                )}

                <div 
                  onMouseDown={() => startLongPress(msg.id)}
                  onMouseUp={endLongPress}
                  onMouseLeave={endLongPress}
                  onTouchStart={() => startLongPress(msg.id)}
                  onTouchEnd={endLongPress}
                  className={`p-4 shadow-xl relative flex flex-col transition-all duration-300 border select-none cursor-pointer ${
                    isMe 
                      ? 'bg-gradient-to-tr from-[#98783B] via-[#C5A059] to-[#E5C68A] border-[#D6B570]/30 text-stone-950 font-bold rounded-[24px] rounded-br-[8px] shadow-[0_10px_25px_-5px_rgba(197,160,89,0.18)] border-t border-white/20 hover:scale-[1.01] hover:-translate-y-[0.5px] ease-out' 
                      : 'bg-[#131314] hover:bg-[#161618] border-[#2E2E2A]/70 text-white rounded-[24px] rounded-bl-[8px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] border-t border-white/[0.04] hover:scale-[1.01] hover:-translate-y-[0.5px] ease-out'
                  }`}
                >
                  {/* Reaction Selection Overlay */}
                  {selectedMessageReactionId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`absolute z-50 p-1 bg-[#1A1A1A] border border-[#C5A059]/40 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-1 -top-12 ${
                        isMe ? 'left-0' : 'right-0'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReactToMessage?.(msg.id, emoji);
                            setSelectedMessageReactionId(null);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-base hover:scale-135 transition-transform duration-150 cursor-pointer hover:bg-stone-800 rounded-full"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessageReactionId(null);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-white text-xs cursor-pointer ml-1"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}

                  {/* Rendered Reactions Badge */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Clicking on the badge toggles/cycles the last reaction
                        if (msg.reactions && msg.reactions.length > 0) {
                          onReactToMessage?.(msg.id, msg.reactions[msg.reactions.length - 1]);
                        }
                      }}
                      className={`absolute -bottom-2.5 flex gap-1 items-center bg-[#1A1A1A] border border-[#C5A059]/40 px-2.5 py-0.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10 hover:scale-105 transition-transform duration-150 ${
                        isMe ? 'left-4' : 'right-4'
                      }`}
                    >
                      {Array.from(new Set(msg.reactions)).slice(0, 3).map((emoji, idx) => (
                        <span key={idx} className="text-xs select-none">{emoji}</span>
                      ))}
                      {msg.reactions.length > 0 && (
                        <span className="text-[9px] font-bold text-[#C5A059] mr-0.5">{msg.reactions.length}</span>
                      )}
                    </div>
                  )}

                  {/* Sender name for group chats */}
                  {!isMe && activeContact.isGroup && (
                    <span className="text-[10px] font-extrabold text-[#C5A059] mb-1 block">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Rendering based on message types */}
                  {msg.type === 'text' && (
                    msg.text.startsWith('🤖 [تحليل الذكاء الاصطناعي') ? (
                      (() => {
                        const parsed = parseAiReport(msg.text);
                        const severityColors = {
                          'عالية': 'bg-rose-950/40 text-rose-400 border-rose-900/30',
                          'متوسطة': 'bg-amber-950/40 text-amber-400 border-amber-900/30',
                          'منخفضة': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30',
                        } as any;
                        const badgeColor = severityColors[parsed.severity] || 'bg-stone-800 text-stone-300 border-stone-700/50';
                        
                        return (
                          <div className="space-y-3.5 text-right font-sans max-w-sm sm:max-w-md">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-[#2E2E2A]/40 pb-2">
                              <div className="flex items-center gap-1.5 text-[#C5A059] font-bold text-xs sm:text-sm">
                                <span className="animate-pulse">✨</span>
                                <span>تحليل أمني ذكي (SNNS AI)</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                                خطورة {parsed.severity}
                              </span>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs">
                              <div className="bg-[#181817] p-2.5 rounded-xl border border-[#2E2E2A]/30">
                                <span className="text-stone-500 block mb-0.5 font-bold">نوع البلاغ:</span>
                                <span className="text-stone-200 font-semibold">{parsed.category}</span>
                              </div>
                              <div className="bg-[#181817] p-2.5 rounded-xl border border-[#2E2E2A]/30">
                                <span className="text-[#C5A059] block mb-0.5 font-bold">الإجراء التلقائي الفوري:</span>
                                <span className="text-stone-200 font-semibold text-[10px] leading-tight block">{parsed.aiAction}</span>
                              </div>
                            </div>

                            {/* Safety Advice */}
                            <div className="bg-[#181817]/60 p-3 rounded-xl border border-[#C5A059]/10 text-[11px] sm:text-xs space-y-1">
                              <span className="text-[#C5A059] block font-extrabold flex items-center gap-1">
                                🛡️ نصيحة أمان SNNS:
                              </span>
                              <p className="text-stone-300 leading-relaxed font-medium">{parsed.safetyAdvice}</p>
                            </div>

                            {/* Response content */}
                            <div className="text-xs sm:text-sm text-stone-100 bg-[#121211] p-3 rounded-xl border border-[#2E2E2A]/50 leading-relaxed font-normal">
                              {parsed.aiReply}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed select-text font-normal">
                        {msg.text}
                      </p>
                    )
                  )}

                  {msg.type === 'image' && (
                    <div className="space-y-1 relative">
                      <img 
                        src={msg.mediaUrl} 
                        alt="مرفق" 
                        referrerPolicy="no-referrer"
                        className="rounded-xl w-60 h-40 object-cover border border-[#2E2E2A]/40 shadow-inner"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] block text-stone-400 font-semibold italic">📸 صورة مرسلة</span>
                        {msg.mediaUrl && (
                          <button
                            onClick={() => handleDownload(msg.mediaUrl!, msg.fileName || 'image.jpg')}
                            className="p-1 px-2 rounded bg-black/40 hover:bg-black/60 text-[#C5A059] border border-[#C5A059]/25 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                            title="تحميل الصورة"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.type === 'video' && (
                    <div className="space-y-1 relative">
                      <video 
                        src={msg.mediaUrl} 
                        controls
                        className="rounded-xl w-60 max-h-48 object-cover border border-[#2E2E2A]/40 shadow-inner bg-black"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] block text-stone-400 font-semibold italic">🎥 فيديو مرسل</span>
                        {msg.mediaUrl && (
                          <button
                            onClick={() => handleDownload(msg.mediaUrl!, msg.fileName || 'video.mp4')}
                            className="p-1 px-2 rounded bg-black/40 hover:bg-black/60 text-[#C5A059] border border-[#C5A059]/25 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                            title="تحميل الفيديو"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل</span>
                          </button>
                        )}
                      </div>
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
                    <div className="space-y-2">
                      <div className={`flex items-center gap-3 p-2 rounded-xl border w-60 ${
                        isMe ? 'bg-black/15 border-[#C5A059]/30 text-white' : 'bg-[#121211] border-[#2E2E2A] text-white'
                      }`}>
                        <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] flex-shrink-0">
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden text-right">
                          <h4 className="text-xs font-bold truncate">{msg.fileName || msg.text}</h4>
                          <span className="text-[9px] font-mono block mt-0.5 text-stone-400">{msg.fileSize || '1.8 MB'}</span>
                        </div>
                      </div>
                      {msg.mediaUrl && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDownload(msg.mediaUrl!, msg.fileName || 'file.dat')}
                            className="p-1 px-2.5 rounded bg-[#C5A059]/20 hover:bg-[#C5A059]/45 text-[#C5A059] border border-[#C5A059]/30 transition-colors cursor-pointer flex items-center gap-1 text-[10px] w-fit font-bold"
                            title="تحميل الملف"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل الملف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata and double-ticks */}
                  <div className="flex items-center justify-end gap-2 mt-2 self-end select-none">
                    {/* Reminder Button */}
                    {(() => {
                      const activeReminder = reminders.find(r => r.messageId === msg.id && !r.triggered);
                      if (activeReminder) {
                        return (
                          <button
                            onClick={() => {
                              if (confirm("هل تريد إلغاء التذكير النشط لهذه الرسالة؟")) {
                                onCancelReminder?.(activeReminder.id);
                              }
                            }}
                            className="p-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center cursor-pointer animate-pulse"
                            title="تذكير نشط! اضغط لإلغاء التذكير ⏰"
                          >
                            <Bell className="w-3 h-3 fill-current" />
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => handleOpenReminderModal(msg)}
                            className={`p-0.5 rounded-full transition-all flex items-center justify-center cursor-pointer opacity-40 hover:opacity-100 ${
                              isMe ? 'text-stone-950 hover:bg-white/20' : 'text-stone-400 hover:text-white hover:bg-[#2E2E2A]/60'
                            }`}
                            title="تذكيري بهذه الرسالة لاحقاً ⏰"
                          >
                            <Bell className="w-3 h-3" />
                          </button>
                        );
                      }
                    })()}

                    {/* Reaction Smiley Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessageReactionId(selectedMessageReactionId === msg.id ? null : msg.id);
                      }}
                      className={`p-0.5 rounded-full transition-all flex items-center justify-center cursor-pointer opacity-40 hover:opacity-100 ${
                        isMe ? 'text-stone-950 hover:bg-white/20' : 'text-stone-400 hover:text-white hover:bg-[#2E2E2A]/60'
                      }`}
                      title="التفاعل بالرموز 👍❤️😂"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    <span className={`text-[9px] font-mono ${isMe ? 'text-white/80' : 'text-[#A8A293]'}`}>
                      {msg.timestamp}
                    </span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-[#FAF9F6]" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {activeContact.status === 'typing' && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex w-full justify-end text-right"
          >
            <div className="flex gap-2.5 max-w-[80%] items-end">
              <div className="w-8 h-8 rounded-full bg-[#1C1C1A] border border-[#2E2E2A] flex items-center justify-center text-sm shadow-md select-none text-[#C5A059] overflow-hidden shrink-0">
                {renderAvatarContent(activeContact.avatar, activeContact.name)}
              </div>
              <div className="bg-[#131314] hover:bg-[#161618] border border-[#2E2E2A]/70 text-white rounded-[24px] rounded-bl-[8px] p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] border-t border-white/[0.04] flex items-center gap-2 transition-all duration-300">
                <span className="text-xs text-stone-300 font-bold">{activeContact.name} يكتب الآن</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce delay-75 shadow-[0_0_8px_rgba(197,160,89,0.5)]"></span>
                  <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce delay-150 shadow-[0_0_8px_rgba(197,160,89,0.5)]"></span>
                  <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce delay-300 shadow-[0_0_8px_rgba(197,160,89,0.5)]"></span>
                </span>
              </div>
            </div>
          </motion.div>
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
          <div className="absolute bottom-16 right-12 bg-[#0D0D0C] border border-[#2E2E2A] p-2 rounded-xl shadow-2xl flex flex-col gap-1 z-50 animate-fadeIn w-52 text-right">
            <button
              onClick={() => {
                setShowCameraModal(true);
                setShowAttachmentMenu(false);
              }}
              className="w-full px-3 py-2 hover:bg-[#1C1C1A] text-xs text-stone-200 flex items-center gap-2.5 rounded-lg text-right font-extrabold transition-all cursor-pointer border border-transparent hover:border-amber-500/25"
            >
              <Camera className="w-4 h-4 text-amber-500 shrink-0" />
              <span>التقاط من الكاميرا 📷</span>
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full px-3 py-2 hover:bg-[#1C1C1A] text-xs text-stone-200 flex items-center gap-2.5 rounded-lg text-right font-extrabold transition-all cursor-pointer border border-transparent hover:border-emerald-500/25"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>تحميل صورة من الجهاز 🖼️</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-full px-3 py-2 hover:bg-[#1C1C1A] text-xs text-stone-200 flex items-center gap-2.5 rounded-lg text-right font-extrabold transition-all cursor-pointer border border-transparent hover:border-rose-500/25"
            >
              <FileVideo className="w-4 h-4 text-rose-500 shrink-0" />
              <span>تحميل فيديو من الجهاز 🎥</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 hover:bg-[#1C1C1A] text-xs text-stone-200 flex items-center gap-2.5 rounded-lg text-right font-extrabold transition-all cursor-pointer border border-transparent hover:border-sky-500/25"
            >
              <FileIcon className="w-4 h-4 text-sky-500 shrink-0" />
              <span>تحميل ملف من الجهاز 📄</span>
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
          <div className="flex items-center gap-2 bg-[#0B0B0A]/95 p-2 rounded-[24px] border border-[#2E2E2A]/40 shadow-xl">
            
            {/* Attach Action */}
            <button
              onClick={() => {
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowEmojiPicker(false);
              }}
              className={`p-2.5 rounded-full transition duration-300 cursor-pointer ${
                showAttachmentMenu ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30' : 'hover:bg-[#1C1C1A] text-stone-400'
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
              className={`p-2.5 rounded-full transition duration-300 cursor-pointer ${
                showEmojiPicker ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30' : 'hover:bg-[#1C1C1A] text-stone-400'
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
                placeholder={getTranslation(currentUser.language, 'typeMessage')}
                className="w-full bg-[#121213] border border-[#2E2E2A]/60 rounded-full py-3 px-5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/30 focus:border-[#C5A059] transition-all"
              />
            </div>

            {/* Voice Record trigger */}
            <button
              onClick={startVoiceRecording}
              className="p-2.5 hover:bg-[#1C1C1A] text-stone-400 hover:text-[#C5A059] rounded-full transition duration-300 cursor-pointer"
              title="تسجيل رسالة صوتية"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send trigger */}
            <button
              id="send_message_btn"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full font-black flex items-center justify-center transition-all duration-300 cursor-pointer ${
                inputText.trim() 
                  ? 'bg-gradient-to-r from-[#8A6E35] to-[#C5A059] text-stone-950 scale-105 shadow-lg shadow-[#C5A059]/35' 
                  : 'bg-[#1C1C1A] text-stone-600 border border-[#2E2E2A]/50 cursor-not-allowed'
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#0D0D0C] rounded-3xl p-6 max-w-md w-full border border-rose-950/50 shadow-2xl space-y-4 animate-scaleIn text-right">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <h3 className="font-extrabold text-base text-stone-100">تقديم بلاغ رسمي للإدارة والمشرفين</h3>
            </div>
            <p className="text-xs text-[#A89F91] leading-relaxed">
              إذا واجهت أي محتوى مسيء، إزعاج، أو سلوك غير لائق من جهة اتصال، يرجى ملء التفاصيل أدناه. سيقوم الأدمن والمسؤولون بمراجعة شكواك فوراً واتخاذ الإجراءات اللازمة.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-rose-400 block">تفاصيل الشكوى أو الإساءة:</label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="اكتب هنا بوضوح سبب الشكوى، التفاصيل، أو الرابط المسيء..."
                rows={4}
                className="w-full bg-[#121211] border border-rose-950/40 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSendComplaint}
                disabled={submittingComplaint}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingComplaint ? 'جاري التقديم...' : 'تقديم البلاغ فورا 🛡️'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setComplaintText('');
                  setShowComplaintModal(false);
                }}
                className="px-4 py-2.5 bg-[#1C1C1A] hover:bg-[#2E2E2A] text-stone-300 font-extrabold rounded-xl text-xs transition border border-[#2E2E2A]/50 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Report Analysis Result Modal */}
      {showAiResultModal && aiComplaintResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#0D0D0C] rounded-3xl p-6 max-w-md w-full border border-[#C5A059]/40 shadow-2xl space-y-4 animate-scaleIn text-right">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <span className="text-xl animate-pulse">🤖</span>
              <h3 className="font-extrabold text-base text-stone-100">تحليل معالجة البلاغ بالذكاء الاصطناعي</h3>
            </div>
            
            <p className="text-xs text-[#A89F91] leading-relaxed">
              لقد قام نظام الذكاء الاصطناعي الأمني لـ <strong className="text-white">SNNS</strong> بفحص بلاغك وتصنيفه فوراً لاتخاذ الإجراءات التقنية اللازمة.
            </p>

            <div className="space-y-2.5">
              <div className="bg-[#121211] p-3 rounded-xl border border-[#2E2E2A]/50 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-bold">مستوى الخطورة:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-extrabold border ${
                  aiComplaintResult.severity === 'عالية' 
                    ? 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                    : aiComplaintResult.severity === 'متوسطة'
                      ? 'bg-amber-950/40 text-amber-400 border-amber-900/30'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                }`}>
                  خطورة {aiComplaintResult.severity}
                </span>
              </div>

              <div className="bg-[#121211] p-3 rounded-xl border border-[#2E2E2A]/50 text-xs space-y-1">
                <span className="text-stone-400 font-bold block">تصنيف المخالفة:</span>
                <span className="text-stone-100 font-semibold">{aiComplaintResult.category}</span>
              </div>

              <div className="bg-[#121211] p-3 rounded-xl border border-[#2E2E2A]/50 text-xs space-y-1">
                <span className="text-[#C5A059] font-bold block">الإجراء التقني الفوري:</span>
                <p className="text-stone-200 leading-relaxed font-medium text-[10px] sm:text-xs">{aiComplaintResult.aiAction}</p>
              </div>

              <div className="bg-[#121211]/40 p-3 rounded-xl border border-[#C5A059]/10 text-xs space-y-1">
                <span className="text-stone-400 font-bold block flex items-center gap-1">
                  💡 نصيحة أمنية مخصصة لك:
                </span>
                <p className="text-stone-300 leading-relaxed font-normal">{aiComplaintResult.safetyAdvice}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAiResultModal(false);
                }}
                className="w-full py-2.5 bg-[#C5A059] hover:bg-[#A68343] text-stone-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>فهمت وموافق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#0C0C0E] border border-amber-400/30 rounded-[24px] p-5 sm:p-6 max-w-lg w-full shadow-[0_0_40px_rgba(212,175,55,0.15)] space-y-4 animate-scaleIn text-center relative">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowCameraModal(false);
                setCapturedImage(null);
              }}
              className="absolute top-4 left-4 p-1.5 bg-stone-900 border border-stone-800 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 justify-center text-amber-400">
              <Camera className="w-5 h-5 animate-pulse" />
              <h3 className="font-extrabold text-base text-stone-100">التقاط صورة مباشرة من الكاميرا</h3>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              التقط صورة حية الآن لمشاركتها فورياً في المحادثة مع أصدقائك أو فريق الدعم.
            </p>

            {/* Live Feed / Captured Image Display */}
            <div className="relative w-full aspect-[4/3] bg-black border border-stone-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              {cameraError ? (
                <div className="p-4 text-center space-y-2">
                  <span className="text-3xl block">⚠️</span>
                  <p className="text-xs text-rose-400 font-bold leading-relaxed">{cameraError}</p>
                  <button 
                    onClick={handleRecapture}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold border border-stone-800 transition"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured frame" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
              )}

              {/* Glowing active indicator */}
              {!cameraError && !capturedImage && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>

            {/* Interactive Control Controls */}
            <div className="flex gap-3 justify-center pt-2">
              {capturedImage ? (
                <>
                  <button
                    onClick={handleRecapture}
                    className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 font-extrabold rounded-xl text-xs transition border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة التقاط 🔄</span>
                  </button>
                  <button
                    onClick={handleSendCapturedImage}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-amber-400 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10 border border-amber-300/20"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>إرسال الصورة 🚀</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  disabled={!!cameraError}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300/20"
                >
                  <Camera className="w-4 h-4 text-stone-950" />
                  <span>التقاط الصورة الآن 📸</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && selectedReminderMsg && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" dir="rtl">
          <div className="bg-[#0C0C0E] border border-[#C5A059]/30 rounded-[28px] p-6 max-w-md w-full shadow-[0_0_40px_rgba(197,160,89,0.15)] space-y-5 animate-scaleIn text-right relative">
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowReminderModal(false);
                setSelectedReminderMsg(null);
              }}
              className="absolute top-4 left-4 p-1.5 bg-stone-900 border border-stone-800 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[#C5A059] border-b border-[#2E2E2A]/40 pb-3">
              <Bell className="w-5 h-5 animate-bounce" />
              <h3 className="font-extrabold text-base text-stone-100">تذكيري بهذه الرسالة لاحقاً</h3>
            </div>

            {/* Message preview */}
            <div className="bg-[#121211] border border-[#2E2E2A]/50 rounded-2xl p-4 space-y-1.5 shadow-inner">
              <span className="block text-[10px] text-[#C5A059] font-bold">الرسالة المحددة من {selectedReminderMsg.senderName}:</span>
              <p className="text-xs text-stone-300 italic line-clamp-3 select-none leading-relaxed">
                {selectedReminderMsg.type === 'text' ? selectedReminderMsg.text : `[مرفق ${selectedReminderMsg.type === 'image' ? 'صورة' : selectedReminderMsg.type === 'voice' ? 'صوت' : selectedReminderMsg.type === 'video' ? 'فيديو' : 'ملف'}]`}
              </p>
            </div>

            {/* Quick selectors */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#C5A059] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>اختر وقت التذكير السريع:</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(1);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 1 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  دقيقة واحدة ⏳
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(5);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 5 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  5 دقائق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(15);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 15 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  15 دقيقة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(60);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 60 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  ساعة واحدة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(180);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 180 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  3 ساعات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderMinutes(1440);
                    setCustomRemindDateTime('');
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer ${
                    reminderMinutes === 1440 && !customRemindDateTime
                      ? 'bg-[#C5A059] text-stone-950 border-[#C5A059]' 
                      : 'bg-[#121211] hover:bg-[#1C1C1A] text-stone-300 border-[#2E2E2A]/50'
                  }`}
                >
                  يوم كامل
                </button>
              </div>
            </div>

            {/* Custom date time picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#C5A059] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>أو حدد تاريخ ووقت مخصصين:</span>
              </label>
              <input
                type="datetime-local"
                value={customRemindDateTime}
                onChange={(e) => {
                  setCustomRemindDateTime(e.target.value);
                  setReminderMinutes(0);
                }}
                className="w-full bg-[#121211] border border-[#2E2E2A]/50 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all cursor-pointer text-right [color-scheme:dark]"
              />
            </div>

            {/* Notification permission status info */}
            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[10px] text-yellow-500 font-medium leading-relaxed">
                🔔 ملاحظة: يرجى تفعيل إشعارات المتصفح عند الطلب لتتمكن من تلقي التذكير في الوقت المحدد بنجاح.
              </div>
            )}

            {/* Save / Cancel actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSaveReminder}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10 border border-amber-300/20"
              >
                <span>حفظ التذكير فورا ⏰</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReminderModal(false);
                  setSelectedReminderMsg(null);
                }}
                className="px-5 py-3 bg-[#1C1C1A] hover:bg-[#2E2E2A] text-stone-300 font-extrabold rounded-xl text-xs transition border border-[#2E2E2A]/50 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs for real file uploads */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoUpload}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="*"
        className="hidden"
      />

    </div>
  );
}
