import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "./Socket";
import CallManager from "./CallManager";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./CSS/VideoCall.css";

function VideoCall({ channelName }) {
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const currentCam = useRef("user");

  const [isMuted, setIsMuted] = useState(false);

  /* ================= CALL END LISTENER ================= */
  useEffect(() => {
    const handleCallEnded = async () => {
      console.log("📴 Other user ended the call");

      await CallManager.leave();

      localStorage.removeItem("activeCallChannel");
      localStorage.removeItem("callStartTime");

      navigate("/chat");
    };

    socket.on("call-ended", handleCallEnded);
    return () => socket.off("call-ended", handleCallEnded);
  }, [navigate]);

  /* ================= TIMER ================= */
  const [callTime, setCallTime] = useState(() => {
    const start = Number(localStorage.getItem("callStartTime"));
    return start ? Math.floor((Date.now() - start) / 1000) : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const start = Number(localStorage.getItem("callStartTime"));
      if (start) {
        setCallTime(Math.floor((Date.now() - start) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  /* ================= INIT ================= */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        /* Join socket call room ALWAYS */
        if (!socket.connected) socket.connect();
        socket.emit("join-call-room", channelName);

        /* Attach ONLY our listeners (not wiping SDK) */
        CallManager.client.removeAllListeners("user-published");
        CallManager.client.removeAllListeners("user-left");

        CallManager.client.on("user-published", async (user, type) => {
          await CallManager.client.subscribe(user, type);

          if (type === "video" && remoteRef.current) {
            user.videoTrack.play(remoteRef.current);
          }
          if (type === "audio") {
            user.audioTrack.play();
          }
        });

        CallManager.client.on("user-left", () => {
          if (remoteRef.current) remoteRef.current.innerHTML = "";
        });

        const alreadyInCall =
          CallManager.joined &&
          CallManager.channel === channelName;

        /* ===== RETURN TO CALL (NO REJOIN) ===== */
        if (alreadyInCall) {
          console.log("♻️ Reattaching existing call");

          if (CallManager.localTracks[1] && localRef.current) {
            CallManager.localTracks[1].play(localRef.current);
          }

          CallManager.client.remoteUsers.forEach(user => {
            if (user.videoTrack && remoteRef.current) {
              user.videoTrack.play(remoteRef.current);
            }
            if (user.audioTrack) user.audioTrack.play();
          });

          return;
        }

        /* ===== FIRST TIME JOIN ===== */
        localStorage.setItem("activeCallChannel", channelName);

        if (!localStorage.getItem("callStartTime")) {
          localStorage.setItem("callStartTime", Date.now());
        }

        const res = await fetch(
          `https://chatwithfrndsorloversbackend.onrender.com/generate-token/${channelName}`
        );
        const { token } = await res.json();

        await CallManager.join(channelName, token);

        if (!mounted) return;

        if (CallManager.localTracks[1] && localRef.current) {
          CallManager.localTracks[1].play(localRef.current);
        }

      } catch (err) {
        console.log("INIT ERROR:", err);
      }
    };

    init();
    return () => (mounted = false);
  }, [channelName]);

  /* ================= CAMERA SWITCH ================= */
  const switchCamera = async () => {
    try {
      const newFacing =
        currentCam.current === "user" ? "environment" : "user";

      const newTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: newFacing,
      });

      const oldTrack = CallManager.localTracks[1];
      if (!oldTrack) return;

      await CallManager.client.unpublish(oldTrack);
      oldTrack.stop();
      oldTrack.close();

      CallManager.localTracks[1] = newTrack;

      if (localRef.current) newTrack.play(localRef.current);
      await CallManager.client.publish(newTrack);

      currentCam.current = newFacing;
    } catch (err) {
      console.log("CAMERA SWITCH ERROR:", err);
    }
  };

  /* ================= MUTE ================= */
  const toggleMute = async () => {
    try {
      const mic = CallManager.localTracks[0];
      if (!mic) return;

      await mic.setEnabled(isMuted);
      setIsMuted(!isMuted);
    } catch (err) {
      console.log("MUTE ERROR:", err);
    }
  };

  /* ================= RETURN TO CHAT ================= */
  const goBackToChat = () => navigate("/chat");

  /* ================= END CALL ================= */
  const endCall = async () => {
    if (CallManager.joined) {
      socket.emit("end-call", { channel: channelName });
      await CallManager.leave();
    }

    localStorage.removeItem("activeCallChannel");
    localStorage.removeItem("callStartTime");

    navigate("/chat");
  };

  return (
    <div className="call-container">
      <div ref={remoteRef} className="remote-video" />
      <div ref={localRef} className="local-video" />

      <div className="call-timer">{formatTime(callTime)}</div>

      <div className="controls">
        <button onClick={goBackToChat}>⬅️</button>
        <button onClick={switchCamera}>🔄</button>
        <button onClick={toggleMute}>
          {isMuted ? "🔇" : "🎤"}
        </button>
        <button onClick={endCall}>❌</button>
      </div>
    </div>
  );
}

export default VideoCall;