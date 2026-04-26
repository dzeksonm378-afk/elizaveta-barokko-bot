export type PlaceType =
  | "public_space"
  | "photo_spot"
  | "walking_area"
  | "architecture"
  | "creative_space";

export type Place = {
  id: number;
  title: string;
  type: PlaceType;
  category: string;
  district: string;
  address: string;
  priceLevel: string;
  bestFor: string[];
  description: string;
  channelUrl: string;
  imageUrl: string;
};

