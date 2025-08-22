import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TestHelpers } from '../test-utils/test-helpers';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const mockResult = {
        access_token: 'mockToken',
        user: TestHelpers.createTestUser(),
      };

      authService.register.mockResolvedValue(mockResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('Registration failed');
      authService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const testUser = TestHelpers.createTestUser();
      const mockRequest = {
        user: testUser,
      } as any;

      const mockResult = {
        access_token: 'mockToken',
        user: testUser,
      };

      authService.login.mockResolvedValue(mockResult);

      const result = await controller.login(mockRequest);

      expect(authService.login).toHaveBeenCalledWith(testUser);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from auth service', async () => {
      const testUser = TestHelpers.createTestUser();
      const mockRequest = {
        user: testUser,
      } as any;

      const error = new Error('Login failed');
      authService.login.mockRejectedValue(error);

      await expect(controller.login(mockRequest)).rejects.toThrow(error);
    });
  });
});
