import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { logger } from '@/lib/logger';

export const POST = withAuth(async (req, { user, supabase, requestId }) => {
  logger.info({
    requestId,
    userId: user.id,
    action: 'logout.cleanup',
    message: 'Starting logout data cleanup...'
  });

  // 1. Delete database rows
  const dbPromises = [
    supabase.from('analyses').delete().eq('user_id', user.id),
    supabase.from('chat_histories').delete().eq('user_id', user.id),
    supabase.from('rate_limits').delete().eq('user_id', user.id)
  ];

  await Promise.allSettled(dbPromises);

  // 2. Delete all user uploaded files from storage resumes bucket
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('resumes')
      .list(user.id);

    if (listError) throw listError;

    if (files && files.length > 0) {
      const filePaths = files.map((f: any) => `${user.id}/${f.name}`);
      const { error: removeError } = await supabase.storage
        .from('resumes')
        .remove(filePaths);

      if (removeError) throw removeError;
      
      logger.info({
        requestId,
        userId: user.id,
        action: 'logout.cleanup.storage',
        message: `Deleted ${files.length} resume files from storage.`
      });
    }
  } catch (err: any) {
    logger.warn({
      requestId,
      userId: user.id,
      action: 'logout.cleanup.storage_failed',
      message: `Failed to clear storage files: ${err.message}`
    });
  }

  logger.info({
    requestId,
    userId: user.id,
    action: 'logout.cleanup_success',
    message: 'Data cleanup complete.'
  });

  return responseBuilder.success({ cleaned: true });
});
