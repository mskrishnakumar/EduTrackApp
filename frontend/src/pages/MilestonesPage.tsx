import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, CheckCircleIcon, AcademicCapIcon, UserGroupIcon, CalendarIcon, PencilIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Milestone, Student, CreateMilestoneRequest, UpdateMilestoneRequest, MilestoneType } from '../types';
import { dataService } from '../services/dataService';
import { MILESTONE_TYPE_OPTIONS } from '../constants/milestoneTypes';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { getStudentDetailRoute } from '../constants/routes';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../context/LanguageContext';

// Helper to get translated description for a specific language
function getDescriptionForLanguage(
  description: string,
  translations?: Record<string, string>,
  language: SupportedLanguage = 'en'
): string {
  if (language === 'en' || !translations) {
    return description;
  }
  return translations[language] || description;
}

export function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    type: '' as MilestoneType | '',
    description: '',
    dateAchieved: format(new Date(), 'yyyy-MM-dd'),
    verifiedBy: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-milestone language selection
  const [milestoneLanguages, setMilestoneLanguages] = useState<Record<string, SupportedLanguage>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch students to get their milestones and for the dropdown
      const studentsResponse = await dataService.students.getAll();
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);

        // Fetch milestones for all students
        const allMilestones: Milestone[] = [];
        for (const student of studentsResponse.data) {
          const milestonesResponse = await dataService.milestones.getByStudent(student.id);
          if (milestonesResponse.success && milestonesResponse.data) {
            allMilestones.push(...milestonesResponse.data);
          }
        }

        // Sort by date (most recent first)
        allMilestones.sort((a, b) =>
          new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime()
        );
        setMilestones(allMilestones);
      } else {
        setError(studentsResponse.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editingMilestone && !formData.studentId) {
      newErrors.studentId = 'Please select a student';
    }

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    try {
      if (editingMilestone) {
        // Update existing milestone
        const data: UpdateMilestoneRequest = {
          type: formData.type as MilestoneType,
          description: formData.description.trim(),
          dateAchieved: formData.dateAchieved,
          verifiedBy: formData.verifiedBy.trim(),
        };

        const response = await dataService.milestones.update(editingMilestone.id, data);
        if (response.success) {
          await fetchData();
          handleCloseModal();
        } else {
          setError(response.error || 'Failed to update milestone');
        }
      } else {
        // Create new milestone
        const data: CreateMilestoneRequest = {
          studentId: formData.studentId,
          type: formData.type as MilestoneType,
          description: formData.description.trim(),
          dateAchieved: formData.dateAchieved,
          verifiedBy: formData.verifiedBy.trim(),
        };

        const response = await dataService.milestones.create(data);
        if (response.success) {
          await fetchData();
          handleCloseModal();
        } else {
          setError(response.error || 'Failed to create milestone');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      studentId: milestone.studentId,
      type: milestone.type,
      description: milestone.description,
      dateAchieved: milestone.dateAchieved,
      verifiedBy: milestone.verifiedBy,
    });
    setIsFormOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingMilestone(null);
    setFormData({
      studentId: '',
      type: '',
      description: '',
      dateAchieved: format(new Date(), 'yyyy-MM-dd'),
      verifiedBy: '',
    });
    setErrors({});
  };

  const handleMilestoneLanguageChange = (milestoneId: string, language: SupportedLanguage) => {
    setMilestoneLanguages(prev => ({
      ...prev,
      [milestoneId]: language
    }));
  };

  const getMilestoneLanguage = (milestoneId: string): SupportedLanguage => {
    return milestoneLanguages[milestoneId] || 'en';
  };

  const typeOptions = MILESTONE_TYPE_OPTIONS.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const getMilestoneIcon = (type: MilestoneType) => {
    switch (type) {
      case 'academic':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'life-skills':
        return <UserGroupIcon className="w-5 h-5" />;
      case 'attendance':
        return <CalendarIcon className="w-5 h-5" />;
      default:
        return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Milestones</h2>
        <Button
          variant="primary"
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Milestone
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
          {error}
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No milestones recorded yet.</p>
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              Record First Milestone
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const currentLang = getMilestoneLanguage(milestone.id);
            const hasTranslations = milestone.descriptionTranslations && Object.keys(milestone.descriptionTranslations).length > 0;

            return (
              <Card key={milestone.id} hoverable>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      milestone.type === 'academic'
                        ? 'bg-blue-100 text-blue-600'
                        : milestone.type === 'life-skills'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {getMilestoneIcon(milestone.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={getStudentDetailRoute(milestone.studentId)}
                          className="font-semibold text-text-primary hover:text-primary transition-colors"
                        >
                          {milestone.studentName || 'Unknown Student'}
                        </Link>
                        <Badge type={milestone.type}>
                          {milestone.type === 'academic' ? 'Academic' : milestone.type === 'life-skills' ? 'Life Skills' : 'Attendance'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Per-card Language Selector */}
                        {hasTranslations && (
                          <div className="flex items-center gap-1">
                            <GlobeAltIcon className="w-4 h-4 text-text-secondary" />
                            <select
                              value={currentLang}
                              onChange={(e) => handleMilestoneLanguageChange(milestone.id, e.target.value as SupportedLanguage)}
                              className="px-2 py-1 border border-gray-border rounded text-xs bg-white focus:outline-none focus:border-primary"
                            >
                              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(milestone)}
                          className="p-1 text-text-secondary hover:text-primary transition-colors"
                          title="Edit milestone"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm mb-2">
                      {getDescriptionForLanguage(milestone.description, milestone.descriptionTranslations, currentLang)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>
                        {format(new Date(milestone.dateAchieved), 'MMM d, yyyy')}
                      </span>
                      <span>Verified by: {milestone.verifiedBy}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Milestone Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseModal}
        title={editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
              {editingMilestone ? 'Update Milestone' : 'Save Milestone'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {!editingMilestone && (
            <Select
              label="Student"
              options={studentOptions}
              placeholder="Select a student"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              error={errors.studentId}
              required
            />
          )}

          {editingMilestone && (
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Student
              </label>
              <p className="text-text-secondary">{editingMilestone.studentName}</p>
            </div>
          )}

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
            {editingMilestone && (
              <p className="mt-1.5 text-xs text-text-secondary">
                Note: Updating the description will trigger re-translation.
              </p>
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
        </div>
      </Modal>
    </div>
  );
}
