const express = require("express");
const ProductService = require("../services/product.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const productService = new ProductService();
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
 * /api/products:
 *   get:
 *     summary: Listar productos
 *     description: Retorna una lista de todos los productos disponibles
 *     tags:
 *       - Productos
 *     security: []
 */
router.get("/", async (req, res) => {
  try {
    const data = await productService.listProducts();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     description: Retorna un producto específico por su ID
 *     tags:
 *       - Productos
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
    const data = await productService.getProduct(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Crear producto
 *     description: Crea un nuevo producto. Solo admin.
 *     tags:
 *       - Productos
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
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 */
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const created = await productService.createProduct(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     description: Actualiza un producto existente. Solo admin.
 *     tags:
 *       - Productos
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
    const updated = await productService.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     description: Elimina un producto. Solo admin.
 *     tags:
 *       - Productos
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
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
