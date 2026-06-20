const RestaurantRepository = require("../interfaces/restaurant.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class RestaurantPostgresRepository extends RestaurantRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.restaurant.findUnique({ where: { id } });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.restaurant.create({
      data: payload
    });
  }

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.restaurant.update({
      where: { id },
      data: payload
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.restaurant.delete({ where: { id } });
  }
}

module.exports = RestaurantPostgresRepository;
