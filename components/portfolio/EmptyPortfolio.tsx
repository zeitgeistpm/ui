import Link from "next/link";
import { Frown } from "react-feather";

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
      <Frown className="text-pastel-blue" size={80} />
      <div className="font-semibold text-[24px]">{headerText}</div>
      <div>{bodyText}</div>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="text-[14px] bg-mystic rounded-ztg-100 py-[8px] px-[20px]"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default EmptyPortfolio;
