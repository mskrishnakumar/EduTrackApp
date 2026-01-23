import { useMemo } from 'react';
import { Card } from '../common/Card';
import { AttendanceRecord } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AttendanceCalendarViewProps {
  records: AttendanceRecord[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  loading?: boolean;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarDay {
  date: number | null;
  dateStr: string | null;
  status: 'present' | 'absent' | 'weekend' | 'future' | 'no-data' | null;
  isToday: boolean;
}

export function AttendanceCalendarView({
  records,
  year,
  month,
  onMonthChange,
  loading,
}: AttendanceCalendarViewProps) {
  const today = new Date();
  const isCurrentOrFutureMonth =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month >= today.getMonth());

  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Leading empty cells
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, dateStr: null, status: null, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isFuture = date > today;
      const isToday = date.toDateString() === today.toDateString();

      if (isWeekend) {
        days.push({ date: day, dateStr, status: 'weekend', isToday });
      } else if (isFuture) {
        days.push({ date: day, dateStr, status: 'future', isToday });
      } else {
        const record = records.find(r => r.date === dateStr);
        days.push({
          date: day,
          dateStr,
          status: record ? record.status : 'no-data',
          isToday,
        });
      }
    }

    return days;
  }, [records, year, month]);

  const handlePrevMonth = () => {
    if (month === 0) {
      onMonthChange(year - 1, 11);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onMonthChange(year + 1, 0);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const getCellClasses = (day: CalendarDay): string => {
    const base = 'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors';

    if (day.date === null) return base;

    let colorClass = '';
    switch (day.status) {
      case 'present':
        colorClass = 'bg-green-100 text-green-700';
        break;
      case 'absent':
        colorClass = 'bg-red-100 text-red-600';
        break;
      case 'weekend':
        colorClass = 'bg-gray-50 text-gray-300';
        break;
      case 'future':
        colorClass = 'text-gray-300';
        break;
      case 'no-data':
        colorClass = 'bg-gray-50 text-gray-400';
        break;
      default:
        colorClass = '';
    }

    const todayClass = day.isToday ? 'ring-2 ring-primary ring-offset-1' : '';

    return `${base} ${colorClass} ${todayClass}`;
  };

  return (
    <Card>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={handleNextMonth}
          disabled={isCurrentOrFutureMonth}
          className={`p-2 rounded-lg transition-colors ${
            isCurrentOrFutureMonth
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-text-secondary'
          }`}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Day-of-week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_HEADERS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-secondary py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div key={index} className={getCellClasses(day)}>
                {day.date}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-100" />
          <span className="text-xs text-text-secondary">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-100" />
          <span className="text-xs text-text-secondary">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200" />
          <span className="text-xs text-text-secondary">Weekend / No data</span>
        </div>
      </div>
    </Card>
  );
}
