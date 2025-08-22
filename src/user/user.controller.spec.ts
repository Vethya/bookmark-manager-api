import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TestHelpers } from '../test-utils/test-helpers';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUser = TestHelpers.createTestUser();
  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
        _count: {
          bookmarks: 5,
        },
      };

      userService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockRequest);

      expect(userService.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockProfile);
    });

    it('should propagate errors from user service', async () => {
      const error = new Error('Profile not found');
      userService.getProfile.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(error);
    });
  });
});
