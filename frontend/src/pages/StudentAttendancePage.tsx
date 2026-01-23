import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttendanceCalendarView } from '../components/student/AttendanceCalendarView';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AttendanceRecord } from '../types';
import { dataService } from '../services/dataService';

export function StudentAttendancePage() {
  const { user } = useAuth();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!user?.studentId) {
      setError('No student profile linked to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.studentPortal.getAttendanceHistory(
        user.studentId, year, month
      );
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.error || 'Failed to load attendance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [user?.studentId, year, month]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const summary = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, rate };
  }, [records]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  if (error && !records.length) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchAttendance}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          My Attendance
        </h1>
        <p className="text-text-secondary">
          View your attendance history
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">{summary.present}</div>
          <div className="text-sm text-text-secondary">Days Present</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-500 mb-1">{summary.absent}</div>
          <div className="text-sm text-text-secondary">Days Absent</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-secondary mb-1">{summary.rate}%</div>
          <div className="text-sm text-text-secondary">Attendance Rate</div>
        </Card>
      </div>

      {/* Calendar */}
      <AttendanceCalendarView
        records={records}
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
        loading={loading}
      />
    </div>
  );
}
