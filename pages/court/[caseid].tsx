import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  MarketId,
  ZeitgeistIpfs,
  create,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import { CourtAppealForm } from "components/court/CourtAppealForm";
import { CourtReassignForm } from "components/court/CourtReassignForm";
import CourtStageTimer from "components/court/CourtStageTimer";
import { CourtVoteForm } from "components/court/CourtVoteForm";
import { CourtVoteRevealForm } from "components/court/CourtVoteRevealForm";
import { SelectedDrawsTable } from "components/court/SelectedDrawsTable";
import { CourtDocsArticle } from "components/court/learn/CourtDocsArticle";
import { AddressDetails } from "components/markets/MarketAddresses";
import { MarketDescription } from "components/markets/MarketDescription";
import { HeaderStat } from "components/markets/MarketHeader";
import { getCmsFullMarketMetadataForMarket } from "lib/cms/markets";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { useMarketCmsMetadata } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCases";
import { useCourtVoteDrawsForCase } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketImage } from "lib/hooks/useMarketImage";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { useCourtStage } from "lib/state/court/useCourtStage";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import { useWallet } from "lib/state/wallet";
import { isMarketCategoricalOutcome } from "lib/types";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { findAsset } from "lib/util/assets";
import { calculateSlashableStake } from "lib/util/court/calculateSlashableStake";
import { formatNumberCompact } from "lib/util/format-compact";
import { sortBy } from "lodash-es";
import { isAbsoluteUrl } from "next/dist/shared/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import NotFoundPage from "pages/404";
import { IGetPlaiceholderReturn, getPlaiceholder } from "plaiceholder";
import { useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { BsShieldFillExclamation } from "react-icons/bs";
import { IoMdArrowBack } from "react-icons/io";
import { LuReplace, LuVote } from "react-icons/lu";

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

  const cmsMetadata = await getCmsFullMarketMetadataForMarket(
    marketId.unwrap().toNumber(),
  );

  const markets = marketId.isSome
    ? await sdk.indexer.markets({
        where: {
          marketId_eq: marketId.unwrap().toNumber(),
        },
      })
    : undefined;

  const market = markets?.markets[0];

  if (market) {
    if (cmsMetadata?.imageUrl) {
      market.img = cmsMetadata?.imageUrl;
    }

    if (cmsMetadata?.question) {
      market.question = cmsMetadata?.question;
    }

    if (cmsMetadata?.description) {
      (market.description as any) = cmsMetadata?.description;
    }
  }

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
    : IOZtgAssetId.is(baseAsset)
      ? lookupAssetImagePath(baseAsset.Ztg)
      : "";

  const connectedParticipantDraw = selectedDraws?.find(
    (draw) => draw.courtParticipant.toString() === wallet.realAddress,
  );

  const isDrawnJuror = connectedParticipantDraw?.vote.isDrawn;
  const hasSecretVote = connectedParticipantDraw?.vote.isSecret;
  const hasRevealedVote = connectedParticipantDraw?.vote.isRevealed;
  const hasDenouncedVote = connectedParticipantDraw?.vote.isDenounced;

  const stage = useCourtStage({
    caseId: caseid as string,
    marketId,
  });

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

  const totalSlashableStake = calculateSlashableStake(
    courtCase?.appeals.length ?? 0,
    chainConstants?.court.minJurorStake ?? 0,
  );

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
                    findAsset(
                      {
                        CategoricalOutcome: [
                          market.marketId as MarketId,
                          connectedParticipantDraw?.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber(),
                        ],
                      },
                      market.assets,
                    )?.name
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

      {stage?.type === "closed" && <CourtReassignForm caseId={caseId} />}
    </>
  );

  const { data: marketImage } = useMarketImage(market, {
    fallback:
      market.img &&
      isAbsoluteUrl(market.img) &&
      !isMarketImageBase64Encoded(market.img)
        ? market.img
        : undefined,
  });

  const { data: marketCmsData } = useMarketCmsMetadata(market.marketId);

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
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image
                  alt={"Market image"}
                  src={marketImage}
                  fill
                  className="overflow-hidden rounded-lg"
                  style={{
                    objectFit: "cover",
                    objectPosition: "50% 50%",
                  }}
                  sizes={"100px"}
                />
              </div>
            </div>
            <div>
              <h1 className="text-[32px] font-extrabold">
                {marketCmsData?.question ?? market?.question}
              </h1>

              <div className="mb-2 flex flex-wrap items-center gap-2 lg:pl-1">
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
                    ? findAsset(
                        {
                          CategoricalOutcome: [
                            market.marketId as MarketId,
                            reportedOutcome,
                          ],
                        },
                        market.assets,
                      )?.name
                    : "-"}
                </HeaderStat>
                <HeaderStat
                  label={`Slashable ${chainConstants?.tokenSymbol}`}
                  border={false}
                >
                  {formatNumberCompact(totalSlashableStake)}
                </HeaderStat>
              </div>
            </div>
          </div>

          <Link
            className="mb-8 inline-block text-sm font-medium text-blue-600"
            href={`/markets/${marketId}`}
          >
            View Market
          </Link>

          <div className="flex items-start gap-4">
            <div>
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
            </div>
            {stage?.type === "reassigned" && market.resolvedOutcome && (
              <div className="inline-block min-w-[200px] rounded-lg bg-blue-500 px-5 py-3 text-white">
                <h3 className="mb-3 text-white">Outcome</h3>
                {
                  findAsset(
                    {
                      CategoricalOutcome: [
                        market.marketId as MarketId,
                        Number(market.resolvedOutcome),
                      ],
                    },
                    market.assets,
                  )?.name
                }
              </div>
            )}
          </div>

          <div className="mb-4">
            <MarketDescription market={market} />
          </div>

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

const Votes = ({
  market,
  selectedDraws,
  isRevealed,
}: {
  market: FullMarketFragment;
  selectedDraws: ZrmlCourtDraw[] | undefined;
  isRevealed: boolean;
}) => {
  const votes = market.assets
    ?.map((category) => {
      const draws = selectedDraws?.filter(
        (draw) =>
          draw.vote.isRevealed &&
          draw.vote.asRevealed.voteItem.isOutcome &&
          findAsset(
            {
              CategoricalOutcome: [
                market.marketId as MarketId,
                draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber(),
              ],
            },
            market.assets,
          ),
      );

      const weight =
        draws?.reduce((acc, draw) => {
          return acc + draw.weight.toNumber();
        }, 0) ?? 0;

      return { category, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  const sortedVotes = sortBy(votes, "weight").reverse();

  const showLeaderIndicator =
    isRevealed &&
    votes?.some((vote) => vote.weight > 0) &&
    sortedVotes?.[0]?.weight > sortedVotes?.[1]?.weight;

  return (
    <div
      className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 ${
        showLeaderIndicator && isRevealed && "[&>*:first-child]:bg-green-200"
      }`}
    >
      {sortedVotes?.map(({ category, weight }, index) => {
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
              <div className="flex-1 p-3 font-semibold">Weight</div>
            </div>

            <div className="flex h-fit flex-1 cursor-default items-center gap-2 text-sm">
              <div className="flex-1 p-3">
                <div className="relative">
                  <span className="text-xs">{category.name}</span>
                </div>
              </div>
              <div className="flex-1 p-3">
                {isRevealed ? (
                  weight
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
