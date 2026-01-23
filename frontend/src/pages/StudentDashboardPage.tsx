import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { ROUTES } from '../constants/routes';
import { StudentDashboardStats } from '../types';
import { dataService } from '../services/dataService';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user?.studentId) {
      setError('No student profile linked to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.studentPortal.getDashboard(user.studentId);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchDashboard}>
          Try Again
        </Button>
      </div>
    );
  }

  const firstName = stats?.studentName?.split(' ')[0] || 'Student';
  const attendanceColor = (stats?.attendanceRate || 0) >= 85
    ? 'primary'
    : (stats?.attendanceRate || 0) >= 70
      ? 'warning'
      : 'info';

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="text-text-secondary">
          {stats?.programName} at {stats?.centerName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Milestones"
          value={stats?.totalMilestones || 0}
          icon="⭐"
          iconColor="green"
          link={{ label: 'View all', onClick: () => navigate(ROUTES.STUDENT_MILESTONES) }}
        />
        <StatCard
          title="This Quarter"
          value={stats?.milestonesThisQuarter || 0}
          icon="🎯"
          iconColor="blue"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate || 0}%`}
          icon="📅"
          iconColor="cyan"
          link={{ label: 'View details', onClick: () => navigate(ROUTES.STUDENT_ATTENDANCE) }}
        />
        <StatCard
          title="Days Present"
          value={stats?.totalDaysPresent || 0}
          change={`of ${stats?.totalDays || 0} total days`}
          icon="✅"
          iconColor="orange"
        />
      </div>

      {/* Attendance Progress */}
      <Card className="mb-8">
        <CardHeader title="Attendance Overview" />
        <div className="mt-4">
          <ProgressBar
            value={stats?.attendanceRate || 0}
            label="Attendance Rate"
            color={attendanceColor}
          />
          <p className="text-sm text-text-secondary mt-2">
            {stats?.totalDaysPresent} days present out of {stats?.totalDays} total days ({stats?.totalDaysAbsent} absent)
          </p>
        </div>
      </Card>

      {/* Recent Milestones & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Milestones"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(ROUTES.STUDENT_MILESTONES)}
                >
                  View All
                </Button>
              }
            />
            <div className="mt-4">
              <MilestoneTimeline milestones={stats?.recentMilestones || []} />
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="Quick Info" />
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">Program</p>
                <p className="text-sm font-medium text-text-primary">{stats?.programName}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">Center</p>
                <p className="text-sm font-medium text-text-primary">{stats?.centerName}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">Enrolled Since</p>
                <p className="text-sm font-medium text-text-primary">
                  {stats?.enrollmentDate ? new Date(stats.enrollmentDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
