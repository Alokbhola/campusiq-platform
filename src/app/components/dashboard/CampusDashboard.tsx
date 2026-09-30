'use client';

import React, { useState } from 'react';
import { CampusRecord } from '../../types';

interface CampusDashboardProps {
  records: CampusRecord[];
  onReset: () => void;
}

export default function CampusDashboard({ records, onReset }: CampusDashboardProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');

  const buildings = Array.from(new Set(records.map((r) => r.building_name)));

  const filteredRecords = selectedBuilding === 'ALL'
    ? records
    : records.filter((r) => r.building_name === selectedBuilding);

  const totalEnergy = filteredRecords.reduce((acc, curr) => acc + (curr.energy_kwh || 0), 0);
  const totalWater = filteredRecords.reduce((acc, curr) => acc + (curr.water_kl || 0), 0);
  const totalWaste = filteredRecords.reduce((acc, curr) => acc + (curr.waste_kg || 0), 0);
  const avgAqi = Math.round(
    filteredRecords.reduce((acc, curr) => acc + (curr.aqi || 0), 0) / (filteredRecords.length || 1)
  );

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100">CampusIQ Analytics</h1>
          <p className="text-xs text-slate-400">Monitoring real-time environmental metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Campus Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-md border border-slate-700"
          >
            Reset / Upload New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Power</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalEnergy.toLocaleString()} <span className="text-xs font-normal">kWh</span></p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Water Consumption</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{totalWater.toLocaleString()} <span className="text-xs font-normal">KL</span></p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Solid Waste</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalWaste.toLocaleString()} <span className="text-xs font-normal">kg</span></p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Avg Air Quality (AQI)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{avgAqi} <span className="text-xs font-normal">AQI</span></p>
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-md font-semibold text-slate-200 mb-4">Building Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-300 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Building</th>
                <th className="p-3">Energy (kWh)</th>
                <th className="p-3">Water (KL)</th>
                <th className="p-3">AQI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.slice(0, 10).map((r, i) => (
                <tr key={r.id || i} className="hover:bg-slate-800/40">
                  <td className="p-3">{r.timestamp}</td>
                  <td className="p-3 font-medium text-slate-200">{r.building_name}</td>
                  <td className="p-3 text-amber-400">{r.energy_kwh}</td>
                  <td className="p-3 text-cyan-400">{r.water_kl}</td>
                  <td className="p-3 text-purple-400">{r.aqi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}