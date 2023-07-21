import { FullContext, Sdk } from "@zeitgeistpm/sdk-next";

export const getDisplayName = async (
  sdk: Sdk<FullContext>,
  addresses: string[],
) => {
  const identities = await Promise.all(
    addresses.map((address) => sdk.api.query.identity.identityOf(address)),
  );

  const textDecoder = new TextDecoder();

  const names: (string | null)[] = identities.map((identity) =>
    identity.isNone === false
      ? textDecoder.decode(
          (identity.value.get("info") as any).get("display").value,
        )
      : null,
  );

  return names;
};
