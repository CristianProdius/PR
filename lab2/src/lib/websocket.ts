import { WebSocketServer, WebSocket } from "ws";

interface ChatUser {
  ws: WebSocket;
  username: string;
  room: string;
}

class ChatServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Map<string, ChatUser>>; // Using username as key to prevent duplicates

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.rooms = new Map();
    console.log(`WebSocket server running on port ${port}`);

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket) {
    let currentUser: ChatUser | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received message:", data);

        switch (data.type) {
          case "join":
            const { username, room } = data.payload;
            currentUser = { ws, username, room };

            // Create room if doesn't exist
            if (!this.rooms.has(room)) {
              this.rooms.set(room, new Map());
            }

            // Remove any existing connection for this username in this room
            const roomUsers = this.rooms.get(room)!;
            if (roomUsers.has(username)) {
              const existingUser = roomUsers.get(username)!;
              existingUser.ws.close();
              roomUsers.delete(username);
            }

            // Add new user to room
            roomUsers.set(username, currentUser);

            // Notify everyone in the room
            this.broadcastToRoom(room, {
              type: "system",
              id: `join-${Date.now()}`,
              payload: {
                message: `${username} has joined the room`,
                timestamp: new Date().toISOString(),
              },
            });

            // Send updated user list
            this.updateUserList(room);
            break;

          case "chat":
            if (currentUser) {
              this.broadcastToRoom(currentUser.room, {
                type: "message",
                id: `msg-${Date.now()}`,
                payload: {
                  username: currentUser.username,
                  message: data.payload.message,
                  timestamp: new Date().toISOString(),
                },
              });
            }
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      if (currentUser) {
        const { room, username } = currentUser;
        const roomUsers = this.rooms.get(room);
        if (roomUsers) {
          roomUsers.delete(username);

          // Remove empty room
          if (roomUsers.size === 0) {
            this.rooms.delete(room);
          }

          // Notify others
          this.broadcastToRoom(room, {
            type: "system",
            id: `leave-${Date.now()}`,
            payload: {
              message: `${username} has left the room`,
              timestamp: new Date().toISOString(),
            },
          });

          this.updateUserList(room);
        }
      }
    });
  }

  private broadcastToRoom(room: string, message: any) {
    const roomUsers = this.rooms.get(room);
    if (roomUsers) {
      const messageStr = JSON.stringify(message);
      for (const user of roomUsers.values()) {
        if (user.ws.readyState === WebSocket.OPEN) {
          user.ws.send(messageStr);
        }
      }
    }
  }

  private updateUserList(room: string) {
    const roomUsers = this.rooms.get(room);
    if (roomUsers) {
      const users = Array.from(roomUsers.keys()); // Get usernames only
      this.broadcastToRoom(room, {
        type: "users",
        id: `users-${Date.now()}`,
        payload: {
          users,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export default ChatServer;
