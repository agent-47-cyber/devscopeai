import { responseBuilder } from '@/lib/response';

export async function GET() {
  return responseBuilder.successEnvelope({
    status: 'online',
    model: 'gemini-2.5-flash-lite',
    latency: '30ms'
  });
}
