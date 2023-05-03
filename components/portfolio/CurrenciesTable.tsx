import Table, { TableColumn } from "components/ui/Table";
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

const CurrenciesTable = ({ address }: { address: string }) => {
  useCurrencyBalances(address);

  const tableData = [
    {
      asset: "ZTG",
      chain: "Zeitgeist",
      balance: 100,
      button: <WithdrawButton />,
    },
    {
      asset: "DOT",
      chain: "Zeitgeist",
      balance: 100,
      button: <WithdrawButton />,
    },
    {
      asset: "DOT",
      chain: "Polkadot",
      balance: 100,
      button: <DepositButton />,
    },
  ];

  return (
    <div>
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default CurrenciesTable;
