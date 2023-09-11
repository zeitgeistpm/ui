import { ActionableCard, ActionableCardProps } from "../ActionableCard";

export const DepositActionableCard = ({
  animationVariant,
}: {
  animationVariant?: ActionableCardProps["animationVariant"];
}) => (
  <ActionableCard
    title="Deposit Tokens"
    description="Use one of several methods to deposit crypto tokens on Zeitgeist to start trading. Trade on your beliefs."
    link="/deposit"
    linkText="Make a Deposit"
    img="/learn/deposit.png"
    timeUsage="~5—15 minutes"
    animationVariant={animationVariant}
  />
);
