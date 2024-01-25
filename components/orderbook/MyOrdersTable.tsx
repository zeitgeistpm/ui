import { BaseAssetId, ZTG, getIndexOf } from "@zeitgeistpm/sdk";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { lookupAssetSymbol } from "lib/constants/foreign-asset";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useMarket } from "lib/hooks/queries/useMarket";
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
    width: "150px",
  },
];

const MyOrdersTable = ({ marketId }: { marketId: number }) => {
  const { data: orders } = useOrders();
  const { data: market } = useMarket({ marketId });

  console.log(orders);

  const tableData: TableData[] | undefined = orders?.map(
    ({ side, price, outcomeAssetId, outcomeAmount }) => {
      const index = getIndexOf(outcomeAssetId);
      const outcomeName = market?.categories?.[index].name;
      const baseAsset = parseAssetIdString(market?.baseAsset) as BaseAssetId;
      const baseSymbol = lookupAssetSymbol(baseAsset);

      return {
        side: side.toUpperCase(),
        outcome: outcomeName,
        amount: outcomeAmount.div(ZTG).toFixed(3),
        value: `${outcomeAmount.mul(price).div(ZTG).toFixed(3)} ${baseSymbol}`,
        price: `${price.toFixed(3)} ${baseSymbol}`,
        button: <button>Cancel</button>,
      };
    },
  );
  return (
    <div>
      <div>My Orders</div>
      <Table columns={columns} data={tableData} showHighlight={false} />
    </div>
  );
};

export default MyOrdersTable;
