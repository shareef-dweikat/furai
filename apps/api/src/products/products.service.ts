import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDetails, ProductSummary } from '@furai/shared';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150';

@Injectable()
export class ProductsService {
  private readonly products: ProductDetails[] = [
    {
      id: 1,
      name: 'Product 1',
      price: 100,
      image: PLACEHOLDER_IMAGE,
      color: 'oak',
      model: 'chair',
    },
    {
      id: 2,
      name: 'Product 2',
      price: 200,
      image: PLACEHOLDER_IMAGE,
      color: 'walnut',
      model: 'table',
    },
    {
      id: 3,
      name: 'Product 3',
      price: 300,
      image: PLACEHOLDER_IMAGE,
      color: 'linen',
      model: 'closet',
    },
  ];

  findAll(): ProductSummary[] {
    return this.products.map(({ id, name, price, image }) => ({
      id,
      name,
      price,
      image,
    }));
  }

  findOne(id: number): ProductDetails {
    const product = this.products.find((entry) => entry.id === id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
