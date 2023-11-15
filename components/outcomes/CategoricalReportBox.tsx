import { Listbox } from "@headlessui/react";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import TruncatedText from "components/ui/TruncatedText";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { MarketCategoricalOutcome } from "lib/types";
import { calcMarketColors } from "lib/util/color-calc";
import { useState } from "react";
import { RiArrowDownSLine } from "react-icons/ri";

const CategoricalReportBox = ({
  market,
  onReport,
}: {
  market: Market<IndexerContext>;
  onReport?: (outcome: MarketCategoricalOutcome) => void;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  if (!market) return null;

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedOutcome, setSelectedOutcome] = useState(outcomeAssets[0]);

  const { send, isLoading, isBroadcasting, isSuccess } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      if (!IOCategoricalAssetId.is(selectedOutcome)) return;

      const ID = selectedOutcome.CategoricalOutcome[1];

      return sdk.api.tx.predictionMarkets.report(market.marketId, {
        Categorical: ID,
      });
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        if (onReport) {
          onReport?.({ categorical: getIndexOf(selectedOutcome) });
        } else {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
        }
      },
    },
  );

  const reportDisabled = !sdk || !isRpcSdk(sdk) || isLoading || isSuccess;

  const handleSignTransaction = async () => send();

  return (
    <>
      <div className="mb-4">
        {market && selectedOutcome && (
          <MarketContextActionOutcomeSelector
            market={market}
            selected={selectedOutcome}
            options={outcomeAssets}
            onChange={(assetId) => {
              setSelectedOutcome(assetId as CategoricalAssetId);
            }}
          />
        )}
      </div>

      <TransactionButton
        className="center my-ztg-10 shadow-ztg-2"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        <span className="mr-1">Report Outcome</span>
        <TruncatedText
          length={12}
          text={market.categories?.[getIndexOf(selectedOutcome)]?.name ?? ""}
        >
          {(text) => <>{text}</>}
        </TruncatedText>
      </TransactionButton>
    </>
  );
};

export default CategoricalReportBox;
