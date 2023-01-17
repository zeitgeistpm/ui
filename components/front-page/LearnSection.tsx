import { motion } from "framer-motion";
import Image from "next/image";

interface LearnCardProps {
  tag: string;
  title: string;
  description: string;
  link: string;
  img: string;
  classes?: string;
}

const LearnCard = ({
  tag,
  title,
  description,
  classes,
  link,
  img,
}: LearnCardProps) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        boxShadow: "0px 10px 20px 5px rgba(0,0,0,0.25)",
      }}
      whileTap={{ scale: 1 }}
      className={`${classes} w-full rounded-[10px] p-[15px] pr-[20px]`}
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        <span className="bg-white p-[6px] rounded-[50px] w-fit text-ztg-12-120">
          {tag}
        </span>
        <div className="flex justify-between gap-[30px]">
          <div>
            <h6 className="font-semibold text-ztg-16-150 mt-[8px]">{title}</h6>
            <p className="hidden md:block text-ztg-14-150">{description}</p>
          </div>
          <Image
            src={img}
            width={84}
            height={80}
            alt={title}
            className="hidden lg:block"
          />
        </div>
      </a>
    </motion.div>
  );
};

const LearnSection = () => {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[20px]">
        <LearnCard
          tag="Trade"
          title="Prediction Markets"
          description="Make money on your Beliefs"
          link="https://docs.zeitgeist.pm/docs/learn/prediction-markets"
          classes="bg-tropical-blue"
          img="/learn/learn-1.png"
        />
        <LearnCard
          tag="Earn"
          title="Liquidity Pools"
          description="Earn ZTG providing Liquidity"
          link="https://docs.zeitgeist.pm/docs/learn/liquidity"
          classes="bg-link-water"
          img="/learn/learn-2.png"
        />
        <LearnCard
          tag="Native Currency"
          title="ZTG Token"
          description="Tokenomics and Future of ZTG"
          link="https://docs.zeitgeist.pm/docs/learn/market-rules"
          classes="bg-mystic col-span-2 sm:col-span-1 min-h-[84px]"
          img="/learn/learn-3.png"
        />
      </div>
    </div>
  );
};

export default LearnSection;
