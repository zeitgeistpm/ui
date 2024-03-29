import { Disclosure, Tab } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk";
import { CourtCasesTable } from "components/court/CourtCasesTable";
import CourtExitButton from "components/court/CourtExitButton";
import CourtUnstakeButton from "components/court/CourtUnstakeButton";
import JoinCourtAsJurorButton from "components/court/JoinCourtAsJurorButton";
import JurorsTable from "components/court/JurorsTable";
import ManageDelegationButton from "components/court/ManageDelegationButton";
import InfoPopover from "components/ui/InfoPopover";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useCourtParticipants } from "lib/hooks/queries/court/useCourtParticipants";
import { useCourtStakeSharePercentage } from "lib/hooks/queries/court/useCourtStakeSharePercentage";
import { useCourtTotalStakedAmount } from "lib/hooks/queries/court/useCourtTotalStakedAmount";
import { useCourtYearlyInflationAmount } from "lib/hooks/queries/court/useCourtYearlyInflation";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { formatNumberLocalized } from "lib/util";
import { isNumber } from "lodash-es";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import NotFoundPage from "pages/404";
import { IGetPlaiceholderReturn, getPlaiceholder } from "plaiceholder";
import { ChevronDown } from "react-feather";
import { IoMdArrowRoundForward } from "react-icons/io";

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

  const { data: constants } = useChainConstants();
  const connectedParticipant = useConnectedCourtParticipant();
  const { data: ztgPrice } = useZtgPrice();
  const stakeShare = useCourtStakeSharePercentage();

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
                      className={`center gap-1 rounded-md px-2 py-1 text-sm text-gray-600`}
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

              <div className="mb-6 flex">
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
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-4 md:flex-row">
                  <JoinCourtAsJurorButton className="h-full w-full md:w-auto" />
                  <ManageDelegationButton className="h-full w-full md:w-auto" />

                  {connectedParticipant &&
                    !isNumber(connectedParticipant.prepareExitAt) && (
                      <CourtUnstakeButton className="h-full w-full md:w-auto" />
                    )}

                  {connectedParticipant &&
                    isNumber(connectedParticipant.prepareExitAt) && (
                      <CourtExitButton className="h-full w-full md:w-auto" />
                    )}
                </div>
              </div>
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
    </div>
  );
};

const Stats = () => {
  const { data: courtCases } = useCourtCases();
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
          <label className="font text-sm text-gray-500">Delegator Stake</label>
          <div className="text-md font-mono font-semibold">
            {formatNumberLocalized(totalStake.delegatorTotal?.toNumber() ?? 0)}{" "}
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
            Yearly Incentives
          </label>

          <div className="flex items-center gap-2">
            <div className="text-md font-mono font-semibold">
              {formatNumberLocalized(yearlyInflationAmount?.toNumber() ?? 0)}{" "}
              {constants?.tokenSymbol}
            </div>
            <InfoPopover
              className="text-slate-500"
              overlay={false}
              position="top-start"
              popoverCss="ml-12"
            >
              The yearly amount of {constants?.tokenSymbol} that will be minted
              to jurors and delegators as a result of inflation.
            </InfoPopover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtPage;
