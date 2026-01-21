import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Program } from '../types';

// Mock data
const mockPrograms: Program[] = [
  {
    id: 'p1',
    name: 'After School Program',
    description: 'Comprehensive after-school support including homework help, recreational activities, and skill development.',
    enrollmentCount: 68,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'admin',
  },
  {
    id: 'p2',
    name: 'Life Skills Training',
    description: 'Program focused on developing essential life skills including communication, teamwork, and problem-solving.',
    enrollmentCount: 42,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'admin',
  },
  {
    id: 'p3',
    name: 'Academic Support',
    description: 'Targeted academic assistance for students needing extra help in core subjects.',
    enrollmentCount: 32,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'admin',
  },
  {
    id: 'p4',
    name: 'Sports & Recreation',
    description: 'Physical education and sports activities promoting health and teamwork.',
    enrollmentCount: 14,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'admin',
  },
];

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    // Mock implementation
    const newProgram: Program = {
      id: `p${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      enrollmentCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
    };
    setPrograms([...programs, newProgram]);
    setFormData({ name: '', description: '' });
    setIsFormOpen(false);
    setLoading(false);
  };

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

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((program) => (
          <Card key={program.id} hoverable>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">{program.name}</h3>
              <span className="text-2xl font-bold text-primary">{program.enrollmentCount}</span>
            </div>
            <p className="text-text-secondary text-body mb-4">{program.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {program.enrollmentCount} students enrolled
              </span>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

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
            <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
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
