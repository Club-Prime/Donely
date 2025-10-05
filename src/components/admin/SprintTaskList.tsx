// Arquivo removido para compatibilidade com banco atual
import { useSprintTaskCRUD, SprintTask } from '@/hooks/useSprintTaskCRUD';

interface SprintTaskListProps {
  sprintId: string;
}

export const SprintTaskList: React.FC<SprintTaskListProps> = ({ sprintId }) => {
  const { tasks, loading, loadTasks, createTask, updateTask, deleteTask, reorderTasks } = useSprintTaskCRUD(sprintId);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDesc, setNewTaskDesc] = React.useState('');

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({ title: newTaskTitle, description: newTaskDesc, status: 'TODO' });
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  // Simple drag & drop handlers
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDrop = (id: string) => {
    if (draggedId && draggedId !== id) {
      const ids = [...tasks.map(t => t.id)];
      const from = ids.indexOf(draggedId);
      const to = ids.indexOf(id);
      ids.splice(from, 1);
      ids.splice(to, 0, draggedId);
      reorderTasks(ids);
    }
    setDraggedId(null);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Nova tarefa" />
        <Input value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Descrição" />
        <Button onClick={handleAdd} disabled={loading}>Adicionar</Button>
      </div>
      <ul>
        {tasks.map(task => (
          <li key={task.id}
              draggable
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(task.id)}
              className="flex items-center gap-2 border p-2 mb-1 bg-white rounded shadow-sm cursor-move">
            <span className="flex-1 font-medium">{task.title}</span>
            <span className="text-xs text-gray-500">{task.status}</span>
            <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' })}>
              {task.status === 'DONE' ? 'Reabrir' : 'Concluir'}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteTask(task.id)}>Excluir</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
