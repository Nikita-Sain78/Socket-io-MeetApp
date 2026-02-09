// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";
// export const useChatStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,
//   unreadCounts: {}, 
//    typingUsers: {}, 
  

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },
//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
//       set({ messages: [...messages, res.data] });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     }
//   },
//   getUnreadCounts: async () => {
//   try {
//     // const res = await axiosInstance.get("/messages/unread");
//     // const counts = {};

//     // res.data.forEach((item) => {
//     //   counts[item._id] = item.count;
//     // });

//     // set({ unreadCounts: counts });
//   } catch (error) {
//     toast.error("Failed to load unread messages",error);
//   }
// },



// subscribeToMessages: () => {
//   const socket = useAuthStore.getState().socket;
//   if (!socket) return;

//   // Remove previous listener
//   socket.off("newMessage");

//   socket.on("newMessage", (message) => {
//     const { selectedUser, messages } = get();

//     // Only handle messages relevant to the selected user
//     if (
//       message.senderId === selectedUser?._id ||
//       message.receiverId === selectedUser?._id
//     ) {
//       // ✅ Deduplicate: only add if it doesn't exist already
//       if (!messages.some((m) => m._id === message._id)) {
//         set({
//           messages: [...messages, message],
//         });
//       }
//     }
//   });
// },


// unsubscribeFromMessages: () => {
//   const socket = useAuthStore.getState().socket;
//   if (!socket) return;

//   socket.off("newMessage");
// },


//   setSelectedUser: (selectedUser) => set({ selectedUser }),
// }));

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  typingUsers: {}, // <-- new state for typing

  // ------------------- Existing actions -------------------

   getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a user and mark as seen
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // Backend already marks messages as seen
      get().clearUnreadForUser(userId);

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    const { selectedUser, messages, } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

      // Clear unread for current chat
      get().clearUnreadForUser(selectedUser._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Fetch unread counts for all users
  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread"); // returns { userId: count }
      set({ unreadCounts: res.data });
    } catch (error) {
      toast.error("Failed to fetch unread messages",error);
    }
  },

  // Clear unread for a single user
  clearUnreadForUser: (userId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [userId]: 0 },
    }));
  },

  // Subscribe to socket messages
  // subscribeToMessages: () => {
  //   const socket = useAuthStore.getState().socket;
  //   const authUser = useAuthStore.getState().authUser;
  //   if (!socket || !authUser) return;

  //   socket.off("newMessage");
  //   socket.on("newMessage", (message) => {
  //     const { selectedUser, messages, unreadCounts } = get();
      

  //     // If the message is from the selected user → append and mark seen
  //     if (message.senderId === selectedUser?._id) {
  //     const res =  axiosInstance.get("/messages/unread"); // returns { userId: count }
  //     set({ unreadCounts: res.data });

  //       set({ messages: [...messages, message] });
  //       get().clearUnreadForUser(selectedUser._id);

  //       // Also mark seen in backend
  //       axiosInstance.put(`/messages/seen/${selectedUser._id}`);
  //     } 

      
  //     // If message is from another user → increment unread
  //     else if (message.receiverId === authUser._id) {
  //       set({
  //         unreadCounts: {
  //           ...unreadCounts,
  //           [message.senderId]: (unreadCounts[message.senderId] || 0) + 1,
  //         },
  //       });
  //     }

     
  //   });
  // },
  subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;
  const authUser = useAuthStore.getState().authUser;
  if (!socket || !authUser) return;

  socket.off("newMessage");
  socket.on("newMessage", async (message) => {
    const { selectedUser, messages, unreadCounts } = get();

    // If the message is from the currently open chat
    if (message.senderId === selectedUser?._id) {
      set({ messages: [...messages, message] });
      get().clearUnreadForUser(selectedUser._id);

      // Mark as seen in backend
      await axiosInstance.put(`/messages/seen/${selectedUser._id}`);
    } 
    // If the message is from another user
    else if (message.receiverId === authUser._id) {
      set({
        unreadCounts: {
          ...unreadCounts,
          [message.senderId]: (unreadCounts[message.senderId] || 0) + 1,
        },
      });
    }
  });
},


  // getUsers: async () => {
  //   set({ isUsersLoading: true });
  //   try {
  //     const res = await axiosInstance.get("/messages/users");
  //     set({ users: res.data });
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //   } finally {
  //     set({ isUsersLoading: false });
  //   }
  // },

  // getMessages: async (userId) => {
  //   set({ isMessagesLoading: true });
  //   try {
  //     const res = await axiosInstance.get(`/messages/${userId}`);
  //     set({ messages: res.data });
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //   } finally {
  //     set({ isMessagesLoading: false });
  //   }
  // },

//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
//       set({ messages: [...messages, res.data] });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     }
//   },
// getUnreadCounts: async () => {
//   try {
//     const res = await axiosInstance.get("/messages/unread");
//     set({ unreadCounts: res.data });
//   } catch (err) {
//     toast.error("Failed to fetch unread messages",err);
//   }
// },



//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");

//     socket.on("newMessage", (message) => {
//       const { selectedUser, messages } = get();
//       if (
//         message.senderId === selectedUser?._id ||
//         message.receiverId === selectedUser?._id
//       ) {
//         if (!messages.some((m) => m._id === message._id)) {
//           set({ messages: [...messages, message] });
//         }
//       }
//     });
//   },

// getUnreadCounts: async () => {
//   try {
//     const { data } = await axiosInstance.get("/messages/unread"); // your backend route
//     // data should be { userId: count, ... }
//     set({ unreadCounts: data });
//   } catch (error) {
//     toast.error("Failed to load unread messages",error);
//   }
// },

// sendMessage: async (messageData) => {
//   const { selectedUser, messages, unreadCounts } = get();
//   try {
//     const res = await axiosInstance.post(
//       `/messages/send/${selectedUser._id}`,
//       messageData
//     );

//     // Add message to current chat
//     set({ messages: [...messages, res.data] });

//     // Reset unread for this user because current chat is open
//     set({ unreadCounts: { ...unreadCounts, [selectedUser._id]: 0 } });
//   } catch (error) {
//     toast.error(error.response.data.message);
//   }
// },

// subscribeToMessages: () => {
//   const socket = useAuthStore.getState().socket;
//   const authUser = useAuthStore.getState().authUser;
//   if (!socket || !authUser) return;

//   socket.off("newMessage");
//   socket.on("newMessage", (message) => {
//     const { selectedUser, messages, unreadCounts } = get();

//     if (message.senderId === selectedUser?._id) {
//       // message belongs to current chat
//       set({ messages: [...messages, message] });
//       // mark as seen
//       axiosInstance.put(`/messages/seen/${selectedUser._id}`);
//       set({ unreadCounts: { ...unreadCounts, [selectedUser._id]: 0 } });
//     } else if (message.receiverId === authUser._id) {
//       // message from another user → increment unread
//       set({
//         unreadCounts: {
//           ...unreadCounts,
//           [message.senderId]: (unreadCounts[message.senderId] || 0) + 1,
//         },
//       });
//     }
//   });
// },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // ------------------- New Typing Actions -------------------
  setTyping: (userId) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: true },
    }));
  },

  removeTyping: (userId) => {
    set((state) => {
      const updated = { ...state.typingUsers };
      delete updated[userId];
      return { typingUsers: updated };
    });
  },
subscribeToTyping: () => {
  const socket = useAuthStore.getState().socket;
  const authUser = useAuthStore.getState().authUser; // current user
  if (!socket?.connected || !authUser) return;

  // Remove old listeners
  socket.off("typing");
  socket.off("stopTyping");

  socket.on("typing", ({ senderId, receiverId }) => {
    // Only track typing events **to me**, and ignore self
    if (!senderId || senderId === authUser._id || receiverId !== authUser._id) return;

    set((state) => ({
      typingUsers: { ...state.typingUsers, [senderId]: true },
    }));

    console.log("Typing users:", get().typingUsers);
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    if (!senderId || senderId === authUser._id || receiverId !== authUser._id) return;

    set((state) => {
      const updated = { ...state.typingUsers };
      delete updated[senderId];
      return { typingUsers: updated };
    });

    console.log("Typing users after stop:", get().typingUsers);
  });
},



  unsubscribeFromTyping: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("typing");
    socket.off("stopTyping");
  },
}));
