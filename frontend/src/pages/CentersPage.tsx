import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Center } from '../types';
import { dataService } from '../services/dataService';

interface CreateCenterRequest {
  name: string;
  location: string;
}

export function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCenterRequest>({ name: '', location: '' });
  const [errors, setErrors] = useState<Partial<CreateCenterRequest>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.centers.getAll();
      if (response.success && response.data) {
        setCenters(response.data);
      } else {
        setError(response.error || 'Failed to load centers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load centers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateCenterRequest> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Center name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    try {
      const response = await dataService.centers.create({
        name: formData.name.trim(),
        location: formData.location.trim(),
      });
      if (response.success) {
        await fetchCenters();
        setFormData({ name: '', location: '' });
        setErrors({});
        setIsFormOpen(false);
      } else {
        setError(response.error || 'Failed to create center');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create center');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setFormData({ name: '', location: '' });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Centers</h2>
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Center
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {/* Centers Grid */}
      {centers.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No centers found.</p>
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              Add Your First Center
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <Card key={center.id} hoverable>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BuildingOfficeIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary truncate">
                    {center.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-text-secondary text-sm">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{center.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        center.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {center.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Center Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseModal}
        title="Add New Center"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
              Save Center
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Input
            label="Center Name"
            placeholder="e.g., Downtown Learning Center"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Location"
            placeholder="e.g., 123 Main Street, Downtown"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
