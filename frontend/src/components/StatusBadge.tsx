import React from 'react';
import { CaseStatus } from '../types';

interface StatusBadgeProps {
  status: CaseStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  NEW: {
    label: 'New Inquiry',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
    border: 'border-blue-200',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  MORE_INFO_NEEDED: {
    label: 'More Info Needed',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    dot: 'bg-purple-600',
    border: 'border-purple-200',
  },
  QUOTATION_SENT: {
    label: 'Quotation Ready',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    dot: 'bg-emerald-600',
    border: 'border-emerald-200',
  },
  QUOTATION_ACCEPTED: {
    label: 'Quotation Accepted',
    bg: 'bg-green-50',
    text: 'text-green-900',
    dot: 'bg-green-600',
    border: 'border-green-300',
  },
  QUOTATION_DECLINED: {
    label: 'Quotation Declined',
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
  REQUEST_DECLINED: {
    label: 'Request Declined',
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    dot: 'bg-stone-500',
    border: 'border-stone-300',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-300',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-2',
    lg: 'text-sm font-medium px-3.5 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

