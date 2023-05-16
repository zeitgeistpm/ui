import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import { CreateMarketFormData, CreateMarketStep } from "./types";

export type CreateMarketState = {
  wizardModeOn: boolean;
  step: CreateMarketStep;
  formData?: CreateMarketFormData;
};

export const defaultState: CreateMarketState = {
  wizardModeOn: true,
  step: { label: "Currency", isValid: false },
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
