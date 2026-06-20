const CategoryRepository = require("../interfaces/category.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class CategoryPostgresRepository extends CategoryRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.category.findUnique({ where: { id } });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.category.create({ data: payload });
  }

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.category.update({
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

    return prisma.category.delete({ where: { id } });
  }
}

module.exports = CategoryPostgresRepository;
