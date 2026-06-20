const express = require("express");
const CategoryService = require("../services/category.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const categoryService = new CategoryService();
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
 * /api/categories:
 *   get:
 *     summary: Listar categorías
 *     description: Retorna una lista de todas las categorías disponibles
 *     tags:
 *       - Categorías
 *     security: []
 */
router.get("/", async (req, res) => {
  try {
    const data = await categoryService.listCategories();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     description: Retorna una categoría específica por su ID
 *     tags:
 *       - Categorías
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
    const data = await categoryService.getCategory(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Crear categoría
 *     description: Crea una nueva categoría. Solo admin.
 *     tags:
 *       - Categorías
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
 *               icon:
 *                 type: string
 */
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const created = await categoryService.createCategory(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     description: Actualiza una categoría existente. Solo admin.
 *     tags:
 *       - Categorías
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
    const updated = await categoryService.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     description: Elimina una categoría. Solo admin.
 *     tags:
 *       - Categorías
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
    const deleted = await categoryService.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
