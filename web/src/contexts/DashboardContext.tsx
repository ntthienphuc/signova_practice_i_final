import { createContext, useContext } from "react";

interface DashboardContextValue {
  isImmersive: boolean;
  setIsImmersive: (v: boolean) => void;
  openAuth: () => void;
}

export const DashboardContext = createContext<DashboardContextValue>({
  isImmersive: false,
  setIsImmersive: () => {},
  openAuth: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}
