import { useEffect, useState } from "react";
import {
  type AppSettings,
  type Prompt,
  getSettings,
  listPrompts,
  testPrompt,
  updatePrompt,
  updateSettings,
} from "../api/settings";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

const LLM_SUGGESTIONS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-5-sonnet",
];

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

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [prompts, setPrompts] = useState<PromptEditorState[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((r) => setSettings(r.data))
      .catch(() => setSettingsError("Failed to load settings"))
      .finally(() => setLoadingSettings(false));

    listPrompts()
      .then((r) =>
        setPrompts(
          r.data.map((p) => ({
            ...p,
            dirty: false,
            saving: false,
            testOpen: false,
            sampleText: "",
            testResult: null,
            testing: false,
            testError: null,
          }))
        )
      )
      .catch(() => setPromptError("Failed to load prompts"))
      .finally(() => setLoadingPrompts(false));
  }, []);

  async function handleSaveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);
    try {
      const res = await updateSettings({
        openrouter_api_key: settings.openrouter_api_key,
        llm_model: settings.llm_model,
        outreach_paused: settings.outreach_paused,
      });
      setSettings(res.data);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      setSettingsError("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  function updatePromptField<K extends keyof PromptEditorState>(
    name: string,
    key: K,
    value: PromptEditorState[K]
  ) {
    setPrompts((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [key]: value } : p))
    );
  }

  async function handleSavePrompt(p: PromptEditorState) {
    updatePromptField(p.name, "saving", true);
    try {
      await updatePrompt(p.name, p.content);
      updatePromptField(p.name, "dirty", false);
    } catch {
      setPromptError(`Failed to save prompt "${p.name}"`);
    } finally {
      updatePromptField(p.name, "saving", false);
    }
  }

  async function handleTestPrompt(p: PromptEditorState) {
    updatePromptField(p.name, "testing", true);
    updatePromptField(p.name, "testError", null);
    updatePromptField(p.name, "testResult", null);
    try {
      const res = await testPrompt(p.name, p.sampleText);
      updatePromptField(p.name, "testResult", res.data.result);
    } catch {
      updatePromptField(p.name, "testError", "Test failed");
    } finally {
      updatePromptField(p.name, "testing", false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* LLM Settings */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          LLM Settings
        </h2>

        {loadingSettings ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : settings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenRouter API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings.openrouter_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, openrouter_api_key: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-or-..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LLM Model
              </label>
              <input
                type="text"
                value={settings.llm_model}
                onChange={(e) =>
                  setSettings({ ...settings, llm_model: e.target.value })
                }
                list="model-suggestions"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="model-suggestions">
                {LLM_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <div className="flex gap-2 flex-wrap mt-2">
                {LLM_SUGGESTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSettings({ ...settings, llm_model: m })}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      settings.llm_model === m
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Pause outreach
                </p>
                <p className="text-xs text-gray-500">
                  Stop sending automated messages
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    outreach_paused: !settings.outreach_paused,
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  settings.outreach_paused ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    settings.outreach_paused ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settingsError && (
              <p className="text-sm text-red-600">{settingsError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save settings"}
              </button>
              {settingsSaved && (
                <span className="text-sm text-green-600">Saved!</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">{settingsError}</p>
        )}
      </section>

      {/* Prompts */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Prompts</h2>

        {promptError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {promptError}
          </div>
        )}

        {loadingPrompts ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((p) => (
              <div key={p.name} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {PROMPT_LABELS[p.name] ?? p.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.dirty && (
                      <span className="text-xs text-orange-500">Unsaved</span>
                    )}
                    <button
                      onClick={() => handleSavePrompt(p)}
                      disabled={p.saving || !p.dirty}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-40"
                    >
                      {p.saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() =>
                        updatePromptField(p.name, "testOpen", !p.testOpen)
                      }
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
                      updatePromptField(p.name, "content", e.target.value);
                      updatePromptField(p.name, "dirty", true);
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
                        updatePromptField(p.name, "sampleText", e.target.value)
                      }
                      rows={3}
                      placeholder="Paste a sample job post or text here..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-2"
                    />
                    <button
                      onClick={() => handleTestPrompt(p)}
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
        )}
      </section>
    </div>
  );
}
