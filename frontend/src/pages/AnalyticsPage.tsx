import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '../components/common/Card';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';

// Mock data
const progressData = [
  { month: 'Aug', milestones: 12, attendance: 85 },
  { month: 'Sep', milestones: 18, attendance: 88 },
  { month: 'Oct', milestones: 24, attendance: 92 },
  { month: 'Nov', milestones: 32, attendance: 90 },
  { month: 'Dec', milestones: 38, attendance: 94 },
  { month: 'Jan', milestones: 42, attendance: 91 },
];

const milestonesByType = [
  { name: 'Academic', value: 45, color: '#3B82F6' },
  { name: 'Life Skills', value: 32, color: '#10B981' },
  { name: 'Attendance', value: 23, color: '#F59E0B' },
];

const programPerformance = [
  { name: 'After School', students: 68, milestones: 156 },
  { name: 'Life Skills', students: 42, milestones: 89 },
  { name: 'Academic', students: 32, milestones: 78 },
  { name: 'Sports', students: 14, milestones: 24 },
];

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: '2024-08-01',
    end: '2026-01-31',
  });
  const [selectedProgram, setSelectedProgram] = useState('');

  const programOptions = [
    { value: '', label: 'All Programs' },
    { value: 'p1', label: 'After School Program' },
    { value: 'p2', label: 'Life Skills Training' },
    { value: 'p3', label: 'Academic Support' },
    { value: 'p4', label: 'Sports & Recreation' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Analytics</h2>

        {/* Filters */}
        <Card className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Program"
              options={programOptions}
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Progress Over Time */}
        <Card>
          <CardHeader title="Progress Over Time" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="milestones"
                name="Milestones"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                name="Attendance %"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Milestones by Type */}
        <Card>
          <CardHeader title="Milestones by Type" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={milestonesByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {milestonesByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Program Performance */}
      <Card>
        <CardHeader title="Program Performance" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={programPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="students" name="Students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="milestones" name="Milestones" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
