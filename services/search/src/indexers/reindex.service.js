const { elastic } = require("../config/elasticsearch");
const { indexRestaurant } = require("./restaurant.indexer");
const { indexBulkProducts } = require("./product.indexer");

const dbEngine = process.env.DB_ENGINE || "postgres";

async function fetchFromPostgres() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const restaurants = await prisma.restaurant.findMany();
    const products = await prisma.product.findMany({ include: { category: true } });
    return { restaurants, products };
  } finally {
    await prisma.$disconnect();
  }
}

async function fetchFromMongo() {
  const mongoose = require("mongoose");
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not configured for reindex");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const restaurantSchema = new mongoose.Schema({
    name: String, address: String, phone: String, description: String, rating: Number
  }, { timestamps: true });

  const productSchema = new mongoose.Schema({
    name: String, description: String, price: Number, imageUrl: String,
    available: Boolean, categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  }, { timestamps: true });

  const categorySchema = new mongoose.Schema({ name: String, description: String, icon: String });

  mongoose.models.Category || mongoose.model("Category", categorySchema);
  const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);
  const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

  const restaurants = (await Restaurant.find({}).lean()).map(({ _id, __v, ...r }) => ({ ...r, id: String(_id) }));
  const products = (await Product.find({}).populate("categoryId").lean()).map(({ _id, __v, ...p }) => ({
    ...p, id: String(_id),
    categoryId: p.categoryId ? String(p.categoryId._id || p.categoryId) : null
  }));

  return { restaurants, products };
}

async function reindexAll() {
  try {
    console.log(`Starting reindex (engine: ${dbEngine})...`);

    console.log("Clearing indices...");
    try {
      await elastic.indices.delete({ index: "restaurants" });
      await elastic.indices.delete({ index: "products" });
    } catch (e) {
      console.log("Indices may not exist yet, creating new ones");
    }

    const { restaurants, products } = dbEngine === "mongodb"
      ? await fetchFromMongo()
      : await fetchFromPostgres();

    console.log(`Found ${restaurants.length} restaurants, ${products.length} products`);

    if (restaurants.length > 0) {
      console.log("Indexing restaurants...");
      for (const restaurant of restaurants) {
        await indexRestaurant(restaurant);
      }
    }

    if (products.length > 0) {
      console.log("Indexing products...");
      await indexBulkProducts(products);
    }

    console.log("Reindex completed successfully");
    return {
      success: true,
      engine: dbEngine,
      restaurantsIndexed: restaurants.length,
      productsIndexed: products.length
    };
  } catch (error) {
    console.error("Reindex failed:", error);
    throw error;
  }
}

module.exports = { reindexAll };
