import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

describe('Auth Integration Tests (Mock DB)', () => {
  let app: INestApplication;
  let prismaService: jest.Mocked<PrismaService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AuthModule,
      ],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $connect: jest.fn(),
            $disconnect: jest.fn(),
          },
        },
      ],
    }).compile();

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

  describe('POST /auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: validRegisterData.email,
        username: validRegisterData.username,
        createdAt: new Date(),
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: validRegisterData.email,
        username: validRegisterData.username,
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 if user already exists', async () => {
      const existingUser = {
        id: 'existing-user-123',
        email: validRegisterData.email,
        username: validRegisterData.username,
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findFirst.mockResolvedValue(existingUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const invalidData = { ...validRegisterData, password: '123' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for missing fields', async () => {
      const invalidData = { email: 'test@example.com' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        password: '$2a$12$valid.hashed.password', // Mock hashed password
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return true for valid password
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: userData.email,
        username: userData.username,
      });
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        password: '$2a$12$valid.hashed.password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false for invalid password
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const loginData = {
        email: userData.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const loginData = {
        email: 'nonexistent@example.com',
        password: userData.password,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: userData.password,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });
  });
});
