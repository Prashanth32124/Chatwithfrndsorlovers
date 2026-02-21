import React, { useEffect, useState } from "react";
import socket from "./Socket";   // ✅ USE SINGLE SOCKET INSTANCE
import { useRef } from "react";
function Chat() {
  const myId = localStorage.getItem("userId");
  const [isMobile] = useState(window.innerWidth < 768);
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const bottomRef = useRef(null);
  /* ================= SOCKET CONNECT + REGISTER ================= */
  useEffect(() => {
  if (!socket.connected) socket.connect();

  socket.on("connect", () => {
    if (myId) {
      console.log("Registering user:", myId);
      socket.emit("register", myId);
    }
  });

  return () => socket.off("connect");
}, [myId]);
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
/* ================= REALTIME MESSAGE LISTENER ================= */
useEffect(() => {
  const handler = (msg) => {
    console.log("RECEIVED:", msg);

    if (!selectedUser) return;

    const isCurrentChat =
      msg.sender === selectedUser._id ||
      msg.receiver === selectedUser._id;

    if (!isCurrentChat) return;

    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  };

  socket.on("new-message", handler);
  return () => socket.off("new-message", handler);
}, [selectedUser]);
  /* ================= INCOMING CALL LISTENER ================= */
 useEffect(() => {
  socket.on("incoming-call", ({ from, channel }) => {
    console.log("📞 Incoming call received:", from, channel);

    setTimeout(() => {
      const accept = window.confirm(`Incoming call from ${from}`);

      if (accept) {
        window.location.href = `/video/${channel}`;
      }
    }, 100);
  });

  return () => socket.off("incoming-call");
}, []);
   
  /* ================= LOAD FRIEND LIST ================= */
  useEffect(() => {
  loadFriends();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const loadFriends = async () => {
    const res = await fetch(`https://chatwithfrndsorloversbackend.onrender.com/friends/${myId}`);
    const data = await res.json();
    setFriends(data);
  };

  /* ================= LOAD MESSAGES ================= */
  const loadMessages = async (friend) => {
    setSelectedUser(friend);

    const res = await fetch(
      `https://chatwithfrndsorloversbackend.onrender.com/messages/${myId}/${friend._id}`
    );
    const data = await res.json();
    setMessages(data);
  };

  /* ================= SEND MESSAGE ================= */
/* ================= SEND MESSAGE ================= */
const sendMessage = () => {
  console.log("sendMessage fired", input, selectedUser);

  if (!input.trim() || !selectedUser) {
    console.log("BLOCKED: empty or no user");
    return;
  }

  socket.emit("send-message", {
    sender: myId,
    receiver: selectedUser._id,
    message: input.trim(),
  });

  console.log("EMITTED");
  setInput("");
};
  /* ================= ADD FRIEND BY EMAIL ================= */
  const addFriend = async () => {
    if (!searchEmail) return alert("Enter email");

    try {
      const res = await fetch(
        `https://chatwithfrndsorloversbackend.onrender.com/search-user?email=${encodeURIComponent(
          searchEmail
        )}`
      );
      const data = await res.json();

      if (!res.ok) return alert(data.error);

      await fetch("https://chatwithfrndsorloversbackend.onrender.com/add-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: myId,
          friendId: data.userId,
        }),
      });

      alert("Friend added 🎉");
      setSearchEmail("");
      loadFriends();
    } catch (err) {
      alert("Error adding friend");
    }
  };

  /* ================= START VIDEO CALL ================= */
  const startVideoCall = () => {
    if (!selectedUser) return alert("Select a friend first");

    const channel = [myId, selectedUser._id].sort().join("_");

    // Notify other user
    socket.emit("call-user", {
      to: selectedUser._id,
      from: myId,
      channel,
    });

    // Open own video page
    window.location.href = `/video/${channel}`;
  };

 return (
  <div
    style={{
      display: "flex",
      height: "100vh",
      fontFamily: "Arial",
      overflow: "hidden",
    }}
  >
    {/* ================= LEFT SIDEBAR ================= */}
    <div
      style={{
        width: isMobile ? "100%" : "30%",
        display: isMobile && selectedUser ? "none" : "block",
        borderRight: "1px solid #ddd",
        backgroundColor: "#f0f2f5",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "15px", fontWeight: "bold" }}>Chats</div>

      {/* Add Friend */}
      <div style={{ padding: "10px" }}>
        <input
  placeholder="Add friend by email"
  value={searchEmail}
  onChange={(e) => setSearchEmail(e.target.value)}
  style={{
    width: "100%",
    padding: "8px",
    fontSize: "16px"   // ✅ IMPORTANT
  }}
/>
        <button
          onClick={addFriend}
          style={{
            marginTop: "5px",
            width: "100%",
            padding: "8px",
            backgroundColor: "#25d366",
            border: "none",
            color: "white",
          }}
        >
          Add Friend
        </button>
      </div>

      <button
        onClick={() => (window.location.href = "/history")}
        style={{
          margin: 10,
          padding: 8,
          background: "#25d366",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        📞 Call History
      </button>

      {/* Friend List */}
      {friends.map((friend) => (
        <div
          key={friend._id}
          onClick={() => loadMessages(friend)}
          style={{
            padding: "15px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
            backgroundColor:
              selectedUser?._id === friend._id ? "#ddd" : "transparent",
          }}
        >
          <div style={{ fontWeight: "bold" }}>{friend.name}</div>
          <div style={{ fontSize: "12px", color: "gray" }}>
            {friend.email}
          </div>
        </div>
      ))}
    </div>

    {/* ================= RIGHT CHAT AREA ================= */}
    <div
      style={{
        flex: 1,
        display: isMobile && !selectedUser ? "none" : "flex",
        flexDirection: "column",
      }}
    >
      {selectedUser && (
        <>
          {/* Header */}
          <div
            style={{
              padding: "15px",
              borderBottom: "1px solid #ddd",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isMobile && (
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ←
                </button>
              )}
              {selectedUser.name}
            </div>

            <button
              onClick={startVideoCall}
              style={{
                padding: "6px 12px",
                background: "#25d366",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              📹
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "15px",
              overflowY: "auto",
              backgroundColor: "#e5ddd5",
              paddingBottom: "70px",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === myId ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      msg.sender === myId ? "#dcf8c6" : "white",
                    padding: "10px 15px",
                    borderRadius: "15px",
                    maxWidth: isMobile ? "80%" : "60%",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: isMobile ? 0 : "30%",
              right: 0,
              padding: "10px",
              borderTop: "1px solid #ddd",
              display: "flex",
              gap: "10px",
              background: "white",
            }}
          >
            <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Type message"
  style={{
    flex: 1,
    padding: "10px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    fontSize: "16px"   // ✅ IMPORTANT
  }}
/>
            <button
  onClick={() => {
    console.log("BUTTON CLICKED");
    sendMessage();
  }}
  style={{
    padding: "10px 20px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#25d366",
    color: "white",
  }}
>
  Send
</button>
          </div>
        </>
      )}
    </div>
  </div>
);
}

export default Chat; 