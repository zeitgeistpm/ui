import { ActionableCard } from "components/ui/ActionableCard";

const GettingStartedSection = () => {
  return (
    <>
      <div className="w-full" data-testid="learnSection">
        <h2 className="sm:col-span-3 text-center sm:text-start mb-6">
          Getting Started
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <ActionableCard
            title="Create an Account"
            description="Make a few simple steps to create an account and install your first zeitgeist friendly wallet."
            link="/create-account"
            linkText="Create an Account"
            img="/learn/create_account.png"
            timeUsage="~5 minutes"
          />
          <ActionableCard
            title="Deposit Tokens"
            description="Use one of several methods to deposit crypto tokens on Zeitgeist to start trading. Trade on your beliefs."
            link="/deposit"
            linkText="Make a Deposit"
            img="/learn/deposit.png"
            timeUsage="~5—15 minutes"
          />
          <ActionableCard
            title="Start Trading"
            description="Our system is at your full disposal. View markets and start trading on your beliefs."
            link="/markets"
            linkText="Make Preditions"
            img="/learn/start_trading.png"
            timeUsage="No time limits"
          />
        </div>
      </div>
    </>
  );
};

export default GettingStartedSection;
