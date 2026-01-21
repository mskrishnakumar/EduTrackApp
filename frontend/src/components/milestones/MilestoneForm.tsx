import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CreateMilestoneRequest, MilestoneType } from '../../types';
import { MILESTONE_TYPE_OPTIONS } from '../../constants/milestoneTypes';
import { format } from 'date-fns';

interface MilestoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMilestoneRequest) => Promise<void>;
  studentId: string;
}

export function MilestoneForm({
  isOpen,
  onClose,
  onSubmit,
  studentId,
}: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    type: '' as MilestoneType | '',
    description: '',
    dateAchieved: format(new Date(), 'yyyy-MM-dd'),
    verifiedBy: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = MILESTONE_TYPE_OPTIONS.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Milestone type is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.dateAchieved) {
      newErrors.dateAchieved = 'Date is required';
    }

    if (!formData.verifiedBy.trim()) {
      newErrors.verifiedBy = 'Verified by is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        studentId,
        type: formData.type as MilestoneType,
        description: formData.description.trim(),
        dateAchieved: formData.dateAchieved,
        verifiedBy: formData.verifiedBy.trim(),
      });
      onClose();
      // Reset form
      setFormData({
        type: '',
        description: '',
        dateAchieved: format(new Date(), 'yyyy-MM-dd'),
        verifiedBy: '',
      });
    } catch (error) {
      console.error('Error submitting milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Milestone"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Save Milestone
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Milestone Type"
          options={typeOptions}
          placeholder="Select type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as MilestoneType })}
          error={errors.type}
          required
        />

        <div>
          <label className="block text-body font-medium text-text-primary mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-4 py-3 border-[1.5px] border-gray-border rounded-input text-body font-sans transition-all duration-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
            rows={4}
            placeholder="Describe the milestone achievement..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <Input
          type="date"
          label="Date Achieved"
          value={formData.dateAchieved}
          onChange={(e) => setFormData({ ...formData, dateAchieved: e.target.value })}
          error={errors.dateAchieved}
          required
        />

        <Input
          label="Verified By"
          placeholder="Enter name of verifier"
          value={formData.verifiedBy}
          onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
          error={errors.verifiedBy}
          required
        />
      </form>
    </Modal>
  );
}
