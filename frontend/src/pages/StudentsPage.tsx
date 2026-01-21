import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFilters } from '../components/students/StudentFilters';
import { StudentForm } from '../components/students/StudentForm';
import { Student, Program, CreateStudentRequest } from '../types';
import { dataService } from '../services/dataService';

export function StudentsPage() {
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.students.getAll({
        search: search || undefined,
        programId: selectedProgram || undefined,
      });
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError(response.error || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [search, selectedProgram]);

  // Fetch programs from API
  const fetchPrograms = useCallback(async () => {
    try {
      const response = await dataService.programs.getAll();
      if (response.success && response.data) {
        setPrograms(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Fetch students when search or program filter changes
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Check if we should open add modal (from dashboard navigation)
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsFormOpen(true);
      // Clear the state so it doesn't reopen on back navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddStudent = async (data: CreateStudentRequest) => {
    try {
      const response = await dataService.students.create(data);
      if (response.success) {
        // Refresh the list to get the new student
        await fetchStudents();
        setIsFormOpen(false);
      } else {
        setError(response.error || 'Failed to create student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Students</h2>
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Student
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {/* Filters */}
      <StudentFilters
        searchValue={search}
        onSearchChange={setSearch}
        selectedProgram={selectedProgram}
        onProgramChange={setSelectedProgram}
        programs={programs}
      />

      {/* Table */}
      <StudentTable students={students} loading={loading} />

      {/* Add Student Modal */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddStudent}
        programs={programs}
      />
    </div>
  );
}
