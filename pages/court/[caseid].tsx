import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOForeignAssetId,
  ZeitgeistIpfs,
  create,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import CourtStageTimer from "components/court/CourtStageTimer";
import { CourtVoteForm } from "components/court/CourtVoteForm";
import { CourtVoteRevealForm } from "components/court/CourtVoteRevealForm";
import { SelectedDrawsTable } from "components/court/SelectedDrawsTable";
import { AddressDetails } from "components/markets/MarketAddresses";
import { HeaderStat } from "components/markets/MarketHeader";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useCourtVoteDrawsForCase } from "lib/hooks/queries/court/useCourtVoteDraws";
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
import { IGetPlaiceholderReturn, getPlaiceholder } from "plaiceholder";
import { useMemo, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { LuReplace, LuVote } from "react-icons/lu";
import { PiBooks } from "react-icons/pi";
import {
  DAY_SECONDS,
  endpointOptions,
  environment,
  graphQlEndpoint,
  ZTG,
} from "lib/constants";
import { CourtAppealForm } from "components/court/CourtAppealForm";
import { CourtDocsArticle } from "components/court/learn/CourtDocsArticle";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { sortBy } from "lodash-es";
import { FaBackwardStep } from "react-icons/fa6";
import { IoMdArrowBack } from "react-icons/io";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { BsShieldFillExclamation } from "react-icons/bs";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { formatNumberCompact } from "lib/util/format-compact";

const QuillViewer = dynamic(() => import("../../components/ui/QuillViewer"), {
  ssr: false,
});

export async function getStaticProps({
  params,
}: {
  params: { caseid: string };
}) {
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const [docsArticleImagePlaceholder] = await Promise.all([
    getPlaiceholder(`/court_gnomes.png`),
  ]);

  const marketId = await sdk.api.query.court.courtIdToMarketId(params.caseid);
  const markets = marketId.isSome
    ? await sdk.indexer.markets({
        where: {
          marketId_eq: marketId.unwrap().toNumber(),
        },
      })
    : undefined;

  const market = markets?.markets[0];

  return {
    props: {
      docsArticleImagePlaceholder,
      initialMarket: market,
    },
  };
}

export async function getStaticPaths() {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return { paths: [], fallback: "blocking" };
  }
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const cases = await sdk.api.query.court.courts.keys();

  const paths = cases.map((caseId) => ({
    params: { caseid: caseId.args[0].toString() },
  }));

  return { paths, fallback: "blocking" };
}

const CasePage: NextPage = ({
  initialMarket,
  docsArticleImagePlaceholder,
}: {
  initialMarket: FullMarketFragment;
  docsArticleImagePlaceholder: IGetPlaiceholderReturn;
}) => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }

  const router = useRouter();

  const wallet = useWallet();
  const time = useChainTime();

  const { caseid } = router.query;
  const caseId = Number(caseid);

  const { data: courtCase } = useCourtCase(caseId);
  const { data: selectedDraws } = useCourtVoteDrawsForCase(caseId);
  const { data: chainConstants } = useChainConstants();

  const { data: marketId } = useCaseMarketId(caseId);

  let { data: dynamicMarket } = useMarket(
    marketId != null ? { marketId } : undefined,
  );

  const market = dynamicMarket ?? initialMarket;

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
  const hasDenouncedVote = connectedParticipantDraw?.vote.isDenounced;

  const stage = useMemo(() => {
    if (time && market && courtCase) {
      return getCourtStage(time, market, courtCase);
    }
  }, [time, market, courtCase]);

  const { prompt } = useConfirmation();
  const [recastVoteEnabled, setRecastVoteEnabled] = useState(false);

  const { unCommitVote } = useCourtVote({
    caseId,
    marketId: market.marketId,
  });

  const { resetBackedUpState } = useCourtSalt({
    caseId,
    marketId: market.marketId,
  });

  const round = courtCase?.appeals.length ?? 0;
  const minJurorStake = chainConstants?.court.minJurorStake ?? 0;
  const requestedVoteWeight = Math.pow(2, round) * 31 + Math.pow(2, round) - 1;
  const totalSlashableStake = requestedVoteWeight * minJurorStake;

  const onClickRecastVote = async () => {
    if (
      await prompt({
        title: "Recast Vote",
        description: "Are you sure you want to recast your vote?",
      })
    ) {
      unCommitVote();
      resetBackedUpState();
      setRecastVoteEnabled(true);
    }
  };

  const onVote = () => {
    setRecastVoteEnabled(false);
  };

  const actionSection = (
    <>
      {(stage?.type === "vote" || stage?.type === "aggregation") &&
        hasDenouncedVote && (
          <div className="overflow-hidden rounded-xl px-6 py-6 shadow-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="text-red-400">
                <BsShieldFillExclamation size={64} />
              </div>
              <h3 className="text mb-2 text-red-400">
                Your vote was denounced
              </h3>
              <p className="mb-3 text-center text-sm text-gray-500">
                Your vote was denounced and wont be counted. This means that
                someone was able to get your secret salt used when voting and
                denounce it.
              </p>
            </div>
          </div>
        )}

      {stage?.type === "vote" && (
        <>
          {(isDrawnJuror || recastVoteEnabled) && (
            <>
              <CourtVoteForm market={market} caseId={caseId} onVote={onVote} />
            </>
          )}

          {hasSecretVote && !recastVoteEnabled && (
            <div className="overflow-hidden rounded-xl px-6 py-6 shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="text-blue-500">
                  <LuVote size={64} />
                </div>
                <h3 className="text mb-2 text-blue-500">You have voted</h3>
                <p className="mb-3 text-center text-sm text-gray-500">
                  Your vote is secret during voting, but when court goes into
                  aggregation you can reveal your vote to the public by coming
                  back to this page.
                </p>
                <button
                  className="center gap-3 rounded-md bg-blue-500 px-4 py-2 text-white"
                  onClick={onClickRecastVote}
                >
                  Recast Vote
                  <LuReplace size={14} />
                </button>
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
                  Your vote has been revealed to the other jurors and the public
                  and has been taken into account.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {stage?.type === "appeal" && <CourtAppealForm caseId={caseId} />}
    </>
  );

  return (
    <div className="relative mt-6 flex flex-auto gap-12">
      <main className="flex-1">
        <section className="mb-6">
          <div className="flex items-center gap-3">
            <Link href="/court">
              <IoMdArrowBack />
            </Link>
            <h2 className="text-base font-normal">Case — #{caseId}</h2>
          </div>
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
            <HeaderStat
              label={`Slashable ${chainConstants?.tokenSymbol}`}
              border={false}
            >
              {formatNumberCompact(totalSlashableStake)}
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
            <CourtStageTimer caseId={caseId} market={market} />
          </div>

          {market.description && (
            <div className="mb-8">
              <QuillViewer value={market.description} />
            </div>
          )}

          {stage?.type !== "reassigned" && (
            <>
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
            </>
          )}

          <div className="mt-4 block md:hidden">{actionSection}</div>
        </section>

        {stage?.type !== "reassigned" && (
          <section>
            <h3 className="mb-3">Jurors</h3>
            <SelectedDrawsTable
              caseId={caseId}
              stage={stage}
              market={market}
              selectedDraws={selectedDraws}
            />
          </section>
        )}
      </main>

      <div className="hidden md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
        <div className="sticky top-28">
          {actionSection}
          <div className="mt-4">
            <CourtDocsArticle imagePlaceholder={docsArticleImagePlaceholder} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CaseSkeleton = () => {};

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

  const sortedVotes = sortBy(votes, "count").reverse();

  const showLeaderIndicator =
    isRevealed &&
    votes?.some((vote) => vote.count > 0) &&
    sortedVotes?.[0]?.count > sortedVotes?.[1]?.count;

  return (
    <div
      className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 ${
        showLeaderIndicator && isRevealed && "[&>*:first-child]:bg-green-200"
      }`}
    >
      {sortedVotes?.map(({ category, count }, index) => {
        const leader = votes?.[0];

        return (
          <div
            key={category.ticker}
            className={`relative flex flex-1 flex-col rounded-md border-1 text-xs shadow-sm md:min-w-[200px] ${
              showLeaderIndicator && index === 0 && "border-green-300"
            }`}
          >
            {showLeaderIndicator && isRevealed && index === 0 && (
              <div className=" absolute right-3 top-0 translate-y-[-50%] rounded-xl bg-green-400 px-2 text-xxs text-white">
                Leading
              </div>
            )}
            <div className="rounded-top-md flex items-center gap-2 overflow-hidden bg-gray-500 bg-opacity-10">
              <div className="flex-1 p-3 font-semibold">Outcome</div>
              <div className="flex-1 p-3 font-semibold">Votes</div>
            </div>

            <div className="flex h-fit flex-1 cursor-default items-center gap-2 text-sm">
              <div className="flex-1 p-3">
                <div className="relative">
                  <span className="text-xs">{category.name}</span>
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
