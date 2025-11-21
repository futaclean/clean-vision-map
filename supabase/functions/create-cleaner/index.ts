import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    // Verify the caller is an admin using the anon key client
    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's token to verify auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Unauthorized - Invalid user token');
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError) {
      console.error('Role check error:', roleError);
      throw new Error('Error checking admin role');
    }

    if (!roleData) {
      console.error('User is not an admin:', user.id);
      throw new Error('User is not an admin');
    }

    console.log('Admin verified:', user.id);

    // Get request body
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      throw new Error('Missing required fields: email, password, full_name');
    }

    // Create the user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name
      }
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('Failed to create user');
    }

    // Create profile (if not created by trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name,
        email
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw - profile might be created by trigger
    }

    // Assign cleaner role using service role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'cleaner'
      });

    if (roleInsertError) {
      throw roleInsertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-cleaner function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred creating the cleaner';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
