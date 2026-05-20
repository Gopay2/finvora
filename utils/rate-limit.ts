import { headers } from "next/headers";

// Fallback en memoria para desarrollo local
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

/**
 * Rate Limiting robusto compatible con entornos Serverless mediante Redis (Upstash)
 * con fallback elegante a memoria local (Map) para desarrollo.
 */
export async function checkRateLimit(actionName: string, limit: number, windowMs: number): Promise<boolean> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown-ip";
  const key = `${ip}-${actionName}`;
  const now = Date.now();

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Si las variables de Redis existen, usamos Redis (Serverless seguro)
  if (redisUrl && redisToken) {
    try {
      const cleanKey = `ratelimit:${key.replace(/[^a-zA-Z0-9:-]/g, "_")}`;
      
      // Consultamos el contador actual
      const getRes = await fetch(`${redisUrl}/get/${cleanKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      
      const getData = await getRes.json();
      const currentCount = getData.result ? parseInt(getData.result, 10) : 0;

      if (currentCount >= limit) {
        return false; // Límite superado
      }

      // Calculamos la expiración en segundos (mínimo 1 segundo)
      const expireSeconds = Math.max(1, Math.round(windowMs / 1000));
      
      // Pipeline para incrementar y expirar la clave en una sola llamada REST
      await fetch(`${redisUrl}/multi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", cleanKey],
          ["EXPIRE", cleanKey, expireSeconds],
        ]),
      });

      return true;
    } catch (redisError) {
      console.warn("Fallo conexión con Redis en Rate Limiter, usando fallback de memoria:", redisError);
    }
  }

  // 2. Fallback de memoria para desarrollo local
  const windowStart = now - windowMs;

  if (rateLimitMap.size > 1000) {
    rateLimitMap.clear(); // Prevenir fugas de memoria
  }

  const record = rateLimitMap.get(key) || { count: 0, timestamp: now };
  
  if (record.timestamp < windowStart) {
    record.count = 0;
    record.timestamp = now;
  }

  record.count++;
  rateLimitMap.set(key, record);

  return record.count <= limit;
}
