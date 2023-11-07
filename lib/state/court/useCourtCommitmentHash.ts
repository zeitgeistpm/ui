import { blake2AsU8a, mnemonicGenerate } from "@polkadot/util-crypto";
import { CategoricalAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useAtom } from "jotai";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { createCourtCommitmentHash } from "lib/util/create-vote-commitment-hash";
import { useMemo } from "react";
import { persistentAtom } from "../util/persistent-atom";
import { useWallet } from "../wallet";

export type UseCourtCommitmentHash = {
  phrase: string;
  salt: Uint8Array;
  commitmentHash?: Uint8Array;
};

export type UseCourtCommitmentHashParams = {
  marketId: number;
  caseId: number;
  selectedOutcome?: CategoricalAssetId;
};

const courtSaltPhrasesAtom = persistentAtom<Record<string, string>>({
  key: "court-salt",
  defaultValue: {},
});

export const useCourtCommitmentHash = ({
  marketId,
  caseId,
  selectedOutcome,
}: UseCourtCommitmentHashParams) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const [saltPhrases, setSaltPhrases] = useAtom(courtSaltPhrasesAtom);
  const id = `${marketId}-${caseId}`;

  let phrase = saltPhrases[id];

  if (!phrase) {
    phrase = mnemonicGenerate();
    setSaltPhrases((state) => ({
      ...state,
      [id]: phrase,
    }));
  }

  const salt = blake2AsU8a(phrase);

  const commitmentHash = useMemo(() => {
    if (isRpcSdk(sdk) && selectedOutcome && wallet.realAddress) {
      return createCourtCommitmentHash(
        sdk,
        wallet.realAddress!,
        selectedOutcome,
        salt,
      );
    }
  }, [salt, selectedOutcome, wallet.realAddress]);

  return {
    phrase,
    salt,
    commitmentHash,
  };
};
