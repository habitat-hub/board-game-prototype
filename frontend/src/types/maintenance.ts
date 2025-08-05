export interface MaintenanceConfig {
  isMaintenanceMode: boolean;
  message: string;
  endTime: string | null;
  allowedPaths: string[];
}
