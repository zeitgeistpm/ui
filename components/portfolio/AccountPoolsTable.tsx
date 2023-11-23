import { isRpcSdk } from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";
import { useAllForeignAssetUsdPrices } from "lib/hooks/queries/useAssetUsdPrice";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import Link from "next/link";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Value",
    accessor: "value",
    type: "text",
  },
  {
    header: "Fees collected",
    accessor: "fees",
    type: "text",
  },
  {
    header: "",
    accessor: "buttons",
    type: "component",
    width: "150px",
  },
];

const CollectFeesButton = ({ marketId }: { marketId: number }) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();

  const {
    isLoading: isCollectingFees,
    isSuccess,
    send,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;
      return sdk.api.tx.predictionMarkets.redeemShares(marketId);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(`Redeemed Fees`, {
          type: "Success",
        });
      },
    },
  );
  return (
    <SecondaryButton
      disabled={isCollectingFees || isSuccess}
      onClick={() => {
        console.log("redeen", marketId);
        send();
      }}
    >
      Collect fees
    </SecondaryButton>
  );
};

const AccountPoolsTable = ({ address }: { address: string }) => {
  const { data: pools, isLoading } = useAccountAmm2Pool(address);

  const tableData: TableData[] =
    pools?.map((pool) => {
      return {
        question: (
          <Link
            href={`/markets/${pool.marketId}`}
            className="line-clamp-1 text-[14px]"
          >
            {pool.question}
          </Link>
        ),
        value: pool.value.div(ZTG).toFixed(3),
        fees: new Decimal(pool.liquiditySharesManager.fees).div(ZTG).toFixed(3),
        buttons: <CollectFeesButton marketId={pool.marketId} />,
      };
    }) ?? [];

  return (
    <div>
      <Table columns={columns} data={tableData} showHighlight={false} />
    </div>
  );
};

export default AccountPoolsTable;
