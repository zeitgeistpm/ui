import Table, { TableColumn } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountBonds } from "lib/hooks/queries/useAccountBonds";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import EmptyPortfolio from "./EmptyPortfolio";
import MarketPositionHeader from "./MarketPositionHeader";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";
import { useAllForeignAssetUsdPrices } from "lib/hooks/queries/useAssetUsdPrice";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Price",
    accessor: "price",
    type: "text",
    width: "100px",
  },
  {
    header: "",
    accessor: "buttons",
    type: "component",
  },
];

const AccountPoolsTable = ({ address }: { address: string }) => {
  const { data: pools, isLoading } = useAccountAmm2Pool(address);
  const { data: usdPrices } = useAllForeignAssetUsdPrices();
  const { data: ztgPrice } = useZtgPrice();
  console.log(usdPrices);

  return (
    <div>
      <></>
    </div>
  );
};

export default AccountPoolsTable;
