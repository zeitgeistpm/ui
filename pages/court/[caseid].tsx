import {
  IOBaseAssetId,
  IOForeignAssetId,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import CourtStageTimer from "components/court/CourtStageTimer";
import { AddressDetails } from "components/markets/MarketAddresses";
import { HeaderStat } from "components/markets/MarketHeader";
import Skeleton from "components/ui/Skeleton";
import { KeyringPairOrExtSigner, isExtSigner } from "@zeitgeistpm/rpc";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useSelectedDraws } from "lib/hooks/queries/court/useSelectedDraws";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useChainTime } from "lib/state/chaintime";
import { CourtStage, getCourtStage } from "lib/state/court/get-stage";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isMarketCategoricalOutcome } from "lib/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import NotFoundPage from "pages/404";
import { use, useMemo } from "react";

const QuillViewer = dynamic(() => import("../../components/ui/QuillViewer"), {
  ssr: false,
});

const CasePage: NextPage = () => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }

  const [sdk] = useSdkv2();
  const time = useChainTime();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const router = useRouter();

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

  const stage = useMemo(() => {
    if (time && market && courtCase) {
      return getCourtStage(time, market, courtCase);
    }
  }, [time, market, courtCase]);

  if (!market) {
    return <>Loading</>;
  }

  return (
    <div className="mt-6">
      <section>
        <h2 className="text-base font-normal">Case — #{caseId}</h2>
        <h1 className="text-[32px] font-extrabold">{market?.question}</h1>
        <button
          onClick={() => {
            wallet.signRaw("some data")?.then(console.log);
          }}
        >
          SIGN
        </button>
        <Link
          className="text-blue-600 font-medium text-sm mb-6 block"
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
      </section>
    </div>
  );
};

export default CasePage;
