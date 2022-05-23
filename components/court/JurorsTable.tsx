import Table, { TableColumn, TableData } from "components/ui/Table";
import React from "react";

const JurorsTable = ({ data }: { data: TableData[] }) => {
  const columns: TableColumn[] = [
    {
      header: "Address",
      accessor: "address",
      type: "address",
    },
    {
      header: "Status",
      accessor: "status",
      type: "text",
    },
  ];

  return <Table columns={columns} data={data} noDataMessage="No Jurors" />;
};

export default JurorsTable;
