import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { WizardStepData } from "components/wizard/WizardStepper";
import { SupportedTag } from "lib/constants/markets";
import { NextPage } from "next";
import dynamic from "next/dynamic";

const MarketCreationForm = dynamic(
  () => import("components/create/form/MarketCreationForm"),
  {
    ssr: false,
  },
);
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

export type CreateMarketFormData = {
  currency?: SupportedCurrencyTag;
  tags: SupportedTag[];
};

const CreateMarketPage: NextPage = () => {
  return (
    <div>
      <h2 className="font-3xl mb-6 text-center">Create Market</h2>
      <MarketCreationForm />
    </div>
  );
};

export default CreateMarketPage;
