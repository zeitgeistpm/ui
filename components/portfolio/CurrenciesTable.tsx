import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import {
  CurrencyBalance,
  currencyBalanceId,
  eqCurrencyBalanceId,
  useCurrencyBalances,
} from "lib/hooks/queries/useCurrencyBalances";
import DepositButton from "./DepositButton";
import WithdrawButton from "./WithdrawButton";
import Image from "next/image";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { ChainName, CHAIN_IMAGES } from "lib/constants/chains";
import TransferButton from "./TransferButton";
import { AssetId } from "@zeitgeistpm/sdk";
import { convertDecimals } from "lib/util/convert-decimals";
import { isWSX } from "lib/constants";
import { useMemo } from "react";
import { usePrevious } from "lib/hooks/usePrevious";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";

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
      <div className="h-[16px] w-[16px] md:h-[30px] md:w-[30px]">
        {imagePath && (
          <Image src={imagePath} alt={name} width={30} height={30} />
        )}
      </div>
      <div className="md:text-md text-xs">{name}</div>
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
  allBalanceDetails,
  existentialDeposit,
  assetDecimals,
}: {
  chain: ChainName;
  sourceChain: ChainName;
  token: string;
  foreignAssetId: number;
  balance: Decimal;
  nativeToken: string;
  allBalanceDetails: CurrencyBalance[];
  existentialDeposit: Decimal;
  assetDecimals: number;
}) => {
  const isNativeTokenBalance =
    token.toUpperCase() === nativeToken.toUpperCase();
  const transferAssetId: AssetId = isNativeTokenBalance
    ? { Ztg: null }
    : { ForeignAsset: foreignAssetId };
  const destinationAsset = allBalanceDetails.find(
    (detail) => detail.chain === sourceChain,
  );

  return (
    <>
      {chain === "Zeitgeist" && <TransferButton assetId={transferAssetId} />}
      {chain === "Zeitgeist" &&
        !isNativeTokenBalance &&
        sourceChain &&
        destinationAsset != null && (
          <WithdrawButton
            toChain={sourceChain}
            tokenSymbol={token}
            balance={balance}
            foreignAssetId={foreignAssetId}
            destinationExistentialDeposit={destinationAsset.existentialDeposit}
            destinationTokenBalance={destinationAsset.balance}
            assetDecimals={assetDecimals}
          />
        )}
      {chain !== "Zeitgeist" && (
        <DepositButton
          sourceChain={chain}
          tokenSymbol={token}
          balance={balance}
          sourceExistentialDeposit={existentialDeposit}
          assetDecimals={assetDecimals}
          sourceAssetId={destinationAsset?.sourceAssetId}
        />
      )}
    </>
  );
};

const CurrenciesTable = ({ address }: { address: string }) => {
  const { data: allBalances, isFetched } = useCurrencyBalances(address);
  const { data: constants } = useChainConstants();
  const wasFetched = usePrevious(isFetched);

  const balances = useMemo(() => {
    return isWSX
      ? allBalances?.filter((b) => b.symbol === "WSX")
      : allBalances?.filter((b) => b.symbol !== "WSX");
  }, [isWSX, allBalances]);

  // set sort order only once when data is first fetched
  // sort by balance descending, but keep sorting on subsequent renders/balance updates.
  const sorting = useMemo(() => {
    return balances
      ?.sort((a, b) => b.balance.minus(a.balance).toNumber())
      .map((b) => currencyBalanceId(b));
  }, [isFetched && !wasFetched]);

  const tableData: TableData[] | undefined = useMemo(() => {
    return sorting
      ?.map((id) => balances?.find((b) => eqCurrencyBalanceId(id, b)))
      .filter(isNotNull)
      .map((balance) => {
        const amount =
          balance.chain === "Zeitgeist"
            ? balance.balance
            : convertDecimals(balance.balance, balance.decimals, 10);
        return {
          chain: (
            <ImageAndText
              name={balance.chain}
              imagePath={CHAIN_IMAGES[balance.chain]}
            />
          ),
          asset: (
            <ImageAndText
              name={`${balance.symbol} (${balance.sourceChain})`}
              imagePath={lookupAssetImagePath(
                balance.foreignAssetId != null
                  ? {
                    ForeignAsset: balance.foreignAssetId,
                  }
                  : null,
              )}
            />
          ),
          balance: amount.div(ZTG).toFixed(3),
          button: (
            <div className="flex flex-col gap-2 w-full py-2 whitespace-nowrap">
              <MoveButton
                chain={balance.chain}
                sourceChain={balance.sourceChain}
                token={balance.symbol}
                foreignAssetId={balance.foreignAssetId ?? 0}
                balance={amount}
                nativeToken={constants?.tokenSymbol ?? ""}
                existentialDeposit={balance.existentialDeposit}
                allBalanceDetails={balances!}
                assetDecimals={balance.decimals}
              />
            </div>
          ),
        };
      });
  }, [constants, balances, sorting]);

  return (
    <div>
      <Table data={tableData} columns={columns} showHighlight={false} />
    </div>
  );
};

export default CurrenciesTable;
