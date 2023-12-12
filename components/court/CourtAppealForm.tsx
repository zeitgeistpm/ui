import { Disclosure } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { courtCasesRootKey } from "lib/hooks/queries/court/useCourtCases";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMemo } from "react";
import { AiOutlineEye } from "react-icons/ai";

export const CourtAppealForm = ({ caseId }: { caseId: number }) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const { data: chainConstants } = useChainConstants();
  const { data: courtCase } = useCourtCase(caseId);

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.court.appeal(caseId);
      }
      return undefined;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, courtCasesRootKey]);
      },
    },
  );

  const bond = useMemo(() => {
    const appealRound = (courtCase?.appeals.length ?? 0) + 1;
    return new Decimal(chainConstants?.court.appealBond ?? 0)
      .mul(Math.pow(2, appealRound))
      .toNumber();
  }, [courtCase, chainConstants]);

  return (
    <div className="overflow-hidden rounded-xl shadow-lg">
      <div className="center flex bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Appeal Court</h3>
      </div>

      <div className="px-2 py-6 text-center">
        <div className="mb-4">
          <div className="mb-3 text-sm text-gray-700">
            If you think the court has made a mistake, you can appeal the
            decision. This will start a new round of voting.
          </div>
        </div>

        <div className="relative mb-5 mt-4 w-full rounded-lg bg-provincial-pink p-5 text-sm font-normal">
          <div>
            When you appeal you have to bond{" "}
            <b>
              {bond} {chainConstants?.tokenSymbol}
            </b>
            .
          </div>
          <Disclosure>
            <Disclosure.Button className="py-2">
              <div className="center cursor-pointer gap-2 text-xs text-gray-500">
                Show Details <AiOutlineEye size={12} />
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="text-gray-500">
              At the end of the appeal period and if there are no further
              appeals, all accounts which provided appeal bonds and didn’t
              appeal on the winner outcome, get their funds back. In this case,
              if the appealed outcome is not equal to the winner outcome, the
              appeal was justified. Otherwise the appeal bond is slashed and
              given to the treasury. This punishes the malicious behaviour that
              someone appeals the correct outcome.
              <br />
              <br />
              The last possible call to appeal is necessary for the global
              dispute to get triggered, because there has to be some kind of
              financial commitment to appeal the winner outcome of the last
              appeal round.
            </Disclosure.Panel>
          </Disclosure>
        </div>

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting}
          className={`relative h-[56px] ${
            isLoading && "animate-pulse"
          } !bg-orange-400`}
          type="submit"
          loading={isLoading || isBroadcasting}
          onClick={() => send()}
        >
          <div>
            <div className="center h-[20px] font-normal">Submit Appeal</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
