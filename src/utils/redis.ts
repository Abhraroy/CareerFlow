import { Redis } from '@upstash/redis'

const redisUrl =
  (typeof process !== 'undefined' &&
    (process.env?.UPSTASH_REDIS_REST_URL || process.env?.VITE_UPSTASH_REDIS_REST_URL)) ||
  ''

const redisToken =
  (typeof process !== 'undefined' &&
    (process.env?.UPSTASH_REDIS_REST_TOKEN || process.env?.VITE_UPSTASH_REDIS_REST_TOKEN)) ||
  ''

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null
