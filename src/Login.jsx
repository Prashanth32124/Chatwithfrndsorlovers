import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from './Socket.js';
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  
  const handleLogin = async () => {
  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    // Save login session
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("name", data.name);

    alert("Login successful 🎉");
    localStorage.setItem("userId", data.userId);

socket.connect();
socket.emit("register", data.userId);
    navigate("/chat"); 
    // Redirect to chat page (later)
    // window.location.href = "/chat";

  } catch (err) {
    console.error(err);
    alert("Server not reachable");
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: 20 }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          Login
        </button>

        <p style={{ marginTop: 15 }}>
          Don't have an account? <span style={styles.link}>Register</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#e5ddd5",
  },
  card: {
    width: 320,
    padding: 30,
    background: "white",
    borderRadius: 10,
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#25d366",
    border: "none",
    color: "white",
    borderRadius: 5,
    fontSize: 16,
    cursor: "pointer",
  },
  link: {
    color: "#25d366",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Login;