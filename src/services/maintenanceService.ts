import { API_BASE_URL, fetchWithTimeout } from '../config/api';

export type MaintenanceData = {
  maintenance: boolean;
  title: string;
  message: string;
  estimatedReturn?: string;
};

export const checkMaintenance = async (): Promise<MaintenanceData | null> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/status`, {}, 6000);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.maintenance) {
      return {
        maintenance: true,
        title: json.title || 'Under Maintenance',
        message: json.message || 'We are currently performing scheduled maintenance.',
        estimatedReturn: json.estimatedReturn,
      };
    }
    return null;
  } catch {
    return null;
  }
};
