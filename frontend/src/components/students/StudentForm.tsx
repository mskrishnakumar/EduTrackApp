import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CreateStudentRequest, Program, Student, Center } from '../../types';
import { format } from 'date-fns';
import { dataService } from '../../services/dataService';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudentRequest) => Promise<void>;
  programs: Program[];
  initialData?: Student;
  mode?: 'create' | 'edit';
}

export function StudentForm({
  isOpen,
  onClose,
  onSubmit,
  programs,
  initialData,
  mode = 'create',
}: StudentFormProps) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    age: initialData?.age?.toString() || '',
    programId: initialData?.programId || '',
    centerId: initialData?.centerId || '',
    enrollmentDate: initialData?.enrollmentDate
      ? format(new Date(initialData.enrollmentDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch centers when modal opens
  useEffect(() => {
    if (isOpen) {
      dataService.centers.getAll().then((response) => {
        if (response.success && response.data) {
          setCenters(response.data);
          // Auto-select first center if only one exists
          if (response.data.length === 1 && !formData.centerId) {
            setFormData((prev) => ({ ...prev, centerId: response.data![0].id }));
          }
        }
      });
    }
  }, [isOpen]);

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  const centerOptions = centers.map((c) => ({ value: c.id, label: c.name }));

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age || parseInt(formData.age) < 5 || parseInt(formData.age) > 25) {
      newErrors.age = 'Age must be between 5 and 25';
    }

    if (!formData.programId) {
      newErrors.programId = 'Program is required';
    }

    if (!formData.centerId) {
      newErrors.centerId = 'Center is required';
    }

    if (!formData.enrollmentDate) {
      newErrors.enrollmentDate = 'Enrollment date is required';
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
        name: formData.name.trim(),
        age: parseInt(formData.age),
        programId: formData.programId,
        centerId: formData.centerId,
        enrollmentDate: formData.enrollmentDate,
      });
      onClose();
      // Reset form
      setFormData({
        name: '',
        age: '',
        programId: '',
        centerId: centers.length === 1 ? centers[0].id : '',
        enrollmentDate: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch (error) {
      console.error('Error submitting form:', error);
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
      title={mode === 'create' ? 'Add New Student' : 'Edit Student'}
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
            {mode === 'create' ? 'Save Student' : 'Update Student'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Student Name"
          placeholder="Enter full name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          type="number"
          label="Age"
          placeholder="Enter age"
          min={5}
          max={25}
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          error={errors.age}
          required
        />

        <Select
          label="Program"
          options={programOptions}
          placeholder="Select a program"
          value={formData.programId}
          onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
          error={errors.programId}
          required
        />

        <Select
          label="Center"
          options={centerOptions}
          placeholder="Select a center"
          value={formData.centerId}
          onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
          error={errors.centerId}
          required
        />

        <Input
          type="date"
          label="Enrollment Date"
          value={formData.enrollmentDate}
          onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
          error={errors.enrollmentDate}
          required
        />
      </form>
    </Modal>
  );
}
