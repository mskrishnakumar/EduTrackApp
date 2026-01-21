import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Settings</h2>
        <p className="text-text-secondary">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader title="Profile Information" />
          <div className="space-y-4">
            <Input
              label="Display Name"
              defaultValue={user?.displayName || ''}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              defaultValue={user?.email || ''}
              disabled
              helperText="Contact administrator to change email"
            />
            <Input
              label="Role"
              defaultValue={user?.role === 'admin' ? 'Administrator' : 'Coordinator'}
              disabled
            />
            {user?.centerName && (
              <Input
                label="Center"
                defaultValue={user.centerName}
                disabled
              />
            )}
            <Button variant="primary">Save Changes</Button>
          </div>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader title="Change Password" />
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
            />
            <Button variant="primary">Update Password</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader title="Notifications" />
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary"
              />
              <span className="text-text-primary">Email notifications for new milestones</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary"
              />
              <span className="text-text-primary">Daily attendance reminder</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary"
              />
              <span className="text-text-primary">Weekly progress report</span>
            </label>
            <Button variant="secondary">Save Preferences</Button>
          </div>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader title="About EduTrack" />
          <div className="space-y-2 text-text-secondary">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Built with:</strong> React, TypeScript, Tailwind CSS</p>
            <p><strong>Backend:</strong> Azure Functions</p>
            <p><strong>Database:</strong> Azure Table Storage</p>
            <p className="pt-4 text-sm">
              EduTrack is a comprehensive student progress monitoring system designed
              for educational organizations to track student milestones, attendance,
              and program performance.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
