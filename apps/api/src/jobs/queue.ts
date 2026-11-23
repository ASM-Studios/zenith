export const QUEUE_NAME = 'jobs';

export function queueOptions(redisUrl: string) {
  return { connection: { url: redisUrl }, prefix: 'zenith:bull' };
}

export function workerOptions(redisUrl: string) {
  return {
    ...queueOptions(redisUrl),
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
  };
}
