import { NextRequest, NextResponse } from 'next/server';
import { DeletedItemsService } from '@/lib/services/deleted-items-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const getDeletedItemsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  table_name: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (search) {
      // Handle search request
      const params = searchSchema.parse({
        query: search,
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
      });

      const service = new DeletedItemsService(supabase);
      const result = await service.searchDeletedItems(
        params.query,
        params.limit,
        params.offset
      );

      return NextResponse.json(result);
    } else {
      // Handle regular get request
      const params = getDeletedItemsSchema.parse({
        limit: searchParams.get('limit') || undefined,
        offset: searchParams.get('offset') || undefined,
        table_name: searchParams.get('table_name') || undefined,
        user_id: searchParams.get('user_id') || undefined,
      });

      const service = new DeletedItemsService(supabase);
      const result = await service.getDeletedItems(params);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching deleted items:', error);
    
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

