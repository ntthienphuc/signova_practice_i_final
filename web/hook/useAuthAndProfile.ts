import { useState, useEffect } from "react";
import { getCurrentUser, updateProfile } from "../src/api";
import type { AppTab } from "../src/types/learn";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export function useAuthAndProfile(
  token: string | null,
  setToken: (t: string | null) => void,
  activeTab: AppTab,
  setActiveTab: (tab: AppTab) => void
) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Form Inputs State
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactPhoneInput, setContactPhoneInput] = useState("");

  const fetchUser = async () => {
    const localToken = localStorage.getItem("signova_token");
    if (!localToken) {
      setCurrentUser(null);
      return;
    }
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // Auto redirect tab dựa theo vai trò (Role-based Routing)
      if (user.role === "school" && ["learn", "review", "progress", "family"].includes(activeTab)) {
        setActiveTab("school");
      } else if (user.role === "parent" && ["learn", "review", "school", "custom_package"].includes(activeTab)) {
        setActiveTab("family");
      } else if (user.role === "learner" && ["family", "school", "custom_package"].includes(activeTab)) {
        setActiveTab("learn");
      }
    } catch (err) {
      localStorage.removeItem("signova_token");
      setToken(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  // Đồng bộ thông tin từ API vào Form Inputs khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "learner" && currentUser.learner_profile) {
        setDisplayNameInput(currentUser.learner_profile.display_name || "");
        setDobInput(currentUser.learner_profile.dob || "");
      } else if (currentUser.role === "parent" && currentUser.parent_profile) {
        setDisplayNameInput(currentUser.parent_profile.display_name || "");
        setPhoneInput(currentUser.parent_profile.phone || "");
      } else if (currentUser.role === "school" && currentUser.school_profile) {
        setSchoolNameInput(currentUser.school_profile.school_name || "");
        setContactNameInput(currentUser.school_profile.contact_name || "");
        setContactPhoneInput(currentUser.school_profile.contact_phone || "");
      }
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setProfileLoading(true);
    try {
      const payload: any = {};
      if (currentUser.role === "learner") {
        payload.display_name = displayNameInput;
        payload.dob = dobInput || null;
      } else if (currentUser.role === "parent") {
        payload.display_name = displayNameInput;
        payload.phone = phoneInput || null;
      } else if (currentUser.role === "school") {
        payload.school_name = schoolNameInput;
        payload.contact_name = contactNameInput || null;
        payload.contact_phone = contactPhoneInput || null;
      }
      await updateProfile(payload);
      setProfileSuccessMsg("Cập nhật thông tin tài khoản thành công!");
      fetchUser();
    } catch (err: any) {
      setProfileErrorMsg(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const clearUserSession = () => {
    setCurrentUser(null);
  };

  return {
    currentUser,
    clearUserSession,
    profileLoading,
    profileSuccessMsg,
    profileErrorMsg,
    handleUpdateProfile,
    inputs: {
      displayNameInput, setDisplayNameInput,
      dobInput, setDobInput,
      phoneInput, setPhoneInput,
      schoolNameInput, setSchoolNameInput,
      contactNameInput, setContactNameInput,
      contactPhoneInput, setContactPhoneInput
    },
    refreshUser: fetchUser,
  };
}