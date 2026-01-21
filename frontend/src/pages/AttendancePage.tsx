import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { dataService } from '../services/dataService';
import { Student, AttendanceRecord } from '../types';

interface AttendanceStudent {
  id: string;
  name: string;
  status: 'present' | 'absent' | null;
}

export function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch students and attendance for the selected date
      const [studentsResponse, attendanceResponse] = await Promise.all([
        dataService.students.getAll(),
        dataService.attendance.getByDate(selectedDate),
      ]);

      if (studentsResponse.success && studentsResponse.data) {
        const attendanceMap = new Map<string, 'present' | 'absent'>();
        if (attendanceResponse.success && attendanceResponse.data) {
          attendanceResponse.data.forEach((record: AttendanceRecord) => {
            attendanceMap.set(record.studentId, record.status);
          });
        }

        const attendanceStudents: AttendanceStudent[] = studentsResponse.data.map((student: Student) => ({
          id: student.id,
          name: student.name,
          status: attendanceMap.get(student.id) || null,
        }));

        setStudents(attendanceStudents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setStudents(students.map((s) =>
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = students
        .filter((s) => s.status !== null)
        .map((s) => ({
          studentId: s.id,
          status: s.status as 'present' | 'absent',
        }));

      const response = await dataService.attendance.mark({
        date: selectedDate,
        records,
      });

      if (response.success) {
        alert('Attendance saved successfully!');
      } else {
        setError(response.error || 'Failed to save attendance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const unmarkedCount = students.filter((s) => s.status === null).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Attendance</h2>
        <Button variant="primary" onClick={handleSave} isLoading={saving}>
          Save Attendance
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {/* Date Selector & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <label className="block text-body font-medium text-text-primary mb-2">
            Select Date
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">{presentCount}</div>
          <div className="text-sm text-text-secondary">Present</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-500 mb-1">{absentCount}</div>
          <div className="text-sm text-text-secondary">Absent</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-warning mb-1">{unmarkedCount}</div>
          <div className="text-sm text-text-secondary">Unmarked</div>
        </Card>
      </div>

      {/* Attendance List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
                  Student Name
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-text-secondary">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 border-b border-gray-100">
                      <span className="font-medium text-text-primary">{student.name}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-100 text-center">
                      {student.status === 'present' && (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <CheckCircleIcon className="w-5 h-5" />
                          Present
                        </span>
                      )}
                      {student.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                          <XCircleIcon className="w-5 h-5" />
                          Absent
                        </span>
                      )}
                      {student.status === null && (
                        <span className="text-text-secondary">Not marked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            student.status === 'present'
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            student.status === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-red-50 text-red-500 hover:bg-red-100'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
