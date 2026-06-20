const env = require("../config/env");

// Restaurant
const RestaurantPostgresRepository = require("./postgres/restaurant.postgres.repository");
const RestaurantMongoRepository = require("./mongodb/restaurant.mongodb.repository");

// User
const UserPostgresRepository = require("./postgres/user.postgres.repository");
const UserMongoRepository = require("./mongodb/user.mongodb.repository");

// Category
const CategoryPostgresRepository = require("./postgres/category.postgres.repository");
const CategoryMongoRepository = require("./mongodb/category.mongodb.repository");

// Product
const ProductPostgresRepository = require("./postgres/product.postgres.repository");
const ProductMongoRepository = require("./mongodb/product.mongodb.repository");

// Menu
const MenuPostgresRepository = require("./postgres/menu.postgres.repository");
const MenuMongoRepository = require("./mongodb/menu.mongodb.repository");

// MenuProduct
const MenuProductPostgresRepository = require("./postgres/menu-product.postgres.repository");
const MenuProductMongoRepository = require("./mongodb/menu-product.mongodb.repository");

// Reservation
const ReservationPostgresRepository = require("./postgres/reservation.postgres.repository");
const ReservationMongoRepository = require("./mongodb/reservation.mongodb.repository");

function getRestaurantRepository() {
  if (env.dbEngine === "mongodb") {
    return new RestaurantMongoRepository();
  }
  return new RestaurantPostgresRepository();
}

function getUserRepository() {
  if (env.dbEngine === "mongodb") {
    return new UserMongoRepository();
  }
  return new UserPostgresRepository();
}

function getCategoryRepository() {
  if (env.dbEngine === "mongodb") {
    return new CategoryMongoRepository();
  }
  return new CategoryPostgresRepository();
}

function getProductRepository() {
  if (env.dbEngine === "mongodb") {
    return new ProductMongoRepository();
  }
  return new ProductPostgresRepository();
}

function getMenuRepository() {
  if (env.dbEngine === "mongodb") {
    return new MenuMongoRepository();
  }
  return new MenuPostgresRepository();
}

function getMenuProductRepository() {
  if (env.dbEngine === "mongodb") {
    return new MenuProductMongoRepository();
  }
  return new MenuProductPostgresRepository();
}

function getReservationRepository() {
  if (env.dbEngine === "mongodb") {
    return new ReservationMongoRepository();
  }
  return new ReservationPostgresRepository();
}

module.exports = {
  getRestaurantRepository,
  getUserRepository,
  getCategoryRepository,
  getProductRepository,
  getMenuRepository,
  getMenuProductRepository,
  getReservationRepository
};
