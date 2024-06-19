import { isAbsoluteUrl } from "next/dist/shared/lib/utils";

export const isLive = async (channelNameOrUrl: string) => {
  const res = await fetch(
    `https://decapi.me/twitch/uptime/${extractChannelName(channelNameOrUrl)}`,
  );
  const data = await res.text();
  return res.ok && !data.match(/is offline|error/i);
};

export const extractChannelName = (url?: string) => {
  if (!url) return null;
  if (isAbsoluteUrl(url)) {
    return new URL(url ?? "").pathname.replace("/", "");
  } else {
    return url;
  }
};
