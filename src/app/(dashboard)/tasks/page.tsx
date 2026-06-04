import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { TasksContent } from '@/features/tasks/tasks-content'
export const metadata: Metadata = { title: 'Tasks' }
export default function TasksPage() {
  return <AppLayout title="Tasks" subtitle="Financial to-dos and reminders"><TasksContent /></AppLayout>
}
