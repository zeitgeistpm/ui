export const isLive = async (channelName: string) => {
  const res = await fetch(`https://decapi.me/twitch/uptime/${channelName}`);
  const data = await res.text();
  console.log("data", data);
  return !data.match("is offline");
};

export const extractChannelName = (url?: string) => {
  if (!url) return null;
  return new URL(url ?? "").pathname.replace("/", "");
};
