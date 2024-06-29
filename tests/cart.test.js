import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../index';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.model';
import Product from '../models/Product.model';
import Cart from '../models/Cart.model';

let token;
let userId;
let productId;
let cartId;

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

  // Crear un carrito de prueba
  const cart = await Cart.create({
    user: userId,
    products: [productId]
  });
  cartId = cart._id;
});

afterEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await mongoose.connection.close();
});

describe('GET /api/cart/:id', () => {
  it('should return products in the cart', async () => {
    const res = await request(app).get(`/api/cart/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('should return an error if the cart is empty', async () => {
    await Cart.deleteMany({});
    const res = await request(app).get(`/api/cart/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No hay productos en el carro");
  });
});

describe('POST /api/cart/:id', () => {
  it('should add a product to the cart', async () => {
    await Cart.deleteMany({});
    const res = await request(app)
      .post(`/api/cart/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Producto agregado al carrito");
  });

  it('should return an error if the product is already in the cart', async () => {
    const res = await request(app)
      .post(`/api/cart/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Solo se puede seleccionar una suscripción, vacía tu carrito");
  });
});

describe('PUT /api/cart', () => {
  it('should update a product in the cart', async () => {
    const res = await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, updatedProduct: { quantity: 2 } });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto actualizado en el carrito");
    expect(res.body.product.quantity).toBe(2);
  });

  it('should return an error if the product is not in the cart', async () => {
    const res = await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: new mongoose.Types.ObjectId(), updatedProduct: { quantity: 2 } });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Producto no encontrado en el carrito");
  });
});

describe('DELETE /api/cart/:productId', () => {
  it('should delete a product from the cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto eliminado del carrito, carrito actualizado");
  });

  it('should return an error if the product is not in the cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Error al encontrar el carrito");
  });
});

describe('POST /api/cart/checkout/:id', () => {
  it('should return a checkout URL', async () => {
    const res = await request(app)
      .post(`/api/cart/checkout/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
  });

  it('should return an error if the user is not found', async () => {
    const res = await request(app)
      .post(`/api/cart/checkout/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Usuario no encontrado");
  });
});
