import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBookmarkDto: CreateBookmarkDto) {
    const { tags, ...bookmarkData } = createBookmarkDto;

    return this.prisma.bookmark.create({
      data: {
        ...bookmarkData,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
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
  }

  async findAll(userId: string, query: QueryBookmarkDto) {
    const { search, tags, page = '1', limit = '10' } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bookmarks = await this.prisma.bookmark.findMany({
      where,
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
      skip,
      take: limitNum,
    });

    // Parse tags and filter by tags if specified
    let filteredBookmarks = bookmarks.map((bookmark) => ({
      ...bookmark,
      tags: JSON.parse(bookmark.tags || '[]'),
    }));

    if (tags && tags.length > 0) {
      filteredBookmarks = filteredBookmarks.filter((bookmark) =>
        tags.some((tag) => bookmark.tags.includes(tag)),
      );
    }

    const total = await this.prisma.bookmark.count({ where });

    return {
      bookmarks: filteredBookmarks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id },
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

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('You can only access your own bookmarks');
    }

    return {
      ...bookmark,
      tags: JSON.parse(bookmark.tags || '[]'),
    };
  }

  async update(
    id: string,
    userId: string,
    updateBookmarkDto: UpdateBookmarkDto,
  ) {
    const bookmark = await this.findOne(id, userId);

    const { tags, ...updateData } = updateBookmarkDto;

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags && { tags: JSON.stringify(tags) }),
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
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check if bookmark exists and belongs to user

    return this.prisma.bookmark.delete({
      where: { id },
    });
  }

  async getAllTags(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      select: { tags: true },
    });

    const allTags = bookmarks
      .map((bookmark) => JSON.parse(bookmark.tags || '[]'))
      .flat()
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .sort();

    return { tags: allTags };
  }
}
