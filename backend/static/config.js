/* Frontend → backend connection settings.
 * The frontend is served from the same origin as the backend, so API_BASE is
 * empty (relative URLs).
 *
 * On the temporary Devin tunnel host the upstream HTTP Basic auth eats the
 * Authorization header, so we send the tunnel creds there and tunnel our JWT
 * via X-Auth-Token. On any other host (Fly.io, Render, HF Spaces, localhost)
 * we use a normal Bearer token.
 */
window.CONFIG = (function () {
  var host = location.host || "";
  var TUNNEL_HOSTS = /devinapps\.com$/i;
  var onTunnel = TUNNEL_HOSTS.test(host);
  return {
    API_BASE: "",
    TUNNEL_BASIC_AUTH: onTunnel ? "user:742382b9c6812d9cac264d6240721b8d" : "",
  };
})();
