import { Building } from "../types/building";

export const formatBuilding = (building: Building): string => {
  return [
    `🏛️ ${building.title}`,
    "",
    `📍 Район: ${building.district}`,
    `🎨 Стиль: ${building.style}`,
    `👤 Архитектор: ${building.architect}`,
    `📌 Адрес: ${building.address}`,
    "",
    "—",
    "",
    building.description
  ].join("\n");
};
