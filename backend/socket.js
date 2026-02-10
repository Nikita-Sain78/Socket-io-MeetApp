// // import { Server } from "socket.io";
// // import jwt from "jsonwebtoken";
// // import { JWT_SECRET } from "./middleware/AuthMiddleWare.js";
// // export default function configureSocket(server) {
// //   const io = new Server(server, {
// //     cors: {
// //       origin: "*",
// //       methods: ["GET", "POST"]
// //     }
// //   });

// //   io.use((socket, next) => {
// //     const token = socket.handshake.auth?.token;
// //     if (!token) return next(new Error("Authentication error"));

// //     try {
// //       const user = jwt.verify(token, JWT_SECRET);
// //       socket.user = user;
// //       next();
// //     } catch (err) {
// //       next(new Error("Authentication error"));
// //     }
// //   });

// //   io.on("connection", (socket) => {
// //     console.log(`${socket.user.username} connected`);

// //     socket.on("chat message", (msg) => {
// //       io.emit("chat message", {
// //         user: socket.user.username,
// //         message: msg,
// //       });
// //     });

// //     socket.on("disconnect", () => {
// //       console.log(`${socket.user.username} disconnected`);
// //     });
// //   });
// // }

// import { Server } from "socket.io";
// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "./middleware/AuthMiddleWare.js";

// const onlineUsers = new Map();

// export default function configureSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"]
//     }
//   });

//   // 🔐 JWT authentication
//   io.use((socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) return next(new Error("Authentication error"));

//     try {
//       const user = jwt.verify(token, JWT_SECRET);
//       socket.user = user;
//       next();
//     } catch {
//       next(new Error("Authentication error"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log(`${socket.user.username} connected`);

//     // 🟢 store online user
//     onlineUsers.set(socket.user.id, socket.id);

//     // 💬 chat (unchanged)
//     socket.on("chat message", (msg) => {
//       io.emit("chat message", {
//         user: socket.user.username,
//         message: msg,
//       });
//     });

//     // 📞 start call (send WebRTC offer)
//     socket.on("call-user", ({ toUserId, signal }) => {
//       const targetSocketId = onlineUsers.get(toUserId);
//        console.log("call-user from", socket.user.id, "to", toUserId);
//   console.log("targetSocketId:", targetSocketId);
//       if (!targetSocketId) return;

//       io.to(targetSocketId).emit("incoming-call", {
//         from: socket.user,
//         signal
//       });
//     });

//     // ✅ answer call (send WebRTC answer)
//     socket.on("answer-call", ({ toUserId, signal }) => {
//       const targetSocketId = onlineUsers.get(toUserId);
//        console.log("call-user from", socket.user.id, "to", toUserId);
//   console.log("targetSocketId:", targetSocketId);
//       if (!targetSocketId) return;

//       io.to(targetSocketId).emit("call-accepted", {
//         from: socket.user,
//         signal
//       });
//     });

//     // 🧊 ICE candidate exchange (REQUIRED)
// socket.on("ice-candidate", ({ toUserId, candidate }) => {
//   const targetSocketId = onlineUsers.get(toUserId);
//   if (!targetSocketId) return;

//   io.to(targetSocketId).emit("ice-candidate", {
//     from: socket.user.id,
//     candidate,
//   });
// });

//     // ❌ end / reject call
//     socket.on("end-call", ({ toUserId }) => {
//       const targetSocketId = onlineUsers.get(toUserId);
//        console.log("call-user from", socket.user.id, "to", toUserId);
//   console.log("targetSocketId:", targetSocketId);
//       if (!targetSocketId) return;

//       io.to(targetSocketId).emit("call-ended");
//     });

//     socket.on("disconnect", () => {
//       onlineUsers.delete(socket.user.id);
//       console.log(`${socket.user.username} disconnected`);
//     });
//   });
// }
