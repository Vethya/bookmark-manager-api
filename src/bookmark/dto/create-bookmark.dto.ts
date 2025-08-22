import { IsNotEmpty, IsOptional, IsUrl, IsArray } from 'class-validator';

export class CreateBookmarkDto {
  @IsNotEmpty()
  title: string;

  @IsUrl()
  url: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
