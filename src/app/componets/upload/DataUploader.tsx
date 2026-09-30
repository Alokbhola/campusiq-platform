'use client';

import React, { useState } from 'react';
import { parseCampusExcel, getSampleCampusData } from '../../lib/excelParser';
import { CampusRecord, DataQualityReport } from '../../types';

interface DataUploaderProps {
  onDataLoaded: (records: CampusRecord[]) => void;
}

export default function DataUploader({ onDataLoaded }: DataUploaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [report, setReport] = useState<DataQualityReport | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        const { records, report: parsedReport } = parseCampusExcel(buffer);
        setReport(parsedReport);
        if (records.length > 0) {
          onDataLoaded(records);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDemoClick = () => {
    const sampleData = getSampleCampusData();
    onDataLoaded(sampleData);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-400">CampusIQ Data Ingestion</h2>
        <p className="text-slate-400 text-sm mt-1">Upload campus operational data (Excel / CSV) or explore sample metrics.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsHovered(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer ${
          isHovered ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-700 bg-slate-950/40'
        }`}
      >
        <p className="text-slate-300 font-medium">Drag & Drop your Excel/CSV file here</p>
        <p className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv files</p>
        
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          id="file-input"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <label
          htmlFor="file-input"
          className="inline-block mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-md cursor-pointer border border-slate-700"
        >
          Browse Local File
        </label>
      </div>

      {report && (
        <div className="mt-6 p-4 bg-slate-800/60 rounded-lg border border-slate-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Total Rows</p>
            <p className="text-lg font-semibold text-slate-200">{report.totalRows}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Valid Records</p>
            <p className="text-lg font-semibold text-emerald-400">{report.validRows}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Quality Score</p>
            <p className="text-lg font-semibold text-blue-400">{report.qualityScore}%</p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center border-t border-slate-800 pt-6">
        <button
          onClick={handleDemoClick}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md shadow-md hover:shadow-emerald-900/30 transition-all"
        >
          Explore Demo Campus Data
        </button>
      </div>
    </div>
  );
}