import { useEffect, useState } from "react";
import {
  type Prompt,
  listPrompts,
  testPrompt,
  updatePrompt,
} from "../../api/settings";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onNext: () => void;
}

const PROMPT_LABELS: Record<string, string> = {
  extraction: "Job Extraction Prompt",
  matching: "Matching Prompt",
  outreach: "Outreach Message Prompt",
};

interface PromptEditorState extends Prompt {
  dirty: boolean;
  saving: boolean;
  testOpen: boolean;
  sampleText: string;
  testResult: string | null;
  testing: boolean;
  testError: string | null;
}

export function StepPrompts({ onNext }: Props) {
  const [prompts, setPrompts] = useState<PromptEditorState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPrompts()
      .then((res) => {
        setPrompts(
          res.data.map((p) => ({
            ...p,
            dirty: false,
            saving: false,
            testOpen: false,
            sampleText: "",
            testResult: null,
            testing: false,
            testError: null,
          }))
        );
      })
      .catch(() => setError("Failed to load prompts"))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof PromptEditorState>(
    name: string,
    key: K,
    value: PromptEditorState[K]
  ) {
    setPrompts((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [key]: value } : p))
    );
  }

  async function handleSave(p: PromptEditorState) {
    updateField(p.name, "saving", true);
    try {
      await updatePrompt(p.name, p.content);
      updateField(p.name, "dirty", false);
    } catch {
      setError(`Failed to save prompt "${p.name}"`);
    } finally {
      updateField(p.name, "saving", false);
    }
  }

  async function handleTest(p: PromptEditorState) {
    updateField(p.name, "testing", true);
    updateField(p.name, "testError", null);
    updateField(p.name, "testResult", null);
    try {
      const res = await testPrompt(p.name, p.sampleText);
      updateField(p.name, "testResult", res.data.result);
    } catch {
      updateField(p.name, "testError", "Test failed");
    } finally {
      updateField(p.name, "testing", false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Validate Prompts
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Review and optionally edit the prompts used for extraction, matching,
        and outreach.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {prompts.map((p) => (
          <div
            key={p.name}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {PROMPT_LABELS[p.name] ?? p.name}
              </span>
              <div className="flex items-center gap-2">
                {p.dirty && (
                  <span className="text-xs text-orange-500">Unsaved</span>
                )}
                <button
                  onClick={() => handleSave(p)}
                  disabled={p.saving || !p.dirty}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-40"
                >
                  {p.saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => updateField(p.name, "testOpen", !p.testOpen)}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                  Test
                  {p.testOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4">
              <textarea
                value={p.content}
                onChange={(e) => {
                  updateField(p.name, "content", e.target.value);
                  updateField(p.name, "dirty", true);
                }}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {p.testOpen && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Sample input text
                </label>
                <textarea
                  value={p.sampleText}
                  onChange={(e) =>
                    updateField(p.name, "sampleText", e.target.value)
                  }
                  rows={3}
                  placeholder="Paste a sample job post or text here..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-2"
                />
                <button
                  onClick={() => handleTest(p)}
                  disabled={p.testing || !p.sampleText.trim()}
                  className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-40"
                >
                  {p.testing ? "Running..." : "Run test"}
                </button>

                {p.testError && (
                  <p className="text-xs text-red-600 mt-2">{p.testError}</p>
                )}

                {p.testResult && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Result
                    </label>
                    <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                      {p.testResult}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
