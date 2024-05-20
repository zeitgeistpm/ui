import { TwitchEmbed, TwitchEmbedProps } from "react-twitch-embed";

export const TwitchPlayer = (props: TwitchEmbedProps) => {
  return <TwitchEmbed {...props} />;
};

export default TwitchPlayer;
