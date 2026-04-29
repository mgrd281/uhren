import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { pathname } = (await request.json()) as { pathname: string };

    if (!pathname) {
      return NextResponse.json({ error: "pathname fehlt" }, { status: 400 });
    }

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname,
      maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
      addRandomSuffix: false,
      allowedContentTypes: ["image/*"],
    });

    return NextResponse.json({ clientToken, pathname });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
