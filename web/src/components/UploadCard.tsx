import type { RandomTask } from "../api/index";

interface UploadCardProps {
  task: RandomTask | null;
  file: File | null;
  loading: boolean;
  error: string;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
}

export function UploadCard({
  task,
  file,
  loading,
  error,
  onFileChange,
  onAnalyze
}: UploadCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <strong>Upload attempt</strong>
      </div>
      <label className="upload-drop">
        <input
          accept="video/*"
          type="file"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <span>{file ? file.name : "Chọn video MP4/MOV"}</span>
      </label>
      <button
        className="primary-button"
        disabled={!file || !task || loading}
        onClick={onAnalyze}
        type="button"
      >
        {loading ? "Đang phân tích..." : "Upload Và Phân Tích"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
