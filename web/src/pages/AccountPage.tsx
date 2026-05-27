import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import { getParentDashboard, getSchoolDashboard } from "../api";
import { AccountTab } from "./tabs/AccountTab";

export default function AccountPage() {
  const { openAuth } = useDashboard();
  const { currentUser } = useAuth();

  const [parentDashData, setParentDashData] = useState<any>(null);
  const [schoolDashData, setSchoolDashData] = useState<any>(null);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === "parent") {
        const data = await getParentDashboard();
        setParentDashData(data);
      } else if (currentUser.role === "school") {
        const data = await getSchoolDashboard();
        setSchoolDashData(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tài khoản:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.id]);

  return (
    <AccountTab
      parentDashData={parentDashData}
      schoolDashData={schoolDashData}
      onOpenAuth={openAuth}
      onReloadDashboard={loadDashboardData}
    />
  );
}
