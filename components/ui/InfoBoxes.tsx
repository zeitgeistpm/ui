import { FC } from "react";
import { StatCardProps } from "./StatCard";

const stats: StatCardProps[] = [
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000",
  },
  {
    header: "Active markets",
    text: "12",
    bottomText: "Additional Info",
  },
  {
    header: "Transactions",
    text: "003",
    bottomText: "Additional Info",
  },
];

const InfoBoxes: FC = () => {
  return (
    <></>
    // <div className="flex h-ztg-104 mb-ztg-30">
    //   {stats.map((stat, index) => (
    //     <StatCard
    //       key={index}
    //       header={stat.header}
    //       text={stat.text}
    //       bottomText={stat.bottomText}
    //     />
    //   ))}
    // </div>
  );
};

export default InfoBoxes;
