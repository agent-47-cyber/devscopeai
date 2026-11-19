import { createClient } from '@/utils/supabase/server';
import { AuthError } from './errors';
import { responseBuilder } from './response';
import { logger } from './logger';

export type AuthenticatedHandler = (
  req: Request,
  context: { user: any; supabase: any; requestId: string }
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request): Promise<Response> => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const authClient = await createClient(false); // standard client (anon key) for verifying auth JWT
      const authHeader = req.headers.get('authorization') || '';
      const bearerToken = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
      let user = null;
      let authError = null;

      try {
        const result = bearerToken
          ? await authClient.auth.getUser(bearerToken)
          : await authClient.auth.getUser();
        user = result.data?.user;
        authError = result.error;
      } catch (err: any) {
        logger.error({
          requestId,
          action: 'auth_get_user_exception',
          error: err?.message || err
        });
      }

      if (authError || !user) {
        throw new AuthError();
      }

      // Create service role client for server side database operations
      const serviceClient = await createClient(true);

      await serviceClient.from('users').upsert({
        id: user.id,
        email: user.email || '',
        username:
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          (user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`)
      }, { onConflict: 'id' });

      return await handler(req, { user, supabase: serviceClient, requestId });
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        const message = error.issues?.[0]?.message || 'Invalid request payload.';
        return responseBuilder.error(400, 'VALIDATION_ERROR', message);
      }

      if (error.statusCode) {
        logger.warn({
          requestId,
          action: 'auth',
          message: error.userMessage,
          meta: { code: error.code }
        });
        return responseBuilder.error(error.statusCode, error.code, error.userMessage);
      }

      logger.error({
        requestId,
        action: 'unhandled',
        error
      });
      return responseBuilder.error(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
    }
  };
}
