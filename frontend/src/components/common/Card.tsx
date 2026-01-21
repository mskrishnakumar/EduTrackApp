import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-card shadow-card border border-black/5
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h3>
      {action}
    </div>
  );
}

interface CardLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function CardLink({ href, onClick, children }: CardLinkProps) {
  const Component = href ? 'a' : 'button';
  return (
    <Component
      href={href}
      onClick={onClick}
      className="text-amber-700 text-body font-medium hover:text-amber-800 inline-flex items-center gap-1 transition-all hover:gap-2"
    >
      {children}
      <span>→</span>
    </Component>
  );
}
