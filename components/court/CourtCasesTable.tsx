import { ZrmlCourtCourtInfo } from "@polkadot/types/lookup";
import { isInfinity } from "@zeitgeistpm/utility/dist/infinity";
import { blockDate } from "@zeitgeistpm/utility/dist/time";
import InfoPopover from "components/ui/InfoPopover";
import Skeleton from "components/ui/Skeleton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { CourtCaseInfo } from "lib/hooks/queries/court/useCourtCase";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useCourtVoteDrawsForCase } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";
import { CourtStage, getCourtStage } from "lib/state/court/get-stage";
import { useWallet } from "lib/state/wallet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { LuVote } from "react-icons/lu";
import { courtStageCopy } from "./CourtStageTimer";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { useCourtBacklog } from "lib/state/court/useCourtBacklog";
import { MdOutlinePendingActions } from "react-icons/md";
import { FaLongArrowAltDown } from "react-icons/fa";
import { BsFillTriangleFill } from "react-icons/bs";
import { motion } from "framer-motion";
import { TAILWIND } from "lib/constants";

export const CourtCasesTable = () => {
  const { data: cases } = useCourtCases();
  const time = useChainTime();
  const wallet = useWallet();

  const courtBacklog = useCourtBacklog(wallet.realAddress);

  const sortedCase = useMemo(() => {
    return cases?.sort((a, b) => {
      if (
        b.case.status.type === "Closed" &&
        a.case.status.type === "Reassigned"
      )
        return 1;

      if (b.case.status.type === "Closed") return -1;
      if (b.case.status.type === "Reassigned") return -1;

      const aBacklogItem = courtBacklog.findIndex(
        (item) => item.caseId === a.id,
      );
      const bBacklogItem = courtBacklog.findIndex(
        (item) => item.caseId === b.id,
      );

      if (aBacklogItem !== -1 && bBacklogItem !== -1) {
        return aBacklogItem > bBacklogItem ? -1 : 1;
      }

      if (aBacklogItem !== -1 && bBacklogItem === -1) return -1;

      return a.case.roundEnds.vote.toNumber() > b.case.roundEnds.vote.toNumber()
        ? 1
        : 0;
    });
  }, [cases, courtBacklog]);

  const actionableCount = courtBacklog.filter((item) => item.actionable).length;

  const backlogNotificationTransition = {
    duration: 1,
    ease: "easeInOut",
    times: [0, 0.2, 0.5, 0.8, 1],
    repeat: 5,
  };

  const columns: TableColumn[] = [
    {
      header: "#",
      accessor: "id",
      type: "text",
      hideMobile: true,
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
      header: "Aggregation Ends",
      accessor: "ends",
      type: "text",
      hideMobile: true,
    },
    {
      header: (
        <div className="center relative flex-1">
          {actionableCount > 0 ? (
            <div className="center absolute -top-6 translate-y-[-50%]">
              <motion.div
                animate={{
                  translateY: ["0%", "-20%", "0%"],
                  backgroundColor: [
                    TAILWIND.theme.colors["slate"][200],
                    TAILWIND.theme.colors["orange"][400],
                    TAILWIND.theme.colors["slate"][200],
                  ],
                  color: [
                    TAILWIND.theme.colors["gray"][500],
                    TAILWIND.theme.colors["orange"][800],
                    TAILWIND.theme.colors["gray"][500],
                  ],
                }}
                transition={backlogNotificationTransition}
                className={`center relative z-20 flex gap-2 rounded-lg px-3 py-3 text-gray-500`}
              >
                <div className="relative z-20">
                  You are required to take action
                </div>
                <motion.div
                  animate={{
                    backgroundColor: [
                      TAILWIND.theme.colors["orange"][400],
                      TAILWIND.theme.colors["orange"][300],
                      TAILWIND.theme.colors["orange"][400],
                    ],
                    color: [
                      TAILWIND.theme.colors["orange"][800],
                      TAILWIND.theme.colors["orange"][700],
                      TAILWIND.theme.colors["orange"][800],
                    ],
                  }}
                  transition={backlogNotificationTransition}
                  className="center gap-1 rounded-md  p-1 "
                >
                  <div>{actionableCount}</div>
                  <MdOutlinePendingActions size={16} />
                </motion.div>
              </motion.div>
              <div className="center absolute inset-0 bottom-0 left-0 z-10 w-full translate-y-[20%] text-orange-400">
                <motion.div
                  animate={{
                    translateY: ["40%", "-15%", "40%"],
                    color: [
                      TAILWIND.theme.colors["slate"][200],
                      TAILWIND.theme.colors["orange"][400],
                      TAILWIND.theme.colors["slate"][200],
                    ],
                  }}
                  transition={backlogNotificationTransition}
                >
                  <BsFillTriangleFill
                    className="rotate-180"
                    size={24}
                    style={{
                      transform: "scale(1.5, 1) rotate(180deg)",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      ),
      accessor: "actions",
      type: "component",
    },
  ];

  const tableData: TableData[] | undefined = sortedCase?.map((courtCase) => {
    return {
      id: `${courtCase.id}`,
      case: <CaseNameForCaseId id={courtCase.id} />,
      status: <CaseStatus courtCase={courtCase} />,
      ends:
        time &&
        new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(
          blockDate(time, courtCase.case.roundEnds.aggregation.toNumber()),
        ),
      actions: <CaseActions caseId={courtCase.id} courtCase={courtCase.case} />,
    };
  });

  return (
    <div className="relative">
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
        <div className="break-words text-sm">{market?.question}</div>
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

  const percentage =
    stage && isInfinity(stage.remainingBlocks)
      ? 100
      : stage
        ? ((stage.totalTime - stage.remainingBlocks) / stage.totalTime) * 100
        : 0;

  return (
    <div className="">
      {stage ? (
        <>
          <div className="mb-1 flex items-center gap-2">
            <div className={`${caseStatusCopy[stage.type].color}`}>
              {caseStatusCopy[stage.type].title}
            </div>
            <InfoPopover position="top">
              {caseStatusCopy[stage.type].description}
            </InfoPopover>
          </div>

          <div className="w-full">
            <div className="h-1 w-full rounded-lg bg-gray-100">
              <div
                className={`h-full rounded-lg transition-all ${
                  courtStageCopy[stage.type].color
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
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

  const { data: draws } = useCourtVoteDrawsForCase(caseId);

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
          center relative line-clamp-1 gap-3 self-end overflow-visible rounded-full border-2 border-gray-300 px-5 py-1.5 text-xs hover:border-gray-400 disabled:opacity-50 md:min-w-[220px]
            ${canVote && "border-ztg-blue bg-ztg-blue text-white"}
            ${canReveal && "border-purple-500 bg-purple-500 text-white"}
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
            <>
              <span className="hidden md:inline">View Case</span>
              <span className="inline md:hidden">View</span>
            </>
          )}
          {(canVote || canReveal) && (
            <div className="absolute right-1 top-0 h-2 w-2 translate-y-[-50%] ">
              <div className="h-full w-full animate-pulse-scale rounded-full bg-orange-500" />
            </div>
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
    description: "The case can now be appealed.",
    color: "text-orange-400",
  },
  reassigned: {
    title: "Settled",
    description:
      "The case is settled and stakes were reassigned by losers paying the winners.",
    color: "text-gray-400",
  },
  closed: {
    title: "Closed",
    description: "Case has been closed. Waiting to be reassigned.",
    color: "text-gray-400",
  },
};
