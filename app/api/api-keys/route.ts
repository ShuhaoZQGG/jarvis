import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { generateApiKey, maskApiKey, DEFAULT_PERMISSIONS } from '@/lib/api-keys'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace from query params
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Fetch API keys for the workspace
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    // Mask the keys for security
    const maskedKeys = apiKeys?.map(key => ({
      ...key,
      key: undefined,
      key_hash: undefined,
      key_display: maskApiKey(`${key.key_prefix}_${'*'.repeat(40)}`)
    }))

    return NextResponse.json({ apiKeys: maskedKeys || [] })
  } catch (error) {
    console.error('Error in GET /api/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, name, permissions = DEFAULT_PERMISSIONS, expires_at } = body

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'Workspace ID and name are required' }, { status: 400 })
    }

    // Verify user owns the workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 403 })
    }

    // Generate new API key
    const { key, hash } = generateApiKey()
    const prefix = key.split('_')[0]

    // Store the API key (hash only, never store the actual key)
    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        workspace_id,
        user_id: user.id,
        name,
        key_prefix: prefix,
        key_hash: hash,
        permissions,
        expires_at,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating API key:', insertError)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    // Return the full key only once (user must save it)
    return NextResponse.json({
      apiKey: {
        ...apiKey,
        key, // Full key shown only on creation
        key_hash: undefined
      },
      message: 'Save this API key securely. It will not be shown again.'
    })
  } catch (error) {
    console.error('Error in POST /api/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keyId = request.nextUrl.searchParams.get('id')
    if (!keyId) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 })
    }

    // Delete the API key (RLS will ensure user owns it)
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}