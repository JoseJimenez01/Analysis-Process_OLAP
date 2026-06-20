jest.mock("../src/config/env", () => ({
  dbEngine: "postgres"
}));

describe("repository factory", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns postgres repositories when dbEngine is postgres", () => {
    jest.mock("../src/config/env", () => ({ dbEngine: "postgres" }));
    const repos = require("../src/repositories");
    const productRepo = repos.getProductRepository();
    const userRepo = repos.getUserRepository();
    const categoryRepo = repos.getCategoryRepository();
    const menuRepo = repos.getMenuRepository();
    const menuProductRepo = repos.getMenuProductRepository();
    const reservationRepo = repos.getReservationRepository();
    const restaurantRepo = repos.getRestaurantRepository();

    expect(productRepo.constructor.name).toBe("ProductPostgresRepository");
    expect(userRepo.constructor.name).toBe("UserPostgresRepository");
    expect(categoryRepo.constructor.name).toBe("CategoryPostgresRepository");
    expect(menuRepo.constructor.name).toBe("MenuPostgresRepository");
    expect(menuProductRepo.constructor.name).toBe("MenuProductPostgresRepository");
    expect(reservationRepo.constructor.name).toBe("ReservationPostgresRepository");
    expect(restaurantRepo.constructor.name).toBe("RestaurantPostgresRepository");
  });

  it("returns mongodb repositories when dbEngine is mongodb", () => {
    jest.mock("../src/config/env", () => ({ dbEngine: "mongodb" }));
    const repos = require("../src/repositories");

    const productRepo = repos.getProductRepository();
    const userRepo = repos.getUserRepository();
    const categoryRepo = repos.getCategoryRepository();
    const menuRepo = repos.getMenuRepository();
    const menuProductRepo = repos.getMenuProductRepository();
    const reservationRepo = repos.getReservationRepository();
    const restaurantRepo = repos.getRestaurantRepository();

    expect(productRepo.constructor.name).toBe("ProductMongoRepository");
    expect(userRepo.constructor.name).toBe("UserMongoRepository");
    expect(categoryRepo.constructor.name).toBe("CategoryMongoRepository");
    expect(menuRepo.constructor.name).toBe("MenuMongoRepository");
    expect(menuProductRepo.constructor.name).toBe("MenuProductMongoRepository");
    expect(reservationRepo.constructor.name).toBe("ReservationMongoRepository");
    expect(restaurantRepo.constructor.name).toBe("RestaurantMongoRepository");
  });
});
