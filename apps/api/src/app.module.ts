import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ItemsModule } from './items/items.module.js';
import { ProductsModule } from './products/products.module.js';

@Module({
  imports: [ItemsModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
