import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestHelpers } from '../test-utils/test-helpers';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrismaService = TestHelpers.createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const testUser = TestHelpers.createTestUser();
      const mockToken = 'mockJwtToken';

      prismaService.user.findFirst.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      prismaService.user.create.mockResolvedValue(testUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: testUser.email,
        sub: testUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: testUser,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = TestHelpers.createTestUser();
      prismaService.user.findFirst.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const testUser = TestHelpers.createTestUser();
      const mockToken = 'mockJwtToken';

      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(testUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        email: testUser.email,
        sub: testUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: testUser.id,
          email: testUser.email,
          username: testUser.username,
          createdAt: testUser.createdAt,
        },
      });
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user data without password if credentials are valid', async () => {
      const testUser = {
        ...TestHelpers.createTestUser(),
        password: 'hashedPassword',
      };

      prismaService.user.findUnique.mockResolvedValue(testUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        testUser.password,
      );
      expect(result).toEqual({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      });
    });

    it('should return null if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const testUser = {
        ...TestHelpers.createTestUser(),
        password: 'hashedPassword',
      };

      prismaService.user.findUnique.mockResolvedValue(testUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        testUser.password,
      );
      expect(result).toBeNull();
    });
  });
});
