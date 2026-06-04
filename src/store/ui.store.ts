import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  mobileNavOpen: boolean
  commandOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  commandOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
