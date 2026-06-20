const express = require("express");
const MenuService = require("../services/menu.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const menuService = new MenuService();
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
 * /api/menus:
 *   get:
 *     summary: Listar menús
 *     description: Retorna una lista de todos los menús disponibles
 *     tags:
 *       - Menús
 *     security: []
 */
router.get("/", async (req, res) => {
  try {
    const data = await menuService.listMenus();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus/{id}:
 *   get:
 *     summary: Obtener menú por ID
 *     description: Retorna un menú específico por su ID, con sus productos
 *     tags:
 *       - Menús
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/:id", async (req, res) => {
  try {
    const data = await menuService.getMenu(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Menu not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus:
 *   post:
 *     summary: Crear menú
 *     description: Crea un nuevo menú. Solo admin.
 *     tags:
 *       - Menús
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
 *               description:
 *                 type: string
 *               restaurantId:
 *                 type: string
 */
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const created = await menuService.createMenu(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus/{id}:
 *   put:
 *     summary: Actualizar menú
 *     description: Actualiza un menú existente. Solo admin.
 *     tags:
 *       - Menús
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.put("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const updated = await menuService.updateMenu(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Menu not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus/{id}:
 *   delete:
 *     summary: Eliminar menú
 *     description: Elimina un menú. Solo admin.
 *     tags:
 *       - Menús
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const deleted = await menuService.deleteMenu(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Menu not found" });
    }
    return res.status(200).json({ message: "Menu deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
