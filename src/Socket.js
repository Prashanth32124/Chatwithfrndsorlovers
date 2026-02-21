import { io } from "socket.io-client";

const socket = io("https://chatwithfrndsorloversbackend.onrender.com", {
  transports: ["websocket"],   // 🔥 FORCE WEBSOCKET (NO POLLING DELAY)
  autoConnect: false,
  reconnection: true,          // auto reconnect if network drop
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;