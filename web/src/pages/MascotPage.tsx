import { useDashboard } from "../contexts/DashboardContext";
import { MascotTab } from "./tabs/MascotTab";

export default function MascotPage() {
  const { openAuth } = useDashboard();
  return <MascotTab onOpenAuth={openAuth} />;
}
