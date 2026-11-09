import { NextRequest, NextResponse } from "next/server";

const portalPrefix = "/_owner";

function notFound(): NextResponse {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const portalSlug = process.env.ADMIN_PORTAL_SLUG;

  // Do not accidentally leave a production admin screen discoverable when its
  // private entry value has not been configured. Local development keeps the
  // convenient /admin route because it has no public exposure.
  if (!portalSlug) {
    return process.env.NODE_ENV === "production" ? notFound() : NextResponse.next();
  }

  // The known route must never expose the portal in a production deployment.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return notFound();
  }

  const requestedSlug = pathname.slice(`${portalPrefix}/`.length);
  if (requestedSlug !== portalSlug) return notFound();

  // Keep the private URL in the browser while serving the existing admin UI.
  const destination = request.nextUrl.clone();
  destination.pathname = "/admin";
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/admin/:path*", "/_owner/:path*"],
};
