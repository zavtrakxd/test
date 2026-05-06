/* Frontend → backend connection settings.
 * The frontend is served from the same origin as the backend, so API_BASE is
 * empty (relative URLs). The Authorization header is consumed by the upstream
 * tunnel's HTTP Basic auth, so our JWT travels in X-Auth-Token instead. */
window.CONFIG = {
  API_BASE: "",
  TUNNEL_BASIC_AUTH: "user:742382b9c6812d9cac264d6240721b8d",
};
