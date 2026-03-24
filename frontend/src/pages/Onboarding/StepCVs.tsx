import { useEffect, useRef, useState } from "react";
import { type CV, deleteCV, listCVs, updateCV, uploadCV } from "../../api/cvs";
import { Trash2, Upload } from "lucide-react";

interface Props {
  onNext: () => void;
}

export function StepCVs({ onNext }: Props) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCVs();
  }, []);

  async function fetchCVs() {
    try {
      const res = await listCVs();
      setCvs(res.data);
    } catch {
      setError("Failed to load CVs");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const name = file.name.replace(/\.[^.]+$/, "");
      const res = await uploadCV(file, name, 70);
      setCvs((prev) => [...prev, res.data]);
    } catch {
      setError("Failed to upload CV");
    } finally {
      setUploading(false);
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleDelete(id: string) {
    try {
      await deleteCV(id);
      setCvs((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete CV");
    }
  }

  async function handleNameChange(id: string, name: string) {
    setCvs((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function handleNameBlur(id: string, name: string) {
    try {
      await updateCV(id, { name });
    } catch {
      setError("Failed to update CV name");
    }
  }

  async function handleThresholdChange(id: string, match_threshold: number) {
    setCvs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, match_threshold } : c))
    );
    try {
      await updateCV(id, { match_threshold });
    } catch {
      setError("Failed to update threshold");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload CVs</h2>
      <p className="text-sm text-gray-500 mb-6">
        Upload one or more CVs. Set the match threshold for each.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">
          {uploading ? "Uploading..." : "Click or drag a file to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF or plain text files</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={onFileInput}
        />
      </div>

      {cvs.length > 0 && (
        <div className="space-y-3 mb-6">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={cv.name}
                  onChange={(e) => handleNameChange(cv.id, e.target.value)}
                  onBlur={(e) => handleNameBlur(cv.id, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleDelete(cv.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500 w-28 shrink-0">
                  Match threshold: {cv.match_threshold}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cv.match_threshold}
                  onChange={(e) =>
                    handleThresholdChange(cv.id, Number(e.target.value))
                  }
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cv.match_threshold}
                  onChange={(e) =>
                    handleThresholdChange(cv.id, Number(e.target.value))
                  }
                  className="w-14 border border-gray-300 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {cvs.length === 0 && !loading && (
        <p className="text-sm text-gray-400 text-center mb-6">
          No CVs uploaded yet. Upload at least one to continue.
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={cvs.length === 0}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
