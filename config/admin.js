module.exports = ({ env }) => ({
  // Live Preview: without this, Content Manager preview requests 500 with "Preview config not found".
  // Set enabled: true and add config.handler + config.allowedOrigins when you want real preview URLs.
  preview: {
    enabled: false,
  },
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
});
