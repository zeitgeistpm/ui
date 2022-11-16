import { motion } from "framer-motion";
import { Link } from "react-feather";

interface LearnCardProps {
  tag: string;
  title: string;
  description: string;
  link: string;
  className?: string;
}

const LearnCard = ({
  tag,
  title,
  description,
  className,
  link,
}: LearnCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1 }}
      className={`${className} min-w-[200px] w-full h-[126px] bg-blue-200 rounded-[10px] p-[15px]`}
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        <div className="bg-white py-[6px] px-[10px] rounded-[50px] w-fit text-ztg-12-120	font-bold">
          {tag}
        </div>
        <div className="font-bold text-ztg-16-150 my-[8px]">{title}</div>
        <div className="text-sky-600">{description}</div>
      </a>
    </motion.div>
  );
};

const LearnSection = () => {
  return (
    <div>
      <div className="font-lato font-bold text-[28px] mb-[30px]">
        Welcome to Zeitgeist
      </div>
      <div className="flex flex-col md:flex-row gap-[30px]">
        <LearnCard
          tag="Trade"
          title="Prediction Markets"
          description="Make money on your Beliefs"
          link="https://docs.zeitgeist.pm/docs/learn/prediction-markets"
        />
        <LearnCard
          tag="Earn"
          title="Liquidity Pools"
          description="Earn ZTG providing Liquidity"
          link="https://docs.zeitgeist.pm/docs/learn/liquidity"
        />
        <LearnCard
          tag="Create"
          title="Create Markets"
          description="Learn about the World"
          link="https://docs.zeitgeist.pm/docs/learn/market-rules"
        />
      </div>
    </div>
  );
};

export default LearnSection;
