import React from 'react';
import { SearchInput } from '../common/SearchInput';
import { Select } from '../common/Select';
import { Program } from '../../types';

interface StudentFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedProgram: string;
  onProgramChange: (value: string) => void;
  programs: Program[];
}

export function StudentFilters({
  searchValue,
  onSearchChange,
  selectedProgram,
  onProgramChange,
  programs,
}: StudentFiltersProps) {
  const programOptions = [
    { value: '', label: 'All Programs' },
    ...programs.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="bg-white p-4 rounded-card shadow-card border border-black/5 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
      <div className="flex-1">
        <SearchInput
          placeholder="Search by name..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="w-full sm:w-52">
        <Select
          options={programOptions}
          value={selectedProgram}
          onChange={(e) => onProgramChange(e.target.value)}
        />
      </div>
    </div>
  );
}
