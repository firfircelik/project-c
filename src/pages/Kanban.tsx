import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type TaskPriority = 'low' | 'medium' | 'high';
type TaskStage = 'new' | 'contact' | 'showing' | 'negotiation' | 'closed';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done';
  type?: string | null;
  stage: TaskStage;
  customer_id?: string | null;
  listing_id?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  created_at: string;
  priority: TaskPriority;
  price?: number | null;
  customers?: { name: string | null }[] | null;
  comments_count?: number | null;
  attachments_count?: number | null;
  users?: { full_name: string | null }[] | null;
}

interface TaskComment {
  id: string;
  message: string;
  created_at: string;
  users?: { full_name: string | null }[] | null;
}

interface TaskAttachment {
  id: string;
  title?: string | null;
  url: string;
  created_at: string;
}

const stageLabels: Record<TaskStage, string> = {
  new: 'Yeni',
  contact: 'İletişim',
  showing: 'Gösterim',
  negotiation: 'Pazarlık',
  closed: 'Sonuç (Kapanış)'
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek'
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
};

export default function Kanban() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingAttachment, setSavingAttachment] = useState(false);
  const [assignees, setAssignees] = useState<{ id: string; full_name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'new' as TaskStage,
    priority: 'medium' as TaskPriority,
    due_date: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchAssignees();
  }, [user]);

  async function fetchAssignees() {
    if (!user?.tenant_id) return;
    const { data } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('tenant_id', user.tenant_id)
      .order('full_name');
    setAssignees((data as any[])?.map((u) => ({ id: u.id, full_name: u.full_name })) || []);
  }

  async function fetchTasks() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, customers(name), users(full_name)')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (!error) {
      const normalized = ((data as any[]) || []).map((t: any) => ({
        ...t,
        priority: (t.priority || 'medium') as TaskPriority,
        stage: (t.stage || 'new') as TaskStage,
      }));
      setTasks(normalized);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    setSaving(true);
    const { error } = await supabase
      .from('tasks')
      .insert({
        tenant_id: user.tenant_id,
        title: formData.title,
        description: formData.description,
        stage: formData.stage,
        status: 'todo',
        type: 'iletişim',
        assigned_to: formData.assigned_to || user.id,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        priority: formData.priority,
      });

    setSaving(false);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', description: '', stage: 'new', priority: 'medium', due_date: '', assigned_to: '' });
      fetchTasks();
    }
  }

  async function handleAssignTask(taskId: string, assignedTo: string) {
    await supabase.from('tasks').update({ assigned_to: assignedTo }).eq('id', taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, assigned_to: assignedTo } : t));
  }

  async function updateTaskStage(id: string, stage: TaskStage) {
    await supabase.from('tasks').update({ stage }).eq('id', id);
  }

  async function openTaskDetail(task: Task) {
    setSelectedTask(task);
    setIsDetailOpen(true);
    await fetchComments(task.id);
    await fetchAttachments(task.id);
  }

  async function fetchComments(taskId: string) {
    const { data } = await supabase
      .from('tasks_comments')
      .select('id, message, created_at, users(full_name)')
      .eq('task_id', taskId)
      .eq('tenant_id', user?.tenant_id)
      .order('created_at', { ascending: false });

    setComments((data as TaskComment[]) || []);
  }

  async function fetchAttachments(taskId: string) {
    const { data } = await supabase
      .from('tasks_attachments')
      .select('id, title, url, created_at')
      .eq('task_id', taskId)
      .eq('tenant_id', user?.tenant_id)
      .order('created_at', { ascending: false });

    setAttachments((data as TaskAttachment[]) || []);
  }

  async function addComment() {
    if (!selectedTask || !commentText.trim() || !user?.tenant_id) return;
    setSavingComment(true);
    await supabase.from('tasks_comments').insert({
      tenant_id: user.tenant_id,
      task_id: selectedTask.id,
      user_id: user.id,
      message: commentText.trim(),
    });
    setCommentText('');
    await fetchComments(selectedTask.id);
    setSavingComment(false);
  }

  async function addAttachment() {
    if (!selectedTask || !attachmentUrl.trim() || !user?.tenant_id) return;
    setSavingAttachment(true);
    await supabase.from('tasks_attachments').insert({
      tenant_id: user.tenant_id,
      task_id: selectedTask.id,
      title: attachmentTitle.trim() || null,
      url: attachmentUrl.trim(),
    });
    setAttachmentTitle('');
    setAttachmentUrl('');
    await fetchAttachments(selectedTask.id);
    setSavingAttachment(false);
  }

  const columns = useMemo<Record<TaskStage, Task[]>>(() => {
    const grouped: Record<TaskStage, Task[]> = {
      new: [], contact: [], showing: [], negotiation: [], closed: []
    };

    tasks.forEach((task) => {
      grouped[task.stage || 'new'].push(task);
    });

    return grouped;
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStage = destination.droppableId as TaskStage;
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, stage: newStage } : t));
    await updateTaskStage(draggableId, newStage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış Panosu</h1>
          <p className="text-gray-500 text-sm mt-1">Sürükle bırak ile satış süreçlerinizi yönetin.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Görev
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {Object.entries(columns).map(([columnId, columnTasks]) => (
              <div key={columnId} className="bg-gray-100/80 rounded-xl w-80 flex-shrink-0 flex flex-col max-h-full">
                <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    {stageLabels[columnId as TaskStage]}
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {(columnTasks as Task[]).length}
                    </span>
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-200/50' : ''
                      }`}
                    >
                      {(columnTasks as Task[]).map((task, index) => (
                        // @ts-ignore - React 19 type issue with key
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 group hover:border-blue-300 transition-colors ${
                                snapshot.isDragging ? 'shadow-md ring-2 ring-blue-500 ring-opacity-50' : ''
                              }`}
                              onClick={() => openTaskDetail(task)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>
                                  {priorityLabels[task.priority]}
                                </span>
                                <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                              <h4 className="font-medium text-gray-900 text-sm mb-1 leading-snug">{task.title}</h4>
                              <p className="text-xs text-gray-500 mb-3">
                                {task.customers?.[0]?.name || 'Müşteri'}
                              </p>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Atanan: {task.users?.[0]?.full_name || 'Belirtilmedi'}
                              </div>

                              <div className="flex items-center justify-between text-gray-400 text-xs pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR') : 'Tarih yok'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>{task.comments_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>{task.attachments_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="p-3 border-t border-gray-200/50">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Kart Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Yeni Görev</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Kadıköy 3+1 Daire Gösterimi"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sütun</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as TaskStage })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="new">Yeni</option>
                    <option value="contact">İletişim</option>
                    <option value="showing">Gösterim</option>
                    <option value="negotiation">Pazarlık</option>
                    <option value="closed">Sonuç</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Öncelik</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="high">Yüksek</option>
                    <option value="medium">Orta</option>
                    <option value="low">Düşük</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Görev Ataması</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Kendime ata</option>
                  {assignees.map((member) => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Görev Detayı</h2>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Başlık</h3>
            <p className="text-slate-900 font-semibold mb-4">{selectedTask.title}</p>

                <h3 className="text-sm font-bold text-slate-700 mb-2">Açıklama</h3>
                <p className="text-slate-600 text-sm mb-4">{selectedTask.description || 'Açıklama yok'}</p>

            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className={`px-2 py-1 rounded-md text-xs font-bold ${priorityColors[selectedTask.priority]}`}>
                {priorityLabels[selectedTask.priority]}
              </span>
              <span>{stageLabels[selectedTask.stage]}</span>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-600 mb-1">Atanan Kişi</label>
              <select
                value={selectedTask.assigned_to || ''}
                onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Atanmadı</option>
                {assignees.map((member) => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </div>
          </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Yorumlar</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {comments.length === 0 ? (
                      <div className="text-xs text-slate-500">Henüz yorum yok.</div>
                    ) : comments.map((c) => (
                      <div key={c.id} className="bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="font-bold text-slate-700">{c.users?.[0]?.full_name || 'Sistem'}</div>
                        <div className="text-slate-600">{c.message}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Yorum yaz..."
                    />
                    <button
                      onClick={addComment}
                      disabled={savingComment}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                      {savingComment ? '...' : 'Ekle'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Ekler</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                    {attachments.length === 0 ? (
                      <div className="text-xs text-slate-500">Henüz ek yok.</div>
                    ) : attachments.map((a) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block text-xs text-indigo-600 hover:underline">
                        {a.title || a.url}
                      </a>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      value={attachmentTitle}
                      onChange={(e) => setAttachmentTitle(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Başlık (opsiyonel)"
                    />
                    <input
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                    <button
                      onClick={addAttachment}
                      disabled={savingAttachment}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                      {savingAttachment ? '...' : 'Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
