"use client";

import { useState } from "react";
import ChatRoom from "../components/ChatRoom";

export default function ChatPage() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      setJoined(true);
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleJoin} className="p-8 border rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Join Chat Room</h1>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room Name"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Join Room
          </button>
        </form>
      </div>
    );
  }

  return <ChatRoom username={username} room={room} />;
}
