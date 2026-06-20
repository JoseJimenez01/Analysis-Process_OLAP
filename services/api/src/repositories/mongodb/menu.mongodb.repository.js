const MenuRepository = require("../interfaces/menu.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }
  },
  { timestamps: true }
);

const MenuModel = mongoose.models.Menu || mongoose.model("Menu", menuSchema);

class MenuMongoRepository extends MenuRepository {
  async list() {
    await ensureMongoConnection();
    return MenuModel.find({})
      .populate("restaurantId")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return MenuModel.findById(id).populate("restaurantId").lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return MenuModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return MenuModel.findByIdAndUpdate(id, payload, { new: true })
      .populate("restaurantId")
      .lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return MenuModel.findByIdAndDelete(id).lean();
  }
}

module.exports = MenuMongoRepository;
