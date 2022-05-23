import Table, { TableColumn, TableData } from "components/ui/Table";
import React from "react";

const CasesTable = ({ data }: { data: TableData[] }) => {
  const columns: TableColumn[] = [
    {
      header: "Market",
      accessor: "market",
      type: "paragraph",
    },
    {
      header: "Status",
      accessor: "status",
      type: "text",
    },
    {
      header: "Jurors",
      accessor: "jurors",
      type: "number",
    },
    {
      header: "Ends",
      accessor: "ends",
      type: "text",
    },
    {
      header: "",
      accessor: "detail",
      type: "component",
      width: "50px",
    },
  ];

  return <Table columns={columns} data={data} noDataMessage={"No Cases"} />;
};

export default CasesTable;
