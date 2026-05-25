import { useState } from "react";
import { searchLearners, requestParentLink, requestSchoolLink } from "../src/api";
import { useAuth } from "../src/contexts/AuthContext";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export function useConnectionManager(onSuccess: () => void) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [linkClassName, setLinkClassName] = useState("");
  const [linkStudentCode, setLinkStudentCode] = useState("");
  const [linkSuccessMsg, setLinkSuccessMsg] = useState("");
  const [linkErrorMsg, setLinkErrorMsg] = useState("");

  const handleSearchLearnerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchLearners(val);
      setSearchResults(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLearner = (learner: any) => {
    setSelectedLearner(learner);
    setSearchQuery(learner.username);
    setSearchResults([]);
  };

  const handleSendLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner || !currentUser) return;
    setLinkSuccessMsg("");
    setLinkErrorMsg("");
    try {
      if (currentUser.role === "parent") {
        await requestParentLink(selectedLearner.username);
        setLinkSuccessMsg(`Đã gửi yêu cầu kết nối tới con "${selectedLearner.username}" thành công! Con cần duyệt trong tab Tiến độ.`);
      } else if (currentUser.role === "school") {
        if (!linkClassName || !linkStudentCode) {
          setLinkErrorMsg("Vui lòng điền Lớp và Mã số học sinh.");
          return;
        }
        await requestSchoolLink(selectedLearner.username, linkClassName, linkStudentCode);
        setLinkSuccessMsg(`Đã gửi yêu cầu kết nối tới học sinh "${selectedLearner.username}" thành công! Học sinh cần duyệt.`);
        setLinkClassName("");
        setLinkStudentCode("");
      }
      setSelectedLearner(null);
      setSearchQuery("");
      onSuccess(); // Callback reload lại Dashboard data bên ngoài
    } catch (err: any) {
      setLinkErrorMsg(getErrorMessage(err));
    }
  };

  return {
    searchQuery,
    searchResults,
    searching,
    selectedLearner,
    linkClassName,
    linkStudentCode,
    linkSuccessMsg,
    linkErrorMsg,
    handleSearchLearnerChange,
    handleSelectLearner,
    handleSendLinkRequest,
    setLinkClassName,
    setLinkStudentCode,
    setSelectedLearner,
  };
}