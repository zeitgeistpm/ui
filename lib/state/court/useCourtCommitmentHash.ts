import { blake2AsU8a, mnemonicGenerate } from "@polkadot/util-crypto";
import { CategoricalAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useAtom } from "jotai";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { createCourtCommitmentHash } from "lib/util/create-vote-commitment-hash";
import { useMemo } from "react";
import { persistentAtom } from "../util/persistent-atom";
import { useWallet } from "../wallet";
import { CourtSaltPhraseSeed } from "./phrase-seed";

export type UseCourtCommitmentHash = {
  phraseSeed: CourtSaltPhraseSeed;
  salt: Uint8Array;
  commitmentHash?: Uint8Array;
  setPhraseSeed: (phraseSeed: CourtSaltPhraseSeed) => void;
};

export type UseCourtCommitmentHashParams = {
  marketId: number;
  caseId: number;
  selectedOutcome?: CategoricalAssetId;
};

const courtSaltPhrasesAtom = persistentAtom<Record<string, string>>({
  key: "court-phrase-seeds",
  defaultValue: {},
});

export const useCourtCommitmentHash = ({
  marketId,
  caseId,
  selectedOutcome,
}: UseCourtCommitmentHashParams) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const [saltPhraseSeeds, setSaltPhraseSeeds] = useAtom(courtSaltPhrasesAtom);
  const id = `${marketId}-${caseId}`;

  let phraseSeed = saltPhraseSeeds[id];

  if (!phraseSeed) {
    phraseSeed = mnemonicGenerate();
    console.log("HELLO");
    setSaltPhraseSeeds((state) => ({
      ...state,
      [id]: phraseSeed,
    }));
  }

  const salt = blake2AsU8a(phraseSeed);

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

  const setPhraseSeed = (phraseSeed: string) => {
    setSaltPhraseSeeds((state) => ({
      ...state,
      [id]: phraseSeed,
    }));
  };

  return {
    phraseSeed,
    setPhraseSeed,
    salt,
    commitmentHash,
  };
};
