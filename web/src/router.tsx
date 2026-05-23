import { createBrowserRouter } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import LandingPage from "./pages/LandingPage";
import PracticePage from "./pages/LearnDashboard";
import LearnWordPage from "./pages/LearnWordPage";
import LearnDashboard from "./pages/LearnDashboard";

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
    element: <LearnDashboard />,
  },
  {
    path: "/learn/:topicId/:wordOrder",
    element: <LearnWordPage />,
  }
  // {
  //   path: "/dashboard/family",
  //   element: <PracticePage initialTab="family" />,
  // },
  // {
  //   path: "/dashboard/school",
  //   element: <PracticePage initialTab="school" />,
  // },
]);



