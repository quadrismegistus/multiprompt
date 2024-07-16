export const createUISlice = (set) => ({
  activeModal: null,
  isDarkMode: false,

  setActiveModal: (modalType) => set({ activeModal: modalType }),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  showModal: (modalType) => set({ activeModal: modalType }),
  hideModal: () => set({ activeModal: null }),
});