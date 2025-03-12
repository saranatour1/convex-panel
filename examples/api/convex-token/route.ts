import { NextResponse } from 'next/server';
import { getConvexToken } from 'convex-panel/utils/getConvexToken';

export async function GET() {
  try {
    const accessToken = await getConvexToken();
    
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