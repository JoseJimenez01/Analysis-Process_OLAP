const CategoryRepository = require("../interfaces/category.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" }
  },
  { timestamps: true }
);

const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

class CategoryMongoRepository extends CategoryRepository {
  async list() {
    await ensureMongoConnection();
    return CategoryModel.find({}).sort({ name: 1 }).lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return CategoryModel.findById(id).lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return CategoryModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return CategoryModel.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return CategoryModel.findByIdAndDelete(id).lean();
  }
}

module.exports = CategoryMongoRepository;
