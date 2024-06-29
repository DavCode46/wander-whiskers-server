import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../index';
import dotenv from 'dotenv';
dotenv.config();

beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

describe('Get /api/products', () => {
  it('should return all products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('Get /api/products/:id', () => {
  it('should return a single product', async () => {
    const res = await request(app).get('/api/products/663b582177d9862452a7e28f')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('_id')
    expect(res.body).toHaveProperty('name')
    expect(res.body).toHaveProperty('description')
    expect(res.body).toHaveProperty('quantity')
    expect(res.body).toHaveProperty('price')
    expect(res.body.quantity).toBe(1)
    expect(res.body.price).toBe(20.99)
    expect(res.body).toHaveProperty('features')
  })
})

afterEach(async () => {
  await mongoose.connection.close();
});
