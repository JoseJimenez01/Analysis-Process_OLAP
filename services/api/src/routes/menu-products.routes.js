const express = require("express");
const MenuProductService = require("../services/menu-product.service");
const auth = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });
const menuProductService = new MenuProductService();
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
 * /api/menus/{menuId}/products:
 *   get:
 *     summary: Obtener productos de un menú
 *     description: Retorna la lista de productos asociados a un menú
 *     tags:
 *       - Menú-Productos
 *     security: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/:menuId/products", async (req, res) => {
  try {
    const data = await menuProductService.listProductsByMenu(req.params.menuId);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus/{menuId}/products:
 *   post:
 *     summary: Agregar producto a menú
 *     description: Agrega un producto existente a un menú. Solo admin.
 *     tags:
 *       - Menú-Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 */
router.post("/:menuId/products", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const payload = {
      menuId: req.params.menuId,
      ...req.body
    };
    const created = await menuProductService.addProductToMenu(payload);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/menus/{menuId}/products/{productId}:
 *   delete:
 *     summary: Remover producto de menú
 *     description: Remueve un producto de un menú. Solo admin.
 *     tags:
 *       - Menú-Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/:menuId/products/:productId", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const deleted = await menuProductService.removeProductByMenuAndId(
      req.params.menuId,
      req.params.productId
    );
    if (!deleted || deleted.count === 0) {
      return res.status(404).json({ message: "Menu-Product association not found" });
    }
    return res.status(200).json({ message: "Product removed from menu" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
