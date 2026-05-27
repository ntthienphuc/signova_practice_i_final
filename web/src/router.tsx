import { createBrowserRouter } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LearnDashboard from "./pages/LearnDashboard";
import LearnWordPage from "./pages/LearnWordPage";
import ChapterOverviewPage from "./pages/ChapterOverviewPage";
import ReviewPage from "./pages/ReviewPage";
import ProgressPage from "./pages/ProgressPage";
import AccountPage from "./pages/AccountPage";
import FamilyPage from "./pages/FamilyPage";
import MascotPage from "./pages/MascotPage";
import SchoolPage from "./pages/SchoolPage";
import CustomPackagePage from "./pages/CustomPackagePage";
import StoryTab from "./pages/tabs/StoryTab";
import StoryPage from "./pages/StoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },
  {
    path: "/learn-dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true,          element: <LearnDashboard /> },
      { path: "review",       element: <ReviewPage /> },
      { path: "progress",     element: <ProgressPage /> },
      { path: "account",      element: <AccountPage /> },
      { path: "family",       element: <FamilyPage /> },
      { path: "mascot",       element: <MascotPage /> },
      { path: "story",        element: <StoryTab /> },
      { path: "school",       element: <SchoolPage /> },
      { path: "custom",       element: <CustomPackagePage /> },
    ],
  },
  {
    path: "/chapter-overview/:topicId",
    element: <ChapterOverviewPage />,
  },
  {
    path: "/learn/:topicId/:wordOrder",
    element: <LearnWordPage />,
  },
  {
    path: "/story/:storyId",
    element: <StoryPage />,
  },
]);
