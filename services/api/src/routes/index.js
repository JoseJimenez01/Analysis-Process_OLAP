const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const restaurantRoutes = require("./restaurants.routes");
const cacheRoutes = require("./cache.routes");
const usersRoutes = require("./users.routes");
const categoriesRoutes = require("./categories.routes");
const productsRoutes = require("./products.routes");
const menusRoutes = require("./menus.routes");
const menuProductsRoutes = require("./menu-products.routes");
const reservationsRoutes = require("./reservations.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/cache", cacheRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/menus", menusRoutes);
router.use("/menus", menuProductsRoutes);
router.use("/reservations", reservationsRoutes);

module.exports = router;

