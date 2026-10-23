export const API_GLOBAL_PREFIX = 'api';

export interface Item {
  id: string;
  title: string;
  createdAt: string;
}

export interface CreateItemRequest {
  title: string;
}

export interface HealthStatus {
  status: 'ok';
  service: 'furai-api';
  timestamp: string;
}

export type ProductModel = 'chair' | 'table' | 'lamp' | 'closet';

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface ProductDetails extends ProductSummary {
  color: string;
  model: ProductModel;
}
