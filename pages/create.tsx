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

const CreateMarketPage: NextPage = () => {
  return (
    <div>
      <h2 className="font-3xl mb-6 text-center">Create Market</h2>
      <MarketCreationForm />
    </div>
  );
};

export default CreateMarketPage;
