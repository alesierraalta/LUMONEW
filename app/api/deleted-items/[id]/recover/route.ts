import { NextRequest, NextResponse } from 'next/server';
import { deletedItemsService } from '@/lib/services/deleted-items-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const recoverSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = recoverSchema.parse(body);

    const success = await deletedItemsService.recoverItem(params.id, reason);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Item recovered successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to recover item' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error recovering item:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

