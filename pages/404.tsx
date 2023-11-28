import Image from "next/image";
import { useRouter } from "next/router";

const NotFoundPage = ({
  backText,
  backLink,
}: {
  backText?: string;
  backLink?: string;
}) => {
  const router = useRouter();
  const src = "/light-404.png";

  const handleClick = () => {
    if (backLink) router.push(backLink);
  };

  return (
    <>
      <Image src={src} height={1080} width={1920} alt="404 Page" />
      {backText && backLink ? (
        <div className="mb-ztg-40 flex items-center justify-center">
          <button
            onClick={handleClick}
            className=" rounded-ztg-10 border border-sky-600 px-ztg-50 py-ztg-7 font-bold text-sky-600"
          >
            {backText}
          </button>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default NotFoundPage;
