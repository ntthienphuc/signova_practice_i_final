import { Outlet } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import landingData from "../data/landingData";

export default function LandingLayout() {
  return (
    <>
      <Navbar data={landingData.vi.nav} />
      <Outlet />
    </>
  );
}
