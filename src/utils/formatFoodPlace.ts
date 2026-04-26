import { FoodPlace } from "../types/foodPlace";

export const formatFoodPlace = (foodPlace: FoodPlace): string => {
  return [
    `🍽️ ${foodPlace.title}`,
    "",
    `📍 Район: ${foodPlace.district}`,
    `🏷️ Категория: ${foodPlace.category}`,
    `💸 Формат: ${foodPlace.priceLevel}`,
    `📌 Адрес: ${foodPlace.address}`,
    `🚶 Рядом: ${foodPlace.near}`,
    "",
    foodPlace.description,
    "",
    `Подойдёт для: ${foodPlace.bestFor.join(", ")}`,
    "",
    "⚠️ Цены, меню и режим работы лучше уточнить перед визитом."
  ].join("\n");
};

