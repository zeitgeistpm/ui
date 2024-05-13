import { createClient } from "@supabase/supabase-js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { campaignID } from "lib/constants";
import * as jose from "jose";

export default async function checkNewUser(req, res) {
  try {
    const idToken = req.headers.authorization?.split(" ")[1] || "";
    const app_pub_key = req.body.appPubKey;
    const jwks = jose.createRemoteJWKSet(
      new URL("https://api.openlogin.com/jwks"),
    );
    const jwtDecoded = await jose.jwtVerify(idToken, jwks, {
      algorithms: ["ES256"],
    });

    if ((jwtDecoded.payload as any).wallets[0].public_key == app_pub_key) {
      // verified
      if (
        !process.env.SUPABASE_URL_WSX ||
        !process.env.SUPABASE_SERVICE_KEY_WSX
      ) {
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
        const response = await supabase
          .from("users")
          .insert({ wallet: wallet });
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
    } else {
      // verification failed
      res.status(401).json({ name: "Validation Failed" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const amount = 1_000_000_000_000_000; // 100,000 tokens
    // const amount = 1_000_000_000_000; // 100 tokens
    // 10000000000000 min amoount
    const transfer = api.tx.campaignAssets.transfer(campaignID, wallet, amount);

    const txHash = await transfer.signAndSend(masterAccount);

    return { success: true, txHash: txHash.toString() };
  } catch (error) {
    return { error: error.toString() };
  } finally {
    provider.disconnect();
  }
}
