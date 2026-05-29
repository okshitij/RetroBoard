import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const pubClient = createClient({ url: redisUrl });
export const subClient = pubClient.duplicate();
export const redisClient = pubClient.duplicate();

export const connectRedis = async (): Promise<void> => {
  try {
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      redisClient.connect(),
    ]);
    console.log('Connected to Redis successfully.');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
};
