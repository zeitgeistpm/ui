import { CategoricalAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { createCourtCommitmentHash } from "lib/util/create-vote-commitment-hash";
import { useMemo } from "react";
import { useWallet } from "../wallet";
import { CourtSaltPhraseStorage } from "./CourtSaltPhraseStorage";
import { CourtSalt, useCourtSalt } from "./useCourtSalt";

export type UseCourtCommitmentHash = {
  commitmentHash?: Uint8Array;
};

export type UseCourtCommitmentHashParams = {
  salt: CourtSalt;
  selectedOutcome?: CategoricalAssetId;
};

export const useCourtCommitmentHash = ({
  salt,
  selectedOutcome,
}: UseCourtCommitmentHashParams): UseCourtCommitmentHash => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();

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
    commitmentHash,
  };
};
