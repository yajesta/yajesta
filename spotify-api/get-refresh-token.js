/**
 * One-time helper to exchange an authorization code for a refresh token.
 *
 * Usage:
 *   1. Visit this URL in a browser (replace YOUR_CLIENT_ID):
 *      https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://oscarkalid.com/callback&scope=user-read-currently-playing%20user-read-recently-played
 *
 *   2. After approving, grab the ?code= value from the redirect URL.
 *
 *   3. Run: node get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET> <CODE>
 */

const [clientId, clientSecret, code] = process.argv.slice(2);

if (!clientId || !clientSecret || !code) {
  console.error('Usage: node get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET> <CODE>');
  process.exit(1);
}

fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'https://oscarkalid.com/callback',
    client_id: clientId,
    client_secret: clientSecret,
  }),
})
  .then((r) => r.json())
  .then((data) => {
    if (data.refresh_token) {
      console.log('\nRefresh token:', data.refresh_token);
      console.log('\nSet these environment variables on Vercel:');
      console.log(`  SPOTIFY_CLIENT_ID=${clientId}`);
      console.log(`  SPOTIFY_CLIENT_SECRET=${clientSecret}`);
      console.log(`  SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
    } else {
      console.error('Error:', data);
    }
  });
