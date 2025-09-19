import { NextRequest, NextResponse } from 'next/server';
import { deletedItemsService } from '@/lib/services/deleted-items-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tables = await deletedItemsService.getAvailableTables();

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching available tables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

