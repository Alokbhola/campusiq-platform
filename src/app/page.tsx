'use client';

import React, { useState } from 'react';
import DataUploader from './components/upload/DataUploader';
import CampusDashboard from './components/dashboard/CampusDashboard';
import { CampusRecord } from './types';

export default function Home() {
  const [campusData, setCampusData] = useState<CampusRecord[] | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Campus<span className="text-emerald-500">IQ</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise Facility & Environmental Sustainability Platform</p>
        </header>

        {!campusData ? (
          <DataUploader onDataLoaded={(records) => setCampusData(records)} />
        ) : (
          <CampusDashboard records={campusData} onReset={() => setCampusData(null)} />
        )}
      </div>
    </main>
  );
}