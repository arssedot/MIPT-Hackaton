import { guard } from '@/server/auth';
import { modelConfigured } from '@/server/analysis/model';
export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  return Response.json({
    modelConfigured: modelConfigured(),
    model: process.env.LLM_MODEL || null,
  });
}
