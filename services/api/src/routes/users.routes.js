const express = require("express");
const UserService = require("../services/user.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const userService = new UserService();
const ALLOWED_ROLES = new Set(["admin", "customer"]);

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !ALLOWED_ROLES.has(role) || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Listar usuarios
 *     description: Retorna una lista de todos los usuarios. Solo admins pueden ver todos los usuarios.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 */
router.get("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const data = await userService.listUsers();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     description: Retorna los datos de un usuario específico. Cada usuario solo puede ver su propio perfil, a menos que sea admin.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user?.sub;
    const requestingUserRole = req.user?.role;

    // Solo admins o el mismo usuario puede ver el perfil
    if (requestingUserRole !== "admin" && requestingUserId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data = await userService.getUser(userId);
    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Crear usuario
 *     description: Crea un nuevo usuario. Solo admins pueden crear usuarios.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               passwordHash:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, customer]
 */
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const created = await userService.createUser(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza los datos de un usuario. Cada usuario solo puede actualizar su propio perfil, a menos que sea admin.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user?.sub;
    const requestingUserRole = req.user?.role;

    // Solo admins o el mismo usuario puede actualizar
    if (requestingUserRole !== "admin" && requestingUserId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await userService.updateUser(userId, req.body);
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario. Solo admins pueden eliminar usuarios.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 */
router.delete("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
