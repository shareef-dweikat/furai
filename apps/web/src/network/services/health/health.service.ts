import type { HealthStatus } from '@furai/shared'
import { request } from '../../../lib/http.ts'

export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health')
}
