import { NextRequest, NextResponse } from 'next/server';
import { DeletedItemsService } from '@/lib/services/deleted-items-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new DeletedItemsService(supabase);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching deleted items stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

