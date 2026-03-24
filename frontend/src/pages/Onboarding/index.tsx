import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateSettings } from "../../api/settings";
import { StepChannels } from "./StepChannels";
import { StepCVs } from "./StepCVs";
import { StepPrompts } from "./StepPrompts";
import { StepQR } from "./StepQR";

const STEPS = ["Telegram Auth", "Upload CVs", "Validate Prompts", "Select Channels"];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  async function finish() {
    await updateSettings({ onboarding_complete: true });
    navigate("/jobs");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-1 mb-6 flex-wrap">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < step
                      ? "bg-blue-600 text-white"
                      : i === step
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    i === step ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-6 mx-1 ${
                      i < step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8">
          {step === 0 && <StepQR onNext={() => setStep(1)} />}
          {step === 1 && <StepCVs onNext={() => setStep(2)} />}
          {step === 2 && <StepPrompts onNext={() => setStep(3)} />}
          {step === 3 && <StepChannels onNext={finish} />}
        </div>
      </div>
    </div>
  );
}
