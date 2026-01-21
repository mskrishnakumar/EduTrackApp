import React, { useState } from 'react';
import { DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';

const reportTypes = [
  {
    id: 'student-progress',
    name: 'Student Progress Report',
    description: 'Comprehensive report showing individual student progress, milestones, and attendance.',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'attendance-summary',
    name: 'Attendance Summary',
    description: 'Summary of attendance records for a specified date range.',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'program-performance',
    name: 'Program Performance Report',
    description: 'Analysis of program effectiveness based on enrollment and milestone data.',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'milestone-report',
    name: 'Milestone Achievement Report',
    description: 'List of all milestones achieved within a date range.',
    formats: ['PDF', 'Excel'],
  },
];

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [selectedProgram, setSelectedProgram] = useState('');
  const [generating, setGenerating] = useState(false);

  const programOptions = [
    { value: '', label: 'All Programs' },
    { value: 'p1', label: 'After School Program' },
    { value: 'p2', label: 'Life Skills Training' },
    { value: 'p3', label: 'Academic Support' },
    { value: 'p4', label: 'Sports & Recreation' },
  ];

  const handleGenerateReport = async (format: 'PDF' | 'Excel') => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setGenerating(true);
    // Mock report generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGenerating(false);

    const report = reportTypes.find((r) => r.id === selectedReport);
    alert(`${report?.name} generated successfully in ${format} format!`);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Reports</h2>
        <p className="text-text-secondary">Generate and download reports in PDF or Excel format.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Configure Report" />
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-body font-medium text-text-primary mb-3">
                  Select Report Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedReport === report.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-border hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-text-primary mb-1">{report.name}</h4>
                      <p className="text-sm text-text-secondary">{report.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
                <Select
                  label="Program"
                  options={programOptions}
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                />
              </div>

              {/* Generate Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="primary"
                  leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                  onClick={() => handleGenerateReport('PDF')}
                  isLoading={generating}
                  disabled={!selectedReport}
                >
                  Generate PDF
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<TableCellsIcon className="w-5 h-5" />}
                  onClick={() => handleGenerateReport('Excel')}
                  isLoading={generating}
                  disabled={!selectedReport}
                >
                  Export to Excel
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions / Recent Reports */}
        <div>
          <Card>
            <CardHeader title="Quick Reports" />
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedReport('attendance-summary');
                  handleGenerateReport('PDF');
                }}
                className="w-full p-3 text-left rounded-lg bg-gray-bg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium text-text-primary">Today's Attendance</span>
                <p className="text-sm text-text-secondary">Quick PDF summary</p>
              </button>
              <button
                onClick={() => {
                  setSelectedReport('milestone-report');
                  handleGenerateReport('PDF');
                }}
                className="w-full p-3 text-left rounded-lg bg-gray-bg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium text-text-primary">This Month's Milestones</span>
                <p className="text-sm text-text-secondary">All achievements</p>
              </button>
              <button
                onClick={() => {
                  setSelectedReport('student-progress');
                  handleGenerateReport('Excel');
                }}
                className="w-full p-3 text-left rounded-lg bg-gray-bg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium text-text-primary">Student Data Export</span>
                <p className="text-sm text-text-secondary">Full Excel export</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
