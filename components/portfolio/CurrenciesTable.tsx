import Table, { TableColumn, TableData } from "components/ui/Table";
import { ZTG } from "lib/constants";
import { useCurrencyBalances } from "lib/hooks/queries/useCurrencyBalances";
import DepositButton from "./DepositButton";
import WithdrawButton from "./WithdrawButton";

const columns: TableColumn[] = [
  {
    header: "Asset",
    accessor: "asset",
    type: "text",
  },
  {
    header: "Chain",
    accessor: "chain",
    type: "text",
  },
  {
    header: "Balance",
    accessor: "balance",
    type: "text",
  },
  {
    header: "",
    accessor: "button",
    type: "component",
    width: "150px",
  },
];

const selectButton = (chain: string, token: string) => {
  if (chain === "Zeitgeist") {
    if (token === "ZTG") {
      return <></>;
    } else {
      return <WithdrawButton />;
    }
  } else {
    return <DepositButton />;
  }
};

const CurrenciesTable = ({ address }: { address: string }) => {
  const { data: balances } = useCurrencyBalances(address);

  const tableData: TableData[] = balances
    .sort((a, b) => b.balance.minus(a.balance).toNumber())
    .map((balance) => ({
      asset: balance.symbol,
      chain: balance.chain,
      balance: balance.balance.div(ZTG).toFixed(3),
      button: selectButton(balance.chain, balance.symbol),
    }));

  return (
    <div>
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default CurrenciesTable;
