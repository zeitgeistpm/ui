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
    <div className="my-16 flex flex-col items-center justify-center gap-6 rounded-lg border border-sky-200/30 bg-white/80 p-12 shadow-md backdrop-blur-md">
      <div className="rounded-full bg-sky-50/80 p-6 backdrop-blur-sm">
        <Frown className="text-sky-600" size={64} />
      </div>
      <div className="text-center">
        <h3 className="mb-2 text-xl font-semibold text-sky-900">
          {headerText}
        </h3>
        <p className="text-sm text-sky-700">{bodyText}</p>
      </div>
      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="rounded-md border border-sky-200/30 bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default EmptyPortfolio;
