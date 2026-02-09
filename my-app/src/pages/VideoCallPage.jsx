// import * as React from "react";
// import { useEffect, useRef } from "react";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
// import { useChatStore } from "../store/useChatStore";

// // Generate a random ID for room or user
// function randomID(len) {
//   let result = "";
//   const chars =
//     "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
//   const maxPos = chars.length;
//   len = len || 5;
//   for (let i = 0; i < len; i++) {
//     result += chars.charAt(Math.floor(Math.random() * maxPos));
//   }
//   return result;
// }

// // Get URL parameters
// export function getUrlParams(url = window.location.href) {
//   let urlStr = url.split("?")[1];
//   return new URLSearchParams(urlStr);
// }

// export default function VideoCallPage() {
//   const selectedUser = useChatStore((state) => state.selectedUser);
//   const sendMessage = useChatStore((state) => state.sendMessage);

//   // 1️⃣ Get or generate roomID
//   const roomID = getUrlParams().get("roomID") || randomID(5);

//   // Ref to track if call message was already sent
//   const hasSentCall = useRef(false);

//   // 2️⃣ Send call message exactly once
//   useEffect(() => {
//     if (!selectedUser || hasSentCall.current) return;

//     const callLink = `${window.location.origin}/videoCall?roomID=${roomID}`;

//     // ✅ Send the message
//     sendMessage({ text: callLink });

//     // Mark as sent
//     hasSentCall.current = true;
//   }, [selectedUser, roomID, sendMessage]);

//   // 3️⃣ Initialize Zego UIKit
//   const initMeeting = async (element) => {
//     if (!element) return;

//      const appID 
//       const serverSecret 
//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appID,
//       serverSecret,
//       roomID,
//       randomID(5), // userID (can use actual user ID)
//       randomID(5) // userName
//     );

//     const zp = ZegoUIKitPrebuilt.create(kitToken);

//     zp.joinRoom({
//       container: element,
//       sharedLinks: [
//         {
//           name: "Personal link",
//           url: `${window.location.origin}/videoCall?roomID=${roomID}`,
//         },
//       ],
//       scenario: {
//         mode: ZegoUIKitPrebuilt.GroupCall, // or OneONoneCall
//       },
//     });
//   };

//   return (
//     <div
//       className="myCallContainer"
//       ref={initMeeting}
//       style={{ width: "100vw", height: "100vh" }}
//     ></div>
//   );
// }

// import * as React from "react";
// import { useRef, useEffect } from "react";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
// import { useChatStore } from "../store/useChatStore";

// function randomID(len = 5) {
//   const chars =
//     "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
//   let result = "";
//   for (let i = 0; i < len; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
// }

// export function getUrlParams(url = window.location.href) {
//   const urlStr = url.split("?")[1];
//   return new URLSearchParams(urlStr);
// }

// export default function VideoCallPage() {
//   const containerRef = useRef(null);
//   const selectedUser = useChatStore((state) => state.selectedUser);

//   const roomID = getUrlParams().get("roomID"); // must exist

//   const initMeeting = (element) => {
//     if (!element) return;
//   const appID =50155112
//       const serverSecret ="c507904d20bd5d82b3a8253960eb9d38"

//     const userID = selectedUser?._id || randomID(8);
//     const userName = selectedUser?.fullName || randomID(5);

//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appID,
//       serverSecret,
//       roomID,
//       userID,
//       userName
//     );

//     const zp = ZegoUIKitPrebuilt.create(kitToken);

//     zp.joinRoom({
//       container: element,
//       scenario: {
//         mode: ZegoUIKitPrebuilt.GroupCall, // or OneONOneCall
//       },
//       sharedLinks: [
//         {
//           name: "Personal link",
//           url: `${window.location.origin}/videoCall?roomID=${roomID}`,
//         },
//       ],
//     });
//   };

//   useEffect(() => {
//     if (containerRef.current) {
//       initMeeting(containerRef.current);
//     }
//   }, [roomID]);

//   return (
//     <div
//       className="myCallContainer"
//       ref={containerRef}
//       style={{ width: "100vw", height: "100vh" }}
//     ></div>
//   );
// }

import React, { useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useChatStore } from "../store/useChatStore";

export default function VideoCallPage() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const callContainerRef = useRef(null);

  // Get roomID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomID = urlParams.get("roomID");

  useEffect(() => {
    if (!callContainerRef.current || !roomID) return;

    // Replace these with your Zego credentials
    // const appID = 50155112;
    // const serverSecret = "c507904d20bd5d82b3a8253960eb9d38";
     const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret =import.meta.env.VITE_ZEGO_SERVER_SECRET;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      selectedUser?._id || "guest",
      selectedUser?.fullName || "Guest"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: callContainerRef.current, // This div must exist
      scenario: { mode: ZegoUIKitPrebuilt.GroupCall }, // Group call or One-on-One
      sharedLinks: [
        {
          name: "Personal link",
          url: `${window.location.origin}/videoCall?roomID=${roomID}`,
        },
      ],
    });

    // Cleanup on unmount
    return () => {
      zp.destroy(); // Remove all Zego UI and leave room
    };
  }, [roomID, selectedUser]);

  return (
    <div
      ref={callContainerRef}
      style={{ width: "100vw", height: "100vh" }}
    ></div>
  );
}

