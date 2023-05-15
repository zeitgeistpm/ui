import { Unpacked } from "@zeitgeistpm/utility/dist/array";
import Toggle from "components/ui/Toggle";
import WizardStepper, { WizardStepData } from "components/wizard/WizardStepper";
import { DeepReadonly } from "lib/types/deep-readonly";
import { NextPage } from "next";
import { useState } from "react";

export type CreateMarketWizardStep =
  | "Currency"
  | "Question"
  | "Answers"
  | "Time Period"
  | "Oracle"
  | "Description"
  | "Moderation"
  | "Preview";

export const createMarketWizardSteps: WizardStepData<CreateMarketWizardStep>[] =
  [
    { label: "Currency" },
    { label: "Question" },
    { label: "Answers" },
    { label: "Time Period" },
    { label: "Oracle" },
    { label: "Description" },
    { label: "Moderation" },
    { label: "Preview" },
  ];

const CreateMarketPage: NextPage = () => {
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [step, setStep] = useState<WizardStepData<CreateMarketWizardStep>>({
    label: "Oracle",
  });

  return (
    <div>
      <h2 className="font-3xl mb-6 text-center">Create Market</h2>

      <div className="flex center mb-12">
        <div className="mr-3 font-light">Wizard</div>
        <Toggle
          checked={isWizardMode}
          onChange={(e) => setIsWizardMode(!isWizardMode)}
        />
        <div className="ml-3 font-light">One Page</div>
      </div>

      <div>
        <WizardStepper
          steps={createMarketWizardSteps}
          current={step}
          onChange={(step) => setStep(step)}
        />
      </div>
    </div>
  );
};

export default CreateMarketPage;
