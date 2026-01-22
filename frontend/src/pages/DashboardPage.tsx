import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { QuarterGoalCard } from '../components/dashboard/QuarterGoalCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickStats } from '../components/dashboard/QuickStats';
import { ROUTES } from '../constants/routes';
import { DashboardStats } from '../types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { dataService } from '../services/dataService';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsResponse = await dataService.dashboard.getStats();

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        setError(statsResponse.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddStudent = () => {
    navigate(ROUTES.STUDENTS, { state: { openAddModal: true } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchDashboardData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-text-secondary">
          Here's what's happening with your students today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          change="View all students"
          icon="👥"
          iconColor="blue"
          link={{ label: 'View all students', onClick: () => navigate(ROUTES.STUDENTS) }}
        />
        <StatCard
          title="Milestones This Quarter"
          value={stats?.milestonesThisQuarter || 0}
          change={`${stats?.attendanceRate || 0}% attendance rate`}
          icon="🎯"
          iconColor="green"
          link={{ label: 'All milestones', onClick: () => navigate(ROUTES.MILESTONES) }}
        />
        <StatCard
          title="Active Programs"
          value={stats?.totalPrograms || 0}
          change="View all programs"
          icon="🎓"
          iconColor="orange"
          link={{ label: 'View programs', onClick: () => navigate(ROUTES.PROGRAMS) }}
        />
        <QuarterGoalCard
          percentage={stats?.quarterProgress || 0}
          onViewAll={() => {}}
        />
      </div>

      {/* Add Student Button */}
      <div className="mb-6">
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={handleAddStudent}
        >
          Add New Student
        </Button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={stats?.recentMilestones || []} onViewAll={() => navigate(ROUTES.MILESTONES)} />
        </div>
        <div>
          <QuickStats programs={stats?.programEnrollment || []} />
        </div>
      </div>
    </div>
  );
}
