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

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  create(
    @Request() req,
    @Body(ValidationPipe) createBookmarkDto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.create(req.user.id, createBookmarkDto);
  }

  @Get()
  findAll(@Request() req, @Query() query: QueryBookmarkDto) {
    return this.bookmarkService.findAll(req.user.id, query);
  }

  @Get('tags')
  getAllTags(@Request() req) {
    return this.bookmarkService.getAllTags(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.bookmarkService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body(ValidationPipe) updateBookmarkDto: UpdateBookmarkDto,
  ) {
    return this.bookmarkService.update(id, req.user.id, updateBookmarkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.bookmarkService.remove(id, req.user.id);
  }
}
