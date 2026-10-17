import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Item } from '@furai/shared';

@Injectable()
export class ItemsService {
  private readonly items: Item[] = [
    this.createRecord('Sketch the monorepo'),
    this.createRecord('Connect Zustand to the API'),
  ];

  findAll(): Item[] {
    return [...this.items].reverse();
  }

  create(title: string): Item {
    const item = this.createRecord(title);
    this.items.push(item);
    return item;
  }

  private createRecord(title: string): Item {
    return {
      id: randomUUID(),
      title,
      createdAt: new Date().toISOString(),
    };
  }
}
