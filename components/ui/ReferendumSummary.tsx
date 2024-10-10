import { usePolkadotReferendumVotes } from "lib/hooks/queries/polkadot/usePolkadotReferendumVotes";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ExternalLink } from "react-feather";

const ReferendumSummary = ({
  referendumIndex,
}: {
  referendumIndex: number;
}) => {
  const { data: referendum } = usePolkadotReferendumVotes(referendumIndex);
  const barValue = referendum?.ayePercentage.mul(100).toNumber() ?? 0;
  return (
    <>
      {referendum && (
        <div className="flex w-full flex-col gap-4 rounded-lg px-10 py-6 font-medium shadow-lg">
          <div className="flex items-center">
            <div className="text-lg">Referendum</div>
            <a
              href={`https://polkadot.polkassembly.io/referenda/${referendumIndex}`}
              className="ml-auto flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm text-black "
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/icons/polkassembly.svg"
                alt="Account balance"
                width={"80px"}
              />
              <ExternalLink size={12} className="absolute right-[44px]" />
            </a>
          </div>
          <div className="flex items-center justify-center">
            <div className="mt-3 h-[150px] w-[300px] ">
              <CircularProgressbar
                value={barValue}
                circleRatio={0.5}
                strokeWidth={2}
                styles={buildStyles({
                  rotation: 0.75,
                  strokeLinecap: "round",
                  textSize: "16px",
                  pathTransitionDuration: 0.5,
                  pathColor: `#0070EB`,
                  trailColor: "#FC9965",
                })}
              />
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-col">
              <div className="font-mono text-xl text-[#0070EB]">
                {referendum.ayePercentage.mul(100).toFixed(1)}%
              </div>
              <div className="text-lg">Aye</div>
            </div>
            <div className="ml-auto flex flex-col">
              <div className="font-mono text-xl text-[#FC9965]">
                {referendum.nayPercentage.mul(100).toFixed(1)}%
              </div>
              <div className="text-lg">Nay</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferendumSummary;
