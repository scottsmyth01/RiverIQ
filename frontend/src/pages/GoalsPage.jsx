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
  GripVertical,
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
import { toast } from 'sonner';
import { useCreateGoal, useDeleteGoal, useGoals, useReorderGoals, useUpdateGoal } from '../hooks/useGoals';

const tabs = ['All Goals', 'Not Started', 'Active', 'Needs Attention', 'Completed'];
const categoryOptions = ['All Categories', 'Preflop', 'Postflop', 'Results', 'Volume', 'Bankroll', 'Study'];
const sortOptions = ['Custom Order', 'Recently Created', 'Due Date'];

const statusToneByStatus = {
  'Not Started': 'gray',
  Active: 'blue',
  'Needs Attention': 'orange',
  Paused: 'gray',
  Completed: 'green',
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

const emptyDraft = {
  title: '',
  description: '',
  category: 'Preflop',
  target: '',
  current: '',
  progress: 0,
  status: 'Active',
  dueDate: '',
};

function moveItem(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function setGoalDragPreview(event) {
  const row = event.currentTarget.closest('tr');

  if (!row || !event.dataTransfer.setDragImage) return;

  const table = document.createElement('table');
  const body = document.createElement('tbody');
  const preview = row.cloneNode(true);
  const rowBox = row.getBoundingClientRect();

  table.className = 'goals-drag-preview-table';
  table.style.width = `${rowBox.width}px`;
  preview.classList.add('goal-row--drag-preview');

  body.appendChild(preview);
  table.appendChild(body);
  document.body.appendChild(table);
  event.dataTransfer.setDragImage(table, rowBox.width - 24, Math.max(18, rowBox.height / 2));

  window.setTimeout(() => {
    table.remove();
  }, 0);
}

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

function getGoalId(goal) {
  return goal._id || goal.id;
}

function sortGoals(goalList, sortBy, orderIds = []) {
  const orderMap = new Map(orderIds.map((id, index) => [id, index]));

  return [...goalList].sort((a, b) => {
    if (sortBy === 'Due Date') return new Date(a.dueDate) - new Date(b.dueDate);
    if (sortBy === 'Custom Order') {
      const firstOrder = orderMap.has(getGoalId(a)) ? orderMap.get(getGoalId(a)) : Number(a.order);
      const secondOrder = orderMap.has(getGoalId(b)) ? orderMap.get(getGoalId(b)) : Number(b.order);

      if (Number.isFinite(firstOrder) && Number.isFinite(secondOrder) && firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }
    }

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

function GoalRow({ goal, isDragging, isMenuOpen, onDragEnd, onDragOver, onDragStart, onDrop, onEdit, onMenuToggle, onRemove }) {
  const Icon = iconByCategory[goal.category] ?? Target;
  const iconTone = iconToneByCategory[goal.category] ?? 'blue';
  const statusTone = statusToneByStatus[goal.status] ?? 'gray';
  const dueMeta = goal.dueMeta ?? getDueMeta(goal.status, goal.dueDate);
  const dueDate = formatDueDate(goal.dueDate);

  return (
    <tr
      className={isDragging ? 'goal-row goal-row--dragging' : 'goal-row'}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, getGoalId(goal))}
      onDrop={(event) => onDrop(event, getGoalId(goal))}
    >
      <td>
        <div className='goal-title-cell'>
          <span className={`goal-icon goal-icon--${iconTone}`}>
            <Icon aria-hidden='true' />
          </span>
          <div>
            <strong>{goal.title}</strong>
            <small>
              <span>{goal.category}</span>
              {goal.source === 'ai' && <span className='goal-source-badge'>AI Coach</span>}
            </small>
          </div>
        </div>
      </td>
      <td>{goal.target}</td>
      <td>
        <p className='goal-description-cell'>{goal.description || 'No description added yet.'}</p>
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
            className='goal-drag-button'
            type='button'
            aria-label={`Drag ${goal.title} to reorder`}
            title='Drag to reorder'
            draggable
            onDragStart={(event) => onDragStart(event, getGoalId(goal))}
          >
            <GripVertical aria-hidden='true' />
          </button>
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
  const reorderGoalsMutation = useReorderGoals();
  const isSavingGoal = createGoalMutation.isPending || updateGoalMutation.isPending;
  const [activeTab, setActiveTab] = useState('All Goals');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Custom Order');
  const [openMenu, setOpenMenu] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [draggedGoalId, setDraggedGoalId] = useState(null);
  const [goalOrderIds, setGoalOrderIds] = useState([]);
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

  useEffect(() => {
    setGoalOrderIds(sortGoals(goals, 'Custom Order').map(getGoalId));
  }, [goals]);

  const summaryCards = useMemo(() => {
    const total = goals.length;
    const active = goals.filter((goal) => goal.status === 'Active').length;
    const needsAttention = goals.filter((goal) => goal.status === 'Needs Attention').length;
    const completed = goals.filter((goal) => goal.status === 'Completed').length;

    return [
      { label: 'Total Goals', value: total, meta: '+2 vs last 30 days', icon: Target, tone: 'muted' },
      {
        label: 'Active',
        value: active,
        meta: `${Math.round((active / total) * 100) || 0}% of goals`,
        icon: TrendingUp,
        tone: 'blue',
      },
      {
        label: 'Needs Attention',
        value: needsAttention,
        meta: `${Math.round((needsAttention / total) * 100) || 0}% of goals`,
        icon: CircleAlert,
        tone: 'orange',
      },
      { label: 'Completed', value: completed, meta: 'Finished goals', icon: CircleCheck, tone: 'green' },
    ];
  }, [goals]);

  const visibleGoals = useMemo(() => {
    if (activeTab === 'All Goals') {
      return sortGoals(goals, sortBy, goalOrderIds);
    }

    const filteredGoals = goals
      .filter((goal) => goal.status === activeTab)
      .filter((goal) => category === 'All Categories' || goal.category === category);

    return sortGoals(filteredGoals, sortBy, goalOrderIds);
  }, [activeTab, category, goalOrderIds, goals, sortBy]);

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
      description: draft.description.trim() || 'Focus for this goal',
      category: draft.category,
      target: draft.target.trim() || 'N/A',
      current: draft.current.trim() || '0%',
      progress: draft.status === 'Completed' ? 100 : Number(draft.progress) || 0,
      status: draft.status,
      dueDate: draft.dueDate || null,
    };

    try {
      if (modalMode === 'edit') {
        await updateGoalMutation.mutateAsync({ id: editingId, goalData });
        toast.success('Goal updated');
      } else {
        await createGoalMutation.mutateAsync(goalData);
      }

      setModalMode(null);
    } catch (mutationError) {
      console.error(mutationError);
      toast.error(mutationError.message || 'Could not save goal');
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

  function handleGoalDragStart(event, goalId) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', goalId);
    setGoalDragPreview(event);
    setDraggedGoalId(goalId);
    setRowMenuId(null);

    if (sortBy !== 'Custom Order') {
      setSortBy('Custom Order');
    }
  }

  function handleGoalDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  async function handleGoalDrop(event, targetGoalId) {
    event.preventDefault();

    const sourceGoalId = event.dataTransfer.getData('text/plain') || draggedGoalId;

    if (!sourceGoalId || sourceGoalId === targetGoalId) {
      setDraggedGoalId(null);
      return;
    }

    const visibleIds = visibleGoals.map(getGoalId);
    const sourceIndex = visibleIds.indexOf(sourceGoalId);
    const targetIndex = visibleIds.indexOf(targetGoalId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedGoalId(null);
      return;
    }

    const nextVisibleIds = moveItem(visibleIds, sourceIndex, targetIndex);
    const visibleIdSet = new Set(visibleIds);
    const replacements = [...nextVisibleIds];
    const sortedGoalIds = sortGoals(goals, 'Custom Order', goalOrderIds).map(getGoalId);
    const nextOrderIds = sortedGoalIds.map((goalId) => (visibleIdSet.has(goalId) ? replacements.shift() : goalId));

    setGoalOrderIds(nextOrderIds);
    setDraggedGoalId(null);

    try {
      await reorderGoalsMutation.mutateAsync(nextOrderIds);
    } catch (mutationError) {
      console.error(mutationError);
      setGoalOrderIds(sortedGoalIds);
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
        <div className='goals-empty-state goals-loading-state'>
          <span>Loading goals...</span>
          <span className='goals-loading-spinner' aria-hidden='true' />
        </div>
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
          <p>Set goals, define the focus, and become a better player.</p>
        </div>
        {goals.length > 0 && (
          <button className='goals-new-button' type='button' onClick={openNewGoalModal}>
            <Plus aria-hidden='true' />
            <span>New Goal</span>
          </button>
        )}
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
                <th>Description</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleGoals.map((goal) => (
                <GoalRow
                  goal={goal}
                  isDragging={draggedGoalId === getGoalId(goal)}
                  isMenuOpen={rowMenuId === goal._id}
                  key={goal._id}
                  onDragEnd={() => setDraggedGoalId(null)}
                  onDragOver={handleGoalDragOver}
                  onDragStart={handleGoalDragStart}
                  onDrop={handleGoalDrop}
                  onEdit={openEditGoalModal}
                  onMenuToggle={(goalId) => setRowMenuId(rowMenuId === goalId ? null : goalId)}
                  onRemove={handleRemove}
                />
              ))}
            </tbody>
          </table>
          {visibleGoals.length === 0 && (
            <div className='goals-empty-state'>
              <span className='goals-empty-state__icon'>
                <Target aria-hidden='true' />
              </span>
              <h2>No goals at the moment</h2>
              <p>Start with one clear target and track it from your dashboard.</p>
              <button className='goals-empty-state__button' type='button' onClick={openNewGoalModal}>
                <Plus aria-hidden='true' />
                <span>Add First Goal</span>
              </button>
            </div>
          )}
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
                  placeholder='Why does this goal matter, and what should you focus on?'
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
                <span>Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                  {tabs.slice(1).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
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
