const UserRepository = require("../interfaces/user.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "customer"], default: "customer" }
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

class UserMongoRepository extends UserRepository {
  async list() {
    await ensureMongoConnection();
    return UserModel.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return UserModel.findById(id)
      .select("-passwordHash")
      .lean();
  }

  async findByEmail(email) {
    await ensureMongoConnection();
    return UserModel.findOne({ email }).lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return UserModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return UserModel.findByIdAndUpdate(id, payload, { new: true })
      .select("-passwordHash")
      .lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return UserModel.findByIdAndDelete(id).lean();
  }
}

module.exports = UserMongoRepository;
