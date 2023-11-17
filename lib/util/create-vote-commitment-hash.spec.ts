import { describe, expect, test } from "vitest";
import { MarketId, batterystationRpc, create } from "@zeitgeistpm/sdk";
import { blake2AsU8a } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { createCourtCommitmentHash } from "./create-vote-commitment-hash";

describe("createCourtCommitmentHash", () => {
  test("should produce the correct commitment hash provided the", async () => {
    const sdk = await create(batterystationRpc());
    const phrase =
      "purity home goddess equal grant squirrel page cause domain hope throw wink";
    const salt = blake2AsU8a(phrase);

    const yesHash = createCourtCommitmentHash(
      sdk,
      "dDyXkkoewJvnksMEirA7k6K76STzJz78bxYtG1Y1V2LCHJyMA",
      {
        CategoricalOutcome: [754 as MarketId, 0],
      },
      salt,
    );

    const noHash = createCourtCommitmentHash(
      sdk,
      "dDyXkkoewJvnksMEirA7k6K76STzJz78bxYtG1Y1V2LCHJyMA",
      {
        CategoricalOutcome: [754 as MarketId, 1],
      },
      salt,
    );

    expect(u8aToHex(yesHash)).toEqual(
      "0x77d99bba0142ab7ad7e148a9cdb246ca362c03eef834481678766f639d383061",
    );
    expect(u8aToHex(noHash)).toEqual(
      "0x407fe12e135068fa36728063a30a1ce8e19c2b18ad3b471eeea2f20686e01426",
    );
  });
});
