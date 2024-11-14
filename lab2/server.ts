import { createServer } from "http";
import { parse } from "url";
import next from "next";
import ChatServer from "./src/lib/websocket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // HTTP Server (Next.js)
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log("> HTTP Server ready on http://localhost:3000");
  });

  // WebSocket Server
  new ChatServer(8080);
});
