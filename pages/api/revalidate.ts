import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  console.log(process.env.REVALIDATION_TOKEN);
  // Check for secret to confirm this is a valid request
  if (request.query.token !== process.env.REVALIDATION_TOKEN) {
    return response.status(401).json({ message: "Invalid token" });
  }

  try {
    await response.revalidate("/");
    return response.json({ success: true, revalidated: true });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return response.status(500).send("Error revalidating");
  }
}
