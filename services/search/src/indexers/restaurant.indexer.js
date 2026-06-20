const { elastic } = require("../config/elasticsearch");

async function indexRestaurant(restaurant) {
  return elastic.index({
    index: "restaurants",
    id: String(restaurant.id),
    document: restaurant,
    refresh: true
  });
}

module.exports = {
  indexRestaurant
};
