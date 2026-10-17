import { ItemsService } from './items.service.js';

describe('ItemsService', () => {
  it('returns seeded notes and newly created ones', () => {
    const service = new ItemsService();
    const created = service.create('Write the store');

    expect(created.title).toBe('Write the store');
    expect(service.findAll()[0]).toMatchObject({
      id: created.id,
      title: 'Write the store',
    });
    expect(service.findAll().length).toBeGreaterThan(1);
  });
});
