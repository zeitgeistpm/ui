import { useQueryClient } from "@tanstack/react-query";
import { InputMaybe, OrderStatus, OrderWhereInput } from "@zeitgeistpm/indexer";
import { BaseAssetId, ZTG, getIndexOf, isRpcSdk } from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { lookupAssetSymbol } from "lib/constants/foreign-asset";
import {
  ordersRootKey,
  useOrders,
} from "lib/hooks/queries/orderbook/useOrders";
import { useMarketsByIds } from "lib/hooks/queries/useMarketsByIds";
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
    header: "Filled",
    accessor: "percentageFilled",
    type: "text",
  },
  {
    header: "Status",
    accessor: "status",
    type: "text",
  },
  {
    header: "",
    accessor: "button",
    type: "component",
    width: "180px",
  },
];

const OrdersTable = ({ where }: { where: InputMaybe<OrderWhereInput> }) => {
  const { realAddress } = useWallet();
  const { data: orders } = useOrders(where);
  const { data: markets } = useMarketsByIds(
    orders?.map((order) => ({ marketId: order.marketId })),
  );

  const tableData: TableData[] | undefined = orders?.map(
    ({
      side,
      price,
      outcomeAssetId,
      outcomeAmount,
      id,
      marketId,
      makerAddress,
      filledPercentage,
      status,
    }) => {
      const index = getIndexOf(outcomeAssetId);
      const market = markets?.find((market) => market.marketId === marketId);
      const outcomeName = market?.categories?.[index]?.name;
      const baseAsset = parseAssetIdString(market?.baseAsset) as BaseAssetId;
      const baseSymbol = lookupAssetSymbol(baseAsset);
      const orderFilled = filledPercentage === 100;

      return {
        side: side.toUpperCase(),
        outcome: outcomeName,
        amount: outcomeAmount.div(ZTG).toFixed(2),
        value: `${outcomeAmount.mul(price).div(ZTG).toFixed(3)} ${baseSymbol}`,
        price: `${price.toFixed(3)} ${baseSymbol}`,
        percentageFilled: `${filledPercentage.toFixed(0)}%`,
        status: status,
        button: (
          <CancelOrderButton
            orderId={id}
            disabled={
              realAddress !== makerAddress ||
              orderFilled ||
              status === OrderStatus.Removed
            }
          />
        ),
      };
    },
  );
  return (
    <div>
      <Table columns={columns} data={tableData} showHighlight={false} />
    </div>
  );
};

const CancelOrderButton = ({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled: boolean;
}) => {
  const notificationStore = useNotifications();
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries([id, ordersRootKey]);

        notificationStore.pushNotification("Successfully cancelled order", {
          type: "Success",
        });
      },
    },
  );

  return (
    <SecondaryButton
      onClick={() => cancelOrder()}
      disabled={isLoading || isSuccess || disabled}
    >
      Cancel Order
    </SecondaryButton>
  );
};

export default OrdersTable;
