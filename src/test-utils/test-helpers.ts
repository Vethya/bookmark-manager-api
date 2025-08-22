import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export interface TestUser {
  id: string;
  email: string;
  username: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TestHelpers {
  static async createHashedPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 12);
  }

  static async generateTestJWT(user: TestUser, jwtService: JwtService): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return jwtService.sign(payload);
  }

  static createMockConfigService(): Partial<ConfigService> {
    return {
      get: jest.fn().mockImplementation((key: string) => {
        const configs = {
          JWT_SECRET: 'test-jwt-secret-key',
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        };
        return configs[key];
      }),
    };
  }

  static createMockPrismaService(): Partial<PrismaService> {
    return {
      user: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      bookmark: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as any;
  }

  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: 'test-user-id-123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    };
  }

  static createTestBookmark(userId: string, overrides: any = {}) {
    return {
      id: 'test-bookmark-id-123',
      title: 'Test Bookmark',
      url: 'https://example.com',
      description: 'Test description',
      tags: JSON.stringify(['test', 'bookmark']),
      userId,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    };
  }
}
