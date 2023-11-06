import { mnemonicGenerate } from "@polkadot/util-crypto";
import { blake2AsHex } from "@polkadot/util-crypto";
import { persistentAtom } from "../util/persistent-atom";
import { useAtom } from "jotai";

const courtSaltAtom = persistentAtom<Record<string, string>>({
  key: "court-salt",
  defaultValue: {},
});

export type UseCourtSalt = {
  phrase: string;
  salt: `0x${string}`;
  setPhrase: (phrase: string) => void;
};

export const useCourtSalt = (marketId: number, caseId: number) => {
  const [state, setState] = useAtom(courtSaltAtom);
  const id = `${marketId}-${caseId}`;

  let phrase = state[id];

  if (!phrase) {
    phrase = mnemonicGenerate();
    setState((state) => ({
      ...state,
      [id]: phrase,
    }));
  }

  return {
    phrase,
    salt: blake2AsHex(phrase),
    setPhrase: (phrase: string) => {
      setState((state) => ({
        ...state,
        [id]: phrase,
      }));
    },
  };
};
