import { mnemonicGenerate } from "@polkadot/util-crypto";
import { blake2AsHex, blake2AsU8a } from "@polkadot/util-crypto";
import { u8aConcat } from "@polkadot/util/u8a";
import { persistentAtom } from "../util/persistent-atom";
import { useAtom } from "jotai";
import { u8aToHex } from "@polkadot/util";
import { CategoricalAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useWallet } from "../wallet";
import { useMemo } from "react";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export type UseCourtCommitmentHash = {
  phrase: string;
  salt: Uint8Array;
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
    if (isRpcSdk(sdk) && selectedOutcome) {
      const accountId = sdk.api.createType("AccountId32", wallet.realAddress);
      const voteItem = sdk.api.createType("ZrmlCourtVoteItem", {
        Outcome: sdk.api.createType("ZeitgeistPrimitivesOutcomeReport", {
          Categorical: selectedOutcome.CategoricalOutcome[1],
        }),
      });

      const hash = blake2AsU8a(
        u8aConcat(accountId, voteItem.toU8a(), salt),
        256,
      );

      return hash;
    }
  }, [salt, selectedOutcome, wallet.realAddress]);

  return {
    phrase,
    salt,
    commitmentHash,
  };
};
