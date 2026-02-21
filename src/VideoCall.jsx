import React, { useEffect, useRef } from "react";
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
  const isCallMinimized = useRef(false); // 🧠 prevent cleanup when going back

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Joining channel:", channelName);

        if (!socket.connected) socket.connect();

        socket.emit("join-call-room", channelName);

        const myId = localStorage.getItem("userId");
        if (myId) socket.emit("register", myId);

        const forceLeave = async () => {
          try {
            localTracks.current.forEach((track) => {
              track.stop();
              track.close();
            });

            await client.leave();
            navigate("/chat");
          } catch (err) {
            console.log(err);
          }
        };

        socket.off("call-ended");
        socket.on("call-ended", () => {
          console.log("📞 Call ended event received");
          forceLeave();
        });

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video") user.videoTrack.play(remoteRef.current);
          if (mediaType === "audio") user.audioTrack.play();
        });

        client.on("user-unpublished", () => {
          if (remoteRef.current) remoteRef.current.innerHTML = "";
        });

        client.on("user-left", async () => {
          console.log("📞 Remote user left");
          forceLeave();
        });

        const res = await fetch(
          `https://chatwithfrndsorloversbackend.onrender.com/generate-token/${channelName}`
        );
        const data = await res.json();
        const token = data.token;

        await client.join(APP_ID, channelName, token || null, null);

        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        localTracks.current = [micTrack, camTrack];

        camTrack.play(localRef.current);
        await client.publish(localTracks.current);
      } catch (err) {
        console.error("AGORA ERROR:", err);
      }
    };

    init();

    return () => {
      socket.off("call-ended");

      // 🧠 Only cleanup if NOT minimized
      if (!isCallMinimized.current) {
        localTracks.current.forEach((track) => {
          track.stop();
          track.close();
        });

        client.leave();
        client.removeAllListeners();
      }
    };
  }, [channelName, navigate]);

  /* ================= CAMERA SWITCH ================= */
  const switchCamera = async () => {
    try {
      const newFacing =
        currentCam.current === "user" ? "environment" : "user";

      const newCamTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: newFacing,
      });

      const oldCamTrack = localTracks.current[1];
      if (!oldCamTrack) return;

      await client.unpublish(oldCamTrack);
      oldCamTrack.stop();
      oldCamTrack.close();

      localTracks.current[1] = newCamTrack;
      newCamTrack.play(localRef.current);

      await client.publish(newCamTrack);

      currentCam.current = newFacing;
    } catch (err) {
      console.log("Camera switch failed:", err);
    }
  };

  /* ================= BACK TO CHAT (CALL CONTINUES) ================= */
  const goBackToChat = () => {
    isCallMinimized.current = true;
    navigate("/chat");
  };

  /* ================= END CALL ================= */
  const endCall = async () => {
    try {
      socket.emit("end-call", { channel: channelName });

      localTracks.current.forEach((track) => {
        track.stop();
        track.close();
      });

      await client.leave();
      client.removeAllListeners();

      navigate("/chat");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="call-container">
      {/* Remote Full Screen */}
      <div ref={remoteRef} className="remote-video" />

      {/* Local Floating */}
      <div ref={localRef} className="local-video" />

      {/* Controls */}
      <div className="controls">
        <button onClick={goBackToChat}>⬅️</button>
        <button onClick={switchCamera}>🔄</button>
        <button className="end-btn" onClick={endCall}>
          ❌
        </button>
      </div>
    </div>
  );
}

export default VideoCall;