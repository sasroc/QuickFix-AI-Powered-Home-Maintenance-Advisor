import cache from '../utils/cache';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface UserCacheData {
  plan: string;
  credits: number;
  subscriptionStatus?: string;
  lastUpdated: number;
}

export interface AIResponseCache {
  steps: string[];
  tools: string[];
  materials: string[];
  estimatedTime: number;
  confidenceScore: number;
  model: string;
  timestamp: number;
}

class CacheService {
  // Cache TTL configurations (in seconds)
  private readonly TTL = {
    USER_DATA: 300,        // 5 minutes - user plan/credits
    AI_RESPONSE: 3600,     // 1 hour - AI responses for similar queries
    STATIC_DATA: 86400,    // 24 hours - static responses
    FIRESTORE_QUERY: 60    // 1 minute - Firestore query results
  };

  /**
   * Generate a cache key for user data
   */
  private getUserCacheKey(uid: string): string {
    return `user:${uid}`;
  }

  /**
   * Generate a cache key for AI responses based on input
   */
  private getAIResponseKey(description: string, plan: string): string {
    // Create a hash of the description to handle similar queries
    const hash = crypto.createHash('md5').update(description.toLowerCase().trim()).digest('hex');
    return `ai:${plan}:${hash}`;
  }

  /**
   * Cache user data (plan, credits, etc.)
   */
  setUserData(uid: string, userData: UserCacheData): void {
    try {
      const key = this.getUserCacheKey(uid);
      cache.set(key, userData, this.TTL.USER_DATA);
      logger.debug(`Cached user data for ${uid}`);
    } catch (error) {
      logger.error('Error caching user data:', error);
    }
  }

  /**
   * Get cached user data
   */
  getUserData(uid: string): UserCacheData | undefined {
    try {
      const key = this.getUserCacheKey(uid);
      const data = cache.get<UserCacheData>(key);
      if (data) {
        logger.debug(`Cache hit for user data: ${uid}`);
      }
      return data;
    } catch (error) {
      logger.error('Error retrieving user data from cache:', error);
      return undefined;
    }
  }

  /**
   * Cache AI response for similar future queries
   */
  setAIResponse(description: string, plan: string, response: AIResponseCache): void {
    try {
      const key = this.getAIResponseKey(description, plan);
      cache.set(key, response, this.TTL.AI_RESPONSE);
      logger.debug(`Cached AI response for plan ${plan}, description hash: ${key}`);
    } catch (error) {
      logger.error('Error caching AI response:', error);
    }
  }

  /**
   * Get cached AI response for similar queries
   */
  getAIResponse(description: string, plan: string): AIResponseCache | undefined {
    try {
      const key = this.getAIResponseKey(description, plan);
      const data = cache.get<AIResponseCache>(key);
      if (data) {
        logger.debug(`Cache hit for AI response: ${key}`);
      }
      return data;
    } catch (error) {
      logger.error('Error retrieving AI response from cache:', error);
      return undefined;
    }
  }

  /**
   * Cache static data with long TTL
   */
  setStaticData(key: string, data: any): void {
    try {
      cache.set(`static:${key}`, data, this.TTL.STATIC_DATA);
      logger.debug(`Cached static data: ${key}`);
    } catch (error) {
      logger.error('Error caching static data:', error);
    }
  }

  /**
   * Get cached static data
   */
  getStaticData<T>(key: string): T | undefined {
    try {
      return cache.get<T>(`static:${key}`);
    } catch (error) {
      logger.error('Error retrieving static data from cache:', error);
      return undefined;
    }
  }

  /**
   * Invalidate user cache (when user data changes)
   */
  invalidateUserData(uid: string): void {
    try {
      const key = this.getUserCacheKey(uid);
      cache.delete(key);
      logger.debug(`Invalidated cache for user: ${uid}`);
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Invalidate all AI responses for a specific plan
   */
  invalidateAIResponses(plan?: string): void {
    try {
      const stats = cache.getStats();
      const keysToDelete = stats.keys.filter(key => {
        if (plan) {
          return key.startsWith(`ai:${plan}:`);
        }
        return key.startsWith('ai:');
      });

      keysToDelete.forEach(key => cache.delete(key));
      logger.debug(`Invalidated ${keysToDelete.length} AI response cache entries`);
    } catch (error) {
      logger.error('Error invalidating AI response cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return cache.getStats();
  }

  /**
   * Clear all cache (use with caution)
   */
  clearAll(): void {
    cache.clear();
    logger.info('Cleared all cache entries');
  }

  /**
   * Warm up cache with commonly accessed data
   */
  warmUp(): void {
    logger.info('Cache service initialized and ready');
    // Could add pre-loading of common repair responses here
  }
}

export default new CacheService(); 