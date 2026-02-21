import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    // Normalize email (important)
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("https://chatwithfrndsorloversbackend.onrender.com/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Signup failed");
        return;
      }

      alert("Signup successful 🎉");
      navigate("/"); // Redirect to login page
      // Clear fields
      setName("");
      setEmail("");
      setPassword("");

    } catch (err) {
      console.error(err);
      alert("Server not reachable");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: 20 }}>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

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

        <button onClick={handleSignup} style={styles.button}>
          Sign Up
        </button>

        <p style={{ marginTop: 15 }}>
          Already have an account? <span style={styles.link}>Login</span>
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

export default Signup;