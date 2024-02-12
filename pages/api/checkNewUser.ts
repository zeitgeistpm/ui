import { createClient } from "@supabase/supabase-js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { wsxID } from "lib/constants";

export default async function checkNewUser(req, res) {
  if (!process.env.SUPABASE_URL_WSX || !process.env.SUPABASE_SERVICE_KEY_WSX) {
    return;
  }
  const supabase = createClient(
    process.env.SUPABASE_URL_WSX,
    process.env.SUPABASE_SERVICE_KEY_WSX,
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
        return res.status(200).json({
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
  if (!process.env.SEED_WSX) {
    return { error: "Error connecting" };
  }
  const provider = new WsProvider("wss://bsr.zeitgeist.pm");
  const api = await ApiPromise.create({ provider });

  try {
    const keyring = new Keyring({ type: "sr25519" });
    const masterAccount = keyring.addFromUri(process.env.SEED_WSX);

    // const amount = 1_000_000_000_000_0; // 1000 tokens
    const amount = 1_000_000_000_000; // 100 tokens

    const transfer = api.tx.assetManager.transfer(
      wallet,
      { ForeignAsset: wsxID },
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
