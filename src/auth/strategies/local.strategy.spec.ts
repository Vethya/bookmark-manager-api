import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { TestHelpers } from '../../test-utils/test-helpers';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user data if credentials are valid', async () => {
      const mockUser = TestHelpers.createTestUser({ email });
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });
  });
});
