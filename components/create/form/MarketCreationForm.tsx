import { Transition } from "@headlessui/react";
import { CategorySelect } from "components/create/form/inputs/Category";
import CurrencySelect, {
  SupportedCurrencyTag,
} from "components/create/form/inputs/Currency";
import Toggle from "components/ui/Toggle";
import WizardStepper, { WizardStepData } from "components/wizard/WizardStepper";
import { SupportedTag } from "lib/constants/markets";
import { useCreateMarketFormState } from "lib/state/market-creation-form";
import { CreateMarketWizardStep, createMarketWizardSteps } from "pages/create";
import { useState } from "react";

const MarketCreationForm = () => {
  const [step, setStep] = useState<WizardStepData<CreateMarketWizardStep>>({
    label: "Currency",
  });

  const form = useCreateMarketFormState();

  return (
    <div>
      <div className="flex center mb-12">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={form.state.wizardModeOn}
          onChange={(wizardModeOn) => form.merge({ wizardModeOn })}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-12">
        {form.state.wizardModeOn && (
          <WizardStepper
            steps={createMarketWizardSteps}
            current={form.state.step}
            onChange={(step) => form.merge({ step })}
          />
        )}
      </div>

      {(form.state.step.label == "Currency" || !form.state.wizardModeOn) && (
        <div className="mb-16">
          <CurrencySelect
            options={["ZTG", "DOT"]}
            value={form.state.currency}
            onChange={(currency) => form.merge({ currency })}
          />
        </div>
      )}

      {(form.state.step.label == "Question" || !form.state.wizardModeOn) && (
        <div className="mb-16">
          <CategorySelect
            value={form.state.tags}
            onChange={(tags) => form.merge({ tags })}
          />
        </div>
      )}
    </div>
  );
};

const MarketCreationFormSectionTransition: React.FC<{
  key?: string;
  show: boolean;
  children: React.ReactNode;
}> = ({ key, show, children }) => {
  return (
    <Transition
      style={{
        gridRowStart: 1,
        gridColumnStart: 1,
      }}
      show={show}
      enter="transition-opacity duration-100"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0 "
      key={key}
    >
      {children}
    </Transition>
  );
};

export default MarketCreationForm;
