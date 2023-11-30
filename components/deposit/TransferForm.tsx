import { useSquid } from "lib/hooks/squid-router/useSquid";

export const TransferForm = () => {
  const squid = useSquid();

  if (squid.connected) {
    squid.sdk;
  }

  return <></>;
};
