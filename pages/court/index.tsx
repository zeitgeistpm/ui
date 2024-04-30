import { Dialog, Disclosure, Tab } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk";
import { CourtCasesTable } from "components/court/CourtCasesTable";
import CourtExitButton from "components/court/CourtExitButton";
import CourtUnstakeButton from "components/court/CourtUnstakeButton";
import JoinCourtAsJurorButton from "components/court/JoinCourtAsJurorButton";
import JurorsTable from "components/court/JurorsTable";
import ManageDelegationButton from "components/court/ManageDelegationButton";
import InfoPopover from "components/ui/InfoPopover";
import Decimal from "decimal.js";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useCourtParticipants } from "lib/hooks/queries/court/useCourtParticipants";
import { useCourtStakeSharePercentage } from "lib/hooks/queries/court/useCourtStakeSharePercentage";
import { useCourtTotalStakedAmount } from "lib/hooks/queries/court/useCourtTotalStakedAmount";
import { useCourtYearlyInflationAmount } from "lib/hooks/queries/court/useCourtYearlyInflation";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMintedInCourt } from "lib/hooks/queries/useMintedInCourt";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized, shortenAddress } from "lib/util";
import { isNumber } from "lodash-es";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import NotFoundPage from "pages/404";
import { IGetPlaiceholderReturn, getPlaiceholder } from "plaiceholder";
import { ChevronDown } from "react-feather";
import { IoMdArrowRoundForward } from "react-icons/io";
import { FaList, FaMoneyBillWave } from "react-icons/fa";
import { useState } from "react";
import Modal from "components/ui/Modal";
import moment from "moment";
import SubScanIcon from "components/icons/SubScanIcon";
import { useCourtReassignments } from "lib/hooks/queries/useCourtReassignments";
import { HiCheckCircle, HiChevronDoubleUp, HiXCircle } from "react-icons/hi";
import {
  isPayoutEligible,
  useCourtNextPayout,
} from "lib/hooks/queries/useCourtNextPayout";
import { MdMoneyOff } from "react-icons/md";
import { PiTimer, PiTimerBold } from "react-icons/pi";
import { blockDate } from "@zeitgeistpm/utility/dist/time";
import { useChainTime } from "lib/state/chaintime";

export async function getStaticProps() {
  const [bannerPlaiceholder] = await Promise.all([
    getPlaiceholder(`/court_banner.png`),
  ]);

  return {
    props: {
      bannerPlaiceholder,
    },
  };
}

const CourtPage: NextPage = ({
  bannerPlaiceholder,
}: {
  bannerPlaiceholder: IGetPlaiceholderReturn;
}) => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }

  const wallet = useWallet();
  const { data: constants } = useChainConstants();
  const connectedParticipant = useConnectedCourtParticipant();
  const { data: ztgPrice } = useZtgPrice();
  const stakeShare = useCourtStakeSharePercentage();

  const now = useChainTime();

  const { data: mintedPayouts } = useMintedInCourt({
    account: wallet.realAddress,
  });

  const { data: courtReassignments } = useCourtReassignments({
    account: wallet.realAddress,
  });

  const { data: courtPayout } = useCourtNextPayout();

  const allRewards = mintedPayouts
    ?.concat(courtReassignments ?? [])
    .sort((a, b) => b.blockNumber - a.blockNumber);

  const totalMintedPayout = mintedPayouts?.reduce((acc, curr) => {
    return acc.add(curr.dBalance);
  }, new Decimal(0));

  const totalReassignmentsPayout = courtReassignments?.reduce((acc, curr) => {
    return acc.add(curr.dBalance);
  }, new Decimal(0));

  const totalRewards = totalMintedPayout?.add(totalReassignmentsPayout ?? 0);

  const [showPayoutsModal, setShowPayoutsModal] = useState(false);

  const nextPayoutProgress =
    now && courtPayout
      ? ((now.block - courtPayout.lastPayoutBlock) /
          courtPayout.inflationPeriod) *
        100
      : null;

  return (
    <div className="mt-4 flex flex-col gap-y-4">
      <div className="relative mb-4 basis-7 flex-wrap items-center gap-4 lg:flex">
        <div className="relative flex-1 rounded-lg p-6">
          <div className="absolute left-0 top-0 z-10 h-full w-full">
            <Image
              title="Wizard draped in purple robes holding a flaming crypto key."
              alt="Wizard draped in purple robes holding a flaming crypto key."
              src={"/court_banner.png"}
              priority
              layout="fill"
              objectFit="cover"
              blurDataURL={bannerPlaiceholder.base64}
              placeholder="blur"
              className="rounded-lg"
              style={{
                objectPosition: "20% 30%",
              }}
            />
          </div>
          <div className="relative z-20">
            <div className="mb-2 text-3xl font-bold text-white drop-shadow-lg">
              Court
            </div>
            <p className="mb-4 font-light text-white drop-shadow-lg md:max-w-[940px]">
              Anyone can participate by joining the court system as a juror or
              delegator. As a juror, you are responsible for supplying the
              truthful outcome of a prediction market by voting and revealing
              the raw vote information. As a delegator, you can delegate your
              voting rights to active jurors.
            </p>

            <div className="mb-4 inline-block w-full rounded-md bg-slate-200 bg-opacity-50 px-6 py-5 backdrop-blur-[2px] md:w-auto lg:min-w-[580px]">
              <div className="flex">
                <h3 className="mb-1 flex-1 text-lg text-gray-800">My Stake</h3>
                {connectedParticipant && (
                  <div>
                    <div
                      className={`center gap-1 rounded-md py-1 text-sm text-gray-600`}
                    >
                      {connectedParticipant?.type}
                      <InfoPopover overlay={false} position="top">
                        {connectedParticipant?.type === "Juror"
                          ? "You are participating as a juror. All stake is delegated to your personal juror stake."
                          : "You are participating as a delegator. The probability of one delegator being selected is equally distributed among all delegations."}
                      </InfoPopover>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-mono text-lg font-medium">
                    {formatNumberLocalized(
                      connectedParticipant?.stake.div(ZTG).toNumber() ?? 0,
                    )}{" "}
                    {constants?.tokenSymbol}
                  </div>

                  <div className="mb-[0.5] flex items-center gap-2">
                    <div className="font-mono font-light text-gray-600">
                      $
                      {ztgPrice &&
                        formatNumberLocalized(
                          ztgPrice
                            .mul(
                              connectedParticipant?.stake.div(ZTG).toNumber() ??
                                0,
                            )
                            .toNumber(),
                        )}
                    </div>
                    <div className="center gap-1 rounded-md bg-slate-200 bg-opacity-20 p-1 text-xs text-gray-600 ">
                      <InfoPopover
                        overlay={false}
                        position="top-end"
                        icon={<span>{stakeShare.toFixed(1)}%</span>}
                      >
                        Your share percentage of the total staked amount in
                        court.{" "}
                        <Link
                          className="text-blue-500"
                          target="_bank"
                          href="https://docs.zeitgeist.pm/docs/learn/court#incentives"
                        >
                          Learn more about staking incentives.
                        </Link>{" "}
                      </InfoPopover>
                    </div>
                  </div>
                </div>
                {connectedParticipant ? (
                  <div className="text-md line-clamp-1 flex  font-mono font-semibold">
                    <div className="text-right">
                      <h3 className="mb-1 flex-1 font-sans text-sm text-gray-800">
                        Staking Rewards
                      </h3>
                      <div className="flex items-center justify-end gap-2">
                        <div>
                          {formatNumberLocalized(
                            totalRewards?.div(ZTG).toNumber() ?? 0,
                          )}{" "}
                          {constants?.tokenSymbol}
                        </div>
                        <div
                          onClick={() => setShowPayoutsModal(true)}
                          className="flex cursor-pointer rounded-md bg-gray-500/80 p-2 text-gray-300"
                        >
                          <FaList size={10} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mb-4">
                <div className="mb-3 flex flex-col gap-4 md:flex-row">
                  <JoinCourtAsJurorButton className="h-full w-full md:w-auto" />
                  <ManageDelegationButton className="h-full w-full md:w-auto" />

                  {connectedParticipant &&
                    !isNumber(connectedParticipant.prepareExitAt) && (
                      <CourtUnstakeButton className="h-full w-full flex-1 md:w-auto" />
                    )}

                  {connectedParticipant &&
                    isNumber(connectedParticipant.prepareExitAt) && (
                      <CourtExitButton className="h-full w-full flex-1 md:w-auto" />
                    )}
                </div>
              </div>

              {courtPayout ? (
                <div className="mb-1">
                  <div className="mb-1 flex items-center text-sm text-gray-600">
                    <h4 className="bold flex-1 text-sm text-gray-600">
                      Next Staking Payout
                    </h4>
                    <div className="text-xs">
                      {new Intl.DateTimeFormat("default", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      }).format(courtPayout.nextPayoutDate)}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${nextPayoutProgress}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 hidden h-full min-w-[420px] lg:mt-0 lg:flex lg:flex-col xl:min-w-[560px]">
          <h3 className="lg:text-md mb-3 text-sm text-slate-600">Statistics</h3>
          <Stats />
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="center mt-2 block w-full gap-2 rounded-md bg-purple-400 py-1 text-purple-800 lg:hidden">
                <span>Show Court Stats</span>
                <ChevronDown
                  className={`${open ? "rotate-180 transform" : ""} h-5 w-5 `}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="mt-2 lg:hidden">
                <Stats />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>

      <section>
        <Tab.Group>
          <Tab.List className="mb-4 flex">
            {["Court Cases", "Jurors"].map((title, index) => (
              <Tab className="text-sm sm:text-xl" key={index}>
                {({ selected }) => (
                  <div
                    className={`${
                      selected
                        ? "font-semibold text-black transition-all"
                        : "text-sky-600 transition-all"
                    } ${index === 0 ? "px-0 pr-4" : "px-4"}`}
                  >
                    {title}
                  </div>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <CourtCasesTable />
            </Tab.Panel>
            <Tab.Panel>
              <JurorsTable />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </section>

      <Modal open={showPayoutsModal} onClose={() => setShowPayoutsModal(false)}>
        <Dialog.Panel className="mt-8 w-full max-w-[590px] overflow-hidden rounded-ztg-10 bg-white">
          <div className=" bg-[#DC056C] px-4 py-6 text-white">
            <h2 className="mb-1 text-purple-950">Court Reward Payouts</h2>
            <p className="text-sm text-gray-200/80">
              All payouts made to{" "}
              <b>{shortenAddress(wallet?.realAddress ?? "")}</b> as a result of
              participating in court.{" "}
            </p>
          </div>
          <div className="pb-4">
            <div className="subtle-scroll-bar flex max-h-[640px] min-h-[200px] flex-col gap-1 overflow-y-scroll px-4 py-4">
              {now && isPayoutEligible(courtPayout) ? (
                <div className="mb-1 flex gap-2">
                  <div className="flex items-center">
                    <InfoPopover
                      icon={<PiTimerBold className="text-orange-300" />}
                      position={"bottom-end"}
                      popoverCss="!w-96"
                    >
                      Next expected staking reward payout.
                    </InfoPopover>
                  </div>
                  <div className="flex-1 italic text-gray-500">
                    {Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(courtPayout.nextRewardDate)}
                  </div>
                  <div className="text-gray-300">
                    -- <b>{constants?.tokenSymbol}</b>
                  </div>
                  <div className="w-6">
                    <div className="scale-75 opacity-30">
                      <SubScanIcon />
                    </div>
                  </div>
                </div>
              ) : null}

              {allRewards?.map((payout, index) => (
                <div className="mb-1 flex gap-2">
                  <div className="flex items-center">
                    {payout.extrinsic?.name ===
                    "Court.reassign_court_stakes" ? (
                      <InfoPopover
                        icon={
                          new Decimal(payout.dBalance ?? 0).gt(0) ? (
                            <HiCheckCircle className="text-green-400" />
                          ) : (
                            <MdMoneyOff className="text-red-500" />
                          )
                        }
                        position={index > 1 ? "top-end" : "bottom-end"}
                        popoverCss="!w-80"
                      >
                        {new Decimal(payout.dBalance ?? 0).gt(0)
                          ? "Reassigned funds by winning a case."
                          : "Reassigned funds by losing a case."}
                      </InfoPopover>
                    ) : (
                      <div>
                        <InfoPopover
                          icon={
                            <HiChevronDoubleUp className="text-[rgba(0,1,254,0.46)]" />
                          }
                          position={index > 1 ? "top-end" : "bottom-end"}
                          popoverCss="!w-80"
                          css="text-green-500"
                        >
                          Staking reward.
                        </InfoPopover>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 italic text-gray-500">
                    {Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(payout?.timestamp))}
                  </div>
                  <div className="">
                    {formatNumberLocalized(
                      new Decimal(payout?.dBalance ?? 0).div(ZTG).toNumber(),
                    )}{" "}
                    <b>{constants?.tokenSymbol}</b>
                  </div>

                  <div className="w-6">
                    <a
                      className="center text-sm"
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noopener"
                      href={
                        payout.extrinsic?.name === "Court.reassign_court_stakes"
                          ? `https://zeitgeist.subscan.io/extrinsic/${payout.extrinsic?.hash}`
                          : `https://zeitgeist.subscan.io/block/${payout?.blockNumber}?tab=event`
                      }
                    >
                      <div className="scale-75">
                        <SubScanIcon />
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

const Stats = () => {
  const wallet = useWallet();
  const { data: courtCases } = useCourtCases();
  const connectedParticipant = useConnectedCourtParticipant();
  const { data: constants } = useChainConstants();
  const { data: yearlyInflationAmount } = useCourtYearlyInflationAmount();
  const { data: participants } = useCourtParticipants();

  const totalStake = useCourtTotalStakedAmount();

  const activeCaseCount = courtCases?.filter((c) => c.case.status.isOpen)
    .length;

  const jurorCount = participants?.filter((p) => p.type === "Juror").length;
  const delegatorCount = participants?.filter((p) => p.type === "Delegator")
    .length;

  return (
    <>
      <div className="flex flex-1 basis-1 flex-col gap-2">
        <div className="flex flex-1 basis-1 items-center gap-3">
          <div
            className="w-3/5 rounded-md p-4"
            style={{
              background:
                "linear-gradient(115.14deg, rgba(0, 1, 254, 0.46) 2.93%, #AD00FE 89.56%)",
            }}
          >
            <label className="font text-sm text-purple-900">Cases</label>
            <div className="text-md font-mono font-semibold">
              {courtCases?.length} /{" "}
              <span className="text-sm font-medium text-white">
                {activeCaseCount} active
              </span>
            </div>
          </div>

          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(5, 5, 5, 0.11) 11.02%, rgba(5, 5, 5, 0.022) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">Jurors</label>
            <div className="text-md font-mono font-semibold">{jurorCount}</div>
          </div>
          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(5, 5, 5, 0.11) 11.02%, rgba(5, 5, 5, 0.022) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">Delegators</label>
            <div className="text-md font-mono font-semibold">
              {delegatorCount}
            </div>
          </div>
        </div>

        <div className="flex flex-1 basis-1 items-center gap-3">
          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(240, 206, 135, 0.4) 11.02%, rgba(254, 0, 152, 0.4) 93.27%)",
            }}
          >
            <label className="font text-sm text-yellow-700">
              Total Court Stake
            </label>
            <div className="text-md font-mono font-semibold">
              {formatNumberLocalized(totalStake.all.toNumber() ?? 0)}{" "}
              {constants?.tokenSymbol}
            </div>
          </div>
        </div>

        <div className="flex flex-1 basis-1 items-center gap-3">
          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(5, 5, 5, 0.11) 11.02%, rgba(5, 5, 5, 0.022) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">Juror Stake</label>
            <div className="text-md font-mono font-semibold">
              {formatNumberLocalized(totalStake.jurorTotal?.toNumber() ?? 0)}{" "}
              {constants?.tokenSymbol}
            </div>
          </div>
          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(5, 5, 5, 0.11) 11.02%, rgba(5, 5, 5, 0.022) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">
              Delegator Stake
            </label>
            <div className="text-md font-mono font-semibold">
              {formatNumberLocalized(
                totalStake.delegatorTotal?.toNumber() ?? 0,
              )}{" "}
              {constants?.tokenSymbol}
            </div>
          </div>
        </div>

        <div className="flex flex-1 basis-1 items-center gap-3">
          <div
            className="w-1/4 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(5, 5, 5, 0.11) 11.02%, rgba(5, 5, 5, 0.022) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">APY</label>
            <div className="flex items-center gap-2">
              <div className="text-md font-mono font-semibold">
                {formatNumberLocalized(
                  yearlyInflationAmount
                    ?.div(totalStake.all)
                    .mul(100)
                    .toNumber() ?? 0,
                )}
                %
              </div>
              <InfoPopover
                className="text-slate-500"
                overlay={false}
                position="top"
              >
                The current yearly percentage returns that jurors and delegators
                will receive on their staked ZTG
              </InfoPopover>
            </div>
          </div>
          <div>
            <IoMdArrowRoundForward />
          </div>
          <div
            className="flex-1 rounded-md p-4"
            style={{
              background:
                "linear-gradient(131.15deg, rgba(50, 255, 157, 0.4) 11.02%, rgba(240, 206, 135, 0.048) 93.27%)",
            }}
          >
            <label className="font text-sm text-gray-500">
              Yearly<span className="hidden md:inline"> Incentives</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="text-md line-clamp-1 font-mono font-semibold">
                {formatNumberLocalized(yearlyInflationAmount?.toNumber() ?? 0)}{" "}
                {constants?.tokenSymbol}
              </div>
              <InfoPopover
                className="text-slate-500"
                overlay={false}
                position="top-start"
                popoverCss="ml-12"
              >
                The yearly amount of {constants?.tokenSymbol} that will be
                minted to jurors and delegators as a result of inflation.
              </InfoPopover>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourtPage;
