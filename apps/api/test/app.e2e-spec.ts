import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from './../src/configure-app.js';
import { AppModule } from './../src/app.module.js';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'ok',
          service: 'furai-api',
        });
      });
  });

  it('POST /api/items rejects an empty title', () => {
    return request(app.getHttpServer())
      .post('/api/items')
      .send({ title: '   ' })
      .expect(400);
  });

  it('POST /api/items creates a note that GET /api/items returns', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/items')
      .send({ title: 'Ship the first note' })
      .expect(201);

    expect(created.body).toMatchObject({ title: 'Ship the first note' });

    const list = await request(app.getHttpServer())
      .get('/api/items')
      .expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.id,
          title: 'Ship the first note',
        }),
      ]),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
