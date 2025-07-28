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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-base">{project.name}</h4>
                <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Creado: {project.createdAt ? formatDate(new Date(project.createdAt)) : 'N/A'}</span>
                </div>
                {project.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Actualizado: {formatDate(new Date(project.updatedAt))}</span>
                  </div>
                )}
                <span>Items: {project.totalItems || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16">
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
                <span className="text-xs text-gray-500">{project.progress || 0}%</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectProject(project)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay proyectos recientes.</p>
            <p className="text-sm text-gray-400 mt-1">Los proyectos aparecerán aquí cuando los crees.</p>
          </div>
        )}
      </div>
    </Card>
  )
} 