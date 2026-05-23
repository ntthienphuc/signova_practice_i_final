import { createBrowserRouter } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import LandingPage from "./pages/LandingPage";
import PracticePage from "./pages/PracticePage";
import LearnWordPage from "./pages/LearnWordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },
  {
    path: "/practice",
    element: <PracticePage/>,
  },
  {
    path: "/learn-dashboard",
    element: <PracticePage />,
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
