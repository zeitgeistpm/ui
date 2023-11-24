import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import { courtCasesRootKey } from "lib/hooks/queries/court/useCourtCases";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const CourtAppealForm = ({ caseId }: { caseId: number }) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

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

  return (
    <div className="overflow-hidden rounded-xl shadow-lg">
      <div className="center flex bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Appeal Court</h3>
      </div>

      <div className="px-2 py-6 text-center">
        <div className="mb-4">
          <div className="mb-3 text-sm text-gray-700">
            If you think the juror's most recent vote aggregation is unjustified, you can appeal it.
            This will start a new vote round.
          </div>
        </div>

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting}
          className={`relative h-[56px] ${isLoading && "animate-pulse"
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
