export type BuildingHealthStatus = 'Healthy' | 'Warning' | 'Critical';
export type AnomalySeverity = 'Critical' | 'Warning' | 'Attention';
export type CampusMetricType = 'energy_kwh' | 'water_kl' | 'waste_kg' | 'aqi' | 'pm25' | 'co2';

export interface CampusRecord {
  id?: string;
  timestamp: string;
  building_id: string;
  building_name: string;
  energy_kwh?: number;
  water_kl?: number;
  waste_kg?: number;
  aqi?: number;
  pm25?: number;
  co2?: number;
  asset_utilization_pct?: number;
  asset_id?: string;
  occupancy?: number;
  [key: string]: any;
}

export interface ColumnMapping {
  timestamp?: string;
  building_id?: string;
  building_name?: string;
  energy_kwh?: string;
  water_kl?: string;
  waste_kg?: string;
  aqi?: string;
  pm25?: string;
  co2?: string;
  asset_utilization_pct?: string;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  duplicates: number;
  missingValues: number;
  qualityScore: number;
}

export interface BuildingOverview {
  building_id: string;
  building_name: string;
  totalEnergy: number;
  totalWater: number;
  totalWaste: number;
  avgAqi: number;
  status: BuildingHealthStatus;
  trend: Array<{ timestamp: string; energy: number; water: number }>;
}

export interface AnomalyAlert {
  id: string;
  severity: AnomalySeverity;
  metric: CampusMetricType;
  building_id: string;
  building_name: string;
  timestamp: string;
  value: number;
  expectedAvg: number;
  description: string;
}

export interface CampusFilters {
  dateRange: { start: string; end: string };
  buildingId: string;
  metricType: string;
  refreshInterval: number;
}