import React, { useState, useMemo } from 'react';
import {
  OperationalTask,
  TaskPriority,
  TaskStatus,
  UserRole,
  User,
  Vehicle,
  Booking,
} from '../types';
import { ColorTheme } from '../theme';
import { formatDueStatus } from '../utils/dates';
import { useI18n } from '../utils/i18n';
import { Plus, Search, Check, ListTodo, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface TasksViewProps {
  tasks: OperationalTask[];
  users: User[];
  vehicles: Vehicle[];
  bookings: Booking[];
  currentUser?: User;
  currentTheme?: ColorTheme;
  onAddTask: (task: Omit<OperationalTask, 'id' | 'created_at'>) => OperationalTask;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  users,
  vehicles,
  currentUser,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
}) => {
  const { tr } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'mine' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedName, setAssignedName] = useState(users[0]?.name || '');
  const [assignedRole, setAssignedRole] = useState<UserRole>(users[0]?.role || 'dispatcher');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [vehicleId, setVehicleId] = useState('');

  const handleSelectStaff = (userName: string) => {
    setAssignedName(userName);
    const u = users.find((user) => user.name === userName);
    if (u) {
      setAssignedRole(u.role);
    }
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to_name: assignedName,
      assigned_to_role: assignedRole,
      due_date: dueDate,
      priority,
      status: 'Open',
      related_vehicle_id: vehicleId || undefined,
    });

    setIsNewTaskOpen(false);
    setTitle('');
    setDescription('');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeTab === 'urgent' && (t.priority !== 'Urgent' || t.status === 'Completed')) return false;
      if (activeTab === 'mine' && currentUser && t.assigned_to_name !== currentUser.name) return false;
      if (activeTab === 'done' && t.status !== 'Completed') return false;
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.assigned_to_name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, activeTab, currentUser, filterPriority, searchTerm]);

  const doingNow = useMemo(
    () => filteredTasks.filter((t) => t.status === 'In Progress'),
    [filteredTasks]
  );
  const waiting = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Open'),
    [filteredTasks]
  );
  const doneList = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Completed'),
    [filteredTasks]
  );

  const openCount = tasks.filter((t) => t.status === 'Open').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Completed').length;

  const renderTaskRow = (t: OperationalTask) => {
    const isDone = t.status === 'Completed';
    const relatedVeh = vehicles.find((v) => v.id === t.related_vehicle_id);
    const dueInfo = formatDueStatus(t.due_date);

    return (
      <div
        key={t.id}
        className={`grid grid-cols-[24px_1fr_auto] gap-3.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70 items-start transition-colors ${
          isDone ? 'opacity-65 bg-slate-50/40 dark:bg-slate-900/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
        }`}
      >
        <button
          type="button"
          onClick={() => onUpdateStatus(t.id, isDone ? 'Open' : 'Completed')}
          aria-label={isDone ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
          className={`w-5 h-5 mt-0.5 border rounded-md flex items-center justify-center transition-colors ${
            isDone
              ? 'accent-bg border-transparent'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] hover:border-slate-400'
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        <div className="min-w-0">
          <div
            className={`text-sm font-medium text-slate-900 dark:text-white flex flex-wrap items-center gap-2 ${
              isDone ? 'line-through text-slate-500 dark:text-slate-400' : ''
            }`}
          >
            <span>{t.title}</span>
            {relatedVeh && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300 no-underline">
                {relatedVeh.plate_number}
              </span>
            )}
          </div>
          {t.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.description}
            </div>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {tr('For')} {t.assigned_to_name}
            </span>
            {t.status === 'Open' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(t.id, 'In Progress')}
                className="accent-text font-medium hover:underline"
              >
                {tr('Start')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDeleteTask(t.id)}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            >
              {tr('Remove')}
            </button>
          </div>
        </div>

        <div className="text-right text-xs whitespace-nowrap">
          {!isDone && dueInfo.isLate ? (
            <div className="text-rose-600 dark:text-rose-400 font-medium tabular-nums">
              {dueInfo.text}
            </div>
          ) : (
            <div className="text-slate-500 dark:text-slate-400 tabular-nums">{dueInfo.text}</div>
          )}

          {t.priority === 'Urgent' && !isDone && (
            <div className="text-rose-600 dark:text-rose-400 font-semibold mt-1">{tr('Urgent')}</div>
          )}
          {t.priority === 'High' && !isDone && (
            <div className="text-amber-600 dark:text-amber-400 font-semibold mt-1">{tr('Important')}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {tr('Team to-do list')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tr('Give daily jobs to drivers, mechanics, and office staff so nothing gets forgotten.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTaskOpen(true)}
          className="accent-bg inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Add job')}</span>
        </button>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Waiting')}</span>
            <span className="w-9 h-9 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">
            {openCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Jobs queued to start
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Doing now')}</span>
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ListTodo className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-2 tabular-nums">
            {inProgressCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Currently in progress
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Urgent')}</span>
            <span className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            {urgentCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            High-priority tasks open
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 kf-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Done')}</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {completedCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Completed team tasks
          </p>
        </div>
      </div>

      {/* Checklist Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden kf-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'all', label: `${tr('All jobs')} (${tasks.length})` },
              { id: 'urgent', label: `${tr('Urgent')} (${urgentCount})` },
              ...(currentUser ? [{ id: 'mine', label: tr('Mine') }] : []),
              { id: 'done', label: `${tr('Done')} (${completedCount})` },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="All">{tr('All speeds')}</option>
              <option value="Urgent">{tr('Urgent')}</option>
              <option value="High">{tr('Important')}</option>
              <option value="Normal">{tr('Normal')}</option>
              <option value="Low">{tr('Low')}</option>
            </select>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tr('Search job or person')}
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-[#0f172a] focus:border-slate-400 dark:focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Grouped Checklist */}
        {filteredTasks.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{tr('All jobs done')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr('No open jobs match your filter right now.')}
            </p>
          </div>
        ) : (
          <div>
            {doingNow.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {tr('Doing now')}
                </div>
                {doingNow.map(renderTaskRow)}
              </div>
            )}

            {waiting.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {tr('Waiting')}
                </div>
                {waiting.map(renderTaskRow)}
              </div>
            )}

            {doneList.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {tr('Done')}
                </div>
                {doneList.map(renderTaskRow)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: New Job */}
      <ModalShell
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        maxWidthClass="max-w-lg"
        asForm
        onSubmit={handleSubmitTask}
        title={tr('Add team job')}
        subtitle={tr('Pick a person and set a due date')}
        bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              className="accent-bg px-4 py-2 rounded-lg font-medium shadow-xs cursor-pointer"
            >
              {tr('Save job')}
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
            {tr('Job title')} *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tr('e.g. Check headlights on RAC 812 K before inspection')}
            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
            {tr('Details')}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tr('Write what needs to be done or where to go...')}
            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
              {tr('Who does it')}
            </label>
            <select
              value={assignedName}
              onChange={(e) => handleSelectStaff(e.target.value)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
              {tr('Due date')}
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
              {tr('How urgent')}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="Low">{tr('Low')}</option>
              <option value="Normal">{tr('Normal')}</option>
              <option value="High">{tr('Important')}</option>
              <option value="Urgent">{tr('Urgent')}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
              {tr('Car (optional)')}
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="">{tr('No specific car')}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.model_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
