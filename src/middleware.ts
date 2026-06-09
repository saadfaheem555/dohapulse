export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login
     * - /api/auth (NextAuth endpoints)
     * - static assets and Next internals
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
