import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the request is authorized
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Run the cleanup function
    const { data, error } = await supabaseClient.rpc('cleanup_expired_deleted_items')

    if (error) {
      console.error('Cleanup error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Cleanup failed', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const deletedCount = data || 0

    // Log the cleanup operation
    await supabaseClient
      .from('cleanup_logs')
      .insert({
        cleanup_type: 'scheduled_cleanup',
        items_processed: deletedCount,
        items_deleted: deletedCount,
        executed_by: null, // System operation
        metadata: {
          function_name: 'cleanup-deleted-items',
          execution_time: new Date().toISOString(),
          trigger: 'scheduled'
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        message: `Successfully cleaned up ${deletedCount} expired items`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

