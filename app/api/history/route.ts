import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les paramètres de pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search');

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Construire la requête
    let query = supabase
      .from('search_history')
      .select(`
        id,
        created_at,
        query,
        title,
        summary,
        historical_context,
        anecdote,
        exposition,
        sources,
        images,
        keywords,
        model_info
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Ajouter la recherche textuelle si nécessaire
    if (search) {
      query = query.textSearch('query', search);
    }

    // Ajouter la pagination
    const { data: history, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      history,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Supprimer une entrée spécifique
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } else {
      // Supprimer tout l'historique de l'utilisateur
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }, { status: 500 });
  }
} 