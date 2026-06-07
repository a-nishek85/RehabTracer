import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// ================= CONNECT DATABASE =================
connectDB();

// ================= CREATE HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO SETUP =================
export const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    methods: ["GET", "POST"],

    credentials: true,
  },
});

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  console.log(
    `Socket Connected: ${socket.id}`
  );

  // ================= JOIN USER ROOM =================
  socket.on("join-room", (userId) => {
    socket.join(userId);

    console.log(
      `User Joined Room: ${userId}`
    );
  });

  // ================= SEND NOTIFICATION =================
  socket.on(
    "send-notification",
    (notificationData) => {
      io.to(
        notificationData.userId
      ).emit(
        "receive-notification",
        notificationData
      );
    }
  );

  // ================= SEND CHAT MESSAGE =================
  socket.on("send-message", (messageData) => {
    io.to(
      messageData.receiverId
    ).emit(
      "receive-message",
      messageData
    );
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log(
      `Socket Disconnected: ${socket.id}`
    );
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});