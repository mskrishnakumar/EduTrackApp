import React from 'react';
import { ArrowLeftIcon, CalendarIcon, AcademicCapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { Student } from '../../types';
import { format } from 'date-fns';

interface StudentHeaderProps {
  student: Student;
  onBack: () => void;
  onEdit: () => void;
}

export function StudentHeader({ student, onBack, onEdit }: StudentHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-body transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Students
      </button>

      {/* Student Header Card */}
      <div className="bg-white p-8 rounded-card shadow-card border border-black/5 mb-8 flex flex-col sm:flex-row items-center gap-8">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {getInitials(student.name)}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-text-primary mb-3 tracking-tight">
            {student.name}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-text-secondary text-body">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Age: {student.age}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <AcademicCapIcon className="w-4 h-4" />
              <span>{student.programName}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <DocumentTextIcon className="w-4 h-4" />
              <span>Enrolled: {format(new Date(student.enrollmentDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Button variant="secondary" onClick={onEdit}>
            Edit Student
          </Button>
        </div>
      </div>
    </>
  );
}
