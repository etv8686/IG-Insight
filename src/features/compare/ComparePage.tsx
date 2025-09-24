import { useState } from "react";

export default function ComparePage() {
  const [message, setMessage] = useState("App is working!");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Unfollow Checker</h1>
      <p>{message}</p>
      <button 
        onClick={() => setMessage("Button clicked!")}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Test Button
      </button>
    </div>
  );
}