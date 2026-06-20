const MenuRepository = require("../interfaces/menu.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class MenuPostgresRepository extends MenuRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menu.findMany({
      include: { restaurant: true, products: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menu.findUnique({
      where: { id },
      include: { restaurant: true, products: { include: { product: true } } }
    });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menu.create({
      data: payload,
      include: { restaurant: true }
    });
  }

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menu.update({
      where: { id },
      data: payload,
      include: { restaurant: true }
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menu.delete({ where: { id } });
  }
}

module.exports = MenuPostgresRepository;
