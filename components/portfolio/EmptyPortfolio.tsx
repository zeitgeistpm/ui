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
    <div className="mb-[200px] flex flex-col items-center justify-center gap-y-[30px]">
      <Frown className="text-pastel-blue" size={80} />
      <div className="text-[24px] font-semibold">{headerText}</div>
      <div>{bodyText}</div>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="rounded-ztg-100 bg-mystic px-[20px] py-[8px] text-[14px]"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default EmptyPortfolio;
