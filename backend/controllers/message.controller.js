import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     });

//     // Mark only messages that belong to this chat as seen
//     await Message.updateMany(
//       {
//         senderId: userToChatId,
//         receiverId: myId,
//         seen: false,
//       },
//       { seen: true }
//     );

//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // 1️⃣ Mark messages as seen FIRST
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        seen: false,
      },
      { $set: { seen: true } }
    );

    // 2️⃣ Fetch updated messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {

    
    const myId = req.user._id;

    // Aggregate unread messages per sender
    const counts = await Message.aggregate([
      { $match: { receiverId: myId, seen: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);

    // Convert to object { userId: count }
    const result = {};
    counts.forEach(c => { result[c._id] = c.count });

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch unread counts" });
  }
};



export const markMessagesSeen = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    // Update all unseen messages from this user to seen
    await Message.updateMany(
      { senderId: userId, receiverId: myId, seen: false },
      { $set: { seen: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking messages seen:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
