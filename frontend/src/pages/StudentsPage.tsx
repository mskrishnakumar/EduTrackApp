import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFilters } from '../components/students/StudentFilters';
import { StudentForm } from '../components/students/StudentForm';
import { Modal } from '../components/common/Modal';
import { Select } from '../components/common/Select';
import { Student, Program, CreateStudentRequest, StudentRegistration } from '../types';
import { dataService } from '../services/dataService';

type TabKey = 'students' | 'registrations';

export function StudentsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration state
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<StudentRegistration | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [approving, setApproving] = useState(false);

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

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      const response = await dataService.registrations.getAll();
      if (response.success && response.data) {
        setRegistrations(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setRegLoading(false);
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

  // Fetch registrations when tab changes
  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab, fetchRegistrations]);

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
        await fetchStudents();
        setIsFormOpen(false);
      } else {
        setError(response.error || 'Failed to create student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    }
  };

  const handleApprove = (registration: StudentRegistration) => {
    setSelectedRegistration(registration);
    setSelectedStudentId('');
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRegistration || !selectedStudentId) return;
    setApproving(true);
    try {
      const response = await dataService.registrations.approve(
        selectedRegistration.id,
        selectedStudentId
      );
      if (response.success) {
        setApproveModalOpen(false);
        setSelectedRegistration(null);
        await fetchRegistrations();
      } else {
        setError(response.error || 'Failed to approve registration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve registration');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (registration: StudentRegistration) => {
    if (!confirm(`Reject registration for ${registration.displayName}?`)) return;
    try {
      const response = await dataService.registrations.reject(registration.id);
      if (response.success) {
        await fetchRegistrations();
      } else {
        setError(response.error || 'Failed to reject registration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject registration');
    }
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Students</h2>
        {activeTab === 'students' && (
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsFormOpen(true)}
          >
            Add Student
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-bg rounded-input p-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 px-4 py-2.5 rounded-input text-sm font-medium transition-all ${
            activeTab === 'students'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex-1 px-4 py-2.5 rounded-input text-sm font-medium transition-all ${
            activeTab === 'registrations'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Pending Registrations
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {activeTab === 'students' ? (
        <>
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
        </>
      ) : (
        /* Registrations Tab */
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {regLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No registrations found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{reg.displayName}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{reg.email}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(reg.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reg.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : reg.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(reg)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-input hover:bg-green-100 transition-colors"
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(reg)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-input hover:bg-red-100 transition-colors"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Student Modal */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddStudent}
        programs={programs}
      />

      {/* Approve Registration Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Registration"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmApprove}
              isLoading={approving}
              disabled={!selectedStudentId}
            >
              Approve
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Link <span className="font-medium text-text-primary">{selectedRegistration?.displayName}</span> ({selectedRegistration?.email}) to an existing student record:
          </p>
          <Select
            label="Select Student"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.programName})` }))}
            placeholder="Choose a student..."
            required
          />
          <p className="text-xs text-text-secondary">
            Select the student record to link this account to. The user will be able to log in and view this student's milestones and attendance.
          </p>
        </div>
      </Modal>
    </div>
  );
}
