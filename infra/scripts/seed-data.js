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

const bcrypt = require("bcryptjs");
const dbEngine = process.env.DB_ENGINE || "postgres";

// ─── Generators ──────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Carlos", "María", "José", "Ana", "Pedro", "Luisa", "Juan", "Sofía", "Miguel", "Elena",
  "Diego", "Carmen", "Pablo", "Rosa", "Andrés", "Laura", "Fernando", "Diana", "Ricardo", "Claudia",
  "Jorge", "Silvia", "Héctor", "Mariana", "Luis", "Verónica", "Antonio", "Patricia", "Manuel", "Adriana",
  "Francisco", "Mónica", "Alejandro", "Ruth", "Alberto", "Ángela", "Rafael", "Blanca", "Eduardo", "Leticia",
  "Sergio", "Gladys", "Guillermo", "Beatriz", "Raúl", "Lilian", "Enrique", "Marcela", "Arturo", "Yolanda"
];

const LAST_NAMES = [
  "García", "López", "Martínez", "Ramírez", "Castillo", "González", "Pérez", "Rodríguez", "Barrios", "Mendoza",
  "Fuentes", "Morales", "Cruz", "Vásquez", "Reyes", "Hernández", "Flores", "Díaz", "Álvarez", "Ortiz",
  "Herández", "Mejía", "Aguilar", "Rivera", "Romero", "Torres", "Castro", "Monzón", "Velásquez", "Guerrero",
  "Miranda", "Rivas", "Soto", "Valenzuela", "Navarro", "Ramos", "Ortega", "Molina", "Delgado", "Ibarra",
  "Sandoval", "Pineda", "Escobar", "Alvarado", "Cifuentes", "Cordón", "Coronado", "Lemus", "Solórzano", "Sagastume"
];

const CITIES = [
  "Ciudad de Guatemala", "Antigua Guatemala", "Quetzaltenango", "Escuintla", "Mixco",
  "Villa Nueva", "San Miguel Petapa", "Santa Catarina Pinula", "Chimaltenango", "Cobán",
  "Huehuetenango", "Mazatenango", "Totonicapán", "Jalapa", "Zacapa",
  "Retalhuleu", "Chiquimula", "Puerto Barrios", "Sololá", "San Marcos",
  "Jutiapa", "Santa Elena", "Cuilapa", "El Progreso", "Salamá"
];

const RESTAURANT_NAMES = [
  "El Rincón {adj}", "La Casa {adj}", "Sabores {adj}", "El Sazón {adj}", "La Mesa {adj}",
  "Don {adj}", "Doña {adj}", "San {adj}", "Los {adj}", "Las {adj}",
  "{adj} Grill", "{adj} Café", "{adj} Bistro", "{adj} Express", "{adj} Palace",
  "Cantina {adj}", "Fonda {adj}", "Taberna {adj}", "Parrilla {adj}", "Asados {adj}"
];

const RESTAURANT_ADJS = [
  "de Don José", "de Doña María", "Chapín", "del Lago", "del Volcán",
  "Maya", "de la Abuela", "del Chef", "Real", "Imperial",
  "del Mercado", "de la Plaza", "del Valle", "Campestre", "Rústico",
  "del Pueblo", "de la Montaña", "Tradicional", "Artesanal", "Colonial",
  "Moderno", "del Bosque", "de la Finca", "del Río", "Dorado",
  "Verde", "del Sol", "de la Luna", "del Camino", "Nuevo"
];

const PRODUCT_ADJS = [
  "Artesanal", "Tradicional", "Rústico", "Cremoso", "Crujiente",
  "Ahumado", "Gratinado", "Salteado", "Asado", "Marinado",
  "Bañado", "Relleno", "Esponjoso", "Glaseado", "Caramelizado",
  "Chamuscado", "Dorado", "Horneado", "Jugoso", "Empanizado"
];

const PRODUCT_NOUNS = [
  "Pollo", "Res", "Cerdo", "Camarón", "Pescado",
  "Chorizo", "Lomo", "Pechuga", "Costilla", "Solomillo"
];

const ADDRESSES = [
  "{num} Calle {num2}-{num3} Zona {zone}, {city}",
  "Avenida {name} {num2}-{num3} Zona {zone}, {city}",
  "Boulevard {name} {num2}-{num3} Zona {zone}, {city}",
  "{num} Avenida {num2}-{num3} Zona {zone}, {city}"
];

const ADDRESS_NAMES = [
  "Reforma", "Las Américas", "Los Próceres", "La Castellana", "La Paz",
  "España", "Ciprés", "De León", "Sierra Nevada", "Guatemala Indígena"
];

const MENU_TYPES = [
  "Ejecutivo", "Degustación", "Familiar", "Infantil", "Del Chef",
  "Maridaje", "Express", "Fines de Semana", "Tradicional", "Gourmet",
  "Ligero", "Ejecutivo Plus", "Negocios", "Premium", "Especial"
];

const SPECIAL_REQUESTS = [
  null,
  "Mesa junto a la ventana por favor",
  "Alergia a los mariscos",
  "Aniversario, pastel y velas por favor",
  "Mesa alejada del ruido",
  "Silla para bebé",
  "Celebración de cumpleaños",
  "Sin lactosa, por favor",
  "Vegetariano, sin carne",
  "Mesa en área de no fumadores"
];

// ─── Data Generators ────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRestaurantName() {
  const template = pick(RESTAURANT_NAMES);
  return template.replace("{adj}", pick(RESTAURANT_ADJS));
}

function generateAddress() {
  const template = pick(ADDRESSES);
  return template
    .replace(/\{num\}/g, randInt(1, 30))
    .replace(/\{num2\}/g, randInt(1, 99))
    .replace(/\{num3\}/g, randInt(1, 99))
    .replace("{zone}", randInt(1, 25))
    .replace("{city}", pick(CITIES))
    .replace("{name}", pick(ADDRESS_NAMES));
}

function generatePhone() {
  return `+502 ${randInt(2000, 9999)}-${randInt(1000, 9999)}`;
}

function generateDescription(type, name) {
  const templates = {
    restaurant: [
      `Cocina tradicional con los mejores {type} de la región. Ambiente acogedor y servicio de primera.`,
      `Especialistas en {type}y platos típicos guatemaltecos preparados con recetas de generaciones.`,
      `Restaurante con ambiente familiar conocido por su excelente {type}. Ingredientes frescos y locales.`,
      `Alta cocina con {type}de primera calidad. El lugar perfecto para cualquier ocasión especial.`,
      `Sabores auténticos que cuentan historias. {type}preparados con las recetas más tradicionales.`,
      `Desde hace más de 10 años ofreciendo el mejor {type}de la ciudad. Calidad y tradición nos respaldan.`,
      `Fusión de sabores guatemaltecos con técnicas modernas. {type}preparados por chefs galardonados.`
    ],
    product: [
      `Nuestro {adj} {name}, preparado con ingredientes seleccionados y la receta secreta de la casa.`,
      `Exquisito {adj} {name} servido con guarniciones tradicionales y salsas artesanales.`,
      `Delicioso {adj} {name} elaborado con productos frescos del día y especias naturales.`,
      `El {adj} {name} perfecto para los paladares más exigentes. Plato estrella de la casa.`,
      `Pruebe nuestro {adj} {name}, una combinación única de sabores y texturas inolvidables.`
    ]
  };
  const pool = templates[type] || templates.product;
  return pick(pool)
    .replace(/\{type\}/g, pick(["platos", "carnes", "mariscos", "pastas", "parrilla ", "comida ", "sopas ", "guisados "]))
    .replace("{name}", name)
    .replace("{adj}", pick(PRODUCT_ADJS));
}

function generateEmail(name) {
  const domains = ["email.com", "correo.gt", "mail.gt", "outlook.com", "yahoo.com", "hotmail.com"];
  const normalized = name.toLowerCase().replace(/\s+/g, ".").replace(/[ñáéíóú]/g, c => ({ ñ: "n", á: "a", é: "e", í: "i", ó: "o", ú: "u" })[c] || c);
  const num = Math.random() > 0.3 ? randInt(1, 999) : "";
  return `${normalized}${num}@${pick(domains)}`;
}

function generateProductName(categoryIndex) {
  const catNames = [
    ["Guacamole", "Ceviche", "Empanadas", "Nachos", "Tostadas", "Taquitos", "Bruschettas", "Croquetas"],
    ["Pepián", "Hilachas", "Churrasco", "Lomo Saltado", "Carne Asada", "Pollo", "Cerdo", "Costillas"],
    ["Fettuccine", "Spaghetti", "Ravioli", "Penne", "Lasagna", "Rigatoni", "Linguine", "Tortellini"],
    ["Robalo", "Camarones", "Paella", "Pulpo", "Langosta", "Ceviche Mixto", "Filete de Pescado", "Calamares"],
    ["Tres Leches", "Churros", "Flan", "Tiramisú", "Pastel", "Helado", "Mousse", "Crème Brûlée"],
    ["Limonada", "Café", "Horchata", "Mojito", "Smoothie", "Agua Fresca", "Refresco", "Té"],
    ["Pizza Margherita", "Pizza Pepperoni", "Pizza Suprema", "Pizza Vegetariana", "Pizza BBQ", "Pizza Hawaiana", "Pizza de la Casa", "Calzone"],
    ["Ensalada César", "Ensalada Mixta", "Ensalada de Quinoa", "Ensalada Griega", "Ensalada Waldorf", "Ensalada Caprese", "Wrap", "Bowl"]
  ];
  const base = pick(catNames[categoryIndex] || catNames[0]);
  const adj = Math.random() > 0.5 ? ` ${pick(PRODUCT_ADJS)}` : "";
  return `${base}${adj}`;
}

function ratingFromIndex(i, total) {
  const base = 3.5 + (i / total) * 1.5;
  return parseFloat(Math.min(5, base + (Math.random() - 0.5) * 0.4).toFixed(1));
}

// ─── Target Record Counts (total ~5000) ──────────────────────────────────────

const TARGETS = {
  categories: 16,
  restaurants: 30,
  products: 1200,
  users: 1500,
  menus: 120,
  reservations: 2500 // brings total to ~5000+ across all entities
};

// ─── Generate data arrays ───────────────────────────────────────────────────

function generateCategories() {
  const base = [
    { name: "Entradas", description: "Aperitivos y bocas para compartir", icon: "🥗" },
    { name: "Platos Fuertes", description: "Platos principales de la casa", icon: "🍖" },
    { name: "Pastas", description: "Pastas artesanales con salsas caseras", icon: "🍝" },
    { name: "Mariscos", description: "Pescados y mariscos frescos del Pacífico", icon: "🦐" },
    { name: "Postres", description: "Dulces y postres artesanales", icon: "🍰" },
    { name: "Bebidas", description: "Refrescos naturales, cócteles y café", icon: "🥤" },
    { name: "Pizzas", description: "Pizzas al horno de leña con ingredientes premium", icon: "🍕" },
    { name: "Ensaladas", description: "Ensaladas frescas y nutritivas", icon: "🥬" }
  ];
  const extra = [
    { name: "Tapas", description: "Tapas españolas con toque guatemalteco", icon: "🧆" },
    { name: "Desayunos", description: "Desayunos típicos y contundentes", icon: "🌅" },
    { name: "Sopas", description: "Sopas y caldos caseros reconfortantes", icon: "🍜" },
    { name: "Sándwiches", description: "Sándwiches gourmet y wraps", icon: "🥪" },
    { name: "Carnes", description: "Cortes de carne seleccionados a la parrilla", icon: "🥩" },
    { name: "Vegetariano", description: "Platos vegetarianos saludables y sabrosos", icon: "🥦" },
    { name: "Coctelería", description: "Cócteles de autor y clásicos", icon: "🍸" },
    { name: "Infantil", description: "Platos especiales para los más pequeños", icon: "🧒" }
  ];
  return [...base, ...extra].slice(0, TARGETS.categories);
}

function generateRestaurants() {
  const results = [];
  for (let i = 0; i < TARGETS.restaurants; i++) {
    results.push({
      name: generateRestaurantName(),
      address: generateAddress(),
      phone: generatePhone(),
      description: generateDescription("restaurant", ""),
      rating: ratingFromIndex(i, TARGETS.restaurants)
    });
  }
  return results;
}

function generateProducts(categoryCount) {
  const results = [];
  const categories = generateCategories();
  for (let i = 0; i < TARGETS.products; i++) {
    const catIdx = i % categoryCount;
    const name = generateProductName(catIdx);
    const hasDesc = Math.random() > 0.15;
    results.push({
      name,
      description: hasDesc ? generateDescription("product", name) : "",
      price: randFloat(18, 220),
      categoryIndex: catIdx,
      available: Math.random() > 0.08
    });
  }
  return results;
}

function generateUsers() {
  const results = [];
  const usedEmails = new Set();
  // admin
  results.push({ name: "Carlos Administrador", email: "admin@restaurantes.gt", password: "Admin123!@#", role: "admin" });
  usedEmails.add("admin@restaurantes.gt");

  for (let i = 1; i < TARGETS.users; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    let email = generateEmail(name);
    while (usedEmails.has(email)) {
      email = generateEmail(`${name}${randInt(1, 999)}`);
    }
    usedEmails.add(email);
    const roles = ["customer", "customer", "customer", "customer", "admin"];
    results.push({
      name,
      email,
      password: `Pass${randInt(1000, 9999)}!`,
      role: i < 5 ? "admin" : "customer"
    });
  }
  return results;
}

function generateMenus(restaurantCount) {
  const results = [];
  // Ensure each restaurant has at least 2 menus
  let idx = 0;
  for (let r = 0; r < restaurantCount; r++) {
    const menusPerRest = r < 2 ? randInt(4, 6) : randInt(2, 5);
    for (let m = 0; m < menusPerRest && idx < TARGETS.menus; m++) {
      const type = pick(MENU_TYPES);
      const isActive = Math.random() > 0.1;
      results.push({
        name: `Menú ${type}`,
        description: `${type === "Ejecutivo" ? "Almuerzo rápido" : type === "Degustación" ? "Experiencia gastronómica" : "Selección especial"}. ${isActive ? "Disponible todos los días." : "Próximamente."}`,
        restaurantIndex: r,
        active: isActive
      });
      idx++;
    }
  }
  return results;
}

function generateMenuProducts(menus, products, restaurantCount) {
  const results = [];
  // Build a map of categoryIndex -> product IDs for each restaurant's products
  const productIdsByCat = {};
  for (let i = 0; i < products.length; i++) {
    const cat = products[i].categoryIndex;
    if (!productIdsByCat[cat]) productIdsByCat[cat] = [];
    productIdsByCat[cat].push(i);
  }

  for (let m = 0; m < menus.length; m++) {
    const productCount = randInt(5, 15);
    const restaurantIdx = menus[m].restaurantIndex;
    const usedProductIndices = new Set();

    // Pick products from restaurant-relevant categories
    for (let p = 0; p < productCount; p++) {
      // Weight toward categories that have products
      const catKeys = Object.keys(productIdsByCat);
      if (catKeys.length === 0) break;
      const cat = Number(catKeys[p % catKeys.length]);
      const pool = productIdsByCat[cat] || [];
      if (pool.length === 0) continue;

      let attempts = 0;
      let prodIdx;
      do {
        prodIdx = pick(pool);
        attempts++;
      } while (usedProductIndices.has(prodIdx) && attempts < 20);

      if (!usedProductIndices.has(prodIdx)) {
        usedProductIndices.add(prodIdx);
        results.push({
          productIndex: prodIdx,
          menuIndex: m
        });
      }
    }
  }
  return results;
}

function generateReservations(users, restaurants, menuProducts) {
  const statuses = ["pending", "confirmed", "completed", "cancelled", "confirmed", "completed"];
  const results = [];
  const baseDate = new Date("2024-06-01");
  for (let i = 0; i < TARGETS.reservations; i++) {
    const userIdx = i % users.length;
    const restIdx = i % restaurants.length;
    const date = new Date(baseDate);
    date.setDate(date.getDate() + randInt(0, 365));
    date.setHours(randInt(11, 21), randInt(0, 59), 0, 0);
    results.push({
      userIndex: userIdx,
      restaurantIndex: restIdx,
      reservationDate: date,
      partySize: randInt(1, 12),
      status: pick(statuses),
      specialRequests: Math.random() > 0.7 ? pick(SPECIAL_REQUESTS.filter(Boolean)) : null
    });
  }
  return results;
}

// ─── Database Seeders ───────────────────────────────────────────────────────

async function seedPostgres() {
  const { getPrismaClient } = require("../../services/api/src/config/db");
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Could not initialize PrismaClient. Check DATABASE_URL is set.");
  }

  const categoriesData = generateCategories();
  const restaurantsData = generateRestaurants();
  const productsData = generateProducts(categoriesData.length);
  const usersData = generateUsers();
  const menusData = generateMenus(restaurantsData.length);
  const menuProductsData = generateMenuProducts(menusData, productsData, restaurantsData.length);
  const reservationsData = generateReservations(usersData, restaurantsData, menuProductsData);

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
    for (const cat of categoriesData) {
      createdCategories.push(await prisma.category.create({ data: cat }));
    }

    console.log("Seeding restaurants...");
    const createdRestaurants = [];
    for (const rest of restaurantsData) {
      createdRestaurants.push(await prisma.restaurant.create({ data: rest }));
    }

    console.log(`Seeding ${productsData.length} products...`);
    const createdProducts = [];
    for (const prod of productsData) {
      const { categoryIndex, ...data } = prod;
      data.categoryId = createdCategories[categoryIndex].id;
      data.description = data.description || "";
      data.imageUrl = `https://placehold.co/400x300?text=${encodeURIComponent(data.name)}`;
      createdProducts.push(await prisma.product.create({ data }));
    }

    console.log(`Seeding ${usersData.length} users...`);
    const createdUsers = [];
    for (const user of usersData) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      createdUsers.push(await prisma.user.create({
        data: { name: user.name, email: user.email, passwordHash, role: user.role }
      }));
    }

    console.log(`Seeding ${menusData.length} menus...`);
    const createdMenus = [];
    for (const menu of menusData) {
      const { restaurantIndex, active, ...data } = menu;
      data.restaurantId = createdRestaurants[restaurantIndex].id;
      createdMenus.push(await prisma.menu.create({ data: { ...data, active } }));
    }

    console.log(`Seeding menu products...`);
    let mpCount = 0;
    for (let m = 0; m < createdMenus.length; m++) {
      const menuProductsForMenu = menuProductsData.filter(mp => mp.menuIndex === m);
      const usedProductIds = new Set();
      let order = 1;
      const batch = [];
      for (const mp of menuProductsForMenu) {
        const productId = createdProducts[mp.productIndex].id;
        if (usedProductIds.has(productId)) continue;
        usedProductIds.add(productId);
        batch.push({
          menuId: createdMenus[m].id,
          productId,
          displayOrder: order++
        });
        mpCount++;
      }
      if (batch.length > 0) {
        await prisma.menuProduct.createMany({ data: batch, skipDuplicates: true });
      }
    }

    console.log(`Seeding ${reservationsData.length} reservations...`);
    for (const res of reservationsData) {
      await prisma.reservation.create({
        data: {
          userId: createdUsers[res.userIndex].id,
          restaurantId: createdRestaurants[res.restaurantIndex].id,
          reservationDate: res.reservationDate,
          partySize: res.partySize,
          status: res.status,
          specialRequests: res.specialRequests
        }
      });
    }

    return {
      categories: createdCategories.length,
      restaurants: createdRestaurants.length,
      products: createdProducts.length,
      users: createdUsers.length,
      menus: createdMenus.length,
      menuProducts: mpCount,
      reservations: TARGETS.reservations
    };
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

  const categoriesData = generateCategories();
  const restaurantsData = generateRestaurants();
  const productsData = generateProducts(categoriesData.length);
  const usersData = generateUsers();
  const menusData = generateMenus(restaurantsData.length);
  const menuProductsData = generateMenuProducts(menusData, productsData, restaurantsData.length);
  const reservationsData = generateReservations(usersData, restaurantsData, menuProductsData);

  console.log("Cleaning existing data...");
  await Promise.all([
    Category.deleteMany({}), Restaurant.deleteMany({}), Product.deleteMany({}),
    User.deleteMany({}), Menu.deleteMany({}), MenuProduct.deleteMany({}), Reservation.deleteMany({})
  ]);

  console.log("Seeding categories...");
  const createdCategories = await Category.insertMany(categoriesData);

  console.log("Seeding restaurants...");
  const createdRestaurants = await Restaurant.insertMany(restaurantsData);

  console.log(`Seeding ${productsData.length} products...`);
  const productDocs = productsData.map(p => {
    const { categoryIndex, ...data } = p;
    data.categoryId = createdCategories[categoryIndex]._id;
    data.description = data.description || "";
    data.imageUrl = `https://placehold.co/400x300?text=${encodeURIComponent(data.name)}`;
    return data;
  });
  const createdProducts = await Product.insertMany(productDocs);

  console.log(`Seeding ${usersData.length} users...`);
  const userDocs = [];
  for (const user of usersData) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    userDocs.push({ name: user.name, email: user.email, passwordHash, role: user.role });
  }
  const createdUsers = await User.insertMany(userDocs);

  console.log(`Seeding ${menusData.length} menus...`);
  const menuDocs = menusData.map(menu => {
    const { restaurantIndex, ...data } = menu;
    data.restaurantId = createdRestaurants[restaurantIndex]._id;
    return data;
  });
  const createdMenus = await Menu.insertMany(menuDocs);

  console.log(`Seeding menu products...`);
  let mpCount = 0;
  for (let m = 0; m < createdMenus.length; m++) {
    const menuProductsForMenu = menuProductsData.filter(mp => mp.menuIndex === m);
    const usedProductIds = new Set();
    let order = 1;
    const docs = [];
    for (const mp of menuProductsForMenu) {
      const productId = createdProducts[mp.productIndex]._id;
      if (usedProductIds.has(productId.toString())) continue;
      usedProductIds.add(productId.toString());
      docs.push({
        menuId: createdMenus[m]._id,
        productId,
        displayOrder: order++
      });
      mpCount++;
    }
    if (docs.length > 0) {
      await MenuProduct.insertMany(docs);
    }
  }

  console.log(`Seeding ${reservationsData.length} reservations...`);
  const reservationDocs = reservationsData.map(res => ({
    userId: createdUsers[res.userIndex]._id,
    restaurantId: createdRestaurants[res.restaurantIndex]._id,
    reservationDate: res.reservationDate,
    partySize: res.partySize,
    status: res.status,
    specialRequests: res.specialRequests
  }));
  await Reservation.insertMany(reservationDocs);

  await mongoose.disconnect();
  return {
    categories: createdCategories.length,
    restaurants: createdRestaurants.length,
    products: createdProducts.length,
    users: createdUsers.length,
    menus: createdMenus.length,
    menuProducts: mpCount,
    reservations: reservationsData.length
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seed Data Generator — Engine: ${dbEngine}\n`);

  const categoriesData = generateCategories();
  const restaurantsData = generateRestaurants();
  const productsData = generateProducts(categoriesData.length);
  const usersData = generateUsers();
  const menusData = generateMenus(restaurantsData.length);
  const menuProductsData = generateMenuProducts(menusData, productsData, restaurantsData.length);
  const reservationsData = generateReservations(usersData, restaurantsData, menuProductsData);

  console.log("Generated data counts:");
  console.log(`   Categories:   ${categoriesData.length}`);
  console.log(`   Restaurants:  ${restaurantsData.length}`);
  console.log(`   Products:     ${productsData.length}`);
  console.log(`   Users:        ${usersData.length}`);
  console.log(`   Menus:        ${menusData.length}`);
  console.log(`   Reservations: ${reservationsData.length}`);
  console.log(`   Total:        ${categoriesData.length + restaurantsData.length + productsData.length + usersData.length + menusData.length + reservationsData.length}\n`);

  try {
    const result = dbEngine === "mongodb" ? await seedMongo() : await seedPostgres();

    console.log("\n✅ Seeding completed successfully!");
    console.log(`   Categories:   ${result.categories}`);
    console.log(`   Restaurants:  ${result.restaurants}`);
    console.log(`   Products:     ${result.products}`);
    console.log(`   Users:        ${result.users}`);
    console.log(`   Menus:        ${result.menus}`);
    console.log(`   MenuProducts: ${result.menuProducts}`);
    console.log(`   Reservations: ${result.reservations}\n`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
