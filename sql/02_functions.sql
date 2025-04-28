-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for domains table
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get domain statistics
CREATE OR REPLACE FUNCTION get_domain_stats(domain_id UUID)
RETURNS TABLE (
    total_searches BIGINT,
    last_search TIMESTAMP WITH TIME ZONE,
    average_response_length INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_searches,
        MAX(created_at) as last_search,
        AVG(LENGTH(response))::INTEGER as average_response_length
    FROM search_history
    WHERE search_history.domain_id = get_domain_stats.domain_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search domains
CREATE OR REPLACE FUNCTION search_domains(
    search_term TEXT,
    user_id UUID,
    include_public BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    total_searches BIGINT,
    last_search TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.name,
        d.description,
        d.is_public,
        d.created_at,
        d.updated_at,
        COUNT(sh.id)::BIGINT as total_searches,
        MAX(sh.created_at) as last_search
    FROM domains d
    LEFT JOIN search_history sh ON d.id = sh.domain_id
    WHERE
        (d.user_id = search_domains.user_id OR (d.is_public AND include_public))
        AND (
            d.name ILIKE '%' || search_term || '%'
            OR d.description ILIKE '%' || search_term || '%'
        )
    GROUP BY d.id, d.name, d.description, d.is_public, d.created_at, d.updated_at
    ORDER BY d.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get domain tags
CREATE OR REPLACE FUNCTION get_domain_tags(domain_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dt.id,
        dt.name,
        dt.color
    FROM domain_tags dt
    JOIN domain_tag_relations dtr ON dt.id = dtr.tag_id
    WHERE dtr.domain_id = get_domain_tags.domain_id
    ORDER BY dt.name;
END;
$$ LANGUAGE plpgsql; 