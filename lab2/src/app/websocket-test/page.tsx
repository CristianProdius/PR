"use client";

import { useEffect, useState } from "react";

export default function WebSocketTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      <div className="mb-4">
        Status:{" "}
        <span className={connected ? "text-green-500" : "text-red-500"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Messages:</h2>
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
