const RestaurantRepository = require("../interfaces/restaurant.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    description: { type: String, default: "" },
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const RestaurantModel =
  mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

class RestaurantMongoRepository extends RestaurantRepository {
  async list() {
    await ensureMongoConnection();
    return RestaurantModel.find({}).sort({ createdAt: -1 }).lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return RestaurantModel.findById(id).lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return RestaurantModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return RestaurantModel.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return RestaurantModel.findByIdAndDelete(id).lean();
  }
}

module.exports = RestaurantMongoRepository;
