import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { QuarterGoalCard } from '../components/dashboard/QuarterGoalCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickStats } from '../components/dashboard/QuickStats';
import { ROUTES } from '../constants/routes';
import { RecentActivity as RecentActivityType, ProgramEnrollment } from '../types';
import { PlusIcon } from '@heroicons/react/24/outline';

// Mock data - will be replaced with API calls
const mockStats = {
  totalStudents: 156,
  milestonesThisMonth: 42,
  activePrograms: 4,
  quarterGoalProgress: 84,
  studentGrowth: 12,
  milestoneGrowth: 8,
};

const mockActivities: RecentActivityType[] = [
  {
    id: '1',
    studentId: 's1',
    studentName: 'Priya Sharma',
    milestoneType: 'academic',
    description: 'Completed Math Level 2 assessment with 85% score',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    studentId: 's2',
    studentName: 'Amit Patel',
    milestoneType: 'life-skills',
    description: 'Demonstrated excellent communication in group project',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    studentId: 's3',
    studentName: 'Sneha Kumar',
    milestoneType: 'attendance',
    description: 'Achieved 95% attendance milestone for the quarter',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    studentId: 's4',
    studentName: 'Rajesh Verma',
    milestoneType: 'academic',
    description: 'Successfully completed Science project on renewable energy',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    studentId: 's5',
    studentName: 'Ananya Singh',
    milestoneType: 'life-skills',
    description: 'Led team successfully in community service activity',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

const mockProgramEnrollments: ProgramEnrollment[] = [
  { programId: 'p1', programName: 'After School Program', enrollmentCount: 68, percentage: 70 },
  { programId: 'p2', programName: 'Life Skills Training', enrollmentCount: 42, percentage: 45 },
  { programId: 'p3', programName: 'Academic Support', enrollmentCount: 32, percentage: 35 },
  { programId: 'p4', programName: 'Sports & Recreation', enrollmentCount: 14, percentage: 15 },
];

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddStudent = () => {
    navigate(ROUTES.STUDENTS, { state: { openAddModal: true } });
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          Welcome back, {user?.displayName?.split(' ')[0] || 'Rahul'}! 👋
        </h1>
        <p className="text-text-secondary">
          Here's what's happening with your students today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={mockStats.totalStudents}
          change={`+${mockStats.studentGrowth}% from last month`}
          icon="👥"
          iconColor="blue"
          link={{ label: 'View all students', onClick: () => navigate(ROUTES.STUDENTS) }}
        />
        <StatCard
          title="Milestones This Month"
          value={mockStats.milestonesThisMonth}
          change={`+${mockStats.milestoneGrowth}% from last month`}
          icon="🎯"
          iconColor="green"
          link={{ label: 'All milestones', onClick: () => {} }}
        />
        <StatCard
          title="Active Programs"
          value={mockStats.activePrograms}
          change="2 new programs added"
          icon="🎓"
          iconColor="orange"
          link={{ label: 'View programs', onClick: () => navigate(ROUTES.PROGRAMS) }}
        />
        <QuarterGoalCard
          percentage={mockStats.quarterGoalProgress}
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
          <RecentActivity activities={mockActivities} onViewAll={() => {}} />
        </div>
        <div>
          <QuickStats programs={mockProgramEnrollments} />
        </div>
      </div>
    </div>
  );
}
