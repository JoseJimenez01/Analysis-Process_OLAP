const ProductRepository = require("../interfaces/product.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class ProductPostgresRepository extends ProductRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.product.create({
      data: payload,
      include: { category: true }
    });
  }

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.product.update({
      where: { id },
      data: payload,
      include: { category: true }
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.product.delete({ where: { id } });
  }
}

module.exports = ProductPostgresRepository;
