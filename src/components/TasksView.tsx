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
  Calendar,
  User as UserIcon,
  Search,
  X,
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
  currentTheme,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
}) => {
  const activeColor = currentTheme?.hex || '#635bff';
  const [filterStatus, setFilterStatus] = useState<string>('All');
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
      <div className="stripe-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: activeColor }}
          >
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a2540] dark:text-white">
              Team To-Do List
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300 mt-1">
              Give daily jobs to drivers, mechanics, and office staff so nothing gets forgotten.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity shrink-0"
          style={{ backgroundColor: activeColor }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Job</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Waiting</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{openCount}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Not started yet</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Doing Now</span>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">{inProgressCount}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Team working on it</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Urgent</span>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{urgentCount}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Needs quick action</span>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-sm font-semibold text-[#425466] dark:text-slate-400">Done</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{completedCount}</div>
          <span className="text-sm text-[#425466] dark:text-slate-400">Finished jobs</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="stripe-card flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#0a2540] dark:text-slate-200 rounded-xl p-2.5 font-medium"
          >
            <option value="All">All Jobs ({tasks.length})</option>
            <option value="Open">Waiting</option>
            <option value="In Progress">Doing Now</option>
            <option value="Completed">Done</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#0a2540] dark:text-slate-200 rounded-xl p-2.5 font-medium"
          >
            <option value="All">All Speeds</option>
            <option value="Urgent">Urgent</option>
            <option value="High">Important</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search job or person..."
            className="w-full pl-10 pr-3 py-2.5 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-[#0a2540] dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
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
              className={`stripe-card p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDone
                  ? 'border-slate-200 dark:border-slate-800 opacity-65'
                  : isUrgent
                  ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-500/5'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                      isUrgent
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                        : isHigh
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-300'
                    }`}
                  >
                    {t.priority === 'High' ? 'Important' : t.priority}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                      t.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : t.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    }`}
                  >
                    {t.status === 'Open' ? 'Waiting' : t.status === 'In Progress' ? 'Doing Now' : 'Done'}
                  </span>

                  {relatedVeh && (
                    <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                      [{relatedVeh.plate_number}]
                    </span>
                  )}
                </div>

                <h3
                  className={`text-base font-bold text-[#0a2540] dark:text-white ${
                    isDone ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {t.title}
                </h3>

                {t.description && (
                  <p className="text-sm text-[#425466] dark:text-slate-400">{t.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#425466] dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>
                      For: <strong className="text-[#0a2540] dark:text-slate-200">{t.assigned_to_name}</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      By: <strong className="text-[#0a2540] dark:text-slate-200 font-mono">{t.due_date}</strong>
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {t.status === 'Open' && (
                  <button
                    onClick={() => onUpdateStatus(t.id, 'In Progress')}
                    className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-sm font-bold transition-colors"
                  >
                    Start
                  </button>
                )}

                {t.status !== 'Completed' && (
                  <button
                    onClick={() => onUpdateStatus(t.id, 'Completed')}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors shadow-xs"
                  >
                    Mark Done ✓
                  </button>
                )}

                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-[#0a2540] dark:text-white">All Jobs Done</h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              No open jobs match your filter right now.
            </p>
          </div>
        )}
      </div>

      {/* Modal: New Job */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 bg-[#f6f9fc] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Add Team Job</h2>
                  <span className="text-sm text-[#425466] dark:text-slate-400">
                    Pick a person and set a due date
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Check headlights on RAC 812 K before inspection"
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Details</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write what needs to be done or where to go..."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Who Does It</label>
                  <select
                    value={assignedName}
                    onChange={(e) => handleSelectStaff(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">How Urgent</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#0a2540] dark:text-slate-200 font-bold mb-1">Car (Optional)</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[#0a2540] dark:text-white font-medium"
                  >
                    <option value="">No specific car</option>
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
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-white font-bold shadow-sm"
                  style={{ backgroundColor: activeColor }}
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
