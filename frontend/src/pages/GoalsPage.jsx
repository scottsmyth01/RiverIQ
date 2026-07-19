import './GoalsPage.css';

import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDot,
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from '../hooks/useGoals';

const tabs = ['All Goals', 'On Track', 'In Progress', 'At Risk', 'Completed'];
const categoryOptions = ['All Categories', 'Preflop', 'Postflop', 'Results', 'Volume', 'Bankroll', 'Study'];
const sortOptions = ['All', 'Recently Created', 'Progress: High to Low', 'Progress: Low to High', 'Due Date'];

const statusToneByStatus = {
  'On Track': 'green',
  'In Progress': 'blue',
  'At Risk': 'orange',
  Completed: 'green',
  'Not Started': 'gray',
};

const iconByCategory = {
  Preflop: Users,
  Postflop: Star,
  Results: TrendingUp,
  Volume: CircleDot,
  Bankroll: CheckCircle2,
  Study: Brain,
};

const iconToneByCategory = {
  Preflop: 'purple',
  Postflop: 'purple',
  Results: 'green',
  Volume: 'green',
  Bankroll: 'green',
  Study: 'gray',
};

const barToneByStatus = {
  'On Track': 'green',
  'In Progress': 'blue',
  'At Risk': 'orange',
  Completed: 'green',
  'Not Started': 'gray',
};

const emptyDraft = {
  title: '',
  description: '',
  category: 'Preflop',
  target: '',
  current: '',
  progress: 50,
  status: 'In Progress',
  dueDate: '',
};

function getDueMeta(status, dueDate) {
  if (status === 'Completed') return 'Completed';
  if (!dueDate) return 'No due date';

  const daysLeft = Math.max(1, Math.ceil((new Date(dueDate) - new Date()) / 86400000));
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}

function formatDueDate(dueDate) {
  if (!dueDate) return 'No due date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dueDate));
}

function sortGoals(goalList, sortBy) {
  return [...goalList].sort((a, b) => {
    if (sortBy === 'Progress: High to Low') return b.progress - a.progress;
    if (sortBy === 'Progress: Low to High') return a.progress - b.progress;
    if (sortBy === 'Due Date') return new Date(a.dueDate) - new Date(b.dueDate);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function SummaryCard({ card }) {
  const Icon = card.icon;

  return (
    <article className={`goals-summary-card goals-summary-card--${card.tone}`}>
      <div>
        <span>{card.label}</span>
        <strong>{card.value}</strong>
        <small>{card.meta}</small>
      </div>
      <Icon aria-hidden='true' />
    </article>
  );
}

function GoalRow({ goal, isMenuOpen, onEdit, onMenuToggle, onRemove }) {
  const Icon = iconByCategory[goal.category] ?? Target;
  const iconTone = iconToneByCategory[goal.category] ?? 'blue';
  const statusTone = statusToneByStatus[goal.status] ?? 'gray';
  const barTone = barToneByStatus[goal.status] ?? 'gray';
  const dueMeta = goal.dueMeta ?? getDueMeta(goal.status, goal.dueDate);
  const dueDate = formatDueDate(goal.dueDate);

  return (
    <tr>
      <td>
        <div className='goal-title-cell'>
          <span className={`goal-icon goal-icon--${iconTone}`}>
            <Icon aria-hidden='true' />
          </span>
          <div>
            <strong>{goal.title}</strong>
            <small>{goal.description}</small>
          </div>
        </div>
      </td>
      <td>{goal.target}</td>
      <td>
        <div className='goal-progress-cell'>
          <strong>{goal.current}</strong>
          <div className='goal-progress-track'>
            <span
              className={`goal-progress-fill goal-progress-fill--${barTone}`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
          </div>
          <small>{goal.progress}% of target</small>
        </div>
      </td>
      <td>
        <span className={`goal-status goal-status--${statusTone}`}>{goal.status}</span>
      </td>
      <td>
        <div className='goal-date-cell'>
          <CalendarDays aria-hidden='true' />
          <div>
            <span>{dueDate}</span>
            <small className={statusTone === 'orange' ? 'urgent' : ''}>{dueMeta}</small>
          </div>
        </div>
      </td>
      <td>
        <div className='goal-actions-cell'>
          <button
            className='goal-more-button'
            type='button'
            aria-label={`More actions for ${goal.title}`}
            aria-expanded={isMenuOpen}
            onClick={() => onMenuToggle(goal._id)}
          >
            <MoreVertical aria-hidden='true' />
          </button>
          {isMenuOpen && (
            <div className='goal-row-menu'>
              <button type='button' onClick={() => onEdit(goal)}>
                <Pencil aria-hidden='true' />
                <span>Edit</span>
              </button>
              <button type='button' onClick={() => onRemove(goal._id)}>
                <Trash2 aria-hidden='true' />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

const GoalsPage = () => {
  const { data: goals = [], isLoading, error } = useGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const isSavingGoal = createGoalMutation.isPending || updateGoalMutation.isPending;
  const [activeTab, setActiveTab] = useState('All Goals');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('All');
  const [openMenu, setOpenMenu] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!event.target.closest('.goals-filter-menu, .goal-actions-cell, .goal-modal')) {
        setOpenMenu(null);
        setRowMenuId(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const summaryCards = useMemo(() => {
    const total = goals.length;
    const onTrack = goals.filter((goal) => goal.status === 'On Track').length;
    const inProgress = goals.filter((goal) => goal.status === 'In Progress').length;
    const atRisk = goals.filter((goal) => goal.status === 'At Risk').length;
    const completed = goals.filter((goal) => goal.status === 'Completed').length;

    return [
      { label: 'Total Goals', value: total, meta: '+2 vs last 30 days', icon: Target, tone: 'muted' },
      {
        label: 'On Track',
        value: onTrack,
        meta: `${Math.round((onTrack / total) * 100) || 0}% of goals`,
        icon: TrendingUp,
        tone: 'green',
      },
      {
        label: 'In Progress',
        value: inProgress,
        meta: `${Math.round((inProgress / total) * 100) || 0}% of goals`,
        icon: CircleDot,
        tone: 'yellow',
      },
      {
        label: 'At Risk',
        value: atRisk,
        meta: `${Math.round((atRisk / total) * 100) || 0}% of goals`,
        icon: CircleAlert,
        tone: 'orange',
      },
      { label: 'Completed', value: completed, meta: 'This month', icon: CircleCheck, tone: 'purple' },
    ];
  }, [goals]);

  const visibleGoals = useMemo(() => {
    if (activeTab === 'All Goals') {
      return sortGoals(goals, sortBy);
    }

    const filteredGoals = goals
      .filter((goal) => goal.status === activeTab)
      .filter((goal) => category === 'All Categories' || goal.category === category);

    return sortGoals(filteredGoals, sortBy);
  }, [activeTab, category, goals, sortBy]);

  function openNewGoalModal() {
    setDraft(emptyDraft);
    setEditingId(null);
    setModalMode('new');
  }

  function openEditGoalModal(goal) {
    setDraft({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      target: goal.target,
      current: goal.current,
      progress: goal.progress,
      status: goal.status,
      dueDate: goal.dueDate,
    });
    setEditingId(goal._id);
    setModalMode('edit');
    setRowMenuId(null);
  }

  async function handleSaveGoal(event) {
    event.preventDefault();

    const goalData = {
      title: draft.title.trim() || 'Untitled Goal',
      description: draft.description.trim() || 'Track progress toward this goal',
      category: draft.category,
      target: draft.target.trim() || 'N/A',
      current: draft.current.trim() || '0%',
      progress: Number(draft.progress) || 0,
      status: draft.status,
      dueDate: draft.dueDate || null,
    };

    try {
      if (modalMode === 'edit') {
        await updateGoalMutation.mutateAsync({ id: editingId, goalData });
      } else {
        await createGoalMutation.mutateAsync(goalData);
      }

      setModalMode(null);
    } catch (mutationError) {
      console.error(mutationError);
    }
  }

  async function handleRemove(goalId) {
    try {
      await deleteGoalMutation.mutateAsync(goalId);
      setRowMenuId(null);
    } catch (mutationError) {
      console.error(mutationError);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);

    if (tab === 'All Goals') {
      setCategory('All Categories');
    }
  }

  if (isLoading) {
    return (
      <main className='goals-page'>
        <div className='goals-empty-state'>Loading goals...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='goals-page'>
        <div className='goals-empty-state'>{error.message}</div>
      </main>
    );
  }

  return (
    <main className='goals-page'>
      <header className='goals-header'>
        <div>
          <h1>Goals</h1>
          <p>Set goals, track your progress, and become a better player.</p>
        </div>
        <button className='goals-new-button' type='button' onClick={openNewGoalModal}>
          <Plus aria-hidden='true' />
          <span>New Goal</span>
        </button>
      </header>

      <section className='goals-summary-grid' aria-label='Goal summary'>
        {summaryCards.map((card) => (
          <SummaryCard card={card} key={card.label} />
        ))}
      </section>

      <section className='goals-table-card'>
        <div className='goals-table-header'>
          <nav className='goals-tabs' aria-label='Goal status'>
            {tabs.map((tab) => (
              <button
                className={activeTab === tab ? 'active' : ''}
                key={tab}
                type='button'
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className='goals-table-actions'>
            <div className='goals-filter-menu'>
              <button type='button' onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')}>
                <span>{category}</span>
                <ChevronDown aria-hidden='true' />
              </button>
              {openMenu === 'category' && (
                <div className='goals-dropdown'>
                  {categoryOptions.map((option) => (
                    <button
                      className={category === option ? 'selected' : ''}
                      key={option}
                      type='button'
                      onClick={() => {
                        setCategory(option);
                        setOpenMenu(null);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className='goals-filter-menu'>
              <button type='button' onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}>
                <span>Sort: {sortBy}</span>
                <ChevronDown aria-hidden='true' />
              </button>
              {openMenu === 'sort' && (
                <div className='goals-dropdown goals-dropdown--wide'>
                  {sortOptions.map((option) => (
                    <button
                      className={sortBy === option ? 'selected' : ''}
                      key={option}
                      type='button'
                      onClick={() => {
                        setSortBy(option);
                        setOpenMenu(null);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='goals-table-scroll'>
          <div className='goals-result-count'>
            Showing {visibleGoals.length} of {goals.length} goals
          </div>
          <table className='goals-table'>
            <thead>
              <tr>
                <th>Goal</th>
                <th>Target</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleGoals.map((goal) => (
                <GoalRow
                  goal={goal}
                  isMenuOpen={rowMenuId === goal._id}
                  key={goal._id}
                  onEdit={openEditGoalModal}
                  onMenuToggle={(goalId) => setRowMenuId(rowMenuId === goalId ? null : goalId)}
                  onRemove={handleRemove}
                />
              ))}
            </tbody>
          </table>
          {visibleGoals.length === 0 && <div className='goals-empty-state'>No goals match those filters.</div>}
        </div>
      </section>

      {modalMode && (
        <div className='goal-modal-backdrop'>
          <form className='goal-modal' onSubmit={handleSaveGoal}>
            <div className='goal-modal-header'>
              <div>
                <h2>{modalMode === 'edit' ? 'Edit Goal' : 'New Goal'}</h2>
                <p>{modalMode === 'edit' ? 'Update this saved goal.' : 'Create a saved goal.'}</p>
              </div>
              <button type='button' aria-label='Close goal form' onClick={() => setModalMode(null)}>
                <X aria-hidden='true' />
              </button>
            </div>

            <div className='goal-modal-grid'>
              <label>
                <span>Title</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder='Goal title'
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {categoryOptions.slice(1).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className='goal-modal-wide'>
                <span>Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder='What should this goal track?'
                />
              </label>
              <label>
                <span>Target</span>
                <input
                  value={draft.target}
                  onChange={(event) => setDraft({ ...draft, target: event.target.value })}
                  placeholder='>= 9%'
                />
              </label>
              <label>
                <span>Current</span>
                <input
                  value={draft.current}
                  onChange={(event) => setDraft({ ...draft, current: event.target.value })}
                  placeholder='8.5%'
                />
              </label>
              <label>
                <span>Progress</span>
                <input
                  max='120'
                  min='0'
                  type='number'
                  value={draft.progress}
                  onChange={(event) => setDraft({ ...draft, progress: event.target.value })}
                />
              </label>
              <label>
                <span>Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                  {tabs.slice(1).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                  <option>Not Started</option>
                </select>
              </label>
              <label className='goal-modal-wide'>
                <span>Due Date</span>
                <input
                  type='date'
                  value={draft.dueDate}
                  onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                />
              </label>
            </div>

            <div className='goal-modal-actions'>
              <button type='button' onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type='submit' disabled={isSavingGoal}>
                {isSavingGoal ? 'Saving...' : modalMode === 'edit' ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default GoalsPage;
