import DiscordIcon from "components/icons/DiscordIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import Avatar from "components/ui/Avatar";
import { useIdentity } from "lib/hooks/queries/useIdentity";

const PortfolioIdentity = ({ address }: { address: string }) => {
  const { data: identity } = useIdentity(address);

  return (
    <div className="flex flex-col items-center justify-center w-full gap-y-3 min-h-[200px]">
      {address && <Avatar address={address} size={120} />}
      {identity?.twitter && (
        <div className=" font-extrabold text-[38px]">
          {identity.displayName}
        </div>
      )}
      <div>{address}</div>
      <div className="flex gap-3 text-ztg-14-110 text-white">
        {identity?.twitter && (
          <a
            className="flex items-center bg-twitter p-[8px] rounded-md"
            href={`https://twitter.com/${identity.twitter}`}
            target="_blank"
            rel="noreferrer"
          >
            <TwitterIcon fill="white" />
            <span className="ml-ztg-10 ">{identity.twitter}</span>
          </a>
        )}
        {identity?.discord && (
          <div className="flex items-center bg-discord p-[8px] rounded-md">
            <DiscordIcon fill="white" />
            <span className="ml-ztg-10">{identity.discord}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioIdentity;
