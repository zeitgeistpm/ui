import { Frown, Link } from "react-feather";

const EmptyPortfolio = ({
  headerText,
  bodyText,
  buttonText,
  buttonLink,
}: {
  headerText: string;
  bodyText: string;
  buttonText?: string;
  buttonLink?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-[30px] mb-[200px]">
      <Frown size={80} />
      <div className="font-semibold text-[24px]">{headerText}</div>
      <div>{bodyText}</div>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="text-[14px] bg-mystic rounded-ztg-100 py-[5px] px-[10px]"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default EmptyPortfolio;
