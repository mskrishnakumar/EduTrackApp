import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline';
import { Button } from '../components/common/Button';
import { Milestone, MilestoneType } from '../types';
import { dataService } from '../services/dataService';

const FILTER_BUTTONS: { key: MilestoneType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'academic', label: 'Academic' },
  { key: 'life-skills', label: 'Life Skills' },
  { key: 'attendance', label: 'Attendance' },
];

export function StudentMilestonesPage() {
  const { user } = useAuth();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MilestoneType | 'all'>('all');

  const fetchMilestones = useCallback(async () => {
    if (!user?.studentId) {
      setError('No student profile linked to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.studentPortal.getMilestones(user.studentId);
      if (response.success && response.data) {
        setMilestones(response.data);
      } else {
        setError(response.error || 'Failed to load milestones');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const filteredMilestones = useMemo(() => {
    if (activeFilter === 'all') return milestones;
    return milestones.filter(m => m.type === activeFilter);
  }, [milestones, activeFilter]);

  const counts = useMemo(() => ({
    all: milestones.length,
    academic: milestones.filter(m => m.type === 'academic').length,
    'life-skills': milestones.filter(m => m.type === 'life-skills').length,
    attendance: milestones.filter(m => m.type === 'attendance').length,
  }), [milestones]);

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

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchMilestones}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          My Milestones
        </h1>
        <p className="text-text-secondary">
          Track your achievements and progress
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-card shadow-card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTER_BUTTONS.map(btn => (
            <button
              key={btn.key}
              onClick={() => setActiveFilter(btn.key)}
              className={`px-4 py-2 rounded-input text-sm font-medium transition-all ${
                activeFilter === btn.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-bg text-text-secondary hover:bg-gray-200'
              }`}
            >
              {btn.label}
              <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs ${
                activeFilter === btn.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-text-secondary'
              }`}>
                {counts[btn.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length > 0 ? (
        <div className="bg-white rounded-card shadow-card p-6">
          <MilestoneTimeline milestones={filteredMilestones} />
        </div>
      ) : (
        <div className="bg-white p-12 rounded-card shadow-card text-center">
          <p className="text-text-secondary text-lg mb-2">No milestones found</p>
          <p className="text-text-secondary text-sm">
            {activeFilter === 'all'
              ? "You haven't earned any milestones yet. Keep working hard!"
              : `No ${activeFilter === 'life-skills' ? 'life skills' : activeFilter} milestones recorded yet.`}
          </p>
        </div>
      )}
    </div>
  );
}
