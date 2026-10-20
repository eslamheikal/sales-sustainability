export type ProductSpec = string | { label: string; value: string };

export interface ProductCardModel {
  id?: string;
  title: string;
  heroImageUrl?: string | null;
  specs?: ProductSpec[] | null;
}
