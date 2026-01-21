import React, { useState, useEffect, useCallback } from 'react';
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
import { Button } from '../components/common/Button';
import { dataService } from '../services/dataService';
import { ProgressDataPoint, MilestoneStats, Program } from '../types';

const MILESTONE_COLORS = {
  academic: '#3B82F6',
  'life-skills': '#10B981',
  attendance: '#F59E0B',
};

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: '2024-08-01',
    end: '2026-01-31',
  });
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [milestoneStats, setMilestoneStats] = useState<MilestoneStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressResponse, milestoneResponse, programsResponse] = await Promise.all([
        dataService.analytics.getProgressData(),
        dataService.analytics.getMilestoneStats(),
        dataService.programs.getAll(),
      ]);

      if (progressResponse.success && progressResponse.data) {
        setProgressData(progressResponse.data);
      }
      if (milestoneResponse.success && milestoneResponse.data) {
        setMilestoneStats(milestoneResponse.data);
      }
      if (programsResponse.success && programsResponse.data) {
        setPrograms(programsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const programOptions = [
    { value: '', label: 'All Programs' },
    ...programs.map((p) => ({ value: p.id, label: p.name })),
  ];

  // Transform milestone stats for pie chart
  const milestonesByType = milestoneStats.map((stat) => ({
    name: stat.type === 'life-skills' ? 'Life Skills' : stat.type.charAt(0).toUpperCase() + stat.type.slice(1),
    value: stat.count,
    color: MILESTONE_COLORS[stat.type as keyof typeof MILESTONE_COLORS] || '#6B7280',
  }));

  // Generate program performance data from programs
  const programPerformance = programs.map((program) => ({
    name: program.name.length > 12 ? program.name.substring(0, 12) + '...' : program.name,
    students: program.enrollmentCount || 0,
    milestones: Math.floor((program.enrollmentCount || 0) * 2.3), // Estimated milestones
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchAnalyticsData}>
          Try Again
        </Button>
      </div>
    );
  }

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
          {progressData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-secondary">
              No progress data available
            </div>
          ) : (
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
          )}
        </Card>

        {/* Milestones by Type */}
        <Card>
          <CardHeader title="Milestones by Type" />
          {milestonesByType.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-secondary">
              No milestone data available
            </div>
          ) : (
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
          )}
        </Card>
      </div>

      {/* Program Performance */}
      <Card>
        <CardHeader title="Program Performance" />
        {programPerformance.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-text-secondary">
            No program data available
          </div>
        ) : (
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
        )}
      </Card>
    </div>
  );
}
