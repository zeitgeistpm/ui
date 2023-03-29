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
  classes = "",
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
      className={`w-full rounded-[10px] p-[15px] pr-[20px] ${classes} `}
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        <span className="bg-white p-[6px] rounded-[50px] w-fit text-ztg-12-120">
          {tag}
        </span>
        <div className="flex items-start justify-between gap-[30px]">
          <div>
            <h6 className="font-semibold mt-2">{title}</h6>
            <p className="hidden md:block text-ztg-14-150">{description}</p>
          </div>
          <Image
            src={img}
            width={84}
            height={80}
            alt={title}
            className="hidden lg:block object-contain"
          />
        </div>
      </a>
    </motion.div>
  );
};

const LearnSection = () => {
  return (
    <>
      <div
        className="w-full grid sm:grid-cols-3 gap-5"
        data-testid="learnSection"
      >
        <h2 className="sm:col-span-3 text-center sm:text-start">How to</h2>
        <LearnCard
          tag="Trade"
          title="Prediction Markets"
          description="Make money from what you believe"
          link="https://docs.zeitgeist.pm/docs/learn/prediction-markets"
          classes="bg-tropical-blue"
          img="/learn/learn-1.png"
        />
        <LearnCard
          tag="Earn"
          title="Liquidity Pools"
          description="Earn ZTG by providing Liquidity"
          link="https://docs.zeitgeist.pm/docs/learn/liquidity"
          classes="bg-link-water"
          img="/learn/learn-2.png"
        />
        <LearnCard
          tag="Learn"
          title="Get Started"
          description="Learn all about the Zeitgeist ecosystem in our Docs"
          link="https://docs.zeitgeist.pm/docs/getting-started"
          classes="bg-mystic"
          img="/learn/learn-3.png"
        />
      </div>
    </>
  );
};

export default LearnSection;
