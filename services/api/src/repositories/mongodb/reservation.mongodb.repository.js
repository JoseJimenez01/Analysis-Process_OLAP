const ReservationRepository = require("../interfaces/reservation.repository");
const { mongoose, ensureMongoConnection } = require("../../config/db");

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    reservationDate: { type: Date, required: true },
    partySize: { type: Number, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
    specialRequests: { type: String, default: "" }
  },
  { timestamps: true }
);

const ReservationModel =
  mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);

class ReservationMongoRepository extends ReservationRepository {
  async list() {
    await ensureMongoConnection();
    return ReservationModel.find({})
      .populate("userId")
      .populate("restaurantId")
      .sort({ reservationDate: -1 })
      .lean();
  }

  async findById(id) {
    await ensureMongoConnection();
    return ReservationModel.findById(id)
      .populate("userId")
      .populate("restaurantId")
      .lean();
  }

  async findByUserId(userId) {
    await ensureMongoConnection();
    return ReservationModel.find({ userId })
      .populate("userId")
      .populate("restaurantId")
      .sort({ reservationDate: -1 })
      .lean();
  }

  async create(payload) {
    await ensureMongoConnection();
    return ReservationModel.create(payload);
  }

  async update(id, payload) {
    await ensureMongoConnection();
    return ReservationModel.findByIdAndUpdate(id, payload, { new: true })
      .populate("userId")
      .populate("restaurantId")
      .lean();
  }

  async delete(id) {
    await ensureMongoConnection();
    return ReservationModel.findByIdAndDelete(id).lean();
  }
}

module.exports = ReservationMongoRepository;
