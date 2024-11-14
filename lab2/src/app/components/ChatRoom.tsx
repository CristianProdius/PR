"use client";

import { useEffect, useState, useRef } from "react";

interface Message {
  id: string;
  type: string;
  payload: {
    username?: string;
    message: string;
    users?: string[];
    timestamp: string;
  };
}

export default function ChatRoom({
  username,
  room,
}: {
  username: string;
  room: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const processedMessages = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { username, room },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && processedMessages.current.has(data.id)) return;
        if (data.id) processedMessages.current.add(data.id);

        switch (data.type) {
          case "users":
            setActiveUsers(data.payload.users);
            break;
          case "message":
          case "system":
            setMessages((prev) => [...prev, data]);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setConnected(false);
      wsRef.current = null;

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [username, room]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !inputMessage.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        payload: {
          message: inputMessage.trim(),
        },
      })
    );

    setInputMessage("");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Active Users Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Active Users</h2>
          <p className="text-sm text-gray-500">{activeUsers.length} online</p>
        </div>
        <div className="p-4">
          {activeUsers.map((user, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className={user === username ? "font-bold" : ""}>
                {user} {user === username && "(you)"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white p-4 border-b">
          <h1 className="text-xl font-bold">Room: {room}</h1>
          <p className="text-sm text-gray-600">
            Connected as: {username} | Status:{" "}
            <span className={connected ? "text-green-500" : "text-red-500"}>
              {connected ? "Connected" : "Disconnected (Reconnecting...)"}
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[70%] ${
                msg.type === "system"
                  ? "mx-auto"
                  : msg.payload.username === username
                  ? "ml-auto"
                  : ""
              }`}
            >
              <div
                className={`rounded-lg p-3 ${
                  msg.type === "system"
                    ? "bg-gray-200 text-gray-600 text-center"
                    : msg.payload.username === username
                    ? "bg-blue-500 text-white"
                    : "bg-white border"
                }`}
              >
                {msg.type !== "system" && msg.payload.username && (
                  <p className="text-sm font-semibold mb-1">
                    {msg.payload.username === username
                      ? "You"
                      : msg.payload.username}
                  </p>
                )}
                <p>{msg.payload.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.payload.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="bg-white p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!connected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
