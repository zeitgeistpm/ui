import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { ZTG } from "lib/constants";
import { useSdkv2 } from "../useSdkv2";
import { isWSX } from "lib/constants";

export type ChainConstants = {
  tokenSymbol: string;
  ss58Prefix: number;
  blockTimeSec: number;
  parachainId: number;
  markets: {
    maxDisputes: number;
    disputeBond: number; // initial dispute amount
    oracleBond: number;
    advisoryBond: number;
    validityBond: number;
    maxCategories: number;
    minCategories: number;
    advisoryBondSlashPercentage: number;
  };
  swaps: {
    exitFee: number;
  };
  identity: {
    basicDeposit: number;
    fieldDeposit: number;
  };
  balances: {
    existentialDeposit: number;
  };
  court: {
    maxCourtParticipants: number;
    maxAppeals: number;
    minJurorStake: number;
    inflationPeriodBlocks: number;
    maxDelegations: number;
  };
};

export const useChainConstants = () => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, "chain-constants"],
    async () => {
      if (!isRpcSdk(sdk)) return null;

      const [consts, properties, parachainId] = await Promise.all([
        sdk.api.consts,
        sdk.api.rpc.system.properties(),
        sdk.api.query.parachainInfo.parachainId(),
      ]);

      // minimumPeriod * 2 is fair assumption for now but need to make sure this stays up
      // to date with the chain code
      const blockTimeSec =
        (consts.timestamp.minimumPeriod.toNumber() * 2) / 1000;
      const config: ChainConstants = {
        tokenSymbol: isWSX
          ? "WSX"
          : properties.tokenSymbol.toString().replace("[", "").replace("]", ""),
        ss58Prefix: consts.system.ss58Prefix.toNumber(),
        blockTimeSec: blockTimeSec,
        parachainId: parachainId.toNumber(),
        markets: {
          maxDisputes: consts.predictionMarkets.maxDisputes.toNumber(),
          disputeBond: consts.predictionMarkets.disputeBond.toNumber() / ZTG,
          oracleBond: consts.predictionMarkets.oracleBond.toNumber() / ZTG,
          advisoryBond: consts.predictionMarkets.advisoryBond.toNumber() / ZTG,
          validityBond: consts.predictionMarkets.validityBond.toNumber() / ZTG,
          maxCategories: consts.predictionMarkets.maxCategories.toNumber(),
          minCategories: consts.predictionMarkets.minCategories.toNumber(),
          advisoryBondSlashPercentage:
            consts.predictionMarkets.advisoryBondSlashPercentage.toNumber(),
        },
        swaps: {
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
        court: {
          maxCourtParticipants: consts.court.maxCourtParticipants.toNumber(),
          maxAppeals: consts.court.maxAppeals.toNumber(),
          minJurorStake: consts.court.minJurorStake.toNumber() / ZTG,
          inflationPeriodBlocks: consts.court.inflationPeriod.toNumber(),
          maxDelegations: consts.court.maxDelegations.toNumber(),
        },
      };

      return config;
    },
    {
      enabled: Boolean(sdk) && isRpcSdk(sdk),
      keepPreviousData: true,
      staleTime: Infinity,
    },
  );
};
