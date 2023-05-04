import Table, { TableColumn, TableData } from "components/ui/Table";

import { NextPage } from "next";
import React from "react";
import InfoBoxes from "../components/ui/InfoBoxes";

const ActivityFeed: NextPage = () => {
  const tableData: TableData[] = [
    {
      address: "5FRzouqt2BtMFezeXhgvPV2HghHLXdzqQLoZDx5oNtvQ3w6D",
      market: {
        label: "Some market",
        url: "https://picsum.photos/200",
      },
      action: "Deposit",
      value: {
        value: 3535353,
        usdValue: 23423,
      },
      time: "1 hours",
    },
    {
      address: "5FRzouqt2BtMFezeXhgvPV2HghHLXdzqQLoZDx5oNtvQ3w6D",
      market: {
        label: "Some market",
        url: "https://picsum.photos/200",
      },
      action: "Deposit",
      value: {
        value: 3535353,
        usdValue: 23423,
      },
      time: "1 hours",
    },
    {
      address: "5FRzouqt2BtMFezeXhgvPV2HghHLXdzqQLoZDx5oNtvQ3w6D",
      market: {
        label: "Some market",
        url: "https://picsum.photos/200",
      },
      action: "Deposit",
      value: {
        value: 3535353,
        usdValue: 23423,
      },
      time: "1 hours",
    },
  ];

  const columns: TableColumn[] = [
    {
      header: "Account",
      accessor: "address",
      type: "address",
    },
    {
      header: "Market ID",
      accessor: "market",
      type: "market",
    },
    {
      header: "Action",
      accessor: "action",
      type: "text",
    },
    {
      header: "Value (ZTG)",
      accessor: "value",
      type: "currency",
    },
    {
      header: "Time",
      accessor: "time",
      type: "text",
      onSort: () => {},
    },
  ];

  return (
    <div>
      <InfoBoxes />
      <h2 className="text-ztg-18-150 font-medium mb-ztg-23">Activity Feed</h2>
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default ActivityFeed;
