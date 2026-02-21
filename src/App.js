import './App.css';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

import Chat from './Chat';
import Login from './Login';
import Signup from './Signup';
import VideoCall from './VideoCall';
import socket from "./Socket.js";
import { useEffect } from "react";
import History from "./History";
/* Wrapper to read channel from URL */
function VideoWrapper() {
  const { channel } = useParams();
  return <VideoCall channelName={channel} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/history" element={<History />} />
        {/* FIXED — dynamic route */}
        <Route path="/video/:channel" element={<VideoWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;