const MenuProductRepository = require("../interfaces/menu-product.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const menuProductSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

menuProductSchema.index({ menuId: 1, productId: 1 }, { unique: true });

const MenuProductModel =
  mongoose.models.MenuProduct || mongoose.model("MenuProduct", menuProductSchema);

class MenuProductMongoRepository extends MenuProductRepository {
  async listByMenuId(menuId) {
    await ensureMongoConnection();
    return MenuProductModel.find({ menuId })
      .populate("productId")
      .sort({ displayOrder: 1 })
      .lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return MenuProductModel.findById(id).populate("productId").lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return MenuProductModel.create(payload);
  }

  async delete(id) {
    await ensureMongoConnection();
    return MenuProductModel.findByIdAndDelete(id).lean();
  }

  async deleteByMenuAndProduct(menuId, productId) {
    await ensureMongoConnection();
    return MenuProductModel.deleteMany({ menuId, productId });
  }
}

module.exports = MenuProductMongoRepository;
