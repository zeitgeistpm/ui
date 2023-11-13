import { blockDate } from "@zeitgeistpm/utility/dist/time";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";
import {
  ZrmlCourtCourtInfo,
  ZrmlCourtCourtStatus,
} from "@polkadot/types/lookup";
import Link from "next/link";
import InfoPopover from "components/ui/InfoPopover";
import { CourtStage, getCourtStage } from "lib/state/court/get-stage";
import { CourtCaseInfo } from "lib/hooks/queries/court/useCourtCase";
import { useMemo } from "react";
import Skeleton from "components/ui/Skeleton";
import { useVotDrawsForCase } from "lib/hooks/queries/court/useVoteDraws";
import { useWallet } from "lib/state/wallet";
import { AiOutlineEye } from "react-icons/ai";
import { LuVote } from "react-icons/lu";

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
    type: "component",
  },
  {
    header: "Voting Ends",
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

  cases?.sort((a, b) => {
    if (b.case.status.type === "Reassigned") return -1;
    return a.case.roundEnds.vote.toNumber() > b.case.roundEnds.vote.toNumber()
      ? 1
      : 0;
  });

  const tableData: TableData[] | undefined = cases?.map((courtCase) => {
    return {
      id: `${courtCase.id}`,
      case: <CaseNameForCaseId id={courtCase.id} />,
      status: <CaseStatus courtCase={courtCase} />,
      ends:
        time &&
        new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(blockDate(time, courtCase.case.roundEnds.vote.toNumber())),
      actions: <CaseActions caseId={courtCase.id} courtCase={courtCase.case} />,
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
  return (
    <>
      {market ? (
        <div className="text-sm">{market?.question}</div>
      ) : (
        <Skeleton />
      )}
    </>
  );
};

const CaseStatus = ({ courtCase }: { courtCase: CourtCaseInfo }) => {
  const { data: marketId } = useCaseMarketId(courtCase.id);
  const { data: market } = useMarket({ marketId: marketId! });
  const chainTime = useChainTime();

  const stage = useMemo(() => {
    if (market && chainTime) {
      return getCourtStage(chainTime, market, courtCase.case);
    }
  }, [chainTime, market]);

  return (
    <div className="flex items-center gap-2">
      {stage ? (
        <>
          <div className={`${caseStatusCopy[stage.type].color}`}>
            {caseStatusCopy[stage.type].title}
          </div>
          <InfoPopover position="top">
            {caseStatusCopy[stage.type].description}
          </InfoPopover>
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};

const CaseActions = ({
  caseId,
  courtCase,
}: {
  caseId: number;
  courtCase: ZrmlCourtCourtInfo;
}) => {
  const wallet = useWallet();

  const { data: marketId } = useCaseMarketId(caseId);
  const { data: market } = useMarket({ marketId: marketId! });
  const chainTime = useChainTime();

  const stage = useMemo(() => {
    if (market && chainTime) {
      return getCourtStage(chainTime, market, courtCase);
    }
  }, [chainTime, market]);

  const { data: draws } = useVotDrawsForCase(caseId);

  const connectedParticipantDraw = draws?.find(
    (draw) => draw.courtParticipant.toString() === wallet.realAddress,
  );

  const canVote = useMemo(() => {
    return stage?.type === "vote" && connectedParticipantDraw?.vote.isDrawn;
  }, [stage, connectedParticipantDraw]);

  const canReveal = useMemo(() => {
    return (
      stage?.type === "aggregation" && connectedParticipantDraw?.vote.isSecret
    );
  }, [stage, connectedParticipantDraw]);

  return (
    <div className="flex w-full items-center justify-center">
      <Link href={`/court/${caseId}`}>
        <button
          className={`
          center gap-3 border-gray-300 hover:border-gray-400 text-xs border-2 rounded-full px-5 py-1.5 line-clamp-1 disabled:opacity-50 self-end min-w-[220px]
            ${canVote && "bg-blue-400 text-white border-blue-400 animate-pulse"}
            ${
              canReveal &&
              "bg-purple-500 text-white border-purple-500 animate-pulse"
            }
          `}
        >
          {canVote ? (
            <>
              <LuVote size={18} /> <span>Vote</span>
            </>
          ) : canReveal ? (
            <>
              <AiOutlineEye size={18} /> <span>Reveal Vote</span>
            </>
          ) : (
            "View Case"
          )}
        </button>
      </Link>
    </div>
  );
};

const caseStatusCopy: Record<
  CourtStage["type"],
  {
    title: string;
    description: string;
    color: string;
  }
> = {
  "pre-vote": {
    title: "Pre-Vote",
    description: "Waiting for the vote period to start.",
    color: "text-gray-400",
  },
  vote: {
    title: "Vote",
    description: "Case is now open for voting by jurors.",
    color: "text-blue-400",
  },
  aggregation: {
    title: "Aggregation",
    description: "Votes can now be revealed by jurors.",
    color: "text-purple-400",
  },
  appeal: {
    title: "Appeal",
    description: "Jurors can now appeal the voted outcome.",
    color: "text-orange-400",
  },
  reassigned: {
    title: "Reassigned",
    description: "Case has been reassigned and winners paid out.",
    color: "text-gray-400",
  },
  closed: {
    title: "Closed",
    description: "Case has been closed. Waiting to be reassigned.",
    color: "text-gray-400",
  },
};
