import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "856700ed462044a1846e5f7379d2bcda";

class CallManager {
  constructor() {
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.localTracks = [];
    this.channel = null;
    this.joined = false;
    this.joining = false;
  }

  async join(channel, token) {
    if (this.joined && this.channel === channel) {
      console.log("♻️ Already joined same channel");
      return;
    }

    if (this.joining) {
      console.log("⚠️ Join already in progress");
      return;
    }

    try {
      this.joining = true;
      this.channel = channel;

      await this.client.join(APP_ID, channel, token || null, null);

      const [mic, cam] =
        await AgoraRTC.createMicrophoneAndCameraTracks();

      this.localTracks = [mic, cam];

      await this.client.publish(this.localTracks);

      this.joined = true;
      console.log("✅ Joined channel:", channel);
    } catch (err) {
      console.log("JOIN ERROR:", err);
    } finally {
      this.joining = false;
    }
  }

  async leave() {
    if (!this.joined) return;

    try {
      this.localTracks.forEach(track => {
        track.stop();
        track.close();
      });

      await this.client.leave();
    } catch (err) {
      console.log("LEAVE ERROR:", err);
    }

    this.localTracks = [];
    this.joined = false;
    this.joining = false;
    this.channel = null;

    console.log("❌ Left channel");
  }
}

export default new CallManager();