import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// helper to get a socket id for a user
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }

    userSocketMap[userId].push(socket.id);

    // broadcast online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  
socket.on("typing", ({ senderId, receiverId }) => {
    console.log("Typing event received:", senderId, receiverId); // ✅ debug log
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
      console.log("Forwarded typing to:", receiverSocketId);
    } else {
      console.log("Receiver not online yet");
    }
  });
  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (id) => id !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});


export { io, app, server };
