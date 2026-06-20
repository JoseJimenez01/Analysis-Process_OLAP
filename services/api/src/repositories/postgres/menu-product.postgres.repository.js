const MenuProductRepository = require("../interfaces/menu-product.repository");
const { getPrismaClient, getPrismaInitError } = require("../../config/db");

class MenuProductPostgresRepository extends MenuProductRepository {
  async listByMenuId(menuId) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menuProduct.findMany({
      where: { menuId },
      include: { product: true },
      orderBy: { displayOrder: "asc" }
    });
  }

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menuProduct.findUnique({
      where: { id },
      include: { product: true }
    });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menuProduct.create({
      data: payload,
      include: { product: true }
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menuProduct.delete({ where: { id } });
  }

  async deleteByMenuAndProduct(menuId, productId) {
    const prisma = getPrismaClient();
    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    return prisma.menuProduct.deleteMany({
      where: { menuId, productId }
    });
  }
}

module.exports = MenuProductPostgresRepository;
