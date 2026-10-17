import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import type { CreateItemRequest, Item } from '@furai/shared';
import { ItemsService } from './items.service.js';

const MAX_TITLE_LENGTH = 120;

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(): Item[] {
    return this.itemsService.findAll();
  }

  @Post()
  create(@Body() body: CreateItemRequest): Item {
    const title = typeof body?.title === 'string' ? body.title.trim() : '';

    if (!title) {
      throw new BadRequestException('Title is required');
    }

    if (title.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException(
        `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      );
    }

    return this.itemsService.create(title);
  }
}
