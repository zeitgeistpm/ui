import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useCurrencyBalances } from "lib/hooks/queries/useCurrencyBalances";
import DepositButton from "./DepositButton";
import WithdrawButton from "./WithdrawButton";
import Image from "next/image";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { ChainName, CHAIN_IMAGES } from "lib/constants/chains";
import TransferButton from "./TransferButton";
import { AssetId } from "@zeitgeistpm/sdk-next";

const columns: TableColumn[] = [
  {
    header: "Asset",
    accessor: "asset",
    type: "component",
  },
  {
    header: "Chain",
    accessor: "chain",
    type: "component",
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

const ImageAndText = ({
  name,
  imagePath,
}: {
  name: string;
  imagePath: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      {imagePath && <Image src={imagePath} alt={name} width={30} height={30} />}
      <div>{name}</div>
    </div>
  );
};

const MoveButton = ({
  chain,
  sourceChain,
  token,
  foreignAssetId,
  balance,
  nativeToken,
}: {
  chain: ChainName;
  sourceChain: ChainName;
  token: string;
  foreignAssetId: number;
  balance: Decimal;
  nativeToken: string;
}) => {
  if (chain === "Zeitgeist") {
    const isNativeTokenBalance =
      token.toUpperCase() === nativeToken.toUpperCase();
    if (isNativeTokenBalance || sourceChain == null) {
      const transferAssetId: AssetId = isNativeTokenBalance
        ? { Ztg: null }
        : { ForeignAsset: foreignAssetId };
      return <TransferButton assetId={transferAssetId} />;
    } else {
      return (
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
      chain: (
        <ImageAndText
          name={balance.chain}
          imagePath={CHAIN_IMAGES[balance.chain]}
        />
      ),
      asset: (
        <ImageAndText
          name={balance.symbol}
          imagePath={lookupAssetImagePath(balance.foreignAssetId)}
        />
      ),
      balance: balance.balance.div(ZTG).toFixed(3),
      button: (
        <MoveButton
          chain={balance.chain}
          sourceChain={balance.sourceChain}
          token={balance.symbol}
          foreignAssetId={balance.foreignAssetId}
          balance={balance.balance}
          nativeToken={constants.tokenSymbol}
        />
      ),
    }));

  return (
    <div>
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default CurrenciesTable;
