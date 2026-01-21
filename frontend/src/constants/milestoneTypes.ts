import { MilestoneType } from '../types';

export const MILESTONE_TYPES: Record<MilestoneType, { label: string; badgeClass: string }> = {
  academic: {
    label: 'Academic',
    badgeClass: 'badge-academic',
  },
  'life-skills': {
    label: 'Life Skills',
    badgeClass: 'badge-life-skills',
  },
  attendance: {
    label: 'Attendance',
    badgeClass: 'badge-attendance',
  },
};

export const MILESTONE_TYPE_OPTIONS = [
  { value: 'academic' as MilestoneType, label: 'Academic' },
  { value: 'life-skills' as MilestoneType, label: 'Life Skills' },
  { value: 'attendance' as MilestoneType, label: 'Attendance' },
];
