import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Student } from '../../types';
import { getStudentDetailRoute } from '../../constants/routes';
import { format } from 'date-fns';

interface StudentTableProps {
  students: Student[];
  loading?: boolean;
}

// Map program names to badge types for display
const getProgramBadgeType = (programName: string): 'academic' | 'life-skills' | 'attendance' => {
  const nameLower = programName.toLowerCase();
  if (nameLower.includes('life') || nameLower.includes('skill')) return 'life-skills';
  if (nameLower.includes('academic') || nameLower.includes('support')) return 'attendance';
  return 'academic';
};

export function StudentTable({ students, loading }: StudentTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (studentId: string) => {
    navigate(getStudentDetailRoute(studentId));
  };

  if (loading) {
    return (
      <div className="table-container p-8 text-center">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-text-secondary mt-4">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="table-container p-8 text-center">
        <p className="text-text-secondary">No students found.</p>
      </div>
    );
  }

  return (
    <div className="table-container overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
              Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
              Age
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
              Program
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
              Enrollment Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-gray-border">
              Milestones
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              onClick={() => handleRowClick(student.id)}
              className="cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4 border-b border-gray-100">
                <span className="font-semibold text-text-primary">{student.name}</span>
              </td>
              <td className="px-6 py-4 border-b border-gray-100 text-text-primary">
                {student.age}
              </td>
              <td className="px-6 py-4 border-b border-gray-100">
                <Badge type={getProgramBadgeType(student.programName)}>
                  {student.programName}
                </Badge>
              </td>
              <td className="px-6 py-4 border-b border-gray-100 text-text-primary">
                {format(new Date(student.enrollmentDate), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 border-b border-gray-100 text-text-primary">
                {student.milestoneCount || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
