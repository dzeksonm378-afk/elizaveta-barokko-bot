import { Place } from "../types/place";

export const formatPlace = (place: Place): string => {
  return [
    `📸 ${place.title}`,
    "",
    `📍 Район: ${place.district}`,
    `🏷️ Категория: ${place.category}`,
    `💸 Стоимость: ${place.priceLevel}`,
    `📌 Адрес: ${place.address}`,
    "",
    place.description,
    "",
    `Подойдёт для: ${place.bestFor.join(", ")}`
  ].join("\n");
};

