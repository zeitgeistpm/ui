import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get("asset");
  console.log("asset:", asset);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`,
    // "https://api.coingecko.com/api/v33/simple/price?ids=zeitgeist&vs_currsfsdfs",
  ).catch((e) => console.log(e));

  const json = await res!.json();

  const price = asset ? json[asset]?.usd : null;
  console.log(price);

  return NextResponse.json(
    {
      body: { price: price, asset },
      //   body: { asset },
      query: request.nextUrl.search,
      cookies: request.cookies.getAll(),
    },
    {
      status: 200,
      headers: {
        // "Vercel-CDN-Cache-Control": "public, s-maxage=300", //Vercel's Edge Cache to have a TTL (Time To Live) of 300 seconds
        // "CDN-Cache-Control": "public, s-maxage=60", //Downstream CDNs to have a TTL of 60 seconds
        // "Cache-Control": "public, s-maxage=10, stale-while-revalidate=10", //Clients to have a TTL of 10 seconds
      },
    },
  );
}
