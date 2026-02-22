const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

const ALLOWED_ORIGINS = [
  'https://oscarkalid.com',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 's-maxage=30, stale-while-revalidate=150',
  };
}

async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });

  return response.json();
}

async function getCurrentlyPlaying(accessToken) {
  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204 || response.status > 400) {
    return null;
  }

  const data = await response.json();
  if (!data || !data.item) return null;

  return {
    isPlaying: data.is_playing,
    title: data.item.name,
    artist: data.item.artists.map((a) => a.name).join(', '),
    albumArt: data.item.album.images[1]?.url || data.item.album.images[0]?.url,
    songUrl: data.item.external_urls.spotify,
  };
}

async function getRecentlyPlayed(accessToken) {
  const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status !== 200) return null;

  const data = await response.json();
  if (!data.items || data.items.length === 0) return null;

  const track = data.items[0].track;
  return {
    isPlaying: false,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    albumArt: track.album.images[1]?.url || track.album.images[0]?.url,
    songUrl: track.external_urls.spotify,
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));

  try {
    const { access_token } = await getAccessToken();

    let result = await getCurrentlyPlaying(access_token);
    if (!result) {
      result = await getRecentlyPlayed(access_token);
    }

    if (!result) {
      return res.status(200).json({ isPlaying: false });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Spotify API error:', error);
    return res.status(500).json({ error: 'Failed to fetch Spotify data' });
  }
}
