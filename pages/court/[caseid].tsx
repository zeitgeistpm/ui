import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOForeignAssetId,
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
import { useSelectedDraws } from "lib/hooks/queries/court/useSelectedDraws";
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
  const { data: selectedDraws } = useSelectedDraws(caseId);

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
    <div className="mt-6 flex flex-auto gap-12 relative">
      <main className="flex-1">
        <section className="mb-6">
          <h2 className="text-base font-normal">Case — #{caseId}</h2>
          <h1 className="text-[32px] font-extrabold">{market?.question}</h1>

          <Link
            className="text-blue-600 font-medium text-sm mb-6 inline-block"
            href={`/markets/${marketId}`}
          >
            View Market
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-6">
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
            <HeaderStat label="Original Outcome">
              {reportedOutcome !== undefined
                ? market.categories?.[reportedOutcome].name
                : "-"}
            </HeaderStat>
          </div>

          <div className="flex relative items-center gap-3 mb-6">
            <AddressDetails title="Creator" address={market.creator} />

            <div className="relative group">
              <Image
                width={20}
                height={20}
                src={imagePath}
                alt="Currency token logo"
                className="rounded-full"
              />
              <div className="opacity-0 transition-opacity absolute right-0 bottom-0 translate-x-[50%] z-10 translate-y-[115%] group-hover:opacity-100 pt-1  whitespace-nowrap">
                <div className="py-1 px-2 text-sm bg-blue-100 rounded-lg">
                  <span className="text-gray-500">Currency: </span>
                  <span className="font-semibold">{token}</span>
                </div>
              </div>
            </div>

            <div className="relative group">
              <Image
                width={22}
                height={22}
                src="/icons/verified-icon.svg"
                alt="verified checkmark"
              />
              <div className="opacity-0 transition-opacity absolute right-0 bottom-0 translate-x-[50%] z-10 translate-y-[115%] group-hover:opacity-100 pt-1 whitespace-nowrap">
                <div className="py-1 px-2 text-sm bg-green-lighter rounded-lg">
                  Verified Market
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <CourtStageTimer stage={stage} />
          </div>

          {market.description && (
            <div className="mb-8">
              <QuillViewer value={market.description} />
            </div>
          )}

          {stage?.type !== "reassigned" && (
            <div>
              <h3 className="mb-3">Outcomes</h3>
              <Outcomes market={market} selectedDraws={selectedDraws} />
            </div>
          )}
        </section>

        {stage?.type !== "reassigned" && (
          <section>
            <h3 className="mb-3">Outcomes</h3>
            <SelectedDrawsTable market={market} selectedDraws={selectedDraws} />
          </section>
        )}
      </main>

      {stage?.type === "vote" && (
        <>
          {isDrawnJuror && (
            <>
              <div className="hidden md:block md:w-[320px] lg:w-[460px] lg:mr-auto">
                <div className="sticky top-28">
                  <CourtVoteForm market={market} caseId={caseId} />
                </div>
              </div>
            </>
          )}

          {hasSecretVote && (
            <div>
              <div className="hidden md:block md:w-[320px] lg:w-[460px] lg:mr-auto">
                <div className="sticky top-28">
                  <div className="rounded-xl overflow-hidden shadow-lg py-6 px-6">
                    <div className="flex flex-col items-center gap-3">
                      <div>
                        <LuVote size={64} />
                      </div>
                      <h3 className="text mb-2">You have voted</h3>
                      <p className="text-sm">
                        Your vote is secret during voting, but when court goes
                        into aggregation you can reveal your vote to the public
                        by coming back to this page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {stage?.type === "aggregation" && (
        <>
          {hasSecretVote && (
            <>
              <div className="hidden md:block md:w-[320px] lg:w-[460px] lg:mr-auto">
                <div className="sticky top-28">
                  <CourtVoteRevealForm
                    market={market}
                    caseId={caseId}
                    secretVote={
                      connectedParticipantDraw?.vote.isSecret
                        ? connectedParticipantDraw?.vote.asSecret
                        : undefined
                    }
                  />
                </div>
              </div>
            </>
          )}

          {hasRevealedVote && (
            <>
              <div className="hidden md:block md:w-[320px] lg:w-[460px] lg:mr-auto">
                <div className="sticky top-28">
                  <div className="rounded-xl overflow-hidden shadow-lg py-6 px-6">
                    <div className="flex flex-col items-center gap-3">
                      <div>
                        <AiOutlineEye size={64} />
                      </div>
                      <h3 className="text mb-4">Your vote is revealed</h3>
                      <h3 className="text text-base mb-4">
                        {
                          market?.categories?.[
                            connectedParticipantDraw?.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber()
                          ].ticker
                        }
                      </h3>
                      <p className="text-sm">
                        Your vote has been revealed to the other jurors and the
                        public and has been taken into account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const Outcomes = ({
  market,
  selectedDraws,
}: {
  market: FullMarketFragment;
  selectedDraws: ZrmlCourtDraw[] | undefined;
}) => {
  return (
    <div className="flex gap-2">
      {market.categories?.map((category, index) => {
        const votes = selectedDraws?.filter(
          (draw) =>
            draw.vote.isRevealed &&
            draw.vote.asRevealed.voteItem.isOutcome &&
            draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber() ===
              index,
        );

        return (
          <div className="shadow-sm border-1 rounded-md min-w-[200px] text-xs flex-1">
            <div className="flex-1 flex items-center gap-2 bg-gray-100">
              <div className="p-3 flex-1 font-semibold">Outcome</div>
              <div className="p-3 flex-1 font-semibold">Votes</div>
            </div>
            <div className="flex-1 flex items-center gap-2 text-sm">
              <div className="p-3 flex-1">
                <span className="pl-3">{category.ticker}</span>
              </div>
              <div className="p-3 flex-1">{votes?.length}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CasePage;
