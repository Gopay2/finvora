import { headers } from "next/headers";

// Almacenamiento en memoria para Rate Limiting (por IP)
// Nota: En despliegues Serverless (como Vercel), esto funciona por instancia.
// Para un rate limit global perfecto se recomienda Redis (ej: @upstash/ratelimit).
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function checkRateLimit(actionName: string, limit: number, windowMs: number): Promise<boolean> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown-ip";
  const key = `${ip}-${actionName}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Limpieza básica
  if (rateLimitMap.size > 1000) {
    rateLimitMap.clear(); // Prevenir fugas de memoria si hay muchos ataques
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
