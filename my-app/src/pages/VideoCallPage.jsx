
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

