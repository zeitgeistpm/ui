import { Disclosure } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import {
  courtCaseRootKey,
  useCourtCase,
} from "lib/hooks/queries/court/useCourtCases";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMemo } from "react";
import { AiOutlineEye } from "react-icons/ai";

export const CourtReassignForm = ({ caseId }: { caseId: number }) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const { data: chainConstants } = useChainConstants();
  const { data: courtCase } = useCourtCase(caseId);

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.court.reassignCourtStakes(caseId);
      }
      return undefined;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, courtCaseRootKey]);
        queryClient.invalidateQueries([id, voteDrawsRootKey]);
      },
    },
  );

  return (
    <div className="overflow-hidden rounded-xl shadow-lg">
      <div className="center flex bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Settle Case</h3>
      </div>

      <div className="px-2 py-6 text-center">
        <div className="mb-4">
          <div className="mb-3 text-sm text-gray-700">
            The case is closed and can be settled. This will reassign the staked
            amount by the loosing jurors paying the winning jurors.
          </div>
          <Disclosure>
            <Disclosure.Button className="py-2">
              <div className="center cursor-pointer gap-2 text-xs text-gray-500">
                Show Details <AiOutlineEye size={12} />
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="text-xs text-gray-500">
              All jurors and delegators who sided with a different outcome to
              the winner outcome get slashed according to their draw weights.
              <br />
              <br />
              All jurors who failed to vote or failed to reveal the encrypted
              vote or got denounced, as well as their delegators, get also
              slashed according to their draw weights.
              <br />
              <br />
              All jurors and their delegators, who sided with the winner outcome
              get the previously mentioned slashed funds proportional to their
              share of all the other winner stake.
            </Disclosure.Panel>
          </Disclosure>
        </div>

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting}
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isLoading || isBroadcasting}
          onClick={() => send()}
        >
          <div>
            <div className="center h-[20px] font-normal">Settle</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
