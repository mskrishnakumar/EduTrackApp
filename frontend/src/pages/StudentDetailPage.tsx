import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { CardHeader } from '../components/common/Card';
import { StudentHeader } from '../components/students/StudentHeader';
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline';
import { MilestoneForm } from '../components/milestones/MilestoneForm';
import { Student, Milestone, CreateMilestoneRequest } from '../types';
import { ROUTES } from '../constants/routes';

// Mock data - will be replaced with API calls
const mockStudent: Student = {
  id: 's1',
  name: 'Priya Sharma',
  age: 14,
  programId: 'p1',
  programName: 'After School Program',
  centerId: 'c1',
  centerName: 'Main Center',
  enrollmentDate: '2024-10-15',
  milestoneCount: 8,
  createdAt: '2024-10-15',
  updatedAt: '2024-10-15',
  isActive: true,
};

const mockMilestones: Milestone[] = [
  {
    id: 'm1',
    studentId: 's1',
    type: 'academic',
    description: 'Completed Math Level 2 assessment with 85% score',
    dateAchieved: '2026-01-15',
    verifiedBy: 'Rahul Coordinator',
    centerId: 'c1',
    createdAt: '2026-01-15',
    createdBy: 'user1',
  },
  {
    id: 'm2',
    studentId: 's1',
    type: 'life-skills',
    description: 'Successfully presented in front of class - demonstrated confidence',
    dateAchieved: '2026-01-08',
    verifiedBy: 'Priya Teacher',
    centerId: 'c1',
    createdAt: '2026-01-08',
    createdBy: 'user2',
  },
  {
    id: 'm3',
    studentId: 's1',
    type: 'attendance',
    description: 'Achieved 95% attendance for December 2025',
    dateAchieved: '2025-12-31',
    verifiedBy: 'System',
    centerId: 'c1',
    createdAt: '2025-12-31',
    createdBy: 'system',
  },
  {
    id: 'm4',
    studentId: 's1',
    type: 'academic',
    description: 'Completed English reading milestone - finished 5 books',
    dateAchieved: '2025-12-20',
    verifiedBy: 'Rahul Coordinator',
    centerId: 'c1',
    createdAt: '2025-12-20',
    createdBy: 'user1',
  },
  {
    id: 'm5',
    studentId: 's1',
    type: 'life-skills',
    description: 'Participated in community service - helped organize local health camp',
    dateAchieved: '2025-12-10',
    verifiedBy: 'Community Lead',
    centerId: 'c1',
    createdAt: '2025-12-10',
    createdBy: 'user3',
  },
];

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);

  useEffect(() => {
    // Mock data fetch - will be replaced with API call
    setLoading(true);
    setTimeout(() => {
      setStudent(mockStudent);
      setMilestones(mockMilestones);
      setLoading(false);
    }, 300);
  }, [id]);

  const handleBack = () => {
    navigate(ROUTES.STUDENTS);
  };

  const handleEdit = () => {
    // TODO: Open edit modal
    console.log('Edit student');
  };

  const handleAddMilestone = async (data: CreateMilestoneRequest) => {
    // Mock implementation - will be replaced with API call
    const newMilestone: Milestone = {
      id: `m${Date.now()}`,
      studentId: data.studentId,
      type: data.type,
      description: data.description,
      dateAchieved: data.dateAchieved,
      verifiedBy: data.verifiedBy,
      centerId: student?.centerId || 'c1',
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    };
    setMilestones([newMilestone, ...milestones]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Student not found.</p>
        <Button variant="secondary" onClick={handleBack} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Student Header */}
      <StudentHeader
        student={student}
        onBack={handleBack}
        onEdit={handleEdit}
      />

      {/* Milestones Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Milestones</h2>
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsMilestoneFormOpen(true)}
        >
          Add Milestone
        </Button>
      </div>

      {/* Milestone Timeline */}
      <MilestoneTimeline milestones={milestones} />

      {/* Add Milestone Modal */}
      <MilestoneForm
        isOpen={isMilestoneFormOpen}
        onClose={() => setIsMilestoneFormOpen(false)}
        onSubmit={handleAddMilestone}
        studentId={student.id}
      />
    </div>
  );
}
