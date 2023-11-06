import { isWSX } from "lib/constants";
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" && isWSX) {
    const url = request.nextUrl.clone();
    url.pathname = "/markets";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
