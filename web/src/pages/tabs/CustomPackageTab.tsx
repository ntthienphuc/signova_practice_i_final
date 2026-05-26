import { useEffect, useState, useMemo } from "react";
import { mascots } from "../../utils/mascot";
import {
  getWordBank,
  getCustomPackages,
  createCustomPackage,
  deleteCustomPackage,
  assignCustomPackage,
  getSchoolDashboard,
} from "../../api";
import type { BankWordItem, CustomPackageData } from "../../api";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = "list" | "create";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return "";
  }
}

function percent(value: number | undefined): number {
  return Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onDelete,
  onAssign,
}: {
  pkg: CustomPackageData;
  onDelete: (id: string) => void;
  onAssign: (pkg: CustomPackageData) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomPackage(pkg.id);
      onDelete(pkg.id);
    } catch {
      alert("Không thể xóa gói bài tập. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="custom-pkg-card">
      <div className="custom-pkg-card-header">
        <div>
          <div className="custom-pkg-card-badge">
            📦 {pkg.word_count} từ
          </div>
          <h3 className="custom-pkg-card-title">{pkg.title}</h3>
          {pkg.description && (
            <p className="custom-pkg-card-desc">{pkg.description}</p>
          )}
          <div className="custom-pkg-card-assignment">
            {pkg.assigned_class_name ? (
              <span className="custom-pkg-assignment-badge class">
                🏫 Lớp: <strong>{pkg.assigned_class_name}</strong>
              </span>
            ) : pkg.assigned_student_ids && pkg.assigned_student_ids.length > 0 ? (
              <span className="custom-pkg-assignment-badge students">
                👤 Học sinh: <strong>{pkg.assigned_student_ids.length}</strong> bạn
              </span>
            ) : (
              <span className="custom-pkg-assignment-badge none">
                ⚪ Chưa giao bài
              </span>
            )}
          </div>
        </div>
        <div className="custom-pkg-card-date">
          {formatDate(pkg.created_at)}
        </div>
      </div>

      {pkg.assignment_progress && (
        <div className="custom-pkg-progress">
          <div className="custom-pkg-progress-head">
            <span>Theo dõi bài Practice II</span>
            <strong>
              {pkg.assignment_progress.completed_count}/{pkg.assignment_progress.assigned_count} hoàn thành
            </strong>
          </div>
          <div className="custom-pkg-progress-bar">
            <span style={{ width: `${percent(pkg.assignment_progress.completion_rate)}%` }} />
          </div>
          <div className="custom-pkg-progress-meta">
            <span>Điểm TB: {pkg.assignment_progress.average_score ?? "--"}</span>
            <span>{percent(pkg.assignment_progress.completion_rate)}%</span>
          </div>
          {pkg.assignment_progress.student_progress.length > 0 && (
            <div className="custom-pkg-student-progress">
              {pkg.assignment_progress.student_progress.slice(0, 4).map((student) => (
                <div key={student.learner_id} className="custom-pkg-student-row">
                  <div className="custom-pkg-student-name">
                    <strong>{student.display_name || student.username}</strong>
                    <span>
                      {student.completed_words}/{student.total_words} từ
                      {student.wrong_word_count > 0 ? ` • ${student.wrong_word_count} nhầm từ` : ""}
                    </span>
                  </div>
                  <span className={student.completed ? "done" : "pending"}>
                    {student.completed ? "Xong" : `${percent(student.completion_rate)}%`}
                  </span>
                </div>
              ))}
              {pkg.assignment_progress.student_progress.length > 4 && (
                <div className="custom-pkg-student-more">
                  +{pkg.assignment_progress.student_progress.length - 4} học sinh khác
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="custom-pkg-card-glosses">
        {pkg.glosses.slice(0, 12).map((g) => (
          <span key={g} className="custom-pkg-gloss-chip">{g}</span>
        ))}
        {pkg.glosses.length > 12 && (
          <span className="custom-pkg-gloss-chip custom-pkg-gloss-more">
            +{pkg.glosses.length - 12}
          </span>
        )}
      </div>

      <div className="custom-pkg-card-actions">
        <button
          type="button"
          className="custom-pkg-btn-assign"
          onClick={() => onAssign(pkg)}
        >
          📅 Giao bài
        </button>
        {confirming ? (
          <>
            <span className="custom-pkg-confirm-text">Xóa gói này?</span>
            <button
              className="custom-pkg-btn-cancel"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Hủy
            </button>
            <button
              className="custom-pkg-btn-delete-confirm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Đang xóa…" : "Xác nhận"}
            </button>
          </>
        ) : (
          <button
            className="custom-pkg-btn-delete"
            onClick={() => setConfirming(true)}
          >
            🗑️ Xóa
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Word Picker ──────────────────────────────────────────────────────────────

function WordPicker({
  words,
  selected,
  onToggle,
}: {
  words: BankWordItem[];
  selected: Set<string>;
  onToggle: (gloss: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      words.filter((w) =>
        w.gloss.toLowerCase().includes(search.toLowerCase())
      ),
    [words, search]
  );

  return (
    <div className="custom-pkg-word-picker">
      <div className="custom-pkg-picker-search">
        <span className="custom-pkg-picker-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Tìm từ trong kho..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="custom-pkg-picker-input"
        />
        {search && (
          <button
            className="custom-pkg-picker-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="custom-pkg-picker-info">
        {selected.size > 0 ? (
          <span className="custom-pkg-picker-count">✅ Đã chọn <strong>{selected.size}</strong> từ</span>
        ) : (
          <span className="custom-pkg-picker-hint">Chọn các từ muốn đưa vào gói bài tập</span>
        )}
        {filtered.length < words.length && (
          <span className="custom-pkg-picker-filter-count">Hiển thị {filtered.length}/{words.length} từ</span>
        )}
      </div>

      <div className="custom-pkg-picker-grid">
        {filtered.map((w) => {
          const isSelected = selected.has(w.gloss);
          return (
            <button
              key={w.gloss}
              className={`custom-pkg-word-chip ${isSelected ? "selected" : ""} ${!w.has_reference ? "no-ref" : ""}`}
              onClick={() => onToggle(w.gloss)}
              title={!w.has_reference ? "Từ này chưa có video tham khảo" : ""}
            >
              {isSelected && <span className="custom-pkg-chip-check">✓</span>}
              <span>{w.gloss}</span>
              {!w.has_reference && <span className="custom-pkg-chip-warn">⚠</span>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="custom-pkg-picker-empty">
            Không tìm thấy từ nào với "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreatePackageForm({
  words,
  onCreated,
  onCancel,
}: {
  words: BankWordItem[];
  onCreated: (pkg: CustomPackageData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleWord = (gloss: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(gloss)) next.delete(gloss);
      else next.add(gloss);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Vui lòng nhập tên gói bài tập."); return; }
    if (selected.size < 2) { setError("Practice II cần ít nhất 2 từ để kiểm tra nhầm ký hiệu."); return; }

    setSaving(true);
    setError("");
    try {
      const pkg = await createCustomPackage({
        title: title.trim(),
        description: description.trim() || undefined,
        glosses: Array.from(selected),
      });
      onCreated(pkg);
    } catch (err: any) {
      setError(err?.message || "Tạo gói thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="custom-pkg-create-form">
      <div className="custom-pkg-create-header">
        <button type="button" className="custom-pkg-back-btn" onClick={onCancel}>
          ← Quay lại
        </button>
        <h2 className="custom-pkg-create-title">✏️ Tạo gói bài tập mới</h2>
      </div>

      <div className="custom-pkg-field">
        <label className="custom-pkg-label">Tên gói bài tập *</label>
        <input
          type="text"
          className="custom-pkg-input"
          placeholder="VD: Từ vựng lớp 3A - Chủ đề gia đình"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="custom-pkg-field">
        <label className="custom-pkg-label">Mô tả (không bắt buộc)</label>
        <textarea
          className="custom-pkg-textarea"
          placeholder="Ghi chú thêm về mục tiêu của gói học này..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="custom-pkg-field">
        <label className="custom-pkg-label">Chọn từ vựng từ kho *</label>
        <WordPicker words={words} selected={selected} onToggle={toggleWord} />
      </div>

      {error && <div className="custom-pkg-error">⚠️ {error}</div>}

      <div className="custom-pkg-create-actions">
        <button type="button" className="custom-pkg-btn-secondary" onClick={onCancel} disabled={saving}>
          Hủy
        </button>
        <button type="submit" className="custom-pkg-btn-primary" disabled={saving || selected.size === 0}>
          {saving ? (
            <span className="custom-pkg-saving">
              <span className="custom-pkg-spinner" />
              Đang lưu...
            </span>
          ) : (
            <>📦 Tạo gói ({selected.size} từ)</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Assign Modal ────────────────────────────────────────────────────────────

interface AssignModalProps {
  pkg: CustomPackageData;
  students: any[];
  onClose: () => void;
  onAssigned: (updatedPkg: CustomPackageData) => void;
}

function AssignModal({ pkg, students, onClose, onAssigned }: AssignModalProps) {
  const [mode, setMode] = useState<"class" | "students">(pkg.assigned_class_name ? "class" : "students");
  const [selectedClass, setSelectedClass] = useState<string>(pkg.assigned_class_name || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(pkg.assigned_student_ids || [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const classes = useMemo(() => {
    const list = students.map((s) => s.class_name).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [students]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      const className = mode === "class" ? (selectedClass || null) : null;
      const studentIds = mode === "students" ? Array.from(selectedStudentIds) : [];
      
      const updated = await assignCustomPackage(pkg.id, {
        assigned_class_name: className,
        assigned_student_ids: studentIds,
      });
      onAssigned(updated);
    } catch (err: any) {
      setError(err?.message || "Giao bài thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="custom-pkg-modal-overlay">
      <div className="custom-pkg-modal">
        <div className="custom-pkg-modal-header">
          <h3>📅 Giao bài tập: {pkg.title}</h3>
          <button type="button" className="custom-pkg-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="custom-pkg-modal-body">
          <div className="custom-pkg-modal-tabs">
            <button
              type="button"
              className={`custom-pkg-modal-tab ${mode === "class" ? "active" : ""}`}
              onClick={() => setMode("class")}
            >
              🏫 Giao theo lớp
            </button>
            <button
              type="button"
              className={`custom-pkg-modal-tab ${mode === "students" ? "active" : ""}`}
              onClick={() => setMode("students")}
            >
              👤 Giao theo học sinh
            </button>
          </div>

          {mode === "class" ? (
            <div className="custom-pkg-modal-field">
              <label>Chọn lớp học nhận bài tập:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="custom-pkg-modal-select"
              >
                <option value="">-- Không giao / Hủy giao bài --</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="custom-pkg-modal-field">
              <label>Chọn các học sinh nhận bài tập:</label>
              {students.length === 0 ? (
                <p className="custom-pkg-modal-hint">Không có học sinh nào được liên kết.</p>
              ) : (
                <div className="custom-pkg-modal-students-list">
                  {students.map((student) => {
                    const isChecked = selectedStudentIds.has(student.learner_id);
                    return (
                      <label key={student.learner_id} className="custom-pkg-modal-student-item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(student.learner_id)}
                        />
                        <span>
                          <strong>{student.display_name || student.username}</strong>
                          {student.class_name && ` (Lớp ${student.class_name})`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && <div className="custom-pkg-error">⚠️ {error}</div>}
        </div>

        <div className="custom-pkg-modal-footer">
          <button type="button" className="custom-pkg-btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="button" className="custom-pkg-btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? "Đang giao..." : "Xác nhận giao"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomPackageTab() {
  const [view, setView] = useState<ViewMode>("list");
  const [packages, setPackages] = useState<CustomPackageData[]>([]);
  const [words, setWords] = useState<BankWordItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assigningPackage, setAssigningPackage] = useState<CustomPackageData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPackages();
    loadStudents();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomPackages();
      setPackages(data?.packages ?? []);
    } catch (err: any) {
      setError("Không thể tải danh sách gói bài tập.");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await getSchoolDashboard();
      setStudents(data?.linked_learners ?? []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách học sinh:", err);
    }
  };

  const handleOpenCreate = async () => {
    if (words.length === 0) {
      setLoadingWords(true);
      try {
        const data = await getWordBank();
        setWords(data?.words ?? []);
      } catch {
        alert("Không thể tải kho từ vựng.");
        return;
      } finally {
        setLoadingWords(false);
      }
    }
    setView("create");
  };

  const handleCreated = (pkg: CustomPackageData) => {
    setPackages((prev) => [pkg, ...prev]);
    setView("list");
  };

  const handleDeleted = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAssigned = (updatedPkg: CustomPackageData) => {
    setPackages((prev) => prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p)));
    setAssigningPackage(null);
  };

  // ── List view ────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <section className="custom-pkg-section">
        {/* Header */}
        <div className="custom-pkg-hero">
          <div className="custom-pkg-hero-text">
            <p className="custom-pkg-hero-label">Công cụ giảng dạy 🎒</p>
            <h2 className="custom-pkg-hero-title">Gói bài tập tùy chỉnh</h2>
            <p className="custom-pkg-hero-sub">
              Tự thiết kế bộ từ vựng theo chủ đề, giao cho học sinh làm dưới dạng Practice II và theo dõi kết quả từng bạn.
            </p>
          </div>
          <div className="custom-pkg-hero-mascot">
            <img
              src={mascots[8]}
              alt="Teacher mascot"
              className="custom-pkg-mascot-img"
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="custom-pkg-toolbar">
          <div className="custom-pkg-toolbar-left">
            <span className="custom-pkg-pkg-count">
              {loading ? "…" : `${packages.length} gói bài tập`}
            </span>
          </div>
          <button
            className="custom-pkg-btn-create"
            onClick={handleOpenCreate}
            disabled={loadingWords}
          >
            {loadingWords ? (
              <>
                <span className="custom-pkg-spinner-sm" /> Đang tải kho từ...
              </>
            ) : (
              <>+ Tạo gói mới</>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="custom-pkg-loading">
            <div className="custom-pkg-spinner-lg" />
            <p>Đang tải danh sách gói bài tập...</p>
          </div>
        ) : error ? (
          <div className="custom-pkg-error-box">
            <p>{error}</p>
            <button className="custom-pkg-btn-retry" onClick={loadPackages}>Thử lại</button>
          </div>
        ) : packages.length === 0 ? (
          <div className="custom-pkg-empty">
            <img
              src={mascots[9]}
              alt="Empty state"
              className="custom-pkg-empty-mascot"
            />
            <h3 className="custom-pkg-empty-title">Chưa có gói bài tập nào</h3>
            <p className="custom-pkg-empty-sub">
              Tạo gói bài tập đầu tiên để giao cho học sinh luyện tập!
            </p>
            <button className="custom-pkg-btn-create-empty" onClick={handleOpenCreate}>
              + Tạo gói bài tập đầu tiên
            </button>
          </div>
        ) : (
          <div className="custom-pkg-grid">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onDelete={handleDeleted}
                onAssign={setAssigningPackage}
              />
            ))}
          </div>
        )}

        {/* Assign Modal */}
        {assigningPackage && (
          <AssignModal
            pkg={assigningPackage}
            students={students}
            onClose={() => setAssigningPackage(null)}
            onAssigned={handleAssigned}
          />
        )}
      </section>
    );
  }

  // ── Create view ──────────────────────────────────────────────────────────
  return (
    <section className="custom-pkg-section">
      <CreatePackageForm
        words={words}
        onCreated={handleCreated}
        onCancel={() => setView("list")}
      />
    </section>
  );
}
