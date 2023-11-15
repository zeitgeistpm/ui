import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOForeignAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import CourtStageTimer from "components/court/CourtStageTimer";
import { PiBooks } from "react-icons/pi";
import { CourtVoteForm } from "components/court/CourtVoteForm";
import { CourtVoteRevealForm } from "components/court/CourtVoteRevealForm";
import { SelectedDrawsTable } from "components/court/SelectedDrawsTable";
import { AddressDetails } from "components/markets/MarketAddresses";
import { HeaderStat } from "components/markets/MarketHeader";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useVotDrawsForCase } from "lib/hooks/queries/court/useVoteDraws";

import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";
import { getCourtStage } from "lib/state/court/get-stage";
import { useWallet } from "lib/state/wallet";
import { isMarketCategoricalOutcome } from "lib/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import NotFoundPage from "pages/404";
import { useMemo } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { LuVote } from "react-icons/lu";

const QuillViewer = dynamic(() => import("../../components/ui/QuillViewer"), {
  ssr: false,
});

const CasePage: NextPage = () => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }

  const router = useRouter();

  const wallet = useWallet();
  const time = useChainTime();

  const { caseid } = router.query;
  const caseId = Number(caseid);

  const { data: courtCase } = useCourtCase(caseId);
  const { data: selectedDraws } = useVotDrawsForCase(caseId);

  const { data: marketId } = useCaseMarketId(caseId);
  const { data: market } = useMarket(
    marketId != null ? { marketId } : undefined,
  );

  const baseAsset = parseAssetId(market?.baseAsset).unwrapOr(undefined);
  const { data: metadata } = useAssetMetadata(baseAsset);
  const token = metadata?.symbol;

  const reportedOutcome =
    market?.report?.outcome != null &&
    isMarketCategoricalOutcome(market.report?.outcome)
      ? market.report?.outcome.categorical
      : undefined;

  const imagePath = IOForeignAssetId.is(baseAsset)
    ? lookupAssetImagePath(baseAsset.ForeignAsset)
    : IOBaseAssetId.is(baseAsset)
      ? lookupAssetImagePath(baseAsset.Ztg)
      : "";

  const connectedParticipantDraw = selectedDraws?.find(
    (draw) => draw.courtParticipant.toString() === wallet.realAddress,
  );

  const isDrawnJuror = connectedParticipantDraw?.vote.isDrawn;
  const hasSecretVote = connectedParticipantDraw?.vote.isSecret;
  const hasRevealedVote = connectedParticipantDraw?.vote.isRevealed;

  const stage = useMemo(() => {
    if (time && market && courtCase) {
      return getCourtStage(time, market, courtCase);
    }
  }, [time, market, courtCase]);

  if (!market) {
    return <>Loading</>;
  }

  return (
    <div className="relative mt-6 flex flex-auto gap-12">
      <main className="flex-1">
        <section className="mb-6">
          <h2 className="text-base font-normal">Case — #{caseId}</h2>
          <h1 className="text-[32px] font-extrabold">{market?.question}</h1>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <HeaderStat label="Started">
              {new Intl.DateTimeFormat("default", {
                dateStyle: "medium",
              }).format(market.period.start)}
            </HeaderStat>
            <HeaderStat label="Ended">
              {new Intl.DateTimeFormat("default", {
                dateStyle: "medium",
              }).format(market.period.end)}
            </HeaderStat>
            <HeaderStat label="Reported Outcome">
              {reportedOutcome !== undefined
                ? market.categories?.[reportedOutcome].name
                : "-"}
            </HeaderStat>
          </div>

          <Link
            className="mb-8 inline-block text-sm font-medium text-blue-600"
            href={`/markets/${marketId}`}
          >
            View Market
          </Link>

          <div className="relative mb-6 flex items-center gap-3">
            <AddressDetails title="Creator" address={market.creator} />

            <div className="group relative">
              <Image
                width={24}
                height={24}
                src={imagePath}
                alt="Currency token logo"
                className="rounded-full"
              />
              <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity  group-hover:opacity-100">
                <div className="rounded-lg bg-blue-100 px-2 py-1 text-sm">
                  <span className="text-gray-500">Currency: </span>
                  <span className="font-semibold">{token}</span>
                </div>
              </div>
            </div>

            <div className="group relative">
              <Image
                width={26}
                height={26}
                src="/icons/verified-icon.svg"
                alt="verified checkmark"
              />
              <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-lg bg-green-lighter px-2 py-1 text-sm">
                  Verified Market
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 md:max-w-[900px]">
            <CourtStageTimer stage={stage} />
          </div>

          {market.description && (
            <div className="mb-8">
              <QuillViewer value={market.description} />
            </div>
          )}

          {stage?.type !== "reassigned" && (
            <div>
              <h3 className="mb-3">Votes</h3>
              <Votes
                market={market}
                selectedDraws={selectedDraws}
                isRevealed={
                  stage?.type === "aggregation" ||
                  stage?.type === "closed" ||
                  stage?.type === "appeal"
                    ? true
                    : false
                }
              />
            </div>
          )}
        </section>

        {stage?.type !== "reassigned" && (
          <section>
            <h3 className="mb-3">Jurors</h3>
            <SelectedDrawsTable market={market} selectedDraws={selectedDraws} />
          </section>
        )}
      </main>

      <div className="hidden md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
        <div className="sticky top-28">
          {stage?.type === "vote" && (
            <>
              {isDrawnJuror && (
                <>
                  <CourtVoteForm market={market} caseId={caseId} />
                </>
              )}

              {hasSecretVote && (
                <div className="overflow-hidden rounded-xl px-6 py-6 shadow-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-blue-500">
                      <LuVote size={64} />
                    </div>
                    <h3 className="text mb-2 text-blue-500">You have voted</h3>
                    <p className="text-center text-sm text-gray-500">
                      Your vote is secret during voting, but when court goes
                      into aggregation you can reveal your vote to the public by
                      coming back to this page.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {stage?.type === "aggregation" && (
            <>
              {hasSecretVote && (
                <CourtVoteRevealForm
                  market={market}
                  caseId={caseId}
                  secretVote={
                    connectedParticipantDraw?.vote.isSecret
                      ? connectedParticipantDraw?.vote.asSecret
                      : undefined
                  }
                />
              )}

              {hasRevealedVote && (
                <div className="overflow-hidden rounded-xl px-6 py-6 shadow-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div>
                      <AiOutlineEye size={64} />
                    </div>
                    <h3 className="text mb-2">Your vote is revealed</h3>
                    <h3 className="text mb-2 text-base text-purple-500">
                      {
                        market?.categories?.[
                          connectedParticipantDraw?.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber()
                        ].ticker
                      }
                    </h3>
                    <p className="text-center text-sm text-gray-500">
                      Your vote has been revealed to the other jurors and the
                      public and has been taken into account.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="group relative mt-4 overflow-hidden rounded-xl px-6 py-6 shadow-lg">
            <div className="absolute left-0 top-0 z-10 h-full w-full transition-all group-hover:blur-[2px]">
              <Image
                title="Wizard draped in purple robes holding a flaming crypto key."
                alt="Wizard draped in purple robes holding a flaming crypto key."
                src={"/court_gnomes.webp"}
                layout="fill"
                objectFit="cover"
                style={{
                  objectPosition: "50% 50%",
                }}
              />
            </div>
            <div className="relative z-20 text-white">
              <div className="mb-2">
                <h3 className="text-white drop-shadow-lg">
                  Decentralized Court
                </h3>
              </div>
              <p className="mb-6 drop-shadow-lg">
                Zeitgeist implements a decentralized court to handle disputes
                that may arise in the resolution of prediction markets outcomes.
              </p>
              <div className="flex items-center justify-end">
                <Link
                  href="https://docs.zeitgeist.pm/docs/learn/court"
                  target="_blank"
                  className="center relative z-20 cursor-pointer gap-2 rounded-md bg-purple-400 bg-opacity-90 px-6 py-2 text-white"
                >
                  <PiBooks />
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Votes = ({
  market,
  selectedDraws,
  isRevealed,
}: {
  market: FullMarketFragment;
  selectedDraws: ZrmlCourtDraw[] | undefined;
  isRevealed: boolean;
}) => {
  const votes = market.categories
    ?.map((category, index) => {
      const count =
        selectedDraws?.filter(
          (draw) =>
            draw.vote.isRevealed &&
            draw.vote.asRevealed.voteItem.isOutcome &&
            draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber() ===
              index,
        )?.length ?? 0;

      return { category, count };
    })
    .sort((a, b) => b.count - a.count);

  const showLeaderIndicator = votes?.some((vote) => vote.count > 0);

  return (
    <div
      className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
        showLeaderIndicator && isRevealed && "[&>*:first-child]:bg-green-200"
      }`}
    >
      {votes?.map(({ category, count }, index) => {
        const leader = votes?.[0];
        const isTied = index > 0 && count === leader.count;

        return (
          <div
            className={`relative min-w-[200px] flex-1 rounded-md border-1 text-xs shadow-sm ${
              showLeaderIndicator &&
              isRevealed &&
              index === 0 &&
              "border-green-300"
            }`}
          >
            {showLeaderIndicator && isRevealed && index === 0 && (
              <div className=" absolute right-3 top-0 translate-y-[-50%] rounded-xl bg-green-400 px-2 text-xxs text-white">
                {isTied ? "Tied" : "Leading"}
              </div>
            )}
            <div className="rounded-top-md flex flex-1 items-center gap-2 overflow-hidden bg-gray-500 bg-opacity-10">
              <div className="flex-1 p-3 font-semibold">Outcome</div>
              <div className="flex-1 p-3 font-semibold">Votes</div>
            </div>
            <div className="flex flex-1 cursor-default items-center gap-2 text-sm">
              <div className="flex-1 p-3">
                <div className="group relative">
                  <span>{category.ticker}</span>
                  <div className="absolute -left-2 top-0 z-10 translate-y-[-110%] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-lg bg-green-lighter px-3 py-2 text-sm">
                      <span>{category.name}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-3">
                {isRevealed ? (
                  count
                ) : (
                  <span className="text-gray-400">secret</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CasePage;
