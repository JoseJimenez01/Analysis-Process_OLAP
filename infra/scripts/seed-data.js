/**
 * Seed Data Generator — PY01 Restaurantes
 *
 * Generates realistic test data for the restaurant system.
 * Data was designed with LLM assistance to be culturally appropriate
 * and representative of a real Central American restaurant ecosystem.
 *
 * Usage:
 *   DB_ENGINE=postgres node infra/scripts/seed-data.js
 *   DB_ENGINE=mongodb node infra/scripts/seed-data.js
 */

/* eslint-disable no-console */

// ─── Realistic Data (LLM-generated) ────────────────────────────────────────

const categories = [
  { name: "Entradas", description: "Aperitivos y bocas para compartir", icon: "🥗" },
  { name: "Platos Fuertes", description: "Platos principales de la casa", icon: "🍖" },
  { name: "Pastas", description: "Pastas artesanales con salsas caseras", icon: "🍝" },
  { name: "Mariscos", description: "Pescados y mariscos frescos del Pacífico", icon: "🦐" },
  { name: "Postres", description: "Dulces y postres artesanales", icon: "🍰" },
  { name: "Bebidas", description: "Refrescos naturales, cócteles y café", icon: "🥤" },
  { name: "Pizzas", description: "Pizzas al horno de leña con ingredientes premium", icon: "🍕" },
  { name: "Ensaladas", description: "Ensaladas frescas y nutritivas", icon: "🥬" }
];

const restaurants = [
  {
    name: "La Cocina de Doña María",
    address: "4ta Avenida 12-30 Zona 10, Ciudad de Guatemala",
    phone: "+502 2334-5678",
    description: "Cocina tradicional guatemalteca con un toque moderno. Especialistas en pepián, jocón y tamales colorados preparados con recetas de tres generaciones.",
    rating: 4.7
  },
  {
    name: "El Fogón Chapín",
    address: "6ta Calle 3-52 Zona 1, Antigua Guatemala",
    phone: "+502 7832-1234",
    description: "Restaurante rústico con ambiente colonial. Famoso por sus desayunos típicos, chuchitos y su incomparable chocolate caliente artesanal.",
    rating: 4.5
  },
  {
    name: "Mare Nostrum",
    address: "Boulevard Los Próceres 18-29 Zona 10, Ciudad de Guatemala",
    phone: "+502 2368-9012",
    description: "Alta cocina mediterránea con los mejores mariscos importados. Ambiente elegante perfecto para cenas ejecutivas y celebraciones especiales.",
    rating: 4.8
  },
  {
    name: "Sakura Sushi Bar",
    address: "13 Calle 2-75 Zona 10, Ciudad de Guatemala",
    phone: "+502 2337-4567",
    description: "Fusión japonesa-guatemalteca. Rolls creativos con ingredientes locales, ramen artesanal y una selecta carta de sake importado.",
    rating: 4.3
  },
  {
    name: "Pizzería Don Corleone",
    address: "Avenida Reforma 8-60 Zona 9, Ciudad de Guatemala",
    phone: "+502 2331-8901",
    description: "Auténtica pizza napolitana horneada en horno de leña a 450°C. Masa madre fermentada 72 horas y mozzarella di bufala importada semanalmente.",
    rating: 4.6
  }
];

const products = [
  // Entradas
  { name: "Guacamole Artesanal", description: "Aguacate Hass fresco con tomate, cilantro, chile serrano y limón. Servido con totopos de maíz criollo.", price: 45.00, categoryIndex: 0, available: true },
  { name: "Ceviche de Camarón", description: "Camarones del Pacífico marinados en limón con cebolla morada, tomate, cilantro y salsa de habanero.", price: 65.00, categoryIndex: 0, available: true },
  { name: "Empanadas de Loroco", description: "Empanadas crujientes rellenas de loroco y queso Zacapa. Acompañadas de salsa de tomate asado.", price: 35.00, categoryIndex: 0, available: true },
  { name: "Nachos Supremos", description: "Totopos artesanales cubiertos con frijoles volteados, guacamole, crema, jalapeños y queso fundido.", price: 55.00, categoryIndex: 0, available: true },

  // Platos Fuertes
  { name: "Pepián de Pollo", description: "Recado tradicional de pepitoria, chile pasa y tomate. Pollo de granja cocido lentamente con papas y güisquil.", price: 85.00, categoryIndex: 1, available: true },
  { name: "Hilachas en Salsa Roja", description: "Carne de res deshebrada en salsa de tomate y chile guaque. Acompañada de arroz y tamalitos de chipilín.", price: 75.00, categoryIndex: 1, available: true },
  { name: "Churrasco Angus", description: "Corte prime de res Angus a la parrilla, término a elección. Con chimichurri argentino, papas rústicas y ensalada.", price: 145.00, categoryIndex: 1, available: true },
  { name: "Pollo en Jocón", description: "Pollo de granja en salsa verde de miltomate, cilantro y pepitoria. Servido con arroz y tortillas recién hechas.", price: 78.00, categoryIndex: 1, available: true },
  { name: "Lomo Saltado", description: "Lomo fino salteado al wok con cebolla, tomate, ají amarillo y sillao. Acompañado de arroz y papas fritas.", price: 95.00, categoryIndex: 1, available: true },

  // Pastas
  { name: "Fettuccine Alfredo con Pollo", description: "Pasta fresca al huevo con salsa cremosa de parmesano reggiano y pollo a la plancha.", price: 82.00, categoryIndex: 2, available: true },
  { name: "Spaghetti alla Puttanesca", description: "Spaghetti con salsa de tomate San Marzano, aceitunas negras, alcaparras, anchoas y ajo.", price: 72.00, categoryIndex: 2, available: true },
  { name: "Ravioli de Ricotta y Espinaca", description: "Ravioli artesanal relleno de ricotta fresca y espinaca, bañado en salsa de mantequilla y salvia.", price: 88.00, categoryIndex: 2, available: true },
  { name: "Penne al Pesto Genovese", description: null, price: 70.00, categoryIndex: 2, available: true },

  // Mariscos
  { name: "Robalo a la Parrilla", description: "Filete de robalo del Pacífico a la parrilla con mantequilla de hierbas, puré de camote y vegetales asados.", price: 125.00, categoryIndex: 3, available: true },
  { name: "Camarones al Ajillo", description: "Camarones jumbo salteados en aceite de oliva con abundante ajo dorado, chile guajillo y perejil fresco.", price: 110.00, categoryIndex: 3, available: true },
  { name: "Paella Valenciana", description: "Arroz bomba con azafrán, mariscos mixtos (camarón, mejillón, calamar), chorizo español y guisantes.", price: 165.00, categoryIndex: 3, available: false },
  { name: "Pulpo a la Gallega", description: "", price: 135.00, categoryIndex: 3, available: true },

  // Postres
  { name: "Tres Leches Artesanal", description: "Bizcocho esponjoso bañado en leche condensada, evaporada y crema. Coronado con merengue italiano.", price: 42.00, categoryIndex: 4, available: true },
  { name: "Churros con Chocolate", description: "Churros crujientes espolvoreados con azúcar y canela. Acompañados de chocolate caliente para dipping.", price: 38.00, categoryIndex: 4, available: true },
  { name: "Flan de Coco", description: "Flan de coco rallado con caramelo de piloncillo y un toque de ron guatemalteco Zacapa.", price: 45.00, categoryIndex: 4, available: true },
  { name: "Tiramisú Clásico", description: "Capas de bizcocho de café espresso, mascarpone italiano y cacao amargo. Receta original de Venecia.", price: 52.00, categoryIndex: 4, available: true },

  // Bebidas
  { name: "Limonada de Hierbabuena", description: "Limonada natural con hojas frescas de hierbabuena y un toque de jengibre. Servida con hielo.", price: 22.00, categoryIndex: 5, available: true },
  { name: "Café de Origen Huehuetenango", description: "Café de altura 100% arábica de Huehuetenango. Tostado medio, notas de chocolate y frutos rojos.", price: 28.00, categoryIndex: 5, available: true },
  { name: "Horchata de Morro", description: "Bebida tradicional salvadoreña de semilla de morro, cacao, canela y ajonjolí. Servida bien fría.", price: 25.00, categoryIndex: 5, available: true },
  { name: "Mojito Clásico", description: null, price: 55.00, categoryIndex: 5, available: true },

  // Pizzas
  { name: "Pizza Margherita DOP", description: "Base de masa madre, salsa San Marzano DOP, mozzarella di bufala, albahaca fresca y aceite de oliva extra virgen.", price: 95.00, categoryIndex: 6, available: true },
  { name: "Pizza Quattro Formaggi", description: "Cuatro quesos: mozzarella, gorgonzola, fontina y parmesano reggiano sobre base blanca de crema.", price: 105.00, categoryIndex: 6, available: true },
  { name: "Pizza Prosciutto e Funghi", description: "Jamón prosciutto crudo di Parma, hongos porcini, mozzarella fior di latte y rúcula fresca.", price: 110.00, categoryIndex: 6, available: true },
  { name: "Pizza Diavola", description: "Salami picante, chile calabrés, mozzarella y salsa de tomate. Para los amantes del picante.", price: 98.00, categoryIndex: 6, available: true },

  // Ensaladas
  { name: "Ensalada César", description: "Lechuga romana, crutones artesanales, parmesano en lascas y aderezo César casero con anchoas.", price: 48.00, categoryIndex: 7, available: true },
  { name: "Ensalada Mediterránea", description: "Mix de lechugas, tomate cherry, pepino, aceitunas kalamata, queso feta y vinagreta de orégano.", price: 52.00, categoryIndex: 7, available: true },
  { name: "Ensalada de Quinoa", description: "", price: 58.00, categoryIndex: 7, available: true }
];

const menus = [
  { name: "Menú Ejecutivo", description: "Almuerzo de lunes a viernes. Incluye entrada, plato fuerte, bebida y postre del día.", restaurantIndex: 0, productIndices: [0, 4, 22, 18] },
  { name: "Menú Degustación", description: "Experiencia gastronómica de 5 tiempos. Maridaje con vinos opcionales. Solo viernes y sábados.", restaurantIndex: 2, productIndices: [1, 13, 14, 20, 23] },
  { name: "Menú Familiar", description: "Para compartir en familia. Incluye 2 entradas, 2 platos fuertes, 4 bebidas y 2 postres.", restaurantIndex: 1, productIndices: [0, 3, 5, 6, 22, 23, 18, 19] },
  { name: "Menú Italiano", description: "Lo mejor de nuestra cocina italiana. Antipasto, primo piatto, secondo y dolce.", restaurantIndex: 4, productIndices: [10, 11, 26, 20] },
  { name: "Menú de Mariscos", description: "Selección especial del chef con los mariscos más frescos del día. Disponible jueves a domingo.", restaurantIndex: 2, productIndices: [1, 13, 14, 15] }
];

const users = [
  { name: "Carlos Administrador", email: "admin@restaurantes.gt", password: "Admin123!@#", role: "admin" },
  { name: "María García", email: "maria.garcia@email.com", password: "Maria2024!", role: "customer" },
  { name: "José López", email: "jose.lopez@email.com", password: "Jose2024!", role: "customer" },
  { name: "Ana Martínez", email: "ana.martinez@email.com", password: "Ana2024!", role: "customer" },
  { name: "Pedro Ramírez", email: "pedro.ramirez@email.com", password: "Pedro2024!", role: "customer" }
];

// ─── Database Seeders ───────────────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const dbEngine = process.env.DB_ENGINE || "postgres";

async function seedPostgres() {
  // Reuse the app's db config which already handles Prisma 7 driver adapter setup
  const { getPrismaClient } = require("../../services/api/src/config/db");
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Could not initialize PrismaClient. Check DATABASE_URL is set.");
  }

  try {
    console.log("Cleaning existing data...");
    await prisma.menuProduct.deleteMany({});
    await prisma.reservation.deleteMany({});
    await prisma.menu.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.restaurant.deleteMany({});

    console.log("Seeding categories...");
    const createdCategories = [];
    for (const cat of categories) {
      const created = await prisma.category.create({ data: cat });
      createdCategories.push(created);
    }

    console.log("Seeding restaurants...");
    const createdRestaurants = [];
    for (const rest of restaurants) {
      const created = await prisma.restaurant.create({ data: rest });
      createdRestaurants.push(created);
    }

    console.log("Seeding products...");
    const createdProducts = [];
    for (const prod of products) {
      const { categoryIndex, ...data } = prod;
      data.categoryId = createdCategories[categoryIndex].id;
      data.description = data.description || "";
      data.imageUrl = `https://placehold.co/400x300?text=${encodeURIComponent(data.name)}`;
      const created = await prisma.product.create({ data });
      createdProducts.push(created);
    }

    console.log("Seeding users...");
    const createdUsers = [];
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const created = await prisma.user.create({
        data: { name: user.name, email: user.email, passwordHash, role: user.role }
      });
      createdUsers.push(created);
    }

    console.log("Seeding menus...");
    for (const menu of menus) {
      const { restaurantIndex, productIndices, ...data } = menu;
      data.restaurantId = createdRestaurants[restaurantIndex].id;
      const created = await prisma.menu.create({ data });
      for (let i = 0; i < productIndices.length; i++) {
        await prisma.menuProduct.create({
          data: { menuId: created.id, productId: createdProducts[productIndices[i]].id, displayOrder: i + 1 }
        });
      }
    }

    console.log("Seeding reservations...");
    const statuses = ["pending", "confirmed", "completed", "cancelled"];
    for (let i = 0; i < 10; i++) {
      const userIdx = (i % (createdUsers.length - 1)) + 1;
      const restIdx = i % createdRestaurants.length;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      await prisma.reservation.create({
        data: {
          userId: createdUsers[userIdx].id,
          restaurantId: createdRestaurants[restIdx].id,
          reservationDate: futureDate,
          partySize: Math.floor(Math.random() * 8) + 1,
          status: statuses[i % statuses.length],
          specialRequests: i % 3 === 0 ? "Mesa junto a la ventana por favor" : null
        }
      });
    }

    return { categories: createdCategories.length, restaurants: createdRestaurants.length, products: createdProducts.length, users: createdUsers.length, menus: menus.length };
  } finally {
    await prisma.$disconnect();
  }
}

async function seedMongo() {
  const mongoose = require("mongoose");
  const mongoUri = process.env.MONGO_URI || "mongodb://mongos:27017/restaurantes";

  await mongoose.connect(mongoUri);

  const CategorySchema = new mongoose.Schema({ name: { type: String, unique: true }, description: String, icon: String });
  const RestaurantSchema = new mongoose.Schema({ name: String, address: String, phone: String, description: String, rating: Number }, { timestamps: true });
  const ProductSchema = new mongoose.Schema({
    name: String, description: String, price: Number, imageUrl: String, available: Boolean,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  }, { timestamps: true });
  const UserSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true }, passwordHash: String, role: String
  }, { timestamps: true });
  const MenuSchema = new mongoose.Schema({
    name: String, description: String, active: { type: Boolean, default: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }
  }, { timestamps: true });
  const MenuProductSchema = new mongoose.Schema({
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    displayOrder: Number
  });
  const ReservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    reservationDate: Date, partySize: Number, status: String, specialRequests: String
  }, { timestamps: true });

  const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
  const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", RestaurantSchema);
  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Menu = mongoose.models.Menu || mongoose.model("Menu", MenuSchema);
  const MenuProduct = mongoose.models.MenuProduct || mongoose.model("MenuProduct", MenuProductSchema);
  const Reservation = mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);

  console.log("Cleaning existing data...");
  await Promise.all([
    Category.deleteMany({}), Restaurant.deleteMany({}), Product.deleteMany({}),
    User.deleteMany({}), Menu.deleteMany({}), MenuProduct.deleteMany({}), Reservation.deleteMany({})
  ]);

  console.log("Seeding categories...");
  const createdCategories = await Category.insertMany(categories);

  console.log("Seeding restaurants...");
  const createdRestaurants = await Restaurant.insertMany(restaurants);

  console.log("Seeding products...");
  const productDocs = products.map(p => {
    const { categoryIndex, ...data } = p;
    data.categoryId = createdCategories[categoryIndex]._id;
    data.description = data.description || "";
    data.imageUrl = `https://placehold.co/400x300?text=${encodeURIComponent(data.name)}`;
    return data;
  });
  const createdProducts = await Product.insertMany(productDocs);

  console.log("Seeding users...");
  const userDocs = [];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    userDocs.push({ name: user.name, email: user.email, passwordHash, role: user.role });
  }
  const createdUsers = await User.insertMany(userDocs);

  console.log("Seeding menus...");
  for (const menu of menus) {
    const { restaurantIndex, productIndices, ...data } = menu;
    data.restaurantId = createdRestaurants[restaurantIndex]._id;
    const created = await Menu.create(data);
    const menuProductDocs = productIndices.map((pi, i) => ({
      menuId: created._id, productId: createdProducts[pi]._id, displayOrder: i + 1
    }));
    await MenuProduct.insertMany(menuProductDocs);
  }

  console.log("Seeding reservations...");
  const statuses = ["pending", "confirmed", "completed", "cancelled"];
  const reservationDocs = [];
  for (let i = 0; i < 10; i++) {
    const userIdx = (i % (createdUsers.length - 1)) + 1;
    const restIdx = i % createdRestaurants.length;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i + 1);
    reservationDocs.push({
      userId: createdUsers[userIdx]._id,
      restaurantId: createdRestaurants[restIdx]._id,
      reservationDate: futureDate,
      partySize: Math.floor(Math.random() * 8) + 1,
      status: statuses[i % statuses.length],
      specialRequests: i % 3 === 0 ? "Mesa junto a la ventana por favor" : null
    });
  }
  await Reservation.insertMany(reservationDocs);

  await mongoose.disconnect();
  return { categories: createdCategories.length, restaurants: createdRestaurants.length, products: createdProducts.length, users: createdUsers.length, menus: menus.length };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seed Data Generator — Engine: ${dbEngine}\n`);

  try {
    const result = dbEngine === "mongodb" ? await seedMongo() : await seedPostgres();

    console.log("\n✅ Seeding completed successfully!");
    console.log(`   Categories:   ${result.categories}`);
    console.log(`   Restaurants:  ${result.restaurants}`);
    console.log(`   Products:     ${result.products}`);
    console.log(`   Users:        ${result.users}`);
    console.log(`   Menus:        ${result.menus}`);
    console.log(`   Reservations: 10\n`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
