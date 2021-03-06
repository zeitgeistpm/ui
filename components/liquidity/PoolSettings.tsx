import { observer } from "mobx-react";
import React, { FC } from "react";
import { useStore } from "lib/stores/Store";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { ZTG_BLUE_COLOR } from "lib/constants";
import { motion } from "framer-motion";

export interface PoolAssetRowData {
  assetColor: string;
  asset: string;
  weight: string;
  percent: string;
  amount: string;
  price: string;
  value: string;
}

export const poolRowDataFromOutcomes = (
  outcomes: MultipleOutcomeEntry[],
  tokenSymbol: string,
  initialAmount: string = "100"
): PoolAssetRowData[] => {
  const amountNum = +initialAmount;

  const numOutcomes = outcomes.length;

  const ratio = 1 / numOutcomes;
  const weight = ratio * 100;

  return [
    ...outcomes.map((outcome) => {
      return {
        assetColor: outcome.color,
        asset: outcome.ticker,
        weight: weight.toFixed(2),
        percent: `${weight.toFixed(2)}%`,
        amount: "100",
        price: `${ratio.toFixed(4)}`,
        value: `${(amountNum * ratio).toFixed(4)}`,
      };
    }),
    {
      assetColor: ZTG_BLUE_COLOR,
      asset: tokenSymbol,
      weight: "100",
      amount: "100",
      percent: "100.00",
      price: "1",
      value: "100",
    },
  ];
};

const PoolSettings: FC<{
  data: PoolAssetRowData[];
  onChange: (data: PoolAssetRowData[]) => void;
}> = observer(({ data, onChange }) => {
  const store = useStore();
  const { wallets } = store;

  const changeOutcomeRow = (amount: string) => {
    onChange(
      data.map((row) => ({
        ...row,
        amount,
      }))
    );
  };

  const tableData: TableData[] = data.map((d) => {
    return {
      token: {
        color: d.assetColor,
        label: d.asset,
      },

      percent: d.weight,
      balance: {
        value: wallets.activeBalance.toNumber(),
        usdValue: 0,
      },
      weights: d.weight,
      price: {
        value: d.price,
        usdValue: 0,
      },
      total: {
        value: d.value,
        usdValue: 0,
      },
      amount: {
        value: d.amount,
        min: "100",
        max: "150",
        onChange: (amount: string) => {
          changeOutcomeRow(amount);
        },
      },
    };
  });

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
    },
    {
      header: "My Balance",
      accessor: "balance",
      type: "currency",
    },
    {
      header: "Weights",
      accessor: "weights",
      type: "number",
    },
    {
      header: "Percent",
      accessor: "percent",
      type: "percentage",
    },

    { header: "Amount", accessor: "amount", type: "amountInput", width: "17%" },
    {
      header: "Price",
      accessor: "price",
      type: "currency",
    },
    {
      header: "Total Value",
      accessor: "total",
      type: "currency",
    },
  ];

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <Table data={tableData} columns={columns} />
    </motion.div>
  );
});

export default PoolSettings;
