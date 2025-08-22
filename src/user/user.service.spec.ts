import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestHelpers } from '../test-utils/test-helpers';

describe('UserService', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = TestHelpers.createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    const userId = 'user-123';

    it('should return user profile with bookmark count', async () => {
      const mockUserProfile = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date('2024-01-01'),
        _count: {
          bookmarks: 5,
        },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUserProfile);

      const result = await service.getProfile(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUserProfile);
    });

    it('should return null if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
      });
      expect(result).toBeNull();
    });
  });
});
