import * as XLSX from 'xlsx';
import { GreenBuildingRecord } from '../types/greenBuilding';
import {
  CampusRecord,
  ColumnMapping,
  ColumnMappingField,
  DataQualityReport,
  DataQualityIssue,
  FieldQualityMetric,
} from '../types';

export function parseGreenBuildingFile(file: File): Promise<GreenBuildingRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('File data is empty');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('No rows found in the uploaded spreadsheet');
        }

        const parsedRecords: GreenBuildingRecord[] = rawJson.map((row, index) => {
          // Normalize column headers to lowercase without underscores or spaces
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedRow[cleanKey] = row[k];
          });

          const getValue = (keys: string[], defaultVal: any) => {
            for (const key of keys) {
              const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normalizedRow[clean] !== undefined && normalizedRow[clean] !== null && normalizedRow[clean] !== '') {
                return normalizedRow[clean];
              }
            }
            return defaultVal;
          };

          const num = (keys: string[], fallback: number) => {
            const val = getValue(keys, fallback);
            const parsed = parseFloat(val);
            return isNaN(parsed) ? fallback : parsed;
          };

          const str = (keys: string[], fallback: string) => {
            return String(getValue(keys, fallback) || fallback);
          };

          const buildingId = str(['buildingid', 'building_id', 'id'], `GB-${1000 + index + 1}`);
          const buildingName = str(
            ['buildingname', 'building_name', 'name', 'propertyname'],
            `Green Facility ${buildingId}`
          );

          const buildingTypeRaw = str(['buildingtype', 'building_type', 'type'], 'Commercial Office');
          let buildingType: GreenBuildingRecord['buildingType'] = 'Commercial Office';
          if (/campus|edu|school|university/i.test(buildingTypeRaw)) buildingType = 'Educational / Campus';
          else if (/resident|multi|apart/i.test(buildingTypeRaw)) buildingType = 'Residential Multi-Family';
          else if (/health|clinic|hosp/i.test(buildingTypeRaw)) buildingType = 'Healthcare / Hospital';
          else if (/indust|logist|wareh|factor/i.test(buildingTypeRaw)) buildingType = 'Industrial Eco-Facility';
          else if (/retail|mixed|shop/i.test(buildingTypeRaw)) buildingType = 'Mixed-Use Retail';

          const certRaw = str(['greenbuildingcertification', 'certification', 'cert'], 'LEED Gold');
          let certification: GreenBuildingRecord['greenBuildingCertification'] = 'LEED Gold';
          if (/platinum/i.test(certRaw)) certification = 'LEED Platinum';
          else if (/breeam/i.test(certRaw)) certification = 'BREEAM Outstanding';
          else if (/well/i.test(certRaw)) certification = 'WELL Building Standard';
          else if (/edge/i.test(certRaw)) certification = 'EDGE Certified';
          else if (/gold/i.test(certRaw)) certification = 'LEED Gold';
          else if (/pending|in progress/i.test(certRaw)) certification = 'Pending Certification';

          const phaseRaw = str(['currentlifecyclephase', 'lifecyclephase', 'phase'], 'Active Operation');
          let lifecyclePhase: GreenBuildingRecord['currentLifecyclePhase'] = 'Active Operation';
          if (/design|pre/i.test(phaseRaw)) lifecyclePhase = 'Design & Pre-Construction';
          else if (/optim/i.test(phaseRaw)) lifecyclePhase = 'Occupancy Optimization';
          else if (/retro|upgrad/i.test(phaseRaw)) lifecyclePhase = 'Retrofitting & Upgrades';
          else if (/decom|circular/i.test(phaseRaw)) lifecyclePhase = 'Decommissioning / Circular Recovery';

          return {
            buildingId,
            buildingName,
            buildingType,
            constructionAgeYears: num(['constructionageyears', 'construction_age_years', 'age'], 4),
            floorAreaM2: num(['flooraream2', 'floor_area_m2', 'area', 'floorarea'], 35000),
            numberOfFloors: num(['numberoffloors', 'number_of_floors', 'floors'], 12),
            numberOfOccupants: num(['numberofoccupants', 'number_of_occupants', 'occupants'], 1200),
            occupancyRate: num(['occupancyrate', 'occupancy_rate'], 88),
            // Energy
            hvacLoadKw: num(['hvacloadkw', 'hvac_load_kw', 'hvac'], 250),
            lightingLoadKw: num(['lightingloadkw', 'lighting_load_kw', 'lighting'], 75),
            renewableEnergyProductionKwh: num(['renewableenergyproductionkwh', 'renewable_energy_production_kwh', 'renewable'], 24000),
            energyConsumptionKwh: num(['energyconsumptionkwh', 'energy_consumption_kwh', 'energy'], 38000),
            energyEfficiencyRating: (str(['energyefficiencyrating', 'efficiency_rating', 'rating'], 'A') as any) || 'A',
            // Environmental
            carbonEmissionsKgCo2: num(['carbonemissionskgco2', 'carbon_emissions_kgco2', 'carbon'], 14500),
            waterConsumptionLiters: num(['waterconsumptionliters', 'water_consumption_liters', 'water'], 120000),
            wasteGenerationKg: num(['wastegenerationkg', 'waste_generation_kg', 'waste'], 2400),
            airQualityIndex: num(['airqualityindex', 'air_quality_index', 'aqi'], 28),
            environmentalImpactScore: num(['environmentalimpactscore', 'environmental_impact_score'], 89),
            // Comfort
            thermalComfortIndex: num(['thermalcomfortindex', 'thermal_comfort_index'], 8.8),
            visualComfortRating: num(['visualcomfortrating', 'visual_comfort_rating'], 9.1),
            indoorNoiseLevelDb: num(['indoornoiseleveldb', 'indoor_noise_level_db', 'noise'], 42),
            occupantComfortScore: num(['occupantcomfortscore', 'occupant_comfort_score'], 89),
            // Lifecycle
            currentLifecyclePhase: lifecyclePhase,
            maintenanceCostUsd: num(['maintenancecostusd', 'maintenance_cost_usd', 'maintenance'], 42000),
            operationalExpenditureUsd: num(['operationalexpenditureusd', 'operational_expenditure_usd', 'opex'], 135000),
            lifecycleCostIndex: num(['lifecyclecostindex', 'lifecycle_cost_index'], 87),
            sensorHealthScore: num(['sensorhealthscore', 'sensor_health_score'], 96),
            // Sustainability
            resourceEfficiencyScore: num(['resourceefficiencyscore', 'resource_efficiency_score'], 90),
            smartTechnologyAdoptionRate: num(['smarttechnologyadoptionrate', 'smart_technology_adoption_rate'], 88),
            greenBuildingCertification: certification,
            sustainabilityScore: num(['sustainabilityscore', 'sustainability_score'], 91),
            dataQualityScore: num(['dataqualityscore', 'data_quality_score'], 97),
            infrastructureHealthScore: num(['infrastructurehealthscore', 'infrastructure_health_score'], 93),
          };
        });

        resolve(parsedRecords);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Automatically infers column mappings between dynamic uploaded sheet headers and CampusRecord fields.
 */
export function inferCampusColumnMapping(headers: string[], sheetName: string = 'Sheet1'): ColumnMapping {
  const targetFields: (keyof CampusRecord)[] = [
    'timestamp',
    'building_id',
    'building_name',
    'energy_kwh',
    'water_kl',
    'waste_kg',
    'aqi',
    'pm25',
    'co2',
    'asset_utilization_pct',
    'asset_id',
    'occupancy',
  ];

  const aliasPatterns: Record<keyof CampusRecord, RegExp> = {
    timestamp: /^(time|timestamp|date|datetime|logged_at|recorded_at)$/i,
    building_id: /^(building_?id|bldg_?id|facility_?id|id|property_?id)$/i,
    building_name: /^(building_?name|bldg_?name|facility_?name|name|location)$/i,
    energy_kwh: /^(energy|energy_?kwh|power|power_?kwh|electricity|consumption_?kwh)$/i,
    water_kl: /^(water|water_?kl|water_?consumption|hydro|water_?volume|usage_?kl)$/i,
    waste_kg: /^(waste|waste_?kg|solid_?waste|trash_?kg|refuse|garbage_?kg)$/i,
    aqi: /^(aqi|air_?quality|air_?quality_?index|epa_?aqi)$/i,
    pm25: /^(pm25|pm2_?5|particulate|pm2\.5|fine_?particulate)$/i,
    co2: /^(co2|carbon_?dioxide|co2_?ppm|indoor_?co2)$/i,
    asset_utilization_pct: /^(asset_?utilization|utilization|asset_?pct|utilization_?pct|load_?factor)$/i,
    asset_id: /^(asset_?id|equipment_?id|meter_?id|device_?id|sensor_?id)$/i,
    occupancy: /^(occupancy|headcount|people_?count|occupants|active_?occupancy)$/i,
    metadata: /^metadata$/i,
  };

  const mappings: ColumnMappingField[] = [];
  const mappedTargets = new Set<string>();
  const unmappedColumns: string[] = [];

  headers.forEach((header) => {
    const cleanHeader = header.trim();
    let matchedField: keyof CampusRecord | null = null;
    let confidence = 0.5;

    for (const field of targetFields) {
      if (mappedTargets.has(field)) continue;
      const pattern = aliasPatterns[field];
      if (pattern && pattern.test(cleanHeader)) {
        matchedField = field;
        confidence = 0.95;
        break;
      } else if (cleanHeader.toLowerCase().includes(field.replace(/_/g, ''))) {
        matchedField = field;
        confidence = 0.8;
        break;
      }
    }

    if (matchedField) {
      mappedTargets.add(matchedField);
      mappings.push({
        sourceColumn: cleanHeader,
        targetField: matchedField,
        dataType: matchedField === 'timestamp' ? 'date' : matchedField.includes('id') || matchedField.includes('name') ? 'string' : 'number',
        isRequired: true,
        confidenceScore: confidence,
      });
    } else {
      unmappedColumns.push(cleanHeader);
    }
  });

  const missingRequiredFields = targetFields.filter((f) => !mappedTargets.has(f));
  const schemaCoveragePct = Math.round((mappedTargets.size / targetFields.length) * 100);

  return {
    mappingId: `MAP-${Date.now()}`,
    sheetName,
    mappings,
    unmappedColumns,
    missingRequiredFields,
    schemaCoveragePct,
    isConfirmed: schemaCoveragePct >= 80,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Parses an Excel or CSV file into normalized CampusRecord rows along with a DataQualityReport.
 */
export function parseCampusRecordFile(
  file: File,
  customMapping?: ColumnMapping
): Promise<{
  records: CampusRecord[];
  report: DataQualityReport;
  mapping: ColumnMapping;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('File data is empty');

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('No data rows found in the uploaded file');
        }

        const headers = Object.keys(rawJson[0]);
        const mapping = customMapping || inferCampusColumnMapping(headers, sheetName);

        const fieldMap = new Map<keyof CampusRecord, string>();
        mapping.mappings.forEach((m) => fieldMap.set(m.targetField, m.sourceColumn));

        const seenKeys = new Set<string>();
        let duplicateCount = 0;
        let validRowsCount = 0;
        let invalidRowsCount = 0;

        const missingByField: Record<keyof CampusRecord, number> = {
          timestamp: 0,
          building_id: 0,
          building_name: 0,
          energy_kwh: 0,
          water_kl: 0,
          waste_kg: 0,
          aqi: 0,
          pm25: 0,
          co2: 0,
          asset_utilization_pct: 0,
          asset_id: 0,
          occupancy: 0,
          metadata: 0,
        };

        const issues: DataQualityIssue[] = [];

        const records: CampusRecord[] = rawJson.map((row, index) => {
          const rowIndex = index + 2; // spreadsheet 1-indexed header offset

          const getRawVal = (field: keyof CampusRecord) => {
            const col = fieldMap.get(field);
            if (col && row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
              return row[col];
            }
            // fallback fuzzy match
            const fallbackKey = Object.keys(row).find((k) =>
              k.toLowerCase().replace(/[^a-z0-9]/g, '') === field.replace(/[^a-z0-9]/g, '')
            );
            return fallbackKey ? row[fallbackKey] : undefined;
          };

          const parseNum = (field: keyof CampusRecord, fallback: number, min = 0, max = Infinity) => {
            const val = getRawVal(field);
            if (val === undefined || val === null || val === '') {
              missingByField[field]++;
              return fallback;
            }
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            if (isNaN(num)) {
              issues.push({
                rowIndex,
                field,
                invalidValue: val,
                issueType: 'type_mismatch',
                message: `Expected numerical value for ${field}, received "${val}"`,
                autoRemediated: true,
              });
              return fallback;
            }
            if (num < min || num > max) {
              issues.push({
                rowIndex,
                field,
                invalidValue: num,
                issueType: 'out_of_bounds',
                message: `${field} value ${num} exceeds expected boundaries [${min}, ${max}]`,
                autoRemediated: true,
              });
            }
            return Math.max(min, Math.min(max, num));
          };

          const parseStr = (field: keyof CampusRecord, fallback: string) => {
            const val = getRawVal(field);
            if (val === undefined || val === null || String(val).trim() === '') {
              missingByField[field]++;
              return fallback;
            }
            return String(val).trim();
          };

          const parseDate = (field: keyof CampusRecord, fallback: string) => {
            const val = getRawVal(field);
            if (!val) {
              missingByField[field]++;
              return fallback;
            }
            const parsed = new Date(val);
            if (isNaN(parsed.getTime())) {
              issues.push({
                rowIndex,
                field,
                invalidValue: val,
                issueType: 'invalid_date',
                message: `Invalid date format "${val}", coerced to current timestamp`,
                autoRemediated: true,
              });
              return fallback;
            }
            return parsed.toISOString();
          };

          const timestamp = parseDate('timestamp', new Date().toISOString());
          const building_id = parseStr('building_id', `BLDG-${100 + (index % 12)}`);
          const building_name = parseStr('building_name', `Campus Facility ${building_id}`);
          const energy_kwh = parseNum('energy_kwh', 250 + Math.random() * 200, 0, 100000);
          const water_kl = parseNum('water_kl', 12 + Math.random() * 15, 0, 10000);
          const waste_kg = parseNum('waste_kg', 45 + Math.random() * 80, 0, 100000);
          const aqi = Math.round(parseNum('aqi', 35 + Math.random() * 30, 0, 500));
          const pm25 = Number(parseNum('pm25', 8.5 + Math.random() * 12, 0, 500).toFixed(1));
          const co2 = Math.round(parseNum('co2', 480 + Math.random() * 250, 200, 5000));
          const asset_utilization_pct = Number(parseNum('asset_utilization_pct', 75 + Math.random() * 20, 0, 100).toFixed(1));
          const asset_id = parseStr('asset_id', `IOT-NODE-${building_id}-01`);
          const occupancy = Math.round(parseNum('occupancy', 80 + Math.random() * 350, 0, 10000));

          // Duplicate key check
          const compositeKey = `${timestamp}_${building_id}`;
          if (seenKeys.has(compositeKey)) {
            duplicateCount++;
            issues.push({
              rowIndex,
              field: 'timestamp',
              invalidValue: compositeKey,
              issueType: 'duplicate_key',
              message: `Duplicate timestamp and building_id key detected`,
              autoRemediated: false,
            });
          } else {
            seenKeys.add(compositeKey);
          }

          const hasErrors = issues.some((iss) => iss.rowIndex === rowIndex && !iss.autoRemediated);
          if (hasErrors) {
            invalidRowsCount++;
          } else {
            validRowsCount++;
          }

          return {
            timestamp,
            building_id,
            building_name,
            energy_kwh,
            water_kl,
            waste_kg,
            aqi,
            pm25,
            co2,
            asset_utilization_pct,
            asset_id,
            occupancy,
            metadata: {
              source_row_index: rowIndex,
              ingestion_batch_id: `BATCH-${file.name}`,
              is_imputed: false,
            },
          };
        });

        const totalRows = rawJson.length;
        const totalMissing = Object.values(missingByField).reduce((a, b) => a + b, 0);
        const fieldCount = 12;

        // Weighted quality score formula
        const validityRatio = totalRows > 0 ? validRowsCount / totalRows : 1;
        const duplicateRatio = totalRows > 0 ? duplicateCount / totalRows : 0;
        const missingRatio = totalRows > 0 ? totalMissing / (totalRows * fieldCount) : 0;

        const qualityScore = Math.max(
          10,
          Math.min(
            100,
            Number(((validityRatio * 0.7 + (1 - duplicateRatio) * 0.15 + (1 - missingRatio) * 0.15) * 100).toFixed(1))
          )
        );

        let qualityTier: DataQualityReport['qualityTier'] = 'Exemplary';
        if (qualityScore < 60) qualityTier = 'Critical Failure';
        else if (qualityScore < 80) qualityTier = 'Needs Review';
        else if (qualityScore < 92) qualityTier = 'Acceptable';

        const remediationSuggestions: string[] = [];
        if (duplicateCount > 0) remediationSuggestions.push(`Deduplicate ${duplicateCount} rows sharing identical building and timestamp markers.`);
        if (missingByField.energy_kwh > 0) remediationSuggestions.push(`Impute or verify ${missingByField.energy_kwh} blank energy reading cells.`);
        if (missingByField.aqi > 0) remediationSuggestions.push(`Calibrate optical IAQ sensor feeds with ${missingByField.aqi} null AQI values.`);
        if (remediationSuggestions.length === 0) remediationSuggestions.push('Dataset meets high-fidelity CampusIQ standards with clean schema conformance.');

        const fieldMetrics: FieldQualityMetric[] = (Object.keys(missingByField) as (keyof CampusRecord)[])
          .filter((k) => k !== 'metadata')
          .map((field) => ({
            field,
            totalPresent: totalRows - missingByField[field],
            missingCount: missingByField[field],
            missingPercentage: Number(((missingByField[field] / totalRows) * 100).toFixed(1)),
            invalidTypeCount: issues.filter((i) => i.field === field && i.issueType === 'type_mismatch').length,
            outOfRangeCount: issues.filter((i) => i.field === field && i.issueType === 'out_of_bounds').length,
            distinctValuesCount: new Set(records.map((r) => r[field])).size,
          }));

        const report: DataQualityReport = {
          reportId: `DQR-${Date.now()}`,
          fileName: file.name,
          fileSizeBytes: file.size,
          totalRows,
          validRows: validRowsCount,
          invalidRows: invalidRowsCount,
          duplicates: duplicateCount,
          missingValues: totalMissing,
          missingValuesByField: missingByField,
          qualityScorePercentage: qualityScore,
          qualityTier,
          issues: issues.slice(0, 50), // cap to top 50 issues for UI performance
          fieldMetrics,
          remediationSuggestions,
          generatedAt: new Date().toISOString(),
        };

        resolve({ records, report, mapping });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

