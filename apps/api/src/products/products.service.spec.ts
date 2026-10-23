import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  const service = new ProductsService();

  it('returns summaries without color or model', () => {
    expect(service.findAll()).toEqual([
      {
        id: 1,
        name: 'Product 1',
        price: 100,
        image: 'https://via.placeholder.com/150',
      },
      {
        id: 2,
        name: 'Product 2',
        price: 200,
        image: 'https://via.placeholder.com/150',
      },
      {
        id: 3,
        name: 'Product 3',
        price: 300,
        image: 'https://via.placeholder.com/150',
      },
    ]);
  });

  it('returns details for a known id', () => {
    expect(service.findOne(1)).toEqual({
      id: 1,
      name: 'Product 1',
      price: 100,
      image: 'https://via.placeholder.com/150',
      color: 'oak',
      model: 'chair',
    });
  });

  it('throws when the product does not exist', () => {
    expect(() => service.findOne(99)).toThrow(NotFoundException);
  });
});
