import { blockDate } from "@zeitgeistpm/utility/dist/time";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCases } from "lib/hooks/queries/court/useCases";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";

const columns: TableColumn[] = [
  {
    header: "#",
    accessor: "id",
    type: "text",
  },
  {
    header: "Case",
    accessor: "case",
    type: "component",
  },
  {
    header: "Status",
    accessor: "status",
    type: "text",
  },
  {
    header: "Ends",
    accessor: "ends",
    type: "text",
  },
];

export const CourtCasesTable = () => {
  const { data: cases } = useCourtCases();
  const time = useChainTime();

  const tableData: TableData[] | undefined = cases?.map((courtCase) => {
    return {
      id: `# ${courtCase.id}`,
      case: <CaseNameForCaseId id={courtCase.id} />,
      status: courtCase.case.status.type,
      ends:
        time &&
        new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(blockDate(time, courtCase.case.roundEnds.appeal.toNumber())),
    };
  });

  return (
    <div>
      <Table columns={columns} data={tableData} />
    </div>
  );
};

const CaseNameForCaseId = (props: { id: number }) => {
  const { data: marketId } = useCaseMarketId(props.id);
  const { data: market } = useMarket({ marketId: marketId! });
  return <div>{market?.question}</div>;
};
