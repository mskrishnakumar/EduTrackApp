import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { dataService } from '../services/dataService';
import type { StudentRegistration, Student } from '../types';

export function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [regResponse, studentResponse] = await Promise.all([
      dataService.registrations.getAll(),
      dataService.students.getAll(),
    ]);
    if (regResponse.success && regResponse.data) {
      setRegistrations(regResponse.data);
    }
    if (studentResponse.success && studentResponse.data) {
      const studentList = Array.isArray(studentResponse.data)
        ? studentResponse.data
        : (studentResponse.data as { students: Student[] }).students || [];
      setStudents(studentList.filter(s => s.isActive));
    }
    setLoading(false);
  };

  const handleApprove = async (registration: StudentRegistration) => {
    // Try to auto-match by email first
    const matchedStudent = students.find(
      s => s.email?.toLowerCase() === registration.email.toLowerCase()
    );

    if (matchedStudent) {
      setActionLoading(registration.id);
      await dataService.registrations.approve(registration.id, matchedStudent.id);
      await loadData();
      setActionLoading(null);
    } else {
      // Show student picker
      setLinkingId(registration.id);
      setSelectedStudentId('');
    }
  };

  const handleConfirmLink = async () => {
    if (!linkingId || !selectedStudentId) return;
    setActionLoading(linkingId);
    await dataService.registrations.approve(linkingId, selectedStudentId);
    setLinkingId(null);
    setSelectedStudentId('');
    await loadData();
    setActionLoading(null);
  };

  const handleReject = async (registrationId: string) => {
    setActionLoading(registrationId);
    await dataService.registrations.reject(registrationId);
    await loadData();
    setActionLoading(null);
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const processedRegistrations = registrations.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Student Registrations</h1>
        <p className="text-text-secondary mt-1">
          Review and approve student Google OAuth sign-in requests
        </p>
      </div>

      {/* Pending Registrations */}
      <div className="bg-white rounded-card border border-gray-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-warning" />
          Pending Requests
          {pendingRegistrations.length > 0 && (
            <span className="bg-warning-light text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingRegistrations.length}
            </span>
          )}
        </h2>

        {pendingRegistrations.length === 0 ? (
          <p className="text-text-secondary text-sm py-4">No pending registration requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingRegistrations.map(reg => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-4 bg-gray-bg rounded-input border border-gray-border"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{reg.displayName}</p>
                  <p className="text-sm text-text-secondary">{reg.email}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Requested: {new Date(reg.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {linkingId === reg.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="text-sm border border-gray-border rounded-input px-2 py-1.5"
                    >
                      <option value="">Link to student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      onClick={handleConfirmLink}
                      isLoading={actionLoading === reg.id}
                      className="text-sm"
                    >
                      Link
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setLinkingId(null)}
                      className="text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(reg)}
                      isLoading={actionLoading === reg.id}
                      className="text-sm"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(reg.id)}
                      isLoading={actionLoading === reg.id}
                      className="text-sm"
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Registrations */}
      {processedRegistrations.length > 0 && (
        <div className="bg-white rounded-card border border-gray-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">History</h2>
          <div className="space-y-2">
            {processedRegistrations.map(reg => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-3 rounded-input border border-gray-100"
              >
                <div>
                  <p className="font-medium text-text-primary text-sm">{reg.displayName}</p>
                  <p className="text-xs text-text-secondary">{reg.email}</p>
                </div>
                <Badge type={reg.status === 'approved' ? 'academic' : 'attendance'}>
                  {reg.status === 'approved' ? 'Approved' : 'Rejected'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
