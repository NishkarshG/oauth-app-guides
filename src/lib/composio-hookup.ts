// From Composio's docs, not the agent, so these never vary between guides.
export const COMPOSIO_REDIRECT_URI = "https://backend.composio.dev/api/v3/toolkits/auth/callback";
export const COMPOSIO_AUTH_DOCS = "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs";

export const COMPOSIO_STEPS = [
  `Register this redirect URI in the provider's app settings: ${COMPOSIO_REDIRECT_URI}. It must match your Composio auth config exactly, or you will get redirect_uri_mismatch.`,
  "In the Composio dashboard, click Create Auth Config and choose this toolkit.",
  "Select the OAuth2 scheme and turn on Use your own developer credentials.",
  "Enter the client ID, client secret and redirect URI, then click Create. Keep the ac_... ID it gives you.",
  "Start a connection with that auth config ID and authorize with a test account.",
];
