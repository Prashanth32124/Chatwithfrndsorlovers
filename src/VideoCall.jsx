import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useNavigate } from "react-router-dom";
import socket from "./Socket";
import "./CSS/VideoCall.css";

const APP_ID = "856700ed462044a1846e5f7379d2bcda";
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function VideoCall({ channelName }) {
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localTracks = useRef([]);
  const currentCam = useRef("user");
  const isCallMinimized = useRef(false);

  const [isMuted, setIsMuted] = useState(false);

  /* ================= TIMER (PERSISTENT) ================= */
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

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  /* ================= CALL INIT ================= */
  useEffect(() => {
    const init = async () => {
      try {
        if (!socket.connected) socket.connect();

        socket.emit("join-call-room", channelName);

        const myId = localStorage.getItem("userId");
        if (myId) socket.emit("register", myId);

        localStorage.setItem("activeCallChannel", channelName);
        window.dispatchEvent(new Event("call-state-changed"));

        if (!localStorage.getItem("callStartTime")) {
          localStorage.setItem("callStartTime", Date.now());
        }

        const forceLeave = async () => {
          localTracks.current.forEach((track) => {
            track.stop();
            track.close();
          });

          await client.leave();

          localStorage.removeItem("activeCallChannel");
          localStorage.removeItem("callStartTime");
          window.dispatchEvent(new Event("call-state-changed"));

          navigate("/chat");
        };

        socket.off("call-ended");
        socket.on("call-ended", forceLeave);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") user.videoTrack.play(remoteRef.current);
          if (mediaType === "audio") user.audioTrack.play();
        });

        client.on("user-left", forceLeave);

        const res = await fetch(
          `https://chatwithfrndsorloversbackend.onrender.com/generate-token/${channelName}`
        );
        const { token } = await res.json();

        await client.join(APP_ID, channelName, token || null, null);

        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        localTracks.current = [micTrack, camTrack];

        camTrack.play(localRef.current);
        await client.publish(localTracks.current);
      } catch (err) {
        console.log(err);
      }
    };

    init();

    return () => {
      if (isCallMinimized.current) return;

      localTracks.current.forEach((track) => {
        track.stop();
        track.close();
      });

      client.leave();
      client.removeAllListeners();
    };
  }, [channelName, navigate]);

  /* ================= CAMERA SWITCH ================= */
  const switchCamera = async () => {
    const newFacing =
      currentCam.current === "user" ? "environment" : "user";

    const newTrack = await AgoraRTC.createCameraVideoTrack({
      facingMode: newFacing,
    });

    const oldTrack = localTracks.current[1];
    if (!oldTrack) return;

    await client.unpublish(oldTrack);
    oldTrack.stop();
    oldTrack.close();

    localTracks.current[1] = newTrack;
    newTrack.play(localRef.current);
    await client.publish(newTrack);

    currentCam.current = newFacing;
  };

  /* ================= MUTE / UNMUTE ================= */
  const toggleMute = async () => {
    const micTrack = localTracks.current[0];
    if (!micTrack) return;

    await micTrack.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  /* ================= BACK TO CHAT ================= */
  const goBackToChat = () => {
    isCallMinimized.current = true;
    navigate("/chat");
  };

  /* ================= END CALL ================= */
  const endCall = async () => {
    socket.emit("end-call", { channel: channelName });

    localTracks.current.forEach((track) => {
      track.stop();
      track.close();
    });

    await client.leave();
    client.removeAllListeners();

    localStorage.removeItem("activeCallChannel");
    localStorage.removeItem("callStartTime");
    window.dispatchEvent(new Event("call-state-changed"));

    navigate("/chat");
  };

  return (
    <div className="call-container">
      <div ref={remoteRef} className="remote-video" />
      <div ref={localRef} className="local-video" />

      <div className="call-timer">{formatTime(callTime)}</div>

      <div className="controls">
        <button className="control-btn" onClick={goBackToChat}>⬅️</button>
        <button className="control-btn" onClick={switchCamera}>🔄</button>
        <button className="control-btn" onClick={toggleMute}>
          {isMuted ? "🔇" : "🎤"}
        </button>
        <button className="end-btn" onClick={endCall}>❌</button>
      </div>
    </div>
  );
}

export default VideoCall;