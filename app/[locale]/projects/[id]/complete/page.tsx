'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, ArrowLeft, CheckCircle } from 'lucide-react'

interface PageProps {
  params: { id: string; locale: string }
}

interface PendingTaskItem {
  id: string
  title: string
  status: string
  stepKey?: string
  workflowItemId: string
  productName: string
  productType: 'CL' | 'IMP'
}

export default function CompleteProjectPage({ params }: PageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [pendingTasks, setPendingTasks] = useState<PendingTaskItem[]>([])
  const [isFinishing, setIsFinishing] = useState(false)

  const currentUser = useMemo(() => ({ id: '00000000-0000-0000-0000-000000000000' }), [])

  useEffect(() => {
    void initialize()
  }, [params.id])

  async function initialize() {
    try {
      setLoading(true)
      const projectRes = await fetch(`/api/projects/${params.id}`)
      const projectJson = await projectRes.json()
      if (!projectJson?.success) throw new Error('No se pudo cargar el proyecto')
      setProject(projectJson.data)

      const wfItems: any[] = projectJson.data?.workflow_items || []
      const pending: PendingTaskItem[] = []
      const reqs: Promise<void>[] = []
      for (const wf of wfItems) {
        if (wf.product_type !== 'CL' && wf.product_type !== 'IMP') continue
        const endpoint = wf.product_type === 'CL' ? '/api/cl-tasks' : '/api/imp-tasks'
        reqs.push(
          fetch(`${endpoint}?workflowItemId=${encodeURIComponent(wf.id)}`)
            .then(r => r.json())
            .then(j => {
              if (!j?.success || !Array.isArray(j?.data)) return
              const inc = j.data.filter((t: any) => t.status !== 'completed')
              inc.forEach((t: any) => {
                pending.push({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  stepKey: t.stepKey,
                  workflowItemId: t.workflowItemId || wf.id,
                  productName: wf.product_name,
                  productType: wf.product_type
                })
              })
            })
            .catch(() => {})
        )
      }
      await Promise.all(reqs)
      setPendingTasks(pending)
    } catch (e) {
      console.error(e)
      router.push(`/${params.locale}/projects/${params.id}`)
    } finally {
      setLoading(false)
    }
  }

  async function completeAllTasksAndFinish() {
    if (!project) return
    setIsFinishing(true)
    try {
      const updates: Promise<any>[] = []
      for (const t of pendingTasks) {
        if (t.productType === 'CL') {
          updates.push(
            fetch(`/api/cl-tasks/${encodeURIComponent(t.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed' })
            }).then(res => (res.ok ? res.json() : Promise.reject(res.status)))
          )
        } else {
          updates.push(
            fetch(`/api/imp-tasks/${encodeURIComponent(t.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed', updatedBy: currentUser.id })
            }).then(res => (res.ok ? res.json() : Promise.reject(res.status)))
          )
        }
      }
      await Promise.allSettled(updates)

      await finishProject()
    } catch (e) {
      console.error(e)
      alert('No se pudo completar el proyecto')
    } finally {
      setIsFinishing(false)
    }
  }

  async function finishProject() {
    if (!project) return
    const res = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: project.id, status: 'completed', actualEndDate: new Date().toISOString() })
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok || !j?.success) throw new Error(j?.error || 'Error al terminar el proyecto')
    alert('Proyecto marcado como completado')
    router.push(`/${params.locale}/projects/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cargando…</h2>
        </div>
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${params.locale}/projects/${params.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al proyecto
        </Button>
      </div>

      <Card className="shadow-sm md:shadow-lg">
        <CardHeader>
          <CardTitle>Finalizar proyecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingTasks.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Se detectaron tareas pendientes. Revisa la lista y elige cómo proceder.
              </p>
              <div className="rounded-md border border-border bg-muted/40 p-3 md:p-4">
                <div className="font-medium mb-2">Tareas faltantes ({pendingTasks.length})</div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {pendingTasks.map(t => (
                    <div key={t.id} className="flex items-start justify-between p-2 rounded bg-card border border-border">
                      <div className="min-w-0 pr-3">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.productType} · {t.productName} · {t.stepKey || 'paso'} · estado: {t.status}
                        </div>
                      </div>
                      <Badge variant="outline" className={t.productType === 'CL' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-purple-700 border-purple-200 bg-purple-50'}>
                        {t.productType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => router.push(`/${params.locale}/projects/${params.id}`)}>
                  Cancelar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={completeAllTasksAndFinish} disabled={isFinishing}>
                  {isFinishing ? 'Procesando…' : 'Completar todas y terminar'}
                </Button>
                <Button variant="destructive" onClick={finishProject} disabled={isFinishing}>
                  {isFinishing ? 'Procesando…' : 'Terminar igual'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Terminar igual marcará el proyecto como completado dejando tareas pendientes sin cambios.
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No hay tareas pendientes. Puedes terminar el proyecto.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push(`/${params.locale}/projects/${params.id}`)}>
                  Cancelar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={finishProject}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Terminar proyecto
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



