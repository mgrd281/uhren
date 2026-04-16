import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "(not set)";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "(not set)";
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "(not set)";

  // Test if we can reach Google's OIDC discovery endpoint
  let discoveryOk = false;
  let discoveryError = "";
  try {
    const res = await fetch(
      "https://accounts.google.com/.well-known/openid-configuration"
    );
    discoveryOk = res.ok;
    if (!res.ok) discoveryError = `HTTP ${res.status}`;
  } catch (e) {
    discoveryError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    clientId: clientId.slice(0, 10) + "..." + clientId.slice(-10),
    clientSecretLength: clientSecret.length,
    clientSecretFirst3: clientSecret.slice(0, 3),
    clientSecretLast3: clientSecret.slice(-3),
    authSecretLength: authSecret.length,
    discoveryOk,
    discoveryError: discoveryError || undefined,
    nodeEnv: process.env.NODE_ENV,
    authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "(not set)",
    trustHost: process.env.AUTH_TRUST_HOST ?? "(not set)",
  });
}
