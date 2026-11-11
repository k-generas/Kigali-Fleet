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
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Car,
  Filter,
  Search,
  ArrowRight,
  X,
  ShieldAlert,
} from 'lucide-react';

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
  bookings,
  currentUser,
  currentTheme,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Form State
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
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
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
  }, [tasks, filterStatus, filterPriority, searchTerm]);

  const openCount = tasks.filter((t) => t.status === 'Open').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Operational Duty & Tasks Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Field coordination for Contrôle Technique, airport pickups, insurance renewal & maintenance prep.
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Assign Operational Task</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Open Tasks
          </span>
          <div className="text-2xl font-black text-amber-500">{openCount}</div>
          <span className="text-[11px] text-slate-500">Awaiting Action</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            In Progress
          </span>
          <div className="text-2xl font-black text-sky-500">{inProgressCount}</div>
          <span className="text-[11px] text-slate-500">Field Execution</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Urgent Priorities
          </span>
          <div className="text-2xl font-black text-red-500">{urgentCount}</div>
          <span className="text-[11px] text-slate-500">Immediate Attention</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Resolved
          </span>
          <div className="text-2xl font-black text-emerald-500">{completedCount}</div>
          <span className="text-[11px] text-slate-500">100% Completed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg p-2 font-medium"
          >
            <option value="All">All Statuses ({tasks.length})</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg p-2 font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search task or staff member..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const isUrgent = t.priority === 'Urgent';
          const isHigh = t.priority === 'High';
          const isDone = t.status === 'Completed';
          const relatedVeh = vehicles.find((v) => v.id === t.related_vehicle_id);

          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                isDone
                  ? 'border-slate-200 dark:border-slate-800 opacity-60'
                  : isUrgent
                  ? 'border-red-500/40 bg-red-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isUrgent
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                        : isHigh
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.priority}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : t.status === 'In Progress'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {t.status}
                  </span>

                  {relatedVeh && (
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      [{relatedVeh.plate_number}]
                    </span>
                  )}
                </div>

                <h3
                  className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-white ${
                    isDone ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {t.title}
                </h3>

                {t.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    <span>Assigned: <strong className="text-slate-700 dark:text-slate-300">{t.assigned_to_name}</strong> ({t.assigned_to_role || 'Staff'})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Due: <strong className="text-slate-700 dark:text-slate-300">{t.due_date}</strong></span>
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {t.status === 'Open' && (
                  <button
                    onClick={() => onUpdateStatus(t.id, 'In Progress')}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-colors"
                  >
                    Start Task
                  </button>
                )}

                {t.status !== 'Completed' && (
                  <button
                    onClick={() => onUpdateStatus(t.id, 'Completed')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                  >
                    Mark Done ✓
                  </button>
                )}

                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Remove Task"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              All Tasks Cleared
            </h3>
            <p className="text-xs text-slate-500">
              No tasks match your current filter. Keep up the high standard!
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: CREATE NEW OPERATIONAL TASK
      ========================================================================= */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 sm:px-6 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Create Operational Duty Task
                  </h2>
                  <span className="text-xs text-slate-500">
                    Assign duties to mechanics, dispatchers or front desk
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Calibrate headlights for RAC 812 K before Contrôle Technique"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Description / Specific Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details on what must be verified, parts required or meeting location..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Assign To Staff Member
                  </label>
                  <select
                    value={assignedName}
                    onChange={(e) => handleSelectStaff(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Related Vehicle (Optional)
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">None (General Operational)</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md transition-transform active:scale-95"
                >
                  Assign Duty Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
