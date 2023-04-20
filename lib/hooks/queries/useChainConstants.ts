import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { ZTG } from "lib/constants";
import { useSdkv2 } from "../useSdkv2";

export type ChainConstants = {
  tokenSymbol: string;
  ss58Prefix: number;
  blockTimeSec: number;
  markets: {
    maxDisputes: number;
    disputeBond: number; // initial dispute amount
    disputeFactor: number; // increase in bond per dispute
    oracleBond: number;
    advisoryBond: number;
    validityBond: number;
    maxCategories: number;
    minCategories: number;
  };
  court: {
    caseDurationSec: number;
    stakeWeight: number; // increase in juror stake per juror
  };
  swaps: {
    minLiquidity: number;
    exitFee: number;
  };
  identity: {
    basicDeposit: number;
    fieldDeposit: number;
  };
  balances: {
    existentialDeposit: number;
  };
};

export const useChainConstants = () => {
  const [sdk, id] = useSdkv2();

  return useQuery<ChainConstants>(
    [id, sdk, "chain-constants"],
    async () => {
      if (!isRpcSdk(sdk)) return null;

      const [consts, properties] = await Promise.all([
        sdk.api.consts,
        sdk.api.rpc.system.properties(),
      ]);

      // minimumPeriod * 2 is fair assumption for now but need to make sure this stays up
      // to date with the chain code
      const blockTimeSec =
        (consts.timestamp.minimumPeriod.toNumber() * 2) / 1000;
      const config: ChainConstants = {
        tokenSymbol: properties.tokenSymbol
          .toString()
          .replace("[", "")
          .replace("]", ""),
        ss58Prefix: consts.system.ss58Prefix.toNumber(),
        blockTimeSec: blockTimeSec,
        markets: {
          maxDisputes: consts.predictionMarkets.maxDisputes.toNumber(),
          disputeBond: consts.predictionMarkets.disputeBond.toNumber() / ZTG,
          disputeFactor:
            consts.predictionMarkets.disputeFactor.toNumber() / ZTG,
          oracleBond: consts.predictionMarkets.oracleBond.toNumber() / ZTG,
          advisoryBond: consts.predictionMarkets.advisoryBond.toNumber() / ZTG,
          validityBond: consts.predictionMarkets.validityBond.toNumber() / ZTG,
          maxCategories: consts.predictionMarkets.maxCategories.toNumber(),
          minCategories: consts.predictionMarkets.minCategories.toNumber(),
        },
        court: {
          caseDurationSec:
            consts.court.courtCaseDuration.toNumber() * blockTimeSec,
          stakeWeight: consts.court.stakeWeight.toNumber() / ZTG,
        },
        swaps: {
          minLiquidity: consts.swaps.minLiquidity.toNumber() / ZTG,
          exitFee: consts.swaps.exitFee.toNumber() / ZTG,
        },
        identity: {
          basicDeposit: consts.identity.basicDeposit.toNumber() / ZTG,
          fieldDeposit: consts.identity.fieldDeposit.toNumber() / ZTG,
        },
        balances: {
          existentialDeposit:
            consts.balances.existentialDeposit.toNumber() / ZTG,
        },
      };
    },
    {
      keepPreviousData: true,
      staleTime: Infinity,
    },
  );
};
