import React from 'react';
import { AcademicCapIcon, CheckIcon } from '@heroicons/react/24/outline';

const features = [
  'Real-time student progress tracking',
  'Comprehensive attendance monitoring',
  'Milestone achievement analytics',
  'Customizable reports and insights',
];

export function LoginHero() {
  return (
    <div className="flex-1 bg-gradient-to-br from-primary to-primary-dark p-16 flex flex-col justify-center text-white hidden lg:flex">
      <div className="max-w-[540px]">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <AcademicCapIcon className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight">EduTrack</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
          Empowering Student Success Through Data
        </h1>

        {/* Description */}
        <p className="text-lg text-white/95 mb-10 leading-relaxed">
          Track student progress, monitor milestones, and gain actionable insights
          with our comprehensive education management platform. Built for educators
          who care about every student's journey.
        </p>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-4 text-white/95">
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-4 h-4" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
