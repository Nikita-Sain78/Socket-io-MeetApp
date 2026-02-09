
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeltons/MessageSkelton";

const ChatContainer = () => {
  const {
    messages,
    users,
    typingUsers,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToTyping,
    unsubscribeFromTyping,
    sendMessage, // added sendMessage here
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [incomingCalls, setIncomingCalls] = useState([]);

  // ---------------- Fetch + subscribe ----------------
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToTyping();

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromTyping();
    };
  }, [selectedUser?._id]);

  // ---------------- Auto scroll ----------------
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- Incoming calls ----------------
  useEffect(() => {
    const calls = messages.filter(
      (msg) =>
        msg.text?.includes("/videoCall?roomID=") &&
        msg.senderId !== authUser._id
    );

    setIncomingCalls(
      Array.from(new Map(calls.map((c) => [c._id, c])).values())
    );
  }, [messages, authUser._id]);

  // ---------------- Handle Decline ----------------
  const handleDeclineCall = (message) => {
    // Remove from incoming calls
    setIncomingCalls((prev) => prev.filter((c) => c._id !== message._id));

    // Add "call declined" message
    sendMessage({
      text: `📞 ${authUser.name || "user"} declined the call.`,
      senderId: authUser._id,
      receiverId: message.senderId,
      type: "callDeclined",
      createdAt: new Date().toISOString(),
    });
  };

  const handleRemoveCall = (id) => {
    setIncomingCalls((prev) => prev.filter((c) => c._id !== id));
  };

  console.log(users,"users")
  console.log("auth",authUser)
  // ---------------- Typing users (exclude self) ----------------
  const typingUserNames = Object.keys(typingUsers)
    .filter((id) => id !== authUser._id)
    .map((id) => users.find((u) => u._id === id)?.name)
    .filter(Boolean);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Deduplicate messages
  const uniqueMessages = Array.from(
    new Map(messages.map((m) => [m._id, m])).values()
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto h-full">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {uniqueMessages.map((message, index) => {
          const isLast = index === uniqueMessages.length - 1;
          const isCall = message.text?.includes("/videoCall?roomID=");
          const isIncomingCall = incomingCalls.some(
            (c) => c._id === message._id
          );

          return (
            <div
              key={message._id}
              ref={isLast ? messageEndRef : null}
              className={`chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
            >
               <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              {/* Avatar for messages from other users */}
    {message.senderId !== authUser._id && (
  <div className="chat-image avatar">
  <div className="size-7 rounded-full border overflow-hidden">
    <img
      src={
        users.find(u => u._id === message.senderId)?.profilePic || authUser.profilePic
      }
      alt="Avatar"
      className="w-full h-full object-cover"
    />
  </div>
</div>)}

              <div
  className={`${
    isCall
      ? message.senderId === authUser._id
        ? "flex flex-col bg-purple-500 rounded-tl-4xl rounded-tr-lg rounded-br-4xl rounded-bl-4xl px-5 py-1.5"
        : "flex flex-col bg-gray-200 rounded-tl-lg rounded-tr-4xl rounded-br-4xl rounded-bl-4xl px-5 py-5"
      : message.senderId === authUser._id
      ? "flex flex-col bg-purple-500 rounded-tl-4xl rounded-tr-lg rounded-br-4xl rounded-bl-4xl px-5 py-1.5"
      : "flex flex-col bg-gray-200 rounded-tl-lg rounded-tr-4xl rounded-br-4xl rounded-bl-4xl px-5 py-1.5"
  }`}
>
                {message.image && (
                  <img
                    src={authUser.profilePic}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {isCall ? (
                  message.senderId === authUser._id ? (
                    <p className="font-semibold">📞 You started a call</p>
                  ) : isIncomingCall ? (
                    <div className="text-center">
                      <p className="font-semibold mb-2">📞 Incoming Call</p>
                      <div className="flex gap-3 justify-center">
                        <a
                          href={message.text}
                          target="_self"
                          className="bg-green-500 p-2 rounded-2xl font-bold w-20"
                          onClick={() => handleRemoveCall(message._id)}
                        >
                          Join
                        </a>
                        <button
                          onClick={() => handleDeclineCall(message)}
                          className="bg-red-500 p-2 rounded-xl  font-bold  w-20"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ) : null
                ) : message.type === "callDeclined" ? (
                  <p className="text-center font-semibold text-gray-500">
                    {message.text}
                  </p>
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
                 
            </div>
          );
        })}
      </div>

      {typingUserNames.length > 0 && (
        <p className="text-sm text-gray-500 italic px-4 pb-1">
          {typingUserNames.join(", ")}{" "}
          {typingUserNames.length === 1 ? "is" : "are"} typing...
        </p>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
