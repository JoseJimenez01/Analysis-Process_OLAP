const bcrypt = require("bcryptjs");
const { getUserRepository } = require("../repositories");

class AuthService {
  constructor() {
    this.userRepository = getUserRepository();
  }

  async registerUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;
    const role = payload.role || "customer";

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!['admin', 'customer'].includes(role)) {
      throw new Error("Role must be admin or customer");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const name = payload.name?.trim() || email.split("@")[0];

    return this.userRepository.create({
      name,
      email,
      passwordHash,
      role
    });
  }

  async login({ email, password }) {
    const e = email?.trim().toLowerCase();
    if (!e || !password) {
      throw new Error("Email and password are required");
    }

    const user = await this.userRepository.findByEmail(e);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      throw new Error("Invalid credentials");
    }

    return user;
  }
}

module.exports = AuthService;