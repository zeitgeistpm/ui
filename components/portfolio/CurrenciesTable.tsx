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
import EmptyPortfolio from "./EmptyPortfolio";

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
    type: "component",
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
    <div className="flex items-center gap-2.5">
      <div className="h-5 w-5 shrink-0 md:h-7 md:w-7">
        {imagePath && (
          <Image
            src={imagePath}
            alt={name}
            width={30}
            height={30}
            className="rounded-full"
          />
        )}
      </div>
      <div className="text-sm font-medium text-white/90 md:text-base">
        {name}
      </div>
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
          balance: (
            <span className="text-sm font-medium text-white/90">
              {amount.div(ZTG).toFixed(3)}
            </span>
          ),
          button: (
            <div className="flex w-full flex-col gap-2 whitespace-nowrap py-2">
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

  const hasBalances = tableData && tableData.length > 0;
  const isFetchedNoData = isFetched && !hasBalances;

  if (isFetchedNoData) {
    return (
      <EmptyPortfolio
        headerText="No Cross-Chain Balances"
        bodyText="You don't have any assets across chains yet. Deposit tokens to get started."
        buttonText="View Markets"
        buttonLink="/markets"
      />
    );
  }

  return (
    <div className="rounded-lg border border-ztg-primary-200/30 bg-white/10 shadow-lg backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2 border-b border-ztg-primary-200/20 p-4 pb-3">
        <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
        <h2 className="text-base font-semibold text-white/90">
          Cross-Chain Balances
        </h2>
      </div>
      <div className="px-4 pb-4">
        <Table data={tableData} columns={columns} showHighlight={false} />
      </div>
    </div>
  );
};

export default CurrenciesTable;
