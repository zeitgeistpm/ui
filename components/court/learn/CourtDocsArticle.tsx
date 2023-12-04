import Image from "next/image";
import Link from "next/link";
import { IGetPlaiceholderReturn } from "plaiceholder";
import { PiBooks } from "react-icons/pi";

export const CourtDocsArticle = ({
  imagePlaceholder,
}: {
  imagePlaceholder: IGetPlaiceholderReturn;
}) => {
  return (
    <div className="group relative overflow-hidden rounded-xl px-6 py-6 shadow-lg">
      <div className="absolute left-0 top-0 z-10 h-full w-full transition-all group-hover:blur-[2px]">
        <Image
          priority
          title="Wizard draped in purple robes holding a flaming crypto key."
          alt="Wizard draped in purple robes holding a flaming crypto key."
          src={"/court_gnomes.png"}
          layout="fill"
          objectFit="cover"
          blurDataURL={imagePlaceholder.base64}
          placeholder="blur"
          style={{
            objectPosition: "50% 50%",
          }}
        />
      </div>
      <div className="relative z-20 text-white">
        <div className="mb-2">
          <h3 className="text-white drop-shadow-lg">Decentralized Court</h3>
        </div>
        <p className="mb-6 drop-shadow-lg">
          Zeitgeist implements a decentralized court to handle disputes that may
          arise in the resolution of prediction market outcomes.
        </p>
        <div className="flex items-center justify-end">
          <Link
            href="https://docs.zeitgeist.pm/docs/learn/court"
            target="_blank"
            className="center relative z-20 cursor-pointer gap-2 rounded-md bg-purple-400 bg-opacity-90 px-6 py-2 text-white"
          >
            <PiBooks />
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};
