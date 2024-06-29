import mongoose from "mongoose";
import request from "supertest";
import { app } from "../index"; // Asegúrate de que la ruta es correcta
import Post from "../models/Post.model";
import User from "../models/User.model";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
dotenv.config();

describe("Post Controller", () => {
  let token;
  let userId;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/posts", () => {
    it("should create a new post", async () => {
      const image = fs.readFileSync(path.resolve(__dirname, "./test-image.jpg"));

      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${token}`)
        .field("title", "Test Post")
        .field("content", "This is a test post")
        .field("specie", "Gato")
        .field("location", "test location")
        .field("condition", "Perdido")
        .attach("image", image, "test-image.jpg");

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("title", "Test Post");
    });

    it("should return an error if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "",
          content: "",
          specie: "",
          location: "",
          condition: "",
        });

      expect(res.statusCode).toEqual(422);
      expect(res.body.message).toBe("Todos los campos son obligatorios");
    });
  });

  describe("GET /api/posts", () => {
    it("should get all posts", async () => {
      const res = await request(app).get("/api/posts");
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /api/posts/:id", () => {
    it("should get a single post by ID", async () => {
      const post = await Post.create({
        title: "Test Post",
        content: "This is a test post",
        specie: "Gato",
        location: "test location",
        condition: "Perdido",
        image: "test-image.jpg",
        author: userId,
      });

      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("title", "Test Post");
    });

    it("should return an error if post not found", async () => {
      const res = await request(app).get(`/api/posts/${new mongoose.Types.ObjectId()}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("Post no encontrado");
    });
  });

  describe("PATCH /api/posts/:id", () => {
    it("should update a post", async () => {
      const post = await Post.create({
        title: "Test Post",
        content: "This is a test post",
        specie: "Gato",
        location: "test location",
        condition: "Perdido",
        image: "test-image.jpg",
        author: userId,
      });

      const res = await request(app)
        .patch(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Post",
          content: "Updated content",
          specie: "Perro",
          location: "updated location",
          condition: "Encontrado",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("title", "Updated Post");
    });

    it("should return an error if required fields are missing", async () => {
      const post = await Post.create({
        title: "Test Post",
        content: "This is a test post",
        specie: "Gato",
        location: "test location",
        condition: "Perdido",
        image: "test-image.jpg",
        author: userId,
      });

      const res = await request(app)
        .patch(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "",
          content: "",
          specie: "",
          location: "",
          condition: "",
        });

      expect(res.statusCode).toEqual(422);
      expect(res.body.message).toBe("Todos los campos son obligatorios");
    });
  });

  describe("DELETE /api/posts/:id", () => {
    it("should delete a post", async () => {
      const post = await Post.create({
        title: "Test Post",
        content: "This is a test post",
        specie: "Gato",
        location: "test location",
        condition: "Perdido",
        image: "test-image.jpg",
        author: userId,
      });

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.msg).toBe("Post eliminado");

      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it("should return an error if post not found", async () => {
      const res = await request(app)
        .delete(`/api/posts/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("Post no encontrado");
    });
  });
});
