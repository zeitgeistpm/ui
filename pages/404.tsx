import { useRouter } from "next/router";
import Link from "next/link";
import { AlertCircle } from "react-feather";

const NotFoundPage = ({
  backText,
  backLink,
}: {
  backText?: string;
  backLink?: string;
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-lg border border-ztg-primary-200/30 bg-white/10 p-12 shadow-lg backdrop-blur-md">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ztg-primary-200/20 bg-ztg-primary-900/30 backdrop-blur-sm">
          <AlertCircle className="text-white/90/60" size={48} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="mb-3 text-4xl font-bold text-white/90">404</h1>
          <h2 className="mb-3 text-2xl font-semibold text-white/90">
            Page Not Found
          </h2>
          <p className="text-sm text-white/70">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {backText && backLink ? (
            <button
              onClick={handleClick}
              className="rounded-md bg-ztg-green-600/80 px-6 py-2.5 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
            >
              {backText}
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-md bg-ztg-green-600/80 px-6 py-2.5 text-center text-sm font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
            >
              Go Home
            </Link>
          )}
          <button
            onClick={() => router.back()}
            className="rounded-md border border-ztg-primary-200/30 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/90"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
