import Toggle from "components/ui/Toggle";
import WizardStepper, { WizardStepData } from "components/wizard/WizardStepper";
import { useCreateMarketState } from "lib/state/market-creation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  CurrencySectionFormData,
  QuestionSectionFormData,
} from "lib/state/market-creation/types";
import {
  CreateMarketWizardStep,
  createMarketWizardSteps,
  nextStepFrom,
  prevStepFrom,
} from "./inputs/types";
import { CreateMarketFormData } from "lib/state/market-creation/types";
import { MarketFormSection, MarketFormSectionProps } from "./inputs/Section";
import CurrencySelect from "./inputs/Currency";
import { QuestionSectionForm } from "./sections/Question";
import CategorySelect from "./inputs/Category";

const MarketCreationForm = () => {
  const state = useCreateMarketState();

  const sum = useForm<CreateMarketFormData>({
    defaultValues: {},
  });

  const prevStep = prevStepFrom(state.step);
  const nextStep = nextStepFrom(state.step);

  const back = () => {
    if (prevStep) {
      state.merge({ step: prevStep });
    }
  };

  const next = () => {
    if (nextStep) {
      state.merge({ step: nextStep });
    }
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  console.log(sum.watch());

  return (
    <div>
      <div className="flex center mb-12">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={state.wizardModeOn}
          onChange={(wizardModeOn) => state.merge({ wizardModeOn })}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-12">
        {state.wizardModeOn && (
          <WizardStepper
            steps={createMarketWizardSteps}
            current={state.step}
            onChange={(step) => state.merge({ step })}
          />
        )}
      </div>

      <div
        className={`mb-16 ${
          state.step.label == "Currency" || !state.wizardModeOn
            ? "block"
            : "hidden"
        }`}
      >
        <MarketFormSection<CurrencySectionFormData>
          values={sum.watch("currency")}
          wizard={state.wizardModeOn}
          onComplete={(data) => {
            sum.setValue("currency", data);
            next();
          }}
          render={(form) => (
            <CurrencySelect
              options={["ZTG", "DOT"]}
              value={form.watch("currency")}
              {...form.register("currency", {
                required: true,
              })}
            />
          )}
        />
      </div>

      <div
        className={`mb-16 ${
          state.step.label == "Question" || !state.wizardModeOn
            ? "block"
            : "hidden"
        }`}
      >
        <MarketFormSection<QuestionSectionFormData>
          values={sum.watch("question")}
          wizard={state.wizardModeOn}
          onClickBack={back}
          onComplete={(data) => {
            sum.setValue("question", data);
            next();
          }}
          render={(form) => (
            <>
              <div className="mb-12 text-center">
                <h2 className="mb-8 text-md">What is your question?</h2>
                <div className="flex center mb-12">
                  <input
                    className="h-12 w-2/3 text-center bg-green-100 rounded-md"
                    placeholder="When do I send it?"
                    {...form.register("question", {
                      required: true,
                      minLength: 10,
                      maxLength: 240,
                    })}
                    type="text"
                  />
                </div>
              </div>
              <CategorySelect
                value={form.watch("tags")}
                {...form.register("tags", {
                  required: true,
                })}
              />
            </>
          )}
        />
      </div>
    </div>
  );
};

export default MarketCreationForm;
