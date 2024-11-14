// components/ChatRoom.tsx
"use client";

import { useEffect, useState, useRef } from "react";

interface Message {
  type: string;
  payload: {
    username?: string;
    message: string;
    timestamp: string;
    users?: string[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
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
        console.log("Received:", data);

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
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [username, room]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current) return;

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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
            Status:{" "}
            <span className={connected ? "text-green-500" : "text-red-500"}>
              {connected ? "Connected" : "Disconnected"}
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
                    : "bg-white"
                }`}
              >
                {msg.type !== "system" && msg.payload.username && (
                  <p className="text-sm font-semibold">
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
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
