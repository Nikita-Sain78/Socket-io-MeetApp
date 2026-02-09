// controllers/video.controller.js
// import { generateToken04 } from "../utils/zegoToken.js";

import { generateToken04 } from "../lib/zegoToken.js";

export const getVideoToken = (req, res) => {
  const { roomID } = req.query;

  if (!roomID) {
    return res.status(400).json({ error: "roomID is required" });
  }

  const appID = Number(process.env.APP_ID);
  const serverSecret = process.env.SERVER_SECRET;

  const userID = req.user._id.toString();
  const userName = req.user.fullName;

  const token = generateToken04(
    appID,
    userID,
    serverSecret,
    3600, // 1 hour
    roomID
  );

  res.json({ token, userID, userName });
};
