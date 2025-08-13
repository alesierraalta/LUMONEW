import { NextRequest, NextResponse } from 'next/server'
import { impTasksService } from '@/lib/imp-tasks-service'

// POST /api/imp-tasks/[id]/work-data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const body = await request.json()
    
    const {
      executionDate,
      executedBy,
      executedById,
      notes,
      specificData
    } = body

    if (!taskId || !executionDate || !executedById) {
      return NextResponse.json(
        { success: false, error: 'taskId, executionDate, and executedById are required' },
        { status: 400 }
      )
    }

    // Guardar los datos específicos de trabajo en la base de datos
    // Primero, actualizar la tarea con los datos de ejecución
    await impTasksService.updateWorkData(taskId, {
      executionDate,
      executedBy,
      executedById,
      notes,
      specificData,
      completedAt: new Date().toISOString()
    })

    // Agregar una entrada al historial
    await impTasksService.addHistoryEntry(
      taskId,
      'work_completed',
      null,
      'completed',
      `Trabajo completado por ${executedBy}. ${notes || ''}`,
      executedById
    )

    // Agregar nota con los datos específicos
    if (specificData && Object.keys(specificData).length > 0) {
      const dataNote = `Datos registrados: ${JSON.stringify(specificData, null, 2)}`
      await impTasksService.addNote(taskId, dataNote, executedById)
    }

    return NextResponse.json({
      success: true,
      message: 'Work data saved successfully'
    })

  } catch (error) {
    console.error('Error in work-data POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// (duplicate POST removed)