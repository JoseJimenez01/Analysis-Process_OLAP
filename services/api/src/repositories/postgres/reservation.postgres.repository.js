const ReservationRepository = require("../interfaces/reservation.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class ReservationPostgresRepository extends ReservationRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.findMany({
      include: { user: true, restaurant: true },
      orderBy: { reservationDate: "desc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.findUnique({
      where: { id },
      include: { user: true, restaurant: true }
    });
  }

  async findByUserId(userId) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.findMany({
      where: { userId },
      include: { user: true, restaurant: true },
      orderBy: { reservationDate: "desc" }
    });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.create({
      data: payload,
      include: { user: true, restaurant: true }
    });
  }

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.update({
      where: { id },
      data: payload,
      include: { user: true, restaurant: true }
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.reservation.delete({ where: { id } });
  }
}

module.exports = ReservationPostgresRepository;
