import mongoose from "mongoose";
import request from "supertest";
import { app } from "../index";
import User from "../models/User.model";
import Post from "../models/Post.model";
import Cart from "../models/Cart.model";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

describe("User Controller", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const newUser = {
    username: "testuser",
    email: "test1@example.com",
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
  };

  afterEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Cart.deleteMany({});
  });

  describe("POST /api/users/register", () => {
    it("should return an error if the email is already in use", async () => {
      await User.create({
        username: "existinguser",
        email: "test1@example.com",
        password: "ExistingPassword123!",
      });

      const res = await request(app).post("/api/users/register").send(newUser);
      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe("El correo electrónico ya está en uso");
    });

    it("should register a new user", async () => {
      const res = await request(app).post("/api/users/register").send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe("Usuario test1@example.com registrado con éxito");

      const createdUser = await User.findOne({ email: newUser.email });
      expect(createdUser).not.toBeNull();
    });
  });

  describe("POST /api/users/login", () => {
    it("should login an existing user", async () => {
      await request(app).post("/api/users/register").send(newUser);

      const res = await request(app).post("/api/users/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user profile", async () => {
      const user = await User.create(newUser);

      const res = await request(app).get(`/api/users/${user._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("username", newUser.username);
      expect(res.body).toHaveProperty("role", "user");
    });
  });

  describe("GET /api/users", () => {
    it("should get all users", async () => {
      await User.create(newUser);

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/users/edit", () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await User.create(newUser);
      userId = user._id;

      const res = await request(app).post("/api/users/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      token = res.body.token;
    });

    it("should update user info", async () => {
      const res = await request(app)
        .patch(`/api/users/edit`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          username: "updateduser",
          email: "edited@test.com",
          currentPassword: newUser.password,
          newPassword: "NewPassword123!",
          confirmNewPassword: "NewPassword123!",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("username", "updateduser");
      expect(res.body).toHaveProperty("email", "edited@test.com");

      const updatedUser = await User.findById(userId);
      expect(updatedUser.username).toBe("updateduser");
      expect(updatedUser.email).toBe("edited@test.com");

      const passwordMatch = await bcrypt.compare("NewPassword123!", updatedUser.password);
      expect(passwordMatch).toBe(true);
    });
  });

  describe("DELETE /api/users/:id", () => {
    let userToDelete;
    let authToken;

    beforeEach(async () => {
      await request(app).post("/api/users/register").send(newUser);

      const res = await request(app).post("/api/users/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      userToDelete = await User.findOne({ email: newUser.email });
      authToken = res.body.token;
    });

    it("should delete a user and associated posts", async () => {
      const post = await Post.create({
        title: "Test Post",
        content: "This is a test post",
        author: userToDelete._id,
        image: 'bulldoge095c7a6-dd42-43f6-82a3-a68c46a542c9.jpg',
        condition: "Perdido",
        location: "test location",
        specie: "Gato",
      });

      const cart = await Cart.create({
        user: userToDelete._id,
        items: [],
      });

      const res = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.msg).toEqual("Usuario eliminado");

      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();

      const posts = await Post.find({ author: userToDelete._id });
      expect(posts.length).toEqual(0);

      const deletedCart = await Cart.findOne({ user: userToDelete._id });
      expect(deletedCart).toBeNull();
    });
  });
});
