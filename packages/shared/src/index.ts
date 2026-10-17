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
