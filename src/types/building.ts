export type Building = {
  id: number;
  title: string;
  district: string;
  style: string;
  architect: string;
  address: string;
  description: string;
  channelUrl: string;
  imageUrl: string;
};

export type CategoryKind = "style" | "district";

export type CategorySelection = {
  kind: CategoryKind;
  optionId: number;
  value: string;
};

