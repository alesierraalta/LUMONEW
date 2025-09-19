import { NextRequest, NextResponse } from 'next/server';
import { deletedItemsService } from '@/lib/services/deleted-items-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bulkRecoverSchema = z.object({
  item_ids: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_ids, reason } = bulkRecoverSchema.parse(body);

    const result = await deletedItemsService.bulkRecoverItems(item_ids, reason);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk recovering items:', error);
    
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

