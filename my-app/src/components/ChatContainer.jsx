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
    sendMessage,
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
        msg.senderId !== authUser._id,
    );

    // Defer setState to the next tick to avoid cascading renders
    const timeout = setTimeout(() => {
      setIncomingCalls(
        Array.from(new Map(calls.map((c) => [c._id, c])).values()),
      );
    }, 0);

    return () => clearTimeout(timeout);
  }, [messages, authUser._id]);

  // ---------------- Handle Decline ----------------
  const handleDeclineCall = (message) => {
    setIncomingCalls((prev) => prev.filter((c) => c._id !== message._id));

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

  // ---------------- Typing users (exclude self) ----------------
  const typingUserNames = Object.keys(typingUsers)
    .filter((id) => id !== authUser._id)
    .map((id) => users.find((u) => u._id === id)?.name)
    .filter(Boolean);

  // ---------------- Date formatting helper ----------------
  const getMessageDateLabel = (dateStr) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      msgDate.getFullYear() === today.getFullYear() &&
      msgDate.getMonth() === today.getMonth() &&
      msgDate.getDate() === today.getDate();

    const isYesterday =
      msgDate.getFullYear() === yesterday.getFullYear() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getDate() === yesterday.getDate();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return msgDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
    new Map(messages.map((m) => [m._id, m])).values(),
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto h-full">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {uniqueMessages.map((message, index) => {
          const prevMessage = uniqueMessages[index - 1];
          const showDateBadge =
            !prevMessage ||
            getMessageDateLabel(prevMessage.createdAt) !==
              getMessageDateLabel(message.createdAt);

          const isLast = index === uniqueMessages.length - 1;
          const isCall = message.text?.includes("/videoCall?roomID=");
          const isIncomingCall = incomingCalls.some(
            (c) => c._id === message._id,
          );

          return (
            <div key={message._id}>
              {/* Date Badge */}
              {showDateBadge && (
                <div className="text-center my-3">
                  <span className="bg-white px-3 py-2 rounded-full text-xs text-black shadow-lg shadow-black/10">
                    {getMessageDateLabel(message.createdAt)}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                ref={isLast ? messageEndRef : null}
                className={`chat ${
                  message.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
              >
                {/* Avatar */}
                {message.senderId !== authUser._id && (
                  <div className="chat-image avatar">
                    <div className="size-7 rounded-full border overflow-hidden">
                      <img
                        src={
                          users.find((u) => u._id === message.senderId)
                            ?.profilePic || authUser.profilePic
                        }
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Bubble + Time */}
                <div className="flex flex-col max-w-xs">
                  <div
                    className={`${
                      isCall
                        ? message.senderId === authUser._id
                          ? "flex flex-col bg-purple-500 rounded-tl-4xl rounded-tr-lg rounded-br-4xl rounded-bl-4xl px-5 py-1.5 self-end text-white"
                          : "flex flex-col bg-gray-100 rounded-tl-lg rounded-tr-4xl rounded-br-4xl rounded-bl-4xl px-5 py-5 self-start"
                        : message.senderId === authUser._id
                          ? "flex flex-col bg-purple-500 rounded-tl-4xl rounded-tr-lg rounded-br-4xl rounded-bl-4xl px-5 py-1.5 self-end text-white"
                          : "flex flex-col bg-gray-100 rounded-tl-lg rounded-tr-4xl rounded-br-4xl rounded-bl-4xl px-5 py-1.5 self-start"
                    }`}
                  >
                    {/* Message content */}
                    {isCall ? (
                      message.senderId === authUser._id ? (
                        <p className="font-semibold">📞 You started a call</p>
                      ) : isIncomingCall ? (
                        <div className="">
                          <p className="font-semibold mb-3">📞 Incoming Call</p>
                          <div className="flex gap-3 justify-center ">
                            <a
                              href={message.text}
                              target="_self"
                              className="bg-green-500 px-1 py-1 rounded-2xl font-medium w-16 text-sm text-white text-center"
                              onClick={() => handleRemoveCall(message._id)}
                            >
                              Join
                            </a>
                            <button
                              onClick={() => handleDeclineCall(message)}
                              className="bg-red-500 px-1 py-1 rounded-xl font-medium w-20 text-sm text-white text-center"
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

                  {/* Time */}
                  <time
                    className={`text-[10px] mt-1 opacity-60 ${
                      message.senderId === authUser._id
                        ? "self-end mr-1"
                        : "self-start ml-1"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
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
