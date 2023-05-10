import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
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

const selectButton = (
  chain: string,
  sourceChain: string,
  token: string,
  foreignAssetId: number,
  balance: Decimal,
  nativeToken: string,
) => {
  if (chain === "Zeitgeist") {
    if (token.toUpperCase() === nativeToken.toUpperCase()) {
      return <></>;
    } else {
      return (
        //todo: need to find origin chain
        // pass assetId (foreign asset or ztg)
        <WithdrawButton
          toChain={sourceChain}
          tokenSymbol={token}
          balance={balance}
          foreignAssetId={foreignAssetId}
        />
      );
    }
  } else {
    return (
      <DepositButton
        sourceChain={chain}
        tokenSymbol={token}
        balance={balance}
      />
    );
  }
};

const CurrenciesTable = ({ address }: { address: string }) => {
  const { data: balances } = useCurrencyBalances(address);
  const { data: constants } = useChainConstants();

  const tableData: TableData[] = balances
    ?.sort((a, b) => b.balance.minus(a.balance).toNumber())
    .map((balance) => ({
      asset: balance.symbol,
      chain: balance.chain,
      balance: balance.balance.div(ZTG).toFixed(3),
      button: selectButton(
        balance.chain,
        balance.sourceChain,
        balance.symbol,
        balance.foreignAssetId,
        balance.balance,
        constants.tokenSymbol,
      ),
    }));

  return (
    <div>
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default CurrenciesTable;
