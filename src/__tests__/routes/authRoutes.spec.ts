import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "#server.js";
import User from "#models/user.js";
import { hash } from "bcrypt";

let mongoServer: MongoMemoryServer;

// Set up an in-memory database before all tests
beforeAll(async () => {
  // Disconnect any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean up the database and close the connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Auth Routes", () => {
  it("POST /auth/register should register a new user", async () => {
    const newUser = {
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "customer",
    };

    const response = await request(app).post("/api/v1/auth/register").send(newUser).expect(201);

    expect(response.body).toHaveProperty("data");
    expect(response.body.data.email).toBe(newUser.email);
    expect(response.body.data).not.toHaveProperty("password"); // Check if sensitive data is removed

    const createdUser = await User.findOne({ email: newUser.email });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.firstName).toBe("Test");
  });

  it("POST /auth/login should log in an existing user and return cookies", async () => {
    // 1. Create a user directly in the test database
    const password = "password123";
    const hashedPassword = await hash(password, 10);
    await User.create({
      email: "login@example.com",
      password: hashedPassword,
      firstName: "Login",
      lastName: "User",
      role: "customer",
    });

    // 2. Simulate a login request
    const response = await request(app).post("/api/v1/auth/login").send({ email: "login@example.com", password: "password123" }).expect(200);

    // 3. Assert the response
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.email).toBe("login@example.com");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"]).toHaveLength(2);
  });
});
