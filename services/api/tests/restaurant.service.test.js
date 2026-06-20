jest.mock("../src/repositories", () => ({
  getRestaurantRepository: jest.fn()
}));

const { getRestaurantRepository } = require("../src/repositories");
const RestaurantService = require("../src/services/restaurant.service");

describe("RestaurantService", () => {
  it("delegates operations to the repository", async () => {
    const repository = {
      list: jest.fn().mockResolvedValue(["a"]),
      findById: jest.fn().mockResolvedValue({ id: "1" }),
      create: jest.fn().mockResolvedValue({ id: "2" }),
      update: jest.fn().mockResolvedValue({ id: "3" }),
      delete: jest.fn().mockResolvedValue({ id: "4" })
    };

    getRestaurantRepository.mockReturnValue(repository);

    const service = new RestaurantService();

    await expect(service.listRestaurants()).resolves.toEqual(["a"]);
    await expect(service.getRestaurant("1")).resolves.toEqual({ id: "1" });
    await expect(service.createRestaurant({ name: "x" })).resolves.toEqual({ id: "2" });
    await expect(service.updateRestaurant("3", { name: "y" })).resolves.toEqual({ id: "3" });
    await expect(service.deleteRestaurant("4")).resolves.toEqual({ id: "4" });

    expect(repository.list).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith("1");
    expect(repository.create).toHaveBeenCalledWith({ name: "x" });
    expect(repository.update).toHaveBeenCalledWith("3", { name: "y" });
    expect(repository.delete).toHaveBeenCalledWith("4");
  });
});