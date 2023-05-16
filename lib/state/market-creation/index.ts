import { WizardStepData } from "components/wizard/WizardStepper";
import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import { CreateMarketWizardStep } from "./types";

export type CreateMarketState = {
  wizardModeOn: boolean;
  step: WizardStepData<CreateMarketWizardStep>;
};

export const defaultState: CreateMarketState = {
  wizardModeOn: true,
  step: { label: "Currency" },
};

const createMarketStateAtom = persistentAtom<CreateMarketState>({
  key: "market-creation-form",
  defaultValue: defaultState,
});

export const useCreateMarketState = () => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const merge = (newState: Partial<CreateMarketState>) =>
    setState({ ...state, ...newState });

  return { ...state, merge };
};
