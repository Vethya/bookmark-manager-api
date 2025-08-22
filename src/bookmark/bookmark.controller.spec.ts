import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { TestHelpers } from '../test-utils/test-helpers';

describe('BookmarkController', () => {
  let controller: BookmarkController;
  let bookmarkService: jest.Mocked<BookmarkService>;

  const mockUser = TestHelpers.createTestUser();
  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarkController],
      providers: [
        {
          provide: BookmarkService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getAllTags: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookmarkController>(BookmarkController);
    bookmarkService = module.get(BookmarkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createBookmarkDto = {
      title: 'Test Bookmark',
      url: 'https://example.com',
      description: 'Test description',
      tags: ['test'],
    };

    it('should create a bookmark successfully', async () => {
      const mockBookmark = TestHelpers.createTestBookmark(mockUser.id);
      bookmarkService.create.mockResolvedValue(mockBookmark);

      const result = await controller.create(mockRequest, createBookmarkDto);

      expect(bookmarkService.create).toHaveBeenCalledWith(
        mockUser.id,
        createBookmarkDto,
      );
      expect(result).toEqual(mockBookmark);
    });
  });

  describe('findAll', () => {
    const queryDto = {
      search: 'test',
      page: '1',
      limit: '10',
    };

    it('should return paginated bookmarks', async () => {
      const mockResult = {
        bookmarks: [TestHelpers.createTestBookmark(mockUser.id)],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      bookmarkService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockRequest, queryDto);

      expect(bookmarkService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        queryDto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAllTags', () => {
    it('should return all tags for user', async () => {
      const mockTags = { tags: ['tag1', 'tag2', 'tag3'] };
      bookmarkService.getAllTags.mockResolvedValue(mockTags);

      const result = await controller.getAllTags(mockRequest);

      expect(bookmarkService.getAllTags).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockTags);
    });
  });

  describe('findOne', () => {
    const bookmarkId = 'bookmark-123';

    it('should return a single bookmark', async () => {
      const mockBookmark = TestHelpers.createTestBookmark(mockUser.id, {
        id: bookmarkId,
      });
      bookmarkService.findOne.mockResolvedValue(mockBookmark);

      const result = await controller.findOne(bookmarkId, mockRequest);

      expect(bookmarkService.findOne).toHaveBeenCalledWith(
        bookmarkId,
        mockUser.id,
      );
      expect(result).toEqual(mockBookmark);
    });
  });

  describe('update', () => {
    const bookmarkId = 'bookmark-123';
    const updateBookmarkDto = {
      title: 'Updated Title',
      tags: ['updated'],
    };

    it('should update a bookmark successfully', async () => {
      const mockUpdatedBookmark = TestHelpers.createTestBookmark(mockUser.id, {
        id: bookmarkId,
        ...updateBookmarkDto,
      });

      bookmarkService.update.mockResolvedValue(mockUpdatedBookmark);

      const result = await controller.update(
        bookmarkId,
        mockRequest,
        updateBookmarkDto,
      );

      expect(bookmarkService.update).toHaveBeenCalledWith(
        bookmarkId,
        mockUser.id,
        updateBookmarkDto,
      );
      expect(result).toEqual(mockUpdatedBookmark);
    });
  });

  describe('remove', () => {
    const bookmarkId = 'bookmark-123';

    it('should remove a bookmark successfully', async () => {
      const mockDeletedBookmark = TestHelpers.createTestBookmark(mockUser.id, {
        id: bookmarkId,
      });

      bookmarkService.remove.mockResolvedValue(mockDeletedBookmark);

      const result = await controller.remove(bookmarkId, mockRequest);

      expect(bookmarkService.remove).toHaveBeenCalledWith(
        bookmarkId,
        mockUser.id,
      );
      expect(result).toEqual(mockDeletedBookmark);
    });
  });
});
