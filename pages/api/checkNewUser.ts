import { createClient } from "@supabase/supabase-js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";

export default async function checkNewUser(req, res) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
  ) {
    return;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } },
  );

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { userAddress: wallet } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("wallet")
    .eq("wallet", wallet)
    .single();

  if (data === null) {
    const response = await supabase.from("users").insert({ wallet: wallet });
    if (response.statusText === "Created") {
      const fundResponse = await fundUser(wallet);

      if (fundResponse.success) {
        return res
          .status(200)
          .json({
            success: true,
            data: response.data,
            txHash: fundResponse.txHash,
          });
      } else {
        return res.status(500).json({ error: fundResponse.error });
      }
    }

    if (response.error) {
      return res
        .status(500)
        .json({ error: "Error inserting account into database." });
    }
  } else {
    return res.status(200).json({ error: "Account already exists." });
  }
}

async function fundUser(wallet) {
  if (!process.env.NEXT_PUBLIC_SEED) {
    return { error: "Error connecting" };
  }
  const provider = new WsProvider("wss://bsr.zeitgeist.pm");
  const api = await ApiPromise.create({ provider });

  try {
    const keyring = new Keyring({ type: "sr25519" });
    const masterAccount = keyring.addFromUri(process.env.NEXT_PUBLIC_SEED);

    // const amount = 1_000_000_000_000_0; // 1000 tokens
    const amount = 1_000_000_000_000; // 100 tokens

    const transfer = api.tx.assetManager.transfer(
      wallet,
      { ForeignAsset: 3 },
      amount,
    );

    const txHash = await transfer.signAndSend(masterAccount);

    return { success: true, txHash: txHash.toString() };
  } catch (error) {
    return { error: error.toString() };
  } finally {
    provider.disconnect();
  }
}
