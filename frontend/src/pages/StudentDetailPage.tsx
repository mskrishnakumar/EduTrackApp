import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { StudentHeader } from '../components/students/StudentHeader';
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline';
import { MilestoneForm } from '../components/milestones/MilestoneForm';
import { Student, Milestone, CreateMilestoneRequest } from '../types';
import { ROUTES } from '../constants/routes';
import { dataService } from '../services/dataService';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);

  const fetchStudentData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const [studentResponse, milestonesResponse] = await Promise.all([
        dataService.students.getOne(id),
        dataService.milestones.getByStudent(id),
      ]);

      if (studentResponse.success && studentResponse.data) {
        setStudent(studentResponse.data);
      } else {
        setError(studentResponse.error || 'Failed to load student');
      }

      if (milestonesResponse.success && milestonesResponse.data) {
        setMilestones(milestonesResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleBack = () => {
    navigate(ROUTES.STUDENTS);
  };

  const handleEdit = () => {
    // TODO: Open edit modal
    console.log('Edit student');
  };

  const handleAddMilestone = async (data: CreateMilestoneRequest) => {
    try {
      const response = await dataService.milestones.create(data);
      if (response.success) {
        // Refresh milestones
        const milestonesResponse = await dataService.milestones.getByStudent(id!);
        if (milestonesResponse.success && milestonesResponse.data) {
          setMilestones(milestonesResponse.data);
        }
      } else {
        setError(response.error || 'Failed to add milestone');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add milestone');
    }
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

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={handleBack}>
          Back to Students
        </Button>
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
