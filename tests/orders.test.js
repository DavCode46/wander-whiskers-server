import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../index';
import dotenv from 'dotenv';
dotenv.config();
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import User from '../models/User.model';

let token;
let userId;
let productId;

beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Crear un usuario de prueba y obtener el token de autenticación
  const user = await User.create({
    username: "testuser",
    email: "test@example.com",
    password: "TestPassword123!",
  });
  userId = user._id;

  const res = await request(app).post("/api/users/login").send({
    email: "test@example.com",
    password: "TestPassword123!",
  });
  token = res.body.token;

  // Crear un producto de prueba
  const product = await Product.create({
    name: "Test Product",
    description: "This is a test product",
    quantity: 10,
    price: 20.99,
    features: ["feature1", "feature2"]
  });
  productId = product._id;
});

afterEach(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await mongoose.connection.close();
});

describe('Get /api/orders/:id', () => {
  it('should return all orders for a user', async () => {
    const order = await Order.create({
      user: userId,
      products: [productId],
      total: 20.99,
      status: 'Pending'
    });

    const res = await request(app).get(`/api/orders/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(order._id.toString());
  });

  it('should return an error if user ID is missing', async () => {
    const res = await request(app).get('/api/orders/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should return an error if no orders are found', async () => {
    const res = await request(app).get(`/api/orders/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });
});

describe('Get /api/orders/order/:id', () => {
  it('should return a single order for a user', async () => {
    const order = await Order.create({
      user: userId,
      products: [productId],
      total: 20.99,
      status: 'Pending'
    });

    const res = await request(app).get(`/api/orders/order/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0]._id).toBe(productId.toString());
  });

  it('should return an error if user ID is missing', async () => {
    const res = await request(app).get('/api/orders/order/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should return an error if no order is found', async () => {
    const res = await request(app).get(`/api/orders/order/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Pedido no encontrado");
  });
});
