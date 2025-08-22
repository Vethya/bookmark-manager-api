import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { TestHelpers } from '../../test-utils/test-helpers';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = TestHelpers.createMockConfigService();
    const mockPrismaService = TestHelpers.createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
    };

    it('should return user data if user exists', async () => {
      const mockUser = TestHelpers.createTestUser({
        id: payload.sub,
        email: payload.email,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true, createdAt: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true, createdAt: true },
      });
    });
  });
});
