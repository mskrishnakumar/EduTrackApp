import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Student } from '../types';
import { dataService } from '../services/dataService';

export function StudentProfilePage() {
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.studentId) {
      setError('No student profile linked to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await dataService.students.getOne(user.studentId);
      if (response.success && response.data) {
        setStudent(response.data);
        setDisplayName(response.data.name);
      } else {
        setError(response.error || 'Failed to load profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setValidationError(null);
    if (!displayName.trim() || displayName.trim().length < 2) {
      setValidationError('Display name must be at least 2 characters.');
      return;
    }
    if (!user?.studentId) return;

    setSaving(true);
    setError(null);
    try {
      const response = await dataService.studentPortal.updateProfile(user.studentId, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
      });
      if (response.success) {
        setSuccessMsg('Profile updated successfully!');
        setStudent(prev => prev ? { ...prev, name: displayName.trim() } : prev);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(student?.name || '');
    setPhone('');
    setValidationError(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchProfile}>
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
          My Profile
        </h1>
        <p className="text-text-secondary">
          View and manage your profile information
        </p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-input text-body border border-green-200">
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div>
          <Card className="text-center">
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                {getInitials(displayName || student?.name || 'S')}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {displayName || student?.name}
              </h3>
              <p className="text-sm text-text-secondary mb-3">{user?.email}</p>
              <Badge type="attendance">Student</Badge>
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editable Fields */}
          <Card>
            <CardHeader title="Personal Information" />
            <div className="mt-4 space-y-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Your display name"
                required
                error={validationError || undefined}
              />
              <Input
                label="Phone / Contact"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional contact number"
              />
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saving}
              >
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </Card>

          {/* Read-Only Info */}
          <Card>
            <CardHeader title="Program Information" />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Program</p>
                <p className="text-sm font-medium text-text-primary">{student?.programName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Center</p>
                <p className="text-sm font-medium text-text-primary">{student?.centerName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Enrollment Date</p>
                <p className="text-sm font-medium text-text-primary">
                  {student?.enrollmentDate
                    ? new Date(student.enrollmentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Student ID</p>
                <p className="text-sm font-medium text-text-primary font-mono">{student?.id || '-'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
