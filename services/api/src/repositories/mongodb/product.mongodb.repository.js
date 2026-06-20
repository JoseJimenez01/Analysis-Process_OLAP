const ProductRepository = require("../interfaces/product.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    available: { type: Boolean, default: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product || mongoose.model("Product", productSchema);

class ProductMongoRepository extends ProductRepository {
  async list() {
    await ensureMongoConnection();
    return ProductModel.find({})
      .populate("categoryId")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return ProductModel.findById(id).populate("categoryId").lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return ProductModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return ProductModel.findByIdAndUpdate(id, payload, { new: true })
      .populate("categoryId")
      .lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return ProductModel.findByIdAndDelete(id).lean();
  }
}

module.exports = ProductMongoRepository;
