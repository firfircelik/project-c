import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip } from 'lucide-react';

// Types
type Task = {
  id: string;
  title: string;
  client: string;
  price: string;
  date: string;
  comments: number;
  attachments: number;
  priority: 'low' | 'medium' | 'high';
};

type Column = {
  id: string;
  title: string;
  taskIds: string[];
};

type Data = {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

// Initial Data
const initialData: Data = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Kadıköy 3+1 Daire Gösterimi', client: 'Ayşe Yılmaz', price: '12.5M ₺', date: 'Bugün', comments: 2, attachments: 1, priority: 'high' },
    'task-2': { id: 'task-2', title: 'Beşiktaş Ofis Kiralama Sözleşmesi', client: 'Tech Corp', price: '85K ₺', date: 'Yarın', comments: 0, attachments: 3, priority: 'medium' },
    'task-3': { id: 'task-3', title: 'Bodrum Villa Fiyat Teklifi', client: 'Mehmet Demir', price: '45M ₺', date: '28 Oca', comments: 5, attachments: 2, priority: 'high' },
    'task-4': { id: 'task-4', title: 'Şişli 1+1 Yeni Kayıt', client: 'Zeynep Kaya', price: '8.2M ₺', date: '30 Oca', comments: 1, attachments: 0, priority: 'low' },
    'task-5': { id: 'task-5', title: 'Ataşehir Dükkan Pazarlık', client: 'Ali Veli', price: '15M ₺', date: 'Bugün', comments: 8, attachments: 4, priority: 'high' },
  },
  columns: {
    'col-1': { id: 'col-1', title: 'Yeni', taskIds: ['task-4'] },
    'col-2': { id: 'col-2', title: 'İletişim', taskIds: ['task-3'] },
    'col-3': { id: 'col-3', title: 'Gösterim', taskIds: ['task-1'] },
    'col-4': { id: 'col-4', title: 'Pazarlık', taskIds: ['task-5'] },
    'col-5': { id: 'col-5', title: 'Sonuç (Kapanış)', taskIds: ['task-2'] },
  },
  columnOrder: ['col-1', 'col-2', 'col-3', 'col-4', 'col-5'],
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function Kanban() {
  const [data, setData] = useState(initialData);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış Panosu</h1>
          <p className="text-gray-500 text-sm mt-1">Sürükle bırak ile satış süreçlerinizi yönetin.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Yeni Görev
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div key={column.id} className="bg-gray-100/80 rounded-xl w-80 flex-shrink-0 flex flex-col max-h-full">
                  <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      {column.title}
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {tasks.length}
                      </span>
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-gray-200/50' : ''
                        }`}
                      >
                        {tasks.map((task, index) => (
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
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>
                                    {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                  </span>
                                  <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm mb-1 leading-snug">{task.title}</h4>
                                <p className="text-xs text-gray-500 mb-3">{task.client} • {task.price}</p>
                                
                                <div className="flex items-center justify-between text-gray-400 text-xs pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className={task.date === 'Bugün' ? 'text-red-500 font-medium' : ''}>{task.date}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {task.comments > 0 && (
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>{task.comments}</span>
                                      </div>
                                    )}
                                    {task.attachments > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>{task.attachments}</span>
                                      </div>
                                    )}
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
                    <button className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" />
                      Kart Ekle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
