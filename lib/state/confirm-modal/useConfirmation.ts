import { atom, createStore, getDefaultStore, useAtom } from "jotai";
import { generateGUID } from "lib/util/generate-guid";

export type ConfirmationPromptProps = {
  /**
   * The title of the confirmation prompt
   */
  title: string | JSX.Element;
  /**
   * The description of the confirmation prompt
   */
  description: string | JSX.Element;
  /**
   * The label of the confirm button
   */
  confirmLabel?: string | JSX.Element;
  /**
   * The label of the cancel button
   */
  cancelLabel?: string | JSX.Element;
};

/**
 * Confirmation state.
 * Holds a record state(opened, confirmed) about confirmations by id.
 */
export type ComfirmationState = Record<
  string,
  ConfirmationPromptProps & {
    open: boolean;
    confirmed: boolean;
  }
>;

export type UseConfirm = {
  /**
   * Confirmations in state that has been prompted.
   */
  confirmations: ComfirmationState;
  /**
   * Prompt a new confirmation. Can be awaited to get the confirmation result.
   */
  prompt: (props: ConfirmationPromptProps) => Promise<boolean>;
  /**
   * Confirm a confirmation by id.
   */
  confirm: (id: string) => void;
  /**
   * Dismiss a confirmation by id.
   */
  dismiss: (id: string) => void;
};

const confirmationState = atom<ComfirmationState>({});

export const useConfirmation = (opts?: {
  store?: ReturnType<typeof getDefaultStore | typeof createStore>;
}): UseConfirm => {
  const store = opts?.store ?? getDefaultStore();
  const [state, setState] = useAtom(confirmationState);

  const prompt = async (props: ConfirmationPromptProps) => {
    const id = generateGUID();

    setState((state) => ({
      ...state,
      [id]: {
        ...props,
        open: true,
        confirmed: false,
      },
    }));

    let unsubStorage: () => void;

    return new Promise<boolean>(async (resolve) => {
      unsubStorage = store.sub(confirmationState, () => {
        const state = store.get(confirmationState);
        const confirmation = state[id];

        if (!confirmation.open) {
          resolve(confirmation.confirmed);
          unsubStorage();
        }
      });
    });
  };

  const confirm = (id: string) => {
    setState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        confirmed: true,
        open: false,
      },
    }));
  };

  const dismiss = (id: string) => {
    setState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        open: false,
      },
    }));
  };

  return { prompt, confirm, dismiss, confirmations: state };
};
