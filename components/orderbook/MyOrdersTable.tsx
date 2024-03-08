import { BaseAssetId, ZTG, getIndexOf, isRpcSdk } from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { lookupAssetSymbol } from "lib/constants/foreign-asset";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";

const columns: TableColumn[] = [
  {
    header: "Outcome",
    accessor: "outcome",
    type: "component",
  },
  {
    header: "Side",
    accessor: "side",
    type: "text",
  },
  {
    header: "Amount",
    accessor: "amount",
    type: "text",
  },
  {
    header: "Price",
    accessor: "price",
    type: "text",
  },
  {
    header: "Total Value",
    accessor: "value",
    type: "text",
  },
  {
    header: "",
    accessor: "button",
    type: "component",
    width: "200px",
  },
];

const MyOrdersTable = ({ marketId }: { marketId: number }) => {
  const { data: orders } = useOrders();
  const { data: market } = useMarket({ marketId });

  const tableData: TableData[] | undefined = orders?.map(
    ({ side, price, outcomeAssetId, outcomeAmount, id }) => {
      const index = getIndexOf(outcomeAssetId);
      const outcomeName = market?.categories?.[index]?.name;
      const baseAsset = parseAssetIdString(market?.baseAsset) as BaseAssetId;
      const baseSymbol = lookupAssetSymbol(baseAsset);

      return {
        side: side.toUpperCase(),
        outcome: outcomeName,
        amount: outcomeAmount.div(ZTG).toFixed(3),
        value: `${outcomeAmount.mul(price).div(ZTG).toFixed(3)} ${baseSymbol}`,
        price: `${price.toFixed(3)} ${baseSymbol}`,
        button: <CancelOrderButton orderId={id} />,
      };
    },
  );
  return (
    <div>
      <Table columns={columns} data={tableData} showHighlight={false} />
    </div>
  );
};

const CancelOrderButton = ({ orderId }: { orderId: string }) => {
  const notificationStore = useNotifications();
  const [sdk] = useSdkv2();

  const {
    isLoading,
    isSuccess,
    send: cancelOrder,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;
      return sdk.api.tx.orderbook.removeOrder(orderId);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Successfully cancelled order", {
          type: "Success",
        });
      },
    },
  );

  return (
    <SecondaryButton
      onClick={() => cancelOrder()}
      disabled={isLoading || isSuccess}
    >
      Cancel Order
    </SecondaryButton>
  );
};

export default MyOrdersTable;
