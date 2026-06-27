import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Dynamic chat replies will fallback to mock replies.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for intelligent conversational replies (WhatsApp style simulation)
app.post("/api/chat-reply", async (req: any, res: any) => {
  try {
    const { contactName, contactRole, messageHistory, isGroup } = req.body;

    if (!contactName || !messageHistory || !Array.isArray(messageHistory)) {
      return res.status(400).json({ error: "Missing required fields: contactName, messageHistory" });
    }

    // Default mock response generator in case API key is missing or fails
    const getFallbackResponse = (name: string, role: string) => {
      const fallbackMsgs = [
        `أهلاً بك! أنا مشغول قليلاً الآن وسأرد عليك لاحقاً. 👍`,
        `تمام، فهمت عليك. كيف تسير الأمور الأخرى؟`,
        `جميل جداً! الله يعطيك العافية يا رب. ✨`,
        `سأتحقق من هذا الأمر وأخبرك فوراً. 📱`,
        `أنا في الطريق حالياً، نتحدث قريباً! 🚗`
      ];
      if (role.includes("مدير")) {
        return `مرحباً، تلقيت رسالتك. يرجى تزويدي بالتفاصيل في أقرب وقت لمتابعة العمل بشكل مناسب. بالتوفيق.`;
      }
      return fallbackMsgs[Math.floor(Math.random() * fallbackMsgs.length)];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return a dynamic looking fallback
      return res.json({ text: getFallbackResponse(contactName, contactRole || "") });
    }

    const ai = getAiClient();

    // Map recent history for Gemini
    const formattedHistory = messageHistory.slice(-8).map((msg: any) => {
      const sender = msg.senderId === "me" ? "المستخدم (أنا)" : msg.senderName;
      return `${sender}: ${msg.text}`;
    }).join("\n");

    const systemInstruction = `أنت تقوم بمحاكاة شخصية في تطبيق محادثات مرئية ودردشة فورية يشبه واتساب وإيمو وتيمز.
اسمك هو: "${contactName}"، وعلاقتك بالمستخدم أو دورك هو: "${contactRole || 'صديق'}".
${isGroup ? 'المحادثة الحالية هي محادثة جماعية (جروب) يشارك فيها آخرون.' : 'المحادثة الحالية فردية.'}

المطلوب منك:
1. الرد باللغة العربية (يفضل استخدام اللهجة العامية الطبيعية الدافئة المناسبة للشخصية، أو الفصحى المبسطة إذا كان دوراً رسمياً كمدير العمل).
2. اجعل الرد قصيراً، ذكياً، ومناسباً جداً لرسائل واتساب السريعة (لا تتعدى سطرين أو ثلاثة).
3. استخدم الرموز التعبيرية (Emojis) بشكل طبيعي ولطيف يضفي حيوية للدردشة.
4. تفاعل مباشرة مع محتوى آخر رسائل مرسلة في التاريخ المعطى أدناه. لا تتحدث بصفة عامة أو آلية. تصرف كإنسان حقيقي تماماً!

تاريخ المحادثة الأخير:
${formattedHistory}

قم بصياغة الرد المباشر التالي من شخصيتك فقط دون كتابة اسمك قبله.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "اكتب الرد القصير المناسب الآن بناءً على التعليمات وتاريخ المحادثة.",
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    const replyText = response.text ? response.text.trim() : getFallbackResponse(contactName, contactRole || "");
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.json({ 
      text: "عذراً، يبدو أن هناك ضغطاً على الشبكة حالياً. نتحدث لاحقاً! 📡✨" 
    });
  }
});

// Setup HTTP and WebSocket signaling rooms
const rooms = new Map<string, Map<string, WebSocket>>();

// Setup Vite Dev Middleware or production static files
async function startServer() {
  const server = http.createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentClientId: string | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        const { type, roomId, clientId, payload } = data;

        if (type === "join") {
          currentRoomId = roomId;
          currentClientId = clientId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          
          const roomClients = rooms.get(roomId)!;
          roomClients.set(clientId, ws);

          console.log(`[WS] Client ${clientId} joined room ${roomId}`);

          // Notify other clients in the room that a new user joined
          roomClients.forEach((clientWs, id) => {
            if (id !== clientId && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "user_joined",
                clientId,
              }));
            }
          });

          // Send confirmation back with list of other users
          const others = Array.from(roomClients.keys()).filter(id => id !== clientId);
          ws.send(JSON.stringify({
            type: "joined_confirmation",
            others,
          }));
        }

        else if (type === "signal") {
          // Relay signaling (WebRTC offer/answer/candidates) to the target client
          const roomClients = rooms.get(roomId);
          if (roomClients) {
            const targetClientId = data.targetId;
            if (targetClientId) {
              const targetWs = roomClients.get(targetClientId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                  type: "signal",
                  senderId: clientId,
                  signal: payload,
                }));
              }
            }
          }
        }

        else if (type === "chat_message") {
          // Relay chat message to everyone in the room except the sender
          const roomClients = rooms.get(roomId);
          if (roomClients) {
            roomClients.forEach((clientWs, id) => {
              if (id !== clientId && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "chat_message",
                  senderId: clientId,
                  message: payload,
                }));
              }
            });
          }
        }
        
        else if (type === "call_action") {
          // Relay actions like call reject, accept, mute, screen-share
          const roomClients = rooms.get(roomId);
          if (roomClients) {
            roomClients.forEach((clientWs, id) => {
              if (id !== clientId && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "call_action",
                  senderId: clientId,
                  action: payload.action,
                  value: payload.value,
                }));
              }
            });
          }
        }

      } catch (err) {
        console.error("[WS] Message parsing error:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentClientId) {
        const roomClients = rooms.get(currentRoomId);
        if (roomClients) {
          roomClients.delete(currentClientId);
          console.log(`[WS] Client ${currentClientId} left room ${currentRoomId}`);

          // Notify others
          roomClients.forEach((clientWs, id) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "user_left",
                clientId: currentClientId,
              }));
            }
          });

          if (roomClients.size === 0) {
            rooms.delete(currentRoomId);
          }
        }
      }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
