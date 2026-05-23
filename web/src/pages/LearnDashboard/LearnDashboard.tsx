import LeftSidebar from "../../components/learn-dashboard/LeftSidebar";
import MainContent from "../../components/learn-dashboard/MainContent";
import RightSidebar from "../../components/learn-dashboard/RightSidebar";

export default function LearnDashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      <LeftSidebar />
      <MainContent />
      <RightSidebar />
    </div>
  );
}
