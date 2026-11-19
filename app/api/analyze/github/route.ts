import { responseBuilder } from '@/lib/response';

export async function POST() {
  return responseBuilder.error(
    410,
    'LEGACY_ENDPOINT_DEPRECATED',
    'This endpoint has been retired. Use POST /api/analyze for unified candidate analysis.'
  );
}
