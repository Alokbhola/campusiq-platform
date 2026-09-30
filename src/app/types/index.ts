/**
 * @file CampusIQ TypeScript Type Definitions
 * @module types/campus-iq
 * @description Enterprise-grade type system for CampusIQ - an intelligent smart campus
 * sustainability, telemetry analytics, and automated facility intelligence platform.
 *
 * @version 1.0.0
 * @author Senior Principal Engineer
 */

// Re-export existing domain types for unified imports across the application
export * from './environmentalPillars';
export * from './environs';
export * from './greenBuilding';

/* ========================================================================= */
/* 1. CORE DOMAIN ENUMS & LITERAL TYPES                                      */
/* ========================================================================= */

/**
 * Standard telemetry metric domains tracked across CampusIQ facility subsystems.
 */
export type CampusMetricType =
  | 'energy_kwh'
  | 'water_kl'
  | 'waste_kg'
  | 'aqi'
  | 'pm25'
  | 'co2'
  | 'asset_utilization_pct'
  | 'occupancy';

/**
 * High-level classification of campus metrics for filtering, aggregation, and charts.
 */
export type MetricCategory =
  | 'energy'
  | 'water'
  | 'waste'
  | 'indoor_air_quality'
  | 'space_utilization'
  | 'occupancy';

/**
 * Operational health classification for campus structures and facility zones.
 */
export type BuildingHealthStatus = 'Healthy' | 'Warning' | 'Critical' | 'Maintenance';

/**
 * Severity tier for telemetry anomalies and automated incident tickets.
 */
export type AnomalySeverity = 'Critical' | 'Warning' | 'Attention';

/**
 * Supported data transformation functions during Excel/CSV ingestion.
 */
export type DataTransformer =
  | 'none'
  | 'to_uppercase'
  | 'to_lowercase'
  | 'trim_whitespace'
  | 'watts_to_kilowatts'
  | 'mwh_to_kwh'
  | 'liters_to_kiloliters'
  | 'gallons_to_kiloliters'
  | 'pounds_to_kilograms'
  | 'celsius_to_fahrenheit'
  | 'iso_date_parser';

/* ========================================================================= */
/* 2. CAMPUS RECORD (RAW & NORMALIZED TELEMETRY)                             */
/* ========================================================================= */

/**
 * Represents a single normalized telemetry data point ingested into CampusIQ.
 * Combines structural metadata, environmental indicators, resource consumption,
 * and occupant load metrics.
 */
export interface CampusRecord {
  /**
   * ISO 8601 formatted timestamp string representing when the telemetry point was logged.
   * @example "2026-09-30T08:00:00.000Z"
   */
  timestamp: string;

  /**
   * Unique alphanumeric code identifying the physical campus building.
   * @example "BLDG-ENG-01", "LIB-WEST-4"
   */
  building_id: string;

  /**
   * Human-readable official name or display title of the building.
   * @example "Engineering & Robotics Complex", "Central Commons Library"
   */
  building_name: string;

  /**
   * Total electrical energy consumed over the recording window in kilowatt-hours (kWh).
   * @minimum 0
   * @example 482.5
   */
  energy_kwh: number;

  /**
   * Total potable and utility water volume drawn in kiloliters (kL / m³).
   * @minimum 0
   * @example 14.8
   */
  water_kl: number;

  /**
   * Cumulative mass of municipal solid waste, compost, and recyclables generated in kilograms (kg).
   * @minimum 0
   * @example 128.4
   */
  waste_kg: number;

  /**
   * Computed Air Quality Index (US EPA AQI standard, scale 0 - 500).
   * 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive Groups, 151+ Unhealthy.
   * @minimum 0
   * @maximum 500
   * @example 38
   */
  aqi: number;

  /**
   * Fine inhalable particulate matter concentration with diameters 2.5 micrometers and smaller (µg/m³).
   * @minimum 0
   * @example 8.4
   */
  pm25: number;

  /**
   * Carbon dioxide concentration measured via non-dispersive infrared (NDIR) optical sensors in parts per million (ppm).
   * Recommended indoor standard: ≤ 800 ppm; ASHRAE 62.1 threshold: ≤ 1000 ppm.
   * @minimum 300
   * @maximum 5000
   * @example 540
   */
  co2: number;

  /**
   * Measured operational utilization percentage of tracked smart assets (HVAC chillers, lab benches, AV rigs).
   * Scale from 0.0% (idle) to 100.0% (saturated).
   * @minimum 0
   * @maximum 100
   * @example 78.5
   */
  asset_utilization_pct: number;

  /**
   * Unique identifier of the dominant smart IoT equipment, sensor gateway, or sub-metered circuit.
   * @example "METER-PV-MAIN-03", "HVAC-CHILLER-B"
   */
  asset_id: string;

  /**
   * Instantaneous headcount or thermal occupancy count inside the monitored facility zone.
   * @minimum 0
   * @example 245
   */
  occupancy: number;

  /**
   * Optional ingestion metadata recording row audit trail.
   */
  metadata?: {
    /** Raw row index in the source spreadsheet or streaming partition */
    source_row_index?: number;
    /** Original file name or batch identifier */
    ingestion_batch_id?: string;
    /** Sensor transmission latency in milliseconds */
    latency_ms?: number;
    /** Whether this record was imputed/interpolated due to a temporary packet drop */
    is_imputed?: boolean;
  };
}

/**
 * Partial or un-normalized raw data record as parsed directly from arbitrary spreadsheets
 * prior to schema mapping, type coercion, and validation rules.
 */
export type RawCampusDataRow = Record<string, string | number | boolean | null | undefined>;

/* ========================================================================= */
/* 3. COLUMN MAPPING & DYNAMIC SPREADSHEET INGESTION                         */
/* ========================================================================= */

/**
 * Definition of an individual field mapping binding a dynamic source spreadsheet header
 * to a canonical CampusRecord schema attribute.
 */
export interface ColumnMappingField {
  /**
   * Raw header string found in the uploaded Excel / CSV sheet.
   * @example "Power (kWh)", "Building Code", "Timestamp UTC"
   */
  sourceColumn: string;

  /**
   * Target canonical attribute on the normalized `CampusRecord`.
   */
  targetField: keyof CampusRecord;

  /**
   * Expected data primitive type for coercion and validation.
   */
  dataType: 'string' | 'number' | 'date' | 'boolean';

  /**
   * Whether this field is mandatory for the row to be marked valid.
   */
  isRequired: boolean;

  /**
   * Algorithmic confidence score (0.0 to 1.0) for automated header matching heuristics.
   * @example 0.95
   */
  confidenceScore: number;

  /**
   * Optional data transformation pipeline step applied before insertion.
   */
  transformer?: DataTransformer;

  /**
   * Sample values extracted from the first few rows of the uploaded file for previewing.
   */
  previewValues?: (string | number | boolean | null)[];

  /**
   * Default fallback value applied if the source column contains null or blank cells.
   */
  defaultValue?: string | number;
}

/**
 * Complete column mapping configuration for an uploaded tabular dataset.
 * Tracks user-confirmed bindings, unresolved headers, and schema match rates.
 */
export interface ColumnMapping {
  /**
   * Unique identifier for this mapping configuration template.
   */
  mappingId: string;

  /**
   * Name of the worksheet or source data table being mapped.
   * @example "Sheet1", "Campus_Telemetry_Q3"
   */
  sheetName: string;

  /**
   * Array of explicit column bindings.
   */
  mappings: ColumnMappingField[];

  /**
   * Source column headers that could not be mapped to any canonical CampusIQ field.
   */
  unmappedColumns: string[];

  /**
   * Required canonical fields that have not yet been assigned to any source column.
   */
  missingRequiredFields: (keyof CampusRecord)[];

  /**
   * Aggregate percentage (0.0 to 100.0) of required schema fields successfully bound.
   * @example 100.0
   */
  schemaCoveragePct: number;

  /**
   * Flag indicating whether the user or auto-mapper has verified the mapping.
   */
  isConfirmed: boolean;

  /**
   * Timestamp when the mapping was generated or updated.
   */
  lastUpdated: string;
}

/* ========================================================================= */
/* 4. DATA QUALITY AUDIT & REPORTING                                         */
/* ========================================================================= */

/**
 * Detailed description of a validation defect detected in an uploaded dataset.
 */
export interface DataQualityIssue {
  /** Numerical index of the affected row in the uploaded dataset (1-indexed for spreadsheet users) */
  rowIndex: number;
  /** Name of the affected field */
  field: keyof CampusRecord | string;
  /** Raw invalid value encountered */
  invalidValue: unknown;
  /** Error category classification */
  issueType: 'missing_required' | 'type_mismatch' | 'out_of_bounds' | 'duplicate_key' | 'invalid_date';
  /** Human-readable explanation of why the value failed validation */
  message: string;
  /** Whether the parser was able to auto-correct this issue using fallback defaults */
  autoRemediated: boolean;
}

/**
 * Granular audit statistics for a single canonical field.
 */
export interface FieldQualityMetric {
  field: keyof CampusRecord;
  totalPresent: number;
  missingCount: number;
  missingPercentage: number;
  invalidTypeCount: number;
  outOfRangeCount: number;
  distinctValuesCount: number;
  inferredMin?: number;
  inferredMax?: number;
}

/**
 * Comprehensive summary report generated following spreadsheet parse & validation.
 * Quantifies data hygiene, integrity defects, and overall confidence score.
 */
export interface DataQualityReport {
  /** Unique audit report identifier */
  reportId: string;

  /** Source file name uploaded by the operator */
  fileName: string;

  /** File size in bytes */
  fileSizeBytes: number;

  /** Total number of data rows evaluated in the source file */
  totalRows: number;

  /** Number of rows that passed all schema and validation constraints */
  validRows: number;

  /** Number of rows containing unresolvable validation errors */
  invalidRows: number;

  /** Total count of exact duplicate records identified by composite key (timestamp + building_id) */
  duplicates: number;

  /** Cumulative count of missing or null values across all fields */
  missingValues: number;

  /** Granular missing value count keyed by canonical field name */
  missingValuesByField: Record<keyof CampusRecord, number>;

  /**
   * Computed data hygiene index percentage (0.0 to 100.0%).
   * Formula: ((validRows / totalRows) * 0.7 + (1 - duplicates / totalRows) * 0.15 + (1 - missingValues / (totalRows * fieldCount)) * 0.15) * 100
   * @example 96.8
   */
  qualityScorePercentage: number;

  /** Quality tier classification based on qualityScorePercentage */
  qualityTier: 'Exemplary' | 'Acceptable' | 'Needs Review' | 'Critical Failure';

  /** Array of specific cell-level defects flagged during parsing */
  issues: DataQualityIssue[];

  /** Per-column audit breakdown */
  fieldMetrics: FieldQualityMetric[];

  /** High-level operational recommendations to improve dataset hygiene */
  remediationSuggestions: string[];

  /** ISO timestamp when this audit report was generated */
  generatedAt: string;
}

/* ========================================================================= */
/* 5. BUILDING OVERVIEW & HISTORICAL TRENDS                                  */
/* ========================================================================= */

/**
 * Aggregated metric totals and averages computed for a specific building over the active scope.
 */
export interface BuildingAggregatedMetrics {
  /** Sum of electrical consumption (kWh) */
  total_energy_kwh: number;
  /** Mean hourly/daily energy load rate (kW) */
  average_energy_kw: number;
  /** Sum of water usage (kL) */
  total_water_kl: number;
  /** Sum of solid waste generated (kg) */
  total_waste_kg: number;
  /** Mean Air Quality Index */
  mean_aqi: number;
  /** Mean particulate PM2.5 level (µg/m³) */
  mean_pm25: number;
  /** Mean carbon dioxide concentration (ppm) */
  mean_co2: number;
  /** Average equipment utilization rate (0 - 100%) */
  average_asset_utilization_pct: number;
  /** Peak concurrent occupancy count recorded */
  peak_occupancy: number;
  /** Average baseline occupancy */
  average_occupancy: number;
  /** Energy Use Intensity (kWh / m² / year) */
  energy_use_intensity_eui?: number;
  /** Estimated avoided carbon footprint today in kilograms of CO₂ equivalent */
  carbon_offset_kg_co2?: number;
}

/**
 * Single temporal slice in a building's historical telemetry timeline.
 */
export interface HistoricalTrendPoint {
  /** ISO timestamp or time-bucket label (e.g. "08:00", "2026-09-29") */
  timestamp: string;
  /** Energy consumption (kWh) */
  energy_kwh: number;
  /** Water consumption (kL) */
  water_kl: number;
  /** Waste generation (kg) */
  waste_kg: number;
  /** Mean AQI */
  aqi: number;
  /** CO2 in ppm */
  co2: number;
  /** PM2.5 in µg/m³ */
  pm25: number;
  /** Occupancy count */
  occupancy: number;
  /** Asset utilization percentage */
  asset_utilization_pct: number;
  /** Whether this data point represents an automated predictive forecast rather than an observed reading */
  is_predicted?: boolean;
}

/**
 * Comprehensive facility overview card data model for executive command centers
 * and campus schematic maps.
 */
export interface BuildingOverview {
  /** Unique structural building identifier */
  building_id: string;

  /** Official building name */
  building_name: string;

  /** Primary facility classification */
  building_type?: 'Academic' | 'Laboratory' | 'Residential' | 'Administration' | 'Athletics' | 'Commons';

  /** Total gross floor space in square meters */
  gross_floor_area_m2?: number;

  /** Number of active IoT gateway nodes transmitting telemetry */
  connected_sensors_count?: number;

  /** Current real-time operational status */
  current_status: BuildingHealthStatus;

  /** Aggregated sustainability and telemetry metrics */
  total_metrics: BuildingAggregatedMetrics;

  /** Chronological historical trend data points for sparklines and time-series charts */
  historical_trend_series: HistoricalTrendPoint[];

  /** Active unresolved anomaly count for this facility */
  active_anomalies_count: number;

  /** Timestamp of the most recent telemetry packet received */
  last_telemetry_timestamp: string;
}

/* ========================================================================= */
/* 6. ANOMALY DETECTION & AUTOMATED ALERTS                                   */
/* ========================================================================= */

/**
 * Actionable telemetry anomaly or facility fault event detected by analytical thresholds
 * or statistical machine learning models.
 */
export interface AnomalyAlert {
  /** Unique incident ticket or alert event identifier */
  id: string;

  /** Urgency classification of the anomaly */
  severity: AnomalySeverity;

  /** The specific telemetry parameter triggering the alert */
  target_metric: CampusMetricType | string;

  /** Building ID where the anomalous event was recorded */
  building_id: string;

  /** Human-readable building name for notification surfaces */
  building_name?: string;

  /** Timestamp when the anomaly was initially detected */
  timestamp: string;

  /** The actual telemetry reading that triggered the threshold */
  detected_value: number;

  /** The expected nominal value or dynamic moving average for this time period */
  expected_average: number;

  /**
   * Proportional deviation percentage between detected and expected values.
   * Positive indicates spike (+45.2%), negative indicates drop (-32.1%).
   * @example 45.2
   */
  deviation_pct: number;

  /**
   * Plain-language diagnostic explanation generated for facility managers and operators.
   * @example "Abnormal energy surge detected in Robotics Lab: HVAC chiller power spike of 482 kWh is 42% above nominal Wednesday baseline."
   */
  natural_language_explanation: string;

  /** Recommended corrective operational procedure */
  suggested_action?: string;

  /** Flag indicating whether a facility operator has reviewed and acknowledged this alert */
  acknowledged: boolean;

  /** Name or ID of the operator who acknowledged the alert */
  acknowledged_by?: string;

  /** Timestamp when the alert was acknowledged */
  acknowledged_at?: string;

  /** Resolution lifecycle state */
  resolution_status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

/* ========================================================================= */
/* 7. GLOBAL DASHBOARD FILTERS & WORKSPACE STATE                             */
/* ========================================================================= */

/**
 * Standard temporal interval presets for fast filtering.
 */
export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

/**
 * Date range filter model defining bounds for analytical queries.
 */
export interface DateRangeFilter {
  /** ISO string for the start of the query window */
  startDate: string;
  /** ISO string for the end of the query window */
  endDate: string;
  /** Fast selection preset */
  preset: DateRangePreset;
}

/**
 * Global application filter state governing active queries across
 * all CampusIQ dashboard widgets, charts, and export actions.
 */
export interface CampusFilters {
  /**
   * Active date & time boundary window.
   */
  dateRange: DateRangeFilter;

  /**
   * Selected building filter. Either a specific building ID or `'all'` for precinct-wide aggregation.
   * @example "BLDG-ENG-01" or "all"
   */
  buildingId: string | 'all';

  /**
   * Selected metric category or specific metric key to focus visualizers on.
   * @example "energy_kwh", "aqi", or "all"
   */
  metricType: CampusMetricType | MetricCategory | 'all';

  /**
   * Live streaming telemetry poll / refresh interval in milliseconds.
   * Set to 0 to pause live telemetry synchronization.
   * @example 3500 (3.5 seconds), 10000 (10 seconds), 0 (paused)
   */
  refreshInterval: number;

  /**
   * Optional search term string for filtering building names, asset IDs, or alerts.
   */
  searchQuery?: string;

  /**
   * Optional severity filter for alert and anomaly views.
   */
  severityFilter?: AnomalySeverity | 'all';
}

/* ========================================================================= */
/* 8. HIGH-LEVEL WORKSPACE & INGESTION STATE                                 */
/* ========================================================================= */

/**
 * Comprehensive state of an active CampusIQ session containing uploaded data,
 * normalized records, active audits, and real-time alerts.
 */
export interface CampusIQState {
  /** Active global filter state */
  filters: CampusFilters;

  /** Normalized telemetry dataset currently loaded in memory */
  records: CampusRecord[];

  /** Per-building aggregated overviews and status summaries */
  buildings: BuildingOverview[];

  /** Active list of facility anomalies and automated warnings */
  alerts: AnomalyAlert[];

  /** Active column mapping configuration if spreadsheet upload is in progress */
  activeMapping: ColumnMapping | null;

  /** Latest data quality and hygiene audit report */
  latestQualityReport: DataQualityReport | null;

  /** Telemetry streaming heartbeat indicator */
  isStreaming: boolean;
}
