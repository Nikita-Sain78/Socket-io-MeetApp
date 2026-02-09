// store/useCallStore.js
import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null, // { link }

  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncomingCall: () => set({ incomingCall: null }),
}));
