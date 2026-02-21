import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function History() {
  const [calls, setCalls] = useState([]);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
  loadHistory();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const loadHistory = async () => {
    try {
      const res = await fetch(`https://chatwithfrndsorloversbackend.onrender.com/call-history/${userId}`);
      const data = await res.json();
      setCalls(data);
    } catch {
      alert("Failed to load call history");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
      }}>
        <h2>📞 Call History</h2>

        <button
          onClick={() => navigate("/chat")}
          style={{
            padding: "6px 12px",
            border: "none",
            background: "#25d366",
            color: "white",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          ← Back to Chat
        </button>
      </div>

      {/* No history */}
      {calls.length === 0 && (
        <div style={{ color: "gray" }}>No calls yet</div>
      )}

      {/* Call list */}
      {calls.map((call, index) => {
        const isOutgoing = call.caller === userId;
        const otherUser = isOutgoing ? call.receiver : call.caller;

        return (
          <div
            key={index}
            style={{
              padding: 12,
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>
                {isOutgoing ? "📤 Outgoing Call" : "📥 Incoming Call"}
              </div>

              <div style={{ fontSize: 13, color: "gray" }}>
                User ID: {otherUser}
              </div>

              <div style={{ fontSize: 12, color: "#888" }}>
                {new Date(call.time).toLocaleString()}
              </div>
            </div>

            <div style={{
              fontSize: 12,
              color: call.status === "completed" ? "green" : "red"
            }}>
              {call.status}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default History;