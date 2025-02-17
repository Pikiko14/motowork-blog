import Redis from "ioredis";
import { CacheStrategy } from "../../types/cache.interface";
import configuration from "../../../configuration/configuration";

export class RedisImplement implements CacheStrategy {
  private static instance: RedisImplement; // Instancia única de la clase
  private clientRedis: Redis;

  private constructor() {
    this.clientRedis = new Redis({
      host: configuration.get("REDIS_HOST"),
      port: parseInt(configuration.get("REDIS_PORT")),
    });

    this.clientRedis.on("connect", () => console.log("🔗 Conectado a Redis"));
    this.clientRedis.on("error", (err) =>
      console.error("❌ Redis Error:", err)
    );
  }

  public static getInstance(): RedisImplement {
    if (!RedisImplement.instance) {
      RedisImplement.instance = new RedisImplement();
    }
    return RedisImplement.instance;
  }

  public async initClient(): Promise<void> {
    if (!this.clientRedis) {
      this.clientRedis = new Redis({
        host: configuration.get("REDIS_HOST"),
        port: parseInt(configuration.get("REDIS_PORT")),
      });
    }
    console.log("✅ Cliente Redis inicializado");
  }

  public getClient(): Redis {
    return this.clientRedis;
  }

  public async setItem(
    key: string,
    data: any,
    expiration = 600
  ): Promise<boolean> {
    try {
      await this.clientRedis.set(key, JSON.stringify(data), "EX", expiration);
      return true;
    } catch (error) {
      console.error("❌ Error al guardar en Redis:", error);
      return false;
    }
  }

  public async getItem<T>(key: string): Promise<T | null> {
    try {
      const data = await this.clientRedis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Error al obtener de Redis:", error);
      return null;
    }
  }

  public async closeConnection(): Promise<void> {
    await this.clientRedis.quit();
    console.log("🔌 Conexión con Redis cerrada");
  }

  public async getKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const stream = this.clientRedis.scanStream({
        match: pattern,
        count: 1000,
      });

      const keys: string[] = [];
      stream.on("data", (resultKeys) => {
        keys.push(...resultKeys);
      });
      stream.on("end", () => resolve(keys));
      stream.on("error", (err) => reject(err));
    });
  }

  public async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.clientRedis.del(keys);
    }
  }
}
