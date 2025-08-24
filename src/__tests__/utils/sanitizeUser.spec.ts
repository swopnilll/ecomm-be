import { describe, expect, it } from "vitest";
import { sanitizeUser } from "#utils/sanitizeUser.js";
import { type IUser } from "#models/user.js"; // Import IUser for type safety

describe("sanitizeUser utility", () => {
  it("should remove sensitive fields from the user object", () => {
    const userWithSensitiveData: IUser = {
      _id: "user_123",
      email: "test@example.com",
      password: "hashed_password",
      resetPasswordToken: "some_token",
      resetPasswordExpires: new Date(),
      role: "employee",
      firstName: "Test",
      lastName: "User",
      isBlocked: false,
      orderCount: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IUser;

    const sanitizedUser = sanitizeUser(userWithSensitiveData);

    expect(sanitizedUser).not.toHaveProperty("password");
    expect(sanitizedUser).not.toHaveProperty("resetPasswordToken");
    expect(sanitizedUser).not.toHaveProperty("resetPasswordExpires");
    expect(sanitizedUser).toHaveProperty("email");
    expect(sanitizedUser.email).toBe("test@example.com");
  });

  it("should return an empty object if the user is null or undefined", () => {
    // Correct way to test for null/undefined without 'as any'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeUser(null as any)).toEqual({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeUser(undefined as any)).toEqual({});
  });
});
