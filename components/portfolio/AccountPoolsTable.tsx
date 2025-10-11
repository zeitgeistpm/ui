import { isRpcSdk } from "@zeitgeistpm/sdk";
import LiquidityModalAmm2 from "components/liquidity/LiquidityModalAmm2";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import Link from "next/link";
import { useState } from "react";
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

const AccountPoolsTable = ({ address }: { address: string }) => {
  const { data: pools, isLoading } = useAccountAmm2Pool(address);

  const tableData: TableData[] | undefined = pools?.map((pool) => {
    const isMultiMarket =
      pool.isMultiMarket && pool.marketIds && pool.marketIds.length > 1;
    const href = isMultiMarket
      ? `/multi-market/${pool.poolId}`
      : `/markets/${pool.marketId}`;

    return {
      question: (
        <Link href={href} className="line-clamp-1 text-[14px]">
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
        <Table columns={columns} data={tableData} showHighlight={false} />
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
