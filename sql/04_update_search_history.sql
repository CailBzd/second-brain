-- Ajout de la politique de mise à jour pour search_history
CREATE POLICY "Users can update their own search history"
    ON search_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Ajout d'un trigger pour mettre à jour automatiquement les champs JSON
CREATE OR REPLACE FUNCTION merge_search_history() RETURNS trigger AS $$
BEGIN
    -- Si une entrée existe déjà pour cette requête et cet utilisateur
    IF EXISTS (
        SELECT 1 FROM search_history 
        WHERE user_id = NEW.user_id 
        AND query = NEW.query 
        AND id != NEW.id
    ) THEN
        -- Mettre à jour l'entrée existante avec les nouvelles données
        UPDATE search_history
        SET 
            title = COALESCE(NEW.title, search_history.title),
            summary = COALESCE(NEW.summary, search_history.summary),
            historical_context = COALESCE(NEW.historical_context, search_history.historical_context),
            anecdote = COALESCE(NEW.anecdote, search_history.anecdote),
            exposition = COALESCE(NEW.exposition, search_history.exposition),
            sources = COALESCE(NEW.sources, search_history.sources),
            images = COALESCE(NEW.images, search_history.images),
            keywords = COALESCE(NEW.keywords, search_history.keywords),
            model_info = COALESCE(NEW.model_info, search_history.model_info)
        WHERE user_id = NEW.user_id 
        AND query = NEW.query
        AND id != NEW.id;
        
        -- Ne pas insérer la nouvelle ligne
        RETURN NULL;
    END IF;
    
    -- Si aucune entrée n'existe, insérer la nouvelle ligne
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la fusion automatique
DROP TRIGGER IF EXISTS search_history_merge_trigger ON search_history;
CREATE TRIGGER search_history_merge_trigger
    BEFORE INSERT ON search_history
    FOR EACH ROW
    EXECUTE FUNCTION merge_search_history();

-- Ajout d'un index sur la combinaison user_id et query pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_search_history_user_query 
ON search_history(user_id, query);

-- Ajout d'un index GIN sur le champ exposition pour la recherche dans le contenu JSON
CREATE INDEX IF NOT EXISTS idx_search_history_exposition 
ON search_history USING GIN (exposition);

-- Ajout d'un index GIN sur le champ sources pour la recherche dans le contenu JSON
CREATE INDEX IF NOT EXISTS idx_search_history_sources 
ON search_history USING GIN (sources);

-- Ajout d'un index GIN sur le champ images pour la recherche dans le contenu JSON
CREATE INDEX IF NOT EXISTS idx_search_history_images 
ON search_history USING GIN (images);

-- Ajout d'un index GIN sur le champ keywords pour la recherche dans le tableau
CREATE INDEX IF NOT EXISTS idx_search_history_keywords 
ON search_history USING GIN (keywords); 