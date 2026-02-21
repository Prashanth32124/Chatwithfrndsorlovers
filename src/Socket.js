import { io } from "socket.io-client";

const socket = io("https://chatwithfrndsorloversbackend.onrender.com", {
  autoConnect: false,
});

export default socket;