import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Program, CreateProgramRequest } from '../types';
import { dataService } from '../services/dataService';

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.programs.getAll();
      if (response.success && response.data) {
        setPrograms(response.data);
      } else {
        setError(response.error || 'Failed to load programs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const data: CreateProgramRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      const response = await dataService.programs.create(data);
      if (response.success) {
        await fetchPrograms();
        setFormData({ name: '', description: '' });
        setIsFormOpen(false);
      } else {
        setError(response.error || 'Failed to create program');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Programs</h2>
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Program
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">No programs found.</p>
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              Add Your First Program
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program) => (
            <Card key={program.id} hoverable>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{program.name}</h3>
                <span className="text-2xl font-bold text-primary">{program.enrollmentCount || 0}</span>
              </div>
              <p className="text-text-secondary text-body mb-4">{program.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  {program.enrollmentCount || 0} students enrolled
                </span>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Program Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Program"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
              Save Program
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Input
            label="Program Name"
            placeholder="Enter program name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-body font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border-[1.5px] border-gray-border rounded-input text-body font-sans transition-all duration-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
              rows={4}
              placeholder="Enter program description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
