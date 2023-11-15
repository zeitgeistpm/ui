import { defaultTags } from "lib/constants/markets";
import { usePolkadotReferendum } from "lib/hooks/queries/polkadot/usePolkadotReferendum";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

const ReferendumSummary = () => {
  const { data: referendum } = usePolkadotReferendum(244);
  //   console.log(referendum);

  return (
    <div className="w-full h-[300px] flex flex-col shadow-lg rounded-lg px-8 py-10 gap-4">
      <div className="flex">
        <div>Summary</div>
        <div className="ml-auto">View</div>
      </div>
      <div className="h-[350px] overflow-hidden">
        <CircularProgressbar
          value={66}
          circleRatio={0.5}
          strokeWidth={2}
          styles={buildStyles({
            rotation: 0.75,
            strokeLinecap: "round",
            textSize: "16px",
            pathTransitionDuration: 0.5,
            pathColor: `rgba(62, 152, 199)`,
            trailColor: "red",
          })}
        />
      </div>
      <div className="flex">
        <div>Aye</div>
        <div className="ml-auto">Nay</div>
      </div>
    </div>
  );
};

export default ReferendumSummary;
