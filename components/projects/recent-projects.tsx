import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Eye, Calendar, Clock } from 'lucide-react'
import { Project } from '@/lib/types'
import { projectService } from '@/lib/database'
import { formatDate } from '@/lib/utils'

interface RecentProjectsProps {
  onSelectProject: (project: Project) => void
}

export function RecentProjects({ onSelectProject }: RecentProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentProjects()
  }, [])

  const fetchRecentProjects = async () => {
    setLoading(true)
    try {
      const recent = await projectService.getAll()
      // Sort by updated_at descending and take first 5
      const sortedProjects = recent
        .sort((a: Project, b: Project) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
      setProjects(sortedProjects)
    } catch (error) {
      console.error('Error fetching recent projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500 text-white'
      case 'completed': return 'bg-green-500 text-white'
      case 'on_hold': return 'bg-yellow-500 text-white'
      case 'cancelled': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Proyectos Recientes</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Proyectos Recientes</h3>
      <div className="space-y-4">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:dark:bg-gray-800 transition-colors">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{project.name}</h4>
              <p className="text-sm text-secondary mb-2 line-clamp-1">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-soft">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
            </div>
            <div className="ml-4 text-right">
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted-soft">{project.progress || 0}%</span>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-secondary">No hay proyectos recientes.</p>
            <p className="text-sm text-muted-soft mt-1">Los proyectos aparecerán aquí cuando los crees.</p>
          </div>
        )}
      </div>
    </Card>
  )
} 