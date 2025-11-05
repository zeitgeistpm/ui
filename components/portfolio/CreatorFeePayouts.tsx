import { IOBaseAssetId } from "@zeitgeistpm/sdk";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { lookupAssetSymbol } from "lib/constants/foreign-asset";
import { useCreatorFeePayouts } from "lib/hooks/queries/useCreatorFeePayouts";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import EmptyPortfolio from "./EmptyPortfolio";

const columns: TableColumn[] = [
  {
    header: "Amount",
    accessor: "amount",
    type: "text",
  },
  {
    header: "Currency",
    accessor: "currency",
    type: "text",
  },
  {
    header: "Block number",
    accessor: "block",
    type: "text",
  },
];

const CreatorFeePayouts = ({ address }: { address: string }) => {
  const { data: feePayouts, isLoading } = useCreatorFeePayouts(address);
  const tableData: TableData[] | undefined = feePayouts?.map((payout) => {
    const assetId = parseAssetIdString(payout.assetId);
    const assetSymbol = IOBaseAssetId.is(assetId)
      ? lookupAssetSymbol(assetId)
      : "Unknown Asset";

    return {
      amount: new Decimal(payout.dBalance).div(ZTG).toNumber(),
      currency: assetSymbol,
      block: payout.blockNumber,
    };
  });

  return (
    <div>
      {isLoading === false &&
      (feePayouts == null || feePayouts?.length === 0) ? (
        <EmptyPortfolio
          headerText="No creator fees"
          bodyText="Create a market with creator to earn"
          buttonText="Create Market"
          buttonLink="/create"
        />
      ) : (
        <div className="rounded-lg bg-white/15 p-4 shadow-lg backdrop-blur-md">
          <div className="overflow-hidden rounded-lg">
            <Table columns={columns} data={tableData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorFeePayouts;
