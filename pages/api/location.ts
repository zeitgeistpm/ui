import { NextApiRequest, NextApiResponse } from "next";

export default function getIPLocation(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const country = request.headers["x-vercel-ip-country"];
  const region = request.headers["x-vercel-ip-country-region"];
  const city = request.headers["x-vercel-ip-city"];
  const ip = request.headers["x-forwarded-for"];

  response.status(200).json({
    body: {
      country: country,
      region: region,
      city: city,
      ip: ip,
    },
  });
}
