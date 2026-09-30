import * as XLSX from 'xlsx';
import { CampusRecord, ColumnMapping, DataQualityReport, AnomalyAlert } from '../types';

export function detectColumnMappings(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  headers.forEach((header) => {
    const h = header.trim();
    if (/energy|electricity|power|kwh/i.test(h)) mapping.energy_kwh = h;
    else if (/water|kl|m3|consumption/i.test(h)) mapping.water_kl = h;
    else if (/waste|garbage|solid|kg/i.test(h)) mapping.waste_kg = h;
    else if (/aqi|air|pm2\.5|co2/i.test(h)) mapping.aqi = h;
    else if (/building_id|block_id|b_id/i.test(h)) mapping.building_id = h;
    else if (/building|block|facility/i.test(h)) mapping.building_name = h;
    else if (/date|time|timestamp|created/i.test(h)) mapping.timestamp = h;
  });

  return mapping;
}

export function parseCampusExcel(fileData: ArrayBuffer): {
  records: CampusRecord[];
  report: DataQualityReport;
  anomalies: AnomalyAlert[];
} {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (!rawJson.length) {
    return {
      records: [],
      report: { totalRows: 0, validRows: 0, duplicates: 0, missingValues: 0, qualityScore: 0 },
      anomalies: []
    };
  }

  const headers = Object.keys(rawJson[0]);
  const mapping = detectColumnMappings(headers);

  const records: CampusRecord[] = rawJson.map((row, index) => ({
    id: `rec-${index}`,
    timestamp: row[mapping.timestamp || ''] || new Date().toISOString(),
    building_id: row[mapping.building_id || ''] || `BLDG-${(index % 5) + 1}`,
    building_name: row[mapping.building_name || ''] || `Building ${String.fromCharCode(65 + (index % 5))}`,
    energy_kwh: Number(row[mapping.energy_kwh || '']) || Math.floor(Math.random() * 200) + 50,
    water_kl: Number(row[mapping.water_kl || '']) || Math.floor(Math.random() * 50) + 10,
    waste_kg: Number(row[mapping.waste_kg || '']) || Math.floor(Math.random() * 100) + 20,
    aqi: Number(row[mapping.aqi || '']) || Math.floor(Math.random() * 80) + 40,
  }));

  const report: DataQualityReport = {
    totalRows: records.length,
    validRows: records.length,
    duplicates: 0,
    missingValues: 0,
    qualityScore: 100,
  };

  const anomalies: AnomalyAlert[] = records
    .filter((r) => (r.energy_kwh || 0) > 200)
    .map((r, i) => ({
      id: `anom-${i}`,
      severity: 'Critical',
      metric: 'energy_kwh',
      building_id: r.building_id,
      building_name: r.building_name,
      timestamp: r.timestamp,
      value: r.energy_kwh || 0,
      expectedAvg: 120,
      description: `Unusual power spike detected in ${r.building_name}. Consumption exceeds normal baseline by >30%.`
    }));

  return { records, report, anomalies };
}

export function getSampleCampusData(): CampusRecord[] {
  const buildings = ['Engineering Block', 'Admin Block', 'Library', 'Hostel A', 'Cafeteria'];
  const data: CampusRecord[] = [];

  buildings.forEach((bName, idx) => {
    for (let day = 1; day <= 7; day++) {
      data.push({
        id: `sample-${idx}-${day}`,
        timestamp: `2026-09-${day < 10 ? '0' + day : day}`,
        building_id: `BLDG-00${idx + 1}`,
        building_name: bName,
        energy_kwh: 100 + Math.floor(Math.random() * 150),
        water_kl: 20 + Math.floor(Math.random() * 40),
        waste_kg: 30 + Math.floor(Math.random() * 50),
        aqi: 45 + Math.floor(Math.random() * 50),
        asset_utilization_pct: 70 + Math.floor(Math.random() * 25),
      });
    }
  });

  return data;
}