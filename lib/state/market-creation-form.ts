import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { atom, useAtom } from "jotai";
import { atomWithStorage, useHydrateAtoms } from "jotai/utils";
import { SupportedTag } from "lib/constants/markets";
import { persistentAtom } from "./util/persistent-atom";
import { CreateMarketWizardStep } from "pages/create";
import { WizardStepData } from "components/wizard/WizardStepper";

export type CreateMarketFormData = {
  wizardModeOn: boolean;
  step: WizardStepData<CreateMarketWizardStep>;
  currency?: SupportedCurrencyTag;
  tags: SupportedTag[];
  question: string;
};

export const defaultFormState: CreateMarketFormData = {
  wizardModeOn: true,
  step: { label: "Currency" },
  tags: [],
  question: "",
};

const createMarketFormAtom = persistentAtom<CreateMarketFormData>({
  key: "market-creation-form",
  defaultValue: defaultFormState,
});

// const createMarketFormAtom = atomWithStorage<CreateMarketFormData>(
//   "market-creation-form",
//   defaultFormState,
// );

export const useCreateMarketFormState = () => {
  const [state, setState] = useAtom(createMarketFormAtom);

  //useHydrateAtoms([[createMarketFormAtom, defaultFormState]]);

  const merge = (newState: Partial<CreateMarketFormData>) =>
    setState({ ...state, ...newState });

  return { state, merge };
};
