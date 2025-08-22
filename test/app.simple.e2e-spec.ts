import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App E2E Tests (Mock DB)', () => {
  let app: INestApplication;
  let prismaService: jest.Mocked<PrismaService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        bookmark: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          count: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('/ (GET)', async () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Basic User Flow', () => {
    it('should handle user registration and authentication flow', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        createdAt: new Date(),
      };

      // Mock user registration
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      // 1. Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('access_token');
      expect(registerResponse.body.user).toMatchObject({
        email: userData.email,
        username: userData.username,
      });

      const { access_token } = registerResponse.body;

      // Mock user for authentication
      const fullMockUser = {
        ...mockUser,
        password: '$2a$12$hashed.password',
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(fullMockUser);

      // Mock bcrypt for login
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // 2. Login with same credentials
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');

      // Mock user profile data
      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
        _count: { bookmarks: 0 },
      };

      prismaService.user.findUnique.mockResolvedValue(mockProfile);

      // 3. Get user profile
      const profileResponse = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        email: userData.email,
        username: userData.username,
      });
    });

    it('should handle bookmark operations', async () => {
      const userData = {
        email: 'bookmark@example.com',
        username: 'bookmarkuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-bookmark-123',
        email: userData.email,
        username: userData.username,
        createdAt: new Date(),
      };

      // Setup user registration
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const { access_token } = registerResponse.body;

      // Test bookmark creation
      const bookmarkData = {
        title: 'Test Bookmark',
        url: 'https://example.com',
        description: 'Test description',
        tags: ['test', 'bookmark'],
      };

      const mockBookmark = {
        id: 'bookmark-123',
        title: bookmarkData.title,
        url: bookmarkData.url,
        description: bookmarkData.description,
        tags: JSON.stringify(bookmarkData.tags),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.bookmark.create.mockResolvedValue(mockBookmark);

      const createResponse = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${access_token}`)
        .send(bookmarkData)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        title: bookmarkData.title,
        url: bookmarkData.url,
        description: bookmarkData.description,
      });

      // Test getting bookmarks
      prismaService.bookmark.findMany.mockResolvedValue([mockBookmark]);
      prismaService.bookmark.count.mockResolvedValue(1);

      const getResponse = await request(app.getHttpServer())
        .get('/bookmarks')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('bookmarks');
      expect(getResponse.body).toHaveProperty('pagination');
    });

    it('should handle authentication errors', async () => {
      // Test accessing protected routes without token
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);

      await request(app.getHttpServer())
        .get('/bookmarks')
        .expect(401);

      await request(app.getHttpServer())
        .post('/bookmarks')
        .send({ title: 'Test', url: 'https://example.com' })
        .expect(401);
    });

    it('should handle validation errors', async () => {
      // Test registration with invalid data
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab', // too short
          password: '123', // too short
        })
        .expect(400);

      // Test login with invalid data
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });
});
