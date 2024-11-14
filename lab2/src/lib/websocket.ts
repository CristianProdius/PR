import { WebSocketServer, WebSocket } from "ws";

interface ChatUser {
  ws: WebSocket;
  username: string;
  room: string;
}

class ChatServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<ChatUser>>;

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
              this.rooms.set(room, new Set());
            }

            // Add user to room
            this.rooms.get(room)?.add(currentUser);

            // Notify everyone in the room
            this.broadcastToRoom(room, {
              type: "system",
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
        this.rooms.get(room)?.delete(currentUser);

        // Remove empty room
        if (this.rooms.get(room)?.size === 0) {
          this.rooms.delete(room);
        }

        // Notify others
        this.broadcastToRoom(room, {
          type: "system",
          payload: {
            message: `${username} has left the room`,
            timestamp: new Date().toISOString(),
          },
        });

        this.updateUserList(room);
      }
    });
  }

  private broadcastToRoom(room: string, message: any) {
    const roomUsers = this.rooms.get(room);
    if (roomUsers) {
      const messageStr = JSON.stringify(message);
      roomUsers.forEach((user) => {
        if (user.ws.readyState === WebSocket.OPEN) {
          user.ws.send(messageStr);
        }
      });
    }
  }

  private updateUserList(room: string) {
    const users = Array.from(this.rooms.get(room) || []).map(
      (user) => user.username
    );
    this.broadcastToRoom(room, {
      type: "users",
      payload: {
        users,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default ChatServer;
