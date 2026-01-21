import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface AttendanceStudent {
  id: string;
  name: string;
  status: 'present' | 'absent' | null;
}

// Mock data
const mockStudents: AttendanceStudent[] = [
  { id: 's1', name: 'Priya Sharma', status: 'present' },
  { id: 's2', name: 'Amit Patel', status: 'present' },
  { id: 's3', name: 'Sneha Kumar', status: 'absent' },
  { id: 's4', name: 'Rajesh Verma', status: 'present' },
  { id: 's5', name: 'Ananya Singh', status: null },
  { id: 's6', name: 'Karan Mehta', status: null },
  { id: 's7', name: 'Deepa Rao', status: null },
];

export function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<AttendanceStudent[]>(mockStudents);
  const [saving, setSaving] = useState(false);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setStudents(students.map((s) =>
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    // Mock save
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    alert('Attendance saved successfully!');
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const unmarkedCount = students.filter((s) => s.status === null).length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Attendance</h2>
        <Button variant="primary" onClick={handleSave} isLoading={saving}>
          Save Attendance
        </Button>
      </div>

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
              {students.map((student) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
