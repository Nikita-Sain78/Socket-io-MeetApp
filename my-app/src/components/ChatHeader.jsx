import { Video, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

// Generate a random ID for room
const generateRoomID = (len = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < len; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, sendMessage } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const nav = useNavigate();

  const handleVideoCall = () => {
    if (!selectedUser) return;

    // 1️⃣ Generate a unique roomID
    const roomID = generateRoomID();

    // 2️⃣ Build call link
    const callLink = `${window.location.origin}/videoCall?roomID=${roomID}`;

    // 3️⃣ Send link to chat so the other user can join
    sendMessage({ text: callLink });

    // 4️⃣ Navigate yourself to video call page
    nav(`/videoCall?roomID=${roomID}`);
  };

  console.log(selectedUser,"selectedUser")
  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-7 rounded-full relative ">
              <img src={selectedUser.profilePic} alt="avatar" className="size-6 object-fill"/>
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser?.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex gap-5">
          <button onClick={handleVideoCall}><Video /></button>
          <button onClick={() => setSelectedUser(null)}><X /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
