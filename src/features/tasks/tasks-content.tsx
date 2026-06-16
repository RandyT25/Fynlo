'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ListChecks, Check, Trash2, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Task, Priority } from '@/types/database'

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#22C55E', medium: '#F59E0B', high: '#F97316', urgent: '#EF4444',
}

export function TasksContent() {
  const { user, isLoading: authLoading } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', priority: 'medium' as Priority, category: '' })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' as Priority, category: '' })
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('tasks').select('*').is('deleted_at', null).order('is_completed').order('due_date', { nullsFirst: false }).order('created_at', { ascending: false })
    setTasks(data ?? [])
    setIsLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (authLoading) return; if (!user) { setIsLoading(false); return }; fetchTasks() }, [fetchTasks, authLoading, user?.id])

  const addTask = async () => {
    if (!newTask.title.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('tasks').insert({ ...newTask, user_id: user.id, due_date: newTask.due_date || null })
    if (error) { toast.error(error.message); return }
    toast.success('Task added')
    setShowForm(false)
    setNewTask({ title: '', description: '', due_date: '', priority: 'medium', category: '' })
    fetchTasks()
  }

  const toggleTask = async (task: Task) => {
    await supabase.from('tasks').update({ is_completed: !task.is_completed, completed_at: !task.is_completed ? new Date().toISOString() : null }).eq('id', task.id)
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Task deleted')
    fetchTasks()
  }

  const openEdit = (task: Task) => {
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      due_date: task.due_date ?? '',
      priority: task.priority,
      category: task.category ?? '',
    })
    setEditTask(task)
  }

  const saveEdit = async () => {
    if (!editTask || !editForm.title.trim()) return
    const { error } = await supabase.from('tasks').update({
      title: editForm.title,
      description: editForm.description || null,
      due_date: editForm.due_date || null,
      priority: editForm.priority,
      category: editForm.category || null,
    }).eq('id', editTask.id)
    if (error) { toast.error(error.message); return }
    toast.success('Task updated')
    setEditTask(null)
    fetchTasks()
  }

  const pending = tasks.filter(t => !t.is_completed)
  const done = tasks.filter(t => t.is_completed)

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
            <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>New Task</SheetTitle></SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="e.g., Pay credit card bill" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v as Priority }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
                <Button onClick={addTask} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold">Add Task</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks" description="Tap 'Add Task' above to create a reminder" />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending ({pending.length})</h2>
              {pending.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="card-hover">
                    <CardContent className="p-4 flex items-center gap-3">
                      <button
                        onClick={() => toggleTask(task)}
                        className="w-5 h-5 rounded-full border-2 border-border hover:border-primary transition-colors shrink-0 flex items-center justify-center"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                          <span className="text-[10px] text-muted-foreground capitalize">{task.priority}</span>
                          {task.due_date && <span className="text-[10px] text-muted-foreground">Due {formatDate(task.due_date)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => openEdit(task)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2 opacity-60">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed ({done.length})</h2>
              {done.map(task => (
                <Card key={task.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <button onClick={() => toggleTask(task)} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <p className="text-sm line-through text-muted-foreground flex-1">{task.title}</p>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      <Sheet open={!!editTask} onOpenChange={open => !open && setEditTask(null)}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>Edit Task</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input placeholder="e.g., Pay credit card bill" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm(p => ({ ...p, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditTask(null)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
              <Button onClick={saveEdit} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold">Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
