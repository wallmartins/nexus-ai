const toNumber = (value: string | undefined, defaultValue: number): number => {
  const parsed = parseInt(value || String(defaultValue), 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export const throttlerConfig = {
  default: {
    ttl: toNumber(process.env.RATE_LIMIT_DEFAULT_TTL, 60) * 1000,
    limit: toNumber(process.env.RATE_LIMIT_DEFAULT_LIMIT, 10_000),
  },
  chat: {
    ttl: toNumber(process.env.RATE_LIMIT_CHAT_TTL, 60) * 1000,
    limit: toNumber(process.env.RATE_LIMIT_CHAT_LIMIT, 100),
  },
  upload: {
    ttl: toNumber(process.env.RATE_LIMIT_UPLOAD_TTL, 60) * 1000,
    limit: toNumber(process.env.RATE_LIMIT_UPLOAD_LIMIT, 20),
  },
};
