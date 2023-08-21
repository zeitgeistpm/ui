import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

interface GettingStartedCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  img: string;
  time: string;
}

const GettingStartedCard = ({
  title,
  description,
  link,
  linkText,
  img,
  time,
}: GettingStartedCardProps) => {
  return (
    <div className="w-full rounded-md py-5 px-7 bg-white ">
      <div className="mb-6">
        <h6 className="font-semibold text-xl mb-4">{title}</h6>
        <div className="flex gap-4">
          <Image
            src={img}
            width={84}
            height={80}
            alt={title}
            className="hidden lg:block flex-shrink-0 w-[84px] h-[80px]"
          />
          <p className="hidden md:block text-ztg-14-150">{description}</p>
        </div>
      </div>
      <div className="flex">
        <div className="text-blue-500 flex items-center gap-1 flex-1">
          <Link href={link} className="flex flex-col">
            {linkText}
          </Link>
          <FiChevronRight size={20} />
        </div>
        <div className="bg-gray-200 rounded-md py-1 px-2">{time}</div>
      </div>
    </div>
  );
};

const GettingStartedSection = () => {
  return (
    <>
      <div
        className="w-full grid sm:grid-cols-3 gap-5"
        data-testid="learnSection"
      >
        <h2 className="sm:col-span-3 text-center sm:text-start">
          Getting Started
        </h2>
        <GettingStartedCard
          title="Create an Account"
          description="Make a few simple steps to create an account and install your first zeitgeist friendly wllet"
          link="/create-account"
          linkText="Create an Account"
          img="/learn/create_account.png"
          time="~5 minutes"
        />
        <GettingStartedCard
          title="Deposit Tokens"
          description="Use one of several methods to deposit crypto tokens on Zeitgeist to start trading"
          link="/deposit"
          linkText="Make a Deposit"
          img="/learn/deposit.png"
          time="~5—15 minutes"
        />
        <GettingStartedCard
          title="Start Trading"
          description="Our system is at your full disposal"
          link="/markets"
          linkText="Make Preditions"
          img="/learn/start_trading.png"
          time="No time limits"
        />
      </div>
    </>
  );
};

export default GettingStartedSection;
