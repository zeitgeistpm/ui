import { blake2AsU8a } from "@polkadot/util-crypto";
import { u8aConcat } from "@polkadot/util/u8a";
import { CategoricalAssetId, RpcContext, Sdk } from "@zeitgeistpm/sdk";

export const createCourtCommitmentHash = (
  sdk: Sdk<RpcContext>,
  address: string,
  selectedOutcome: CategoricalAssetId,
  salt: Uint8Array,
) => {
  const accountId = sdk.api.createType("AccountId32", address);
  const voteItem = sdk.api.createType("ZrmlCourtVoteItem", {
    Outcome: sdk.api.createType("ZeitgeistPrimitivesOutcomeReport", {
      Categorical: selectedOutcome.CategoricalOutcome[1],
    }),
  });

  const hash = blake2AsU8a(u8aConcat(accountId, voteItem.toU8a(), salt), 256);

  return hash;
};
