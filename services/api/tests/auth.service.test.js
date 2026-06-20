const mockCreate = jest.fn();
const mockFindByEmail = jest.fn();

jest.mock("../src/repositories", () => ({
  getUserRepository: () => ({
    create: mockCreate,
    findByEmail: mockFindByEmail
  })
}));

const bcrypt = require("bcryptjs");
const AuthService = require("../src/services/auth.service");

describe("AuthService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
  });

  describe("registerUser", () => {
    it("creates an admin user", async () => {
      mockCreate.mockResolvedValue({
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin"
      });

      const result = await service.registerUser({
        name: "Admin",
        email: "admin@example.com",
        password: "secret123",
        role: "admin"
      });

      expect(result.id).toBe("user-1");
      expect(result.role).toBe("admin");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Admin",
          email: "admin@example.com",
          role: "admin"
        })
      );
    });

    it("creates a customer user and derives name from email", async () => {
      mockCreate.mockResolvedValue({
        id: "user-2",
        name: "cliente",
        email: "cliente@example.com",
        role: "customer"
      });

      const result = await service.registerUser({
        email: "cliente@example.com",
        password: "secret123"
      });

      expect(result.name).toBe("cliente");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "cliente",
          email: "cliente@example.com",
          role: "customer"
        })
      );
    });

    it("rejects invalid roles", async () => {
      await expect(
        service.registerUser({
          name: "X",
          email: "x@example.com",
          password: "secret123",
          role: "staff"
        })
      ).rejects.toThrow("Role must be admin or customer");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("rejects missing email", async () => {
      await expect(
        service.registerUser({ password: "secret123" })
      ).rejects.toThrow("Email and password are required");
    });

    it("rejects missing password", async () => {
      await expect(
        service.registerUser({ email: "x@y.com" })
      ).rejects.toThrow("Email and password are required");
    });

    it("hashes the password with bcrypt", async () => {
      mockCreate.mockResolvedValue({ id: "1" });

      await service.registerUser({
        email: "test@test.com",
        password: "mypassword",
        role: "customer"
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.any(String)
        })
      );
    });
  });

  describe("login", () => {
    it("returns user on valid credentials", async () => {
      const hashedPw = await bcrypt.hash("correct", 10);
      mockFindByEmail.mockResolvedValue({
        id: "1",
        email: "user@test.com",
        passwordHash: hashedPw
      });

      const result = await service.login({
        email: "user@test.com",
        password: "correct"
      });

      expect(result.id).toBe("1");
    });

    it("throws on user not found", async () => {
      mockFindByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@test.com", password: "x" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("throws on wrong password", async () => {
      const hashedPw = await bcrypt.hash("correct", 10);
      mockFindByEmail.mockResolvedValue({
        id: "1",
        email: "user@test.com",
        passwordHash: hashedPw
      });

      await expect(
        service.login({ email: "user@test.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects missing email", async () => {
      await expect(
        service.login({ password: "x" })
      ).rejects.toThrow("Email and password are required");
    });

    it("rejects missing password", async () => {
      await expect(
        service.login({ email: "x@y.com" })
      ).rejects.toThrow("Email and password are required");
    });
  });
});