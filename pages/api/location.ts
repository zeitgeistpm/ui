import { NextApiRequest, NextApiResponse } from "next";

export default function getIPLocation(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const country = request.headers["x-vercel-ip-country"];
  const region = request.headers["x-vercel-ip-country-region"];
  const city = request.headers["x-vercel-ip-city"];

  response.status(200).json({
    body: {
      country: country,
      region: region,
      city: city,
    },
  });
}
