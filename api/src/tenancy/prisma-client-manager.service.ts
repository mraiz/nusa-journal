import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { RegistryPrismaService } from './registry-prisma.service';
import * as crypto from 'crypto';

interface TenantConnection {
  client: PrismaClient;
  pool: Pool;
  lastUsed: Date;
}

@Injectable()
export class PrismaClientManager {
  private readonly logger = new Logger(PrismaClientManager.name);
  private clients: Map<string, TenantConnection> = new Map();
  private readonly MAX_CONNECTIONS = 50; // Maximum concurrent tenant connections
  private readonly CONNECTION_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(private registryPrisma: RegistryPrismaService) {
    // Cleanup stale connections every 5 minutes
    setInterval(() => this.cleanupStaleConnections(), 5 * 60 * 1000);
  }

  /**
   * Get or create Prisma client for a specific tenant
   */
  async getClient(tenantSlug: string): Promise<PrismaClient> {
    // Return cached client if exists and is recent
    const cached = this.clients.get(tenantSlug);
    if (cached) {
      cached.lastUsed = new Date();
      return cached.client;
    }

    // Check connection limit
    if (this.clients.size >= this.MAX_CONNECTIONS) {
      await this.evictLeastRecentlyUsed();
    }

    // Fetch tenant configuration from registry
    const tenant = await this.registryPrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantSlug}' not found`);
    }

    if (tenant.status !== 'ACTIVE' && tenant.status !== 'MIGRATING') {
      throw new NotFoundException(`Tenant '${tenantSlug}' is not active (status: ${tenant.status})`);
    }

    // Decrypt database credentials
    const dbPassword = this.decrypt(tenant.dbPassword);

    // Build connection string
    const databaseUrl = `postgresql://${tenant.dbUsername}:${encodeURIComponent(dbPassword)}@${tenant.dbHost}:${tenant.dbPort}/${tenant.dbName}?schema=public&connection_limit=10`;

    this.logger.log(`Creating new connection for tenant: ${tenantSlug}`);

    // Create PostgreSQL pool and adapter
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    // Create Prisma client with adapter
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    await client.$connect();

    // Cache client with pool
    this.clients.set(tenantSlug, {
      client,
      pool,
      lastUsed: new Date(),
    });

    this.logger.log(`✅ Connected to tenant database: ${tenantSlug} (${tenant.dbName})`);

    return client;
  }

  /**
   * Disconnect specific tenant
   */
  async disconnect(tenantSlug: string): Promise<void> {
    const connection = this.clients.get(tenantSlug);
    if (connection) {
      await connection.client.$disconnect();
      await connection.pool.end();
      this.clients.delete(tenantSlug);
      this.logger.log(`Disconnected tenant: ${tenantSlug}`);
    }
  }

  /**
   * Disconnect all tenants (for app shutdown)
   */
  async disconnectAll(): Promise<void> {
    this.logger.log('Disconnecting all tenant databases...');
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([slug, connection]) => {
        try {
          await connection.client.$disconnect();
        } catch (error) {
          this.logger.error(`Error disconnecting ${slug}:`, error);
        }
      },
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.logger.log('All tenant databases disconnected');
  }

  /**
   * Cleanup connections that haven't been used recently
   */
  private async cleanupStaleConnections(): Promise<void> {
    const now = new Date();
    const staleConnections: string[] = [];

    this.clients.forEach((connection, slug) => {
      const timeSinceLastUse = now.getTime() - connection.lastUsed.getTime();
      if (timeSinceLastUse > this.CONNECTION_TTL) {
        staleConnections.push(slug);
      }
    });

    for (const slug of staleConnections) {
      await this.disconnect(slug);
    }

    if (staleConnections.length > 0) {
      this.logger.log(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Evict least recently used connection when limit is reached
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestSlug: string | null = null;
    let oldestTime = new Date();

    this.clients.forEach((connection, slug) => {
      if (connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed;
        oldestSlug = slug;
      }
    });

    if (oldestSlug) {
      this.logger.warn(`Connection limit reached. Evicting: ${oldestSlug}`);
      await this.disconnect(oldestSlug);
    }
  }

  /**
   * Simple encryption for database passwords (use proper encryption in production)
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-this-in-prod'.padEnd(32, '0'));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt database passwords
   */
  private decrypt(encrypted: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-this-in-prod'.padEnd(32, '0'));
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      activeConnections: this.clients.size,
      maxConnections: this.MAX_CONNECTIONS,
      tenants: Array.from(this.clients.keys()),
    };
  }
}
