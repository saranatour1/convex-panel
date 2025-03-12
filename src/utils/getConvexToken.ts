import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Retrieves the Convex access token from the local config file.
 * This can be used server-side to get the token for authentication.
 * 
 * @returns Promise that resolves to the access token or null if not found
 */
export async function getConvexToken(): Promise<string | null> {
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