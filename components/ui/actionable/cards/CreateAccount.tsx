import { ActionableCard, ActionableCardProps } from "../ActionableCard";

export const CreateAccountActionableCard = ({
  animationVariant,
}: {
  animationVariant?: ActionableCardProps["animationVariant"];
}) => (
  <ActionableCard
    title="Create an Account"
    description="Make a few simple steps to create an account and install your first zeitgeist friendly wallet."
    link="/create-account"
    linkText="Create an Account"
    img="/learn/create_account.png"
    timeUsage="~5 minutes"
    animationVariant={animationVariant}
  />
);
