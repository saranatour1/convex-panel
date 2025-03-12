import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function getAccessToken() {
  const homeDir = os.homedir();
  const filePath = path.join(homeDir, ".convex", "config.json");

  try {
    const data = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(data);

    if (typeof json !== "object" || json === null) {
      throw new Error("Invalid JSON format");
    }
    if (!("accessToken" in json) || typeof json.accessToken !== "string") {
      throw new Error("Missing or invalid accessToken");
    }
    return json.accessToken;
  } catch (error) {
    console.error("Error reading access token:", error);
    return null;
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Convex authentication required. Run npx convex login in your terminal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
} 