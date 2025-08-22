import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
  };
}

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body(ValidationPipe) createBookmarkDto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.create(req.user.id, createBookmarkDto);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryBookmarkDto,
  ) {
    return this.bookmarkService.findAll(req.user.id, query);
  }

  @Get('tags')
  getAllTags(@Request() req: AuthenticatedRequest) {
    return this.bookmarkService.getAllTags(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookmarkService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body(ValidationPipe) updateBookmarkDto: UpdateBookmarkDto,
  ) {
    return this.bookmarkService.update(id, req.user.id, updateBookmarkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookmarkService.remove(id, req.user.id);
  }
}
