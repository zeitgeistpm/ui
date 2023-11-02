import { blockDate } from "@zeitgeistpm/utility/dist/time";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";
import Link from "next/link";

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
  {
    header: "",
    accessor: "actions",
    type: "component",
  },
];

export const CourtCasesTable = () => {
  const { data: cases } = useCourtCases();
  const time = useChainTime();
  console.log(cases);
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
      actions: (
        <>
          <Link href={`/court/${courtCase.id}`}>
            <button className="border-gray-300 hover:border-gray-400 text-xs border-2 rounded-full px-5 py-1.5 line-clamp-1 disabled:opacity-50 w-full">
              Details
            </button>
          </Link>
        </>
      ),
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
