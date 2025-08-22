import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestHelpers } from '../test-utils/test-helpers';

describe('BookmarkService', () => {
  let service: BookmarkService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = TestHelpers.createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookmarkService>(BookmarkService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createBookmarkDto = {
      title: 'Test Bookmark',
      url: 'https://example.com',
      description: 'Test description',
      tags: ['test', 'bookmark'],
    };

    it('should create a bookmark successfully', async () => {
      const mockBookmark = TestHelpers.createTestBookmark(userId);
      prismaService.bookmark.create.mockResolvedValue(mockBookmark);

      const result = await service.create(userId, createBookmarkDto);

      expect(prismaService.bookmark.create).toHaveBeenCalledWith({
        data: {
          title: createBookmarkDto.title,
          url: createBookmarkDto.url,
          description: createBookmarkDto.description,
          tags: JSON.stringify(createBookmarkDto.tags),
          userId,
        },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockBookmark);
    });

    it('should create a bookmark with empty tags if none provided', async () => {
      const dtoWithoutTags = { ...createBookmarkDto };
      delete dtoWithoutTags.tags;
      const mockBookmark = TestHelpers.createTestBookmark(userId, {
        tags: JSON.stringify([]),
      });
      prismaService.bookmark.create.mockResolvedValue(mockBookmark);

      await service.create(userId, dtoWithoutTags);

      expect(prismaService.bookmark.create).toHaveBeenCalledWith({
        data: {
          title: dtoWithoutTags.title,
          url: dtoWithoutTags.url,
          description: dtoWithoutTags.description,
          tags: JSON.stringify([]),
          userId,
        },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return paginated bookmarks with default pagination', async () => {
      const mockBookmarks = [
        TestHelpers.createTestBookmark(userId),
        TestHelpers.createTestBookmark(userId, { id: 'bookmark-2' }),
      ];
      const totalCount = 2;

      prismaService.bookmark.findMany.mockResolvedValue(mockBookmarks);
      prismaService.bookmark.count.mockResolvedValue(totalCount);

      const result = await service.findAll(userId, {});

      expect(prismaService.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.bookmarks).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: totalCount,
        totalPages: 1,
      });
    });

    it('should filter bookmarks by search term', async () => {
      const mockBookmarks = [TestHelpers.createTestBookmark(userId)];
      prismaService.bookmark.findMany.mockResolvedValue(mockBookmarks);
      prismaService.bookmark.count.mockResolvedValue(1);

      await service.findAll(userId, { search: 'test' });

      expect(prismaService.bookmark.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
            { url: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle custom pagination', async () => {
      const mockBookmarks = [TestHelpers.createTestBookmark(userId)];
      prismaService.bookmark.findMany.mockResolvedValue(mockBookmarks);
      prismaService.bookmark.count.mockResolvedValue(25);

      const result = await service.findAll(userId, { page: '3', limit: '5' });

      expect(prismaService.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (3-1) * 5
        take: 5,
      });
      expect(result.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
    });
  });

  describe('findOne', () => {
    const bookmarkId = 'bookmark-123';
    const userId = 'user-123';

    it('should return a bookmark if it exists and belongs to user', async () => {
      const mockBookmark = TestHelpers.createTestBookmark(userId, {
        id: bookmarkId,
      });
      prismaService.bookmark.findUnique.mockResolvedValue(mockBookmark);

      const result = await service.findOne(bookmarkId, userId);

      expect(prismaService.bookmark.findUnique).toHaveBeenCalledWith({
        where: { id: bookmarkId },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        ...mockBookmark,
        tags: JSON.parse(mockBookmark.tags),
      });
    });

    it('should throw NotFoundException if bookmark does not exist', async () => {
      prismaService.bookmark.findUnique.mockResolvedValue(null);

      await expect(service.findOne(bookmarkId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if bookmark belongs to another user', async () => {
      const mockBookmark = TestHelpers.createTestBookmark('other-user', {
        id: bookmarkId,
      });
      prismaService.bookmark.findUnique.mockResolvedValue(mockBookmark);

      await expect(service.findOne(bookmarkId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const bookmarkId = 'bookmark-123';
    const userId = 'user-123';
    const updateDto = {
      title: 'Updated Title',
      tags: ['updated', 'tag'],
    };

    it('should update a bookmark successfully', async () => {
      const existingBookmark = TestHelpers.createTestBookmark(userId, {
        id: bookmarkId,
      });
      const updatedBookmark = { ...existingBookmark, ...updateDto };

      // Mock findOne call (which is called internally)
      prismaService.bookmark.findUnique.mockResolvedValue(existingBookmark);
      prismaService.bookmark.update.mockResolvedValue(updatedBookmark);

      const result = await service.update(bookmarkId, userId, updateDto);

      expect(prismaService.bookmark.update).toHaveBeenCalledWith({
        where: { id: bookmarkId },
        data: {
          title: updateDto.title,
          tags: JSON.stringify(updateDto.tags),
        },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedBookmark);
    });

    it('should throw error if bookmark does not exist or does not belong to user', async () => {
      prismaService.bookmark.findUnique.mockResolvedValue(null);

      await expect(
        service.update(bookmarkId, userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const bookmarkId = 'bookmark-123';
    const userId = 'user-123';

    it('should remove a bookmark successfully', async () => {
      const existingBookmark = TestHelpers.createTestBookmark(userId, {
        id: bookmarkId,
      });

      prismaService.bookmark.findUnique.mockResolvedValue(existingBookmark);
      prismaService.bookmark.delete.mockResolvedValue(existingBookmark);

      const result = await service.remove(bookmarkId, userId);

      expect(prismaService.bookmark.delete).toHaveBeenCalledWith({
        where: { id: bookmarkId },
      });
      expect(result).toEqual(existingBookmark);
    });

    it('should throw error if bookmark does not exist or does not belong to user', async () => {
      prismaService.bookmark.findUnique.mockResolvedValue(null);

      await expect(service.remove(bookmarkId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllTags', () => {
    const userId = 'user-123';

    it('should return unique tags from user bookmarks', async () => {
      const mockBookmarks = [
        TestHelpers.createTestBookmark(userId, {
          tags: JSON.stringify(['tag1', 'tag2']),
        }),
        TestHelpers.createTestBookmark(userId, {
          tags: JSON.stringify(['tag2', 'tag3']),
        }),
      ];

      prismaService.bookmark.findMany.mockResolvedValue(mockBookmarks);

      const result = await service.getAllTags(userId);

      expect(prismaService.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { tags: true },
      });
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return empty array if no bookmarks exist', async () => {
      prismaService.bookmark.findMany.mockResolvedValue([]);

      const result = await service.getAllTags(userId);

      expect(result.tags).toEqual([]);
    });
  });
});
