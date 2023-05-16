import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import { MarketCreationForm, MarketCreationStep } from "./types";

export type CreateMarketState = {
  step: MarketCreationStep;
  wizard: boolean;
  formData?: MarketCreationForm;
};

export const defaultState: CreateMarketState = {
  wizard: true,
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
