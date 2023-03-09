import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.query.token !== process.env.REVALIDATION_TOKEN) {
    return response.status(401).json({ message: "Invalid token" });
  }

  await response.revalidate("/");
  return response.json({ success: true, revalidated: true });
}
