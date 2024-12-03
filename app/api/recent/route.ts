import { cookies } from 'next/headers';

export async function GET() {
  const accessToken = cookies().get('spotify_access_token')?.value;

  if (!accessToken) {
    return Response.json(
      { error: "Spotify access token not found in cookies" },
      { status: 401 }
    );
  }

  try {
    // First, try to fetch currently playing track
    const currentlyPlayingResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Add error handling for different response statuses
    if (currentlyPlayingResponse.status === 204) {
      // No track is currently playing
      return await fetchRecentlyPlayed(accessToken);
    }

    if (currentlyPlayingResponse.ok) {
      const currentlyPlayingData = await currentlyPlayingResponse.json();
      
      // Check if there's a currently playing track
      if (currentlyPlayingData.item) {
        return Response.json({ 
          tracks: [currentlyPlayingData.item],
          isCurrentlyPlaying: true 
        });
      }
    }

    // If no currently playing track, fetch recently played tracks
    return await fetchRecentlyPlayed(accessToken);

  } catch (error) {
    console.error("Error fetching track:", error);
    return Response.json(
      { error: "Failed to fetch track", tracks: [] },
      { status: 500 }
    );
  }
}

// Helper function to fetch recently played tracks
async function fetchRecentlyPlayed(accessToken: string) {
  try {
    const recentlyPlayedResponse = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!recentlyPlayedResponse.ok) {
      throw new Error(`Spotify API error: ${recentlyPlayedResponse.statusText}`);
    }

    const recentData = await recentlyPlayedResponse.json();
    
    // If there are recently played tracks, return them
    return Response.json({ 
      tracks: recentData.items.map((item: any) => item.track),
      isCurrentlyPlaying: false 
    });
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    return Response.json(
      { error: "Failed to fetch recently played tracks", tracks: [] },
      { status: 500 }
    );
  }
}