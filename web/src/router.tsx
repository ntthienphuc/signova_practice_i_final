import { createBrowserRouter } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import LandingPage from "./pages/LandingPage";
import App from "./App";
import LearnDashboard from "./pages/LearnDashboard";
import LearnPage from "./pages/LearnPage";

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
    element: <App />,
  },
  {
    path: "/learn",
    element: <LearnDashboard />,
  },
  {
    path: "/learn/:unitId/:lessonId",
    element: <LearnPage />,
  },
]);
