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
    type: "text",
  },
  {
    header: "Fees collected",
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

const PoolButtons = ({ marketId }: { marketId: number }) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const [showLiqudityModal, setShowLiqudityModal] = useState(false);

  const {
    isLoading: isCollectingFees,
    isSuccess,
    send: withdrawFees,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;
      return sdk.api.tx.neoSwaps.withdrawFees(marketId);
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
      <LiquidityModalAmm2
        marketId={marketId}
        open={showLiqudityModal}
        onClose={() => setShowLiqudityModal(false)}
      />
      <SecondaryButton
        className="w-full max-w-[150px]"
        onClick={() => {
          setShowLiqudityModal(true);
        }}
      >
        Manage Liquidity
      </SecondaryButton>
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

const AccountPoolsTable = ({ address }: { address: string }) => {
  const { data: pools, isLoading } = useAccountAmm2Pool(address);

  const tableData: TableData[] =
    pools?.map((pool) => {
      return {
        question: (
          <Link
            href={`/markets/${pool.marketId}`}
            className="line-clamp-1 text-[14px]"
          >
            {pool.question}
          </Link>
        ),
        value: pool.value.div(ZTG).toFixed(3),
        fees: new Decimal(pool.liquiditySharesManager.fees).div(ZTG).toFixed(3),
        buttons: <PoolButtons marketId={pool.marketId} />,
      };
    }) ?? [];

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

export default AccountPoolsTable;
