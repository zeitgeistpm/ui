import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useCreatorFeePayouts } from "lib/hooks/queries/useCreatorFeePayouts";
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
  const tableData: TableData[] | undefined = feePayouts?.map((payout) => ({
    amount: new Decimal(payout.dBalance).div(ZTG).toNumber(),
    currency: "ZTG",
    block: payout.blockNumber,
  }));

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
        <Table columns={columns} data={tableData} />
      )}
    </div>
  );
};

export default CreatorFeePayouts;
