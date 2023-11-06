import Avatar from "components/ui/Avatar";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useSelectedDraws } from "lib/hooks/queries/court/useSelectedDraws";
import { shortenAddress } from "lib/util";
import { useMemo } from "react";

export type SelectedDrawsTableProps = {
  selectedDraws?: ZrmlCourtDraw[];
  market: FullMarketFragment;
};

const columns: TableColumn[] = [
  {
    header: "Juror",
    accessor: "juror",
    type: "component",
  },
  {
    header: "Status",
    accessor: "status",
    type: "component",
  },
  {
    header: "Voted Outcome",
    accessor: "vote",
    type: "component",
  },
];

export const SelectedDrawsTable: React.FC<SelectedDrawsTableProps> = ({
  selectedDraws,
  market,
}) => {
  const data: TableData[] | undefined = useMemo(() => {
    return selectedDraws?.map((draw) => {
      const status = draw.vote.type;
      return {
        juror: (
          <div className="flex items-center gap-3">
            <Avatar address={draw.courtParticipant.toString()} size={18} />
            <div className="text-sm">
              {shortenAddress(draw.courtParticipant.toString())}
            </div>
          </div>
        ),
        status: <div>{status}</div>,
        vote: (
          <div
            className={`
            ${status === "Delegated" && "text-gray-400 italic"}
            ${status === "Drawn" && "text-blue-400"}
            ${status === "Denounced" && "text-red-400"}
          `}
          >
            {draw.vote.isDrawn
              ? "Waiting for vote"
              : draw.vote.isSecret
              ? "*****"
              : draw.vote.isDelegated
              ? "Delegated Vote"
              : draw.vote.isRevealed
              ? "Voted"
              : "Unknown"}
          </div>
        ),
      };
    });
  }, [selectedDraws]);

  return (
    <div>
      <Table columns={columns} data={data} />
    </div>
  );
};
