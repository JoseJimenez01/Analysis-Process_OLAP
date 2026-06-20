const express = require("express");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AuthService = require("../services/auth.service");

const router = express.Router();
const authService = new AuthService();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Obtener token JWT
 *     description: |
 *       Emite un token JWT para autenticación en endpoints protegidos.
 *       Esta es una implementación simplificada para desarrollo/demo.
 *       Puedes enviar un body vacío para obtener un token con valores por defecto.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 */
router.post("/login", (req, res) => {
  // Validate credentials against persisted users
  (async () => {
    try {
      const { email, password } = req.body || {};
      const user = await authService.login({ email, password });
      const token = jwt.sign({ sub: user.email, role: user.role }, env.jwtSecret, { expiresIn: "1h" });

      return res.status(200).json({ token });
    } catch (error) {
      if (error.message === "Email and password are required") {
        return res.status(400).json({ message: error.message });
      }

      if (error.message === "Invalid credentials") {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  })();
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     description: |
 *       Registra un usuario de forma simplificada para desarrollo/demo.
 *       Puedes enviar un body vacío para usar valores por defecto.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 */
router.post("/register", async (req, res) => {
  try {
    const user = await authService.registerUser(req.body || {});
    const token = jwt.sign({ sub: user.email, role: user.role }, env.jwtSecret, { expiresIn: "1h" });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.message === "Email and password are required" || error.message === "Role must be admin or customer") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already exists" });
    }

    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
