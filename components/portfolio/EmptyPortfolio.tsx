import Link from "next/link";
import { Inbox } from "react-feather";

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
    <div className="my-16 flex flex-col items-center justify-center gap-6 rounded-lg border border-ztg-primary-200/30 bg-white/10 p-12 shadow-lg backdrop-blur-md">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ztg-primary-200/20 bg-ztg-primary-900/30 backdrop-blur-sm">
        <Inbox className="text-white/90/60" size={40} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h3 className="mb-2 text-xl font-semibold text-white/90">{headerText}</h3>
        <p className="text-sm text-white/70">{bodyText}</p>
      </div>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="rounded-md bg-ztg-green-600/80 px-6 py-2.5 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default EmptyPortfolio;
