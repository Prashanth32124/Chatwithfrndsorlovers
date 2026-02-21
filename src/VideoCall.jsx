import React, { useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useNavigate } from "react-router-dom";
import socket from "./Socket";

const APP_ID = "856700ed462044a1846e5f7379d2bcda";
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function VideoCall({ channelName }) {
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localTracks = useRef([]);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Joining channel:", channelName);

        /* ================= SAFE SOCKET CONNECT ================= */
        if (!socket.connected) {
          socket.connect();
        }

        /* ================= JOIN CALL ROOM ================= */
        socket.emit("join-call-room", channelName);

        /* ================= RE-REGISTER USER (FIX CHAT) ================= */
        const myId = localStorage.getItem("userId");
        if (myId) {
          socket.emit("register", myId);
        }

        /* ================= FORCE LEAVE FUNCTION ================= */
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

        /* ================= PREVENT DUPLICATE LISTENERS ================= */
        socket.off("call-ended");

        /* ================= SOCKET: CALL ENDED ================= */
        socket.on("call-ended", () => {
          console.log("📞 Call ended event received");
          forceLeave();
        });

        /* ================= AGORA EVENTS ================= */
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video") {
            user.videoTrack.play(remoteRef.current);
          }

          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", () => {
          if (remoteRef.current) {
            remoteRef.current.innerHTML = "";
          }
        });

        client.on("user-left", async () => {
          console.log("📞 Remote user left");
          forceLeave();
        });

        /* ================= GET TOKEN ================= */
        const res = await fetch(
          `http://localhost:5000/generate-token/${channelName}`
        );
        const data = await res.json();
        const token = data.token;

        /* ================= JOIN CHANNEL ================= */
        await client.join(APP_ID, channelName, token || null, null);

        /* ================= CREATE TRACKS ================= */
        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        localTracks.current = [micTrack, camTrack];

        /* ================= PLAY LOCAL VIDEO ================= */
        camTrack.play(localRef.current);

        /* ================= PUBLISH ================= */
        await client.publish(localTracks.current);

      } catch (err) {
        console.error("AGORA ERROR:", err);
      }
    };

    init();

    /* ================= CLEANUP ================= */
    return () => {
      socket.off("call-ended");

      localTracks.current.forEach((track) => {
        track.stop();
        track.close();
      });

      client.leave();
      client.removeAllListeners();
    };
  }, [channelName, navigate]);

  /* ================= MANUAL LEAVE ================= */
  const leaveCall = async () => {
    socket.emit("end-call", { channel: channelName });

    localTracks.current.forEach((track) => {
      track.stop();
      track.close();
    });

    await client.leave();
    navigate("/chat");
  };

  return (
    <div style={{ textAlign: "center", paddingTop: 20 }}>
      <h2>Video Call</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        {/* LOCAL VIDEO */}
        <div>
          <h4>You</h4>
          <div
            ref={localRef}
            style={{ width: 350, height: 250, background: "black" }}
          />
        </div>

        {/* REMOTE VIDEO */}
        <div>
          <h4>Friend</h4>
          <div
            ref={remoteRef}
            style={{ width: 350, height: 250, background: "black" }}
          />
        </div>
      </div>

      <br />

      <button
        onClick={leaveCall}
        style={{
          padding: "10px 20px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        End Call ❌
      </button>
    </div>
  );
}

export default VideoCall;