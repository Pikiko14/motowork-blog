import Redis from "ioredis";

export interface CacheStrategy {
  initClient(): Promise<void>;
  getClient(): Redis;
  setItem(key: string, data: any, expiration?: number): Promise<boolean>;
  getItem<T>(key: string): Promise<T | null>;
  closeConnection(): Promise<void>;
  getKeys(pattern: string): Promise<string[]>;
  deleteKeys(keys: string[]): Promise<void>;
}
