import { isRpcSdk } from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import Link from "next/link";
import EmptyPortfolio from "./EmptyPortfolio";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Value",
    accessor: "value",
    type: "currency",
  },
  {
    header: "Fees available",
    accessor: "fees",
    type: "text",
  },
  {
    header: "",
    accessor: "buttons",
    type: "component",
    width: "330px",
  },
];

type AccountPoolsTableProps = {
  pools: any[] | null | undefined;
  isLoading: boolean;
};

const AccountPoolsTable = ({ pools, isLoading }: AccountPoolsTableProps) => {
  const tableData: TableData[] | undefined = pools?.map((pool) => {
    const isMultiMarket =
      pool.isMultiMarket && pool.marketIds && pool.marketIds.length > 1;
    const href = isMultiMarket
      ? `/multi-market/${pool.poolId}`
      : `/markets/${pool.marketId}`;

    return {
      question: (
        <Link
          href={href}
          className="line-clamp-1 text-sm font-medium text-white transition-colors hover:text-ztg-green-400"
        >
          {pool.question}
        </Link>
      ),
      value: {
        value: pool.addressValue?.toNumber(),
        usdValue: pool.addressUsdValue?.toNumber(),
      },
      fees: new Decimal(pool.account?.fees ?? 0).div(ZTG).toFixed(3),
      buttons: (
        <PoolButtons
          poolId={pool.poolId}
          marketId={pool.marketId}
          isMultiMarket={isMultiMarket}
        />
      ),
    };
  });

  return (
    <div>
      {pools?.length === 0 && isLoading === false ? (
        <EmptyPortfolio
          headerText="You don't have any liquidity"
          bodyText="View liquidity pools to find places to provide liquidity"
          buttonText="View Pools"
          buttonLink="/liquidity"
        />
      ) : (
        <div className="rounded-lg border border-ztg-primary-200/30 bg-white/10 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 border-b border-ztg-primary-200/20 p-4 pb-3">
            <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
            <h2 className="text-base font-semibold text-white">
              Liquidity Positions
            </h2>
          </div>
          <div className="px-4 pb-4">
            <Table columns={columns} data={tableData} showHighlight={false} />
          </div>
        </div>
      )}
    </div>
  );
};

const PoolButtons = ({
  poolId,
  marketId,
  isMultiMarket,
}: {
  poolId: number;
  marketId: number | null;
  isMultiMarket: boolean;
}) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();

  // For multi-market pools, use poolId; for single market pools, use marketId
  const withdrawFeesId = isMultiMarket ? poolId : marketId;
  const href = isMultiMarket
    ? `/multi-market/${poolId}`
    : `/markets/${marketId}`;

  const {
    isLoading: isCollectingFees,
    isSuccess,
    send: withdrawFees,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || withdrawFeesId === null) return;
      return sdk.api.tx.neoSwaps.withdrawFees(withdrawFeesId);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(`Redeemed Fees`, {
          type: "Success",
        });
      },
    },
  );
  return (
    <div className="flex justify-end gap-2">
      <Link href={href}>
        <SecondaryButton className="w-full max-w-[150px]" onClick={() => {}}>
          Manage
        </SecondaryButton>
      </Link>
      <SecondaryButton
        className="w-full max-w-[150px]"
        disabled={isCollectingFees || isSuccess}
        onClick={() => {
          withdrawFees();
        }}
      >
        Collect fees
      </SecondaryButton>
    </div>
  );
};

export default AccountPoolsTable;
