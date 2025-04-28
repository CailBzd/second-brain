-- View for domain statistics
CREATE OR REPLACE VIEW domain_statistics AS
SELECT
    d.id as domain_id,
    d.name as domain_name,
    d.user_id,
    d.is_public,
    COUNT(sh.id) as total_searches,
    MAX(sh.created_at) as last_search,
    AVG(LENGTH(sh.response))::INTEGER as average_response_length,
    COUNT(DISTINCT dtr.tag_id) as total_tags
FROM domains d
LEFT JOIN search_history sh ON d.id = sh.domain_id
LEFT JOIN domain_tag_relations dtr ON d.id = dtr.domain_id
GROUP BY d.id, d.name, d.user_id, d.is_public;

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id as user_id,
    COUNT(DISTINCT d.id) as total_domains,
    COUNT(DISTINCT sh.id) as total_searches,
    COUNT(DISTINCT dt.id) as total_tags,
    MAX(sh.created_at) as last_search
FROM auth.users u
LEFT JOIN domains d ON u.id = d.user_id
LEFT JOIN search_history sh ON u.id = sh.user_id
LEFT JOIN domain_tags dt ON u.id = dt.user_id
GROUP BY u.id;

-- View for recent searches
CREATE OR REPLACE VIEW recent_searches AS
SELECT
    sh.id,
    sh.created_at,
    sh.prompt,
    sh.response,
    d.name as domain_name,
    d.id as domain_id,
    u.email as user_email,
    array_agg(dt.name) as tags
FROM search_history sh
JOIN domains d ON sh.domain_id = d.id
JOIN auth.users u ON sh.user_id = u.id
LEFT JOIN domain_tag_relations dtr ON d.id = dtr.domain_id
LEFT JOIN domain_tags dt ON dtr.tag_id = dt.id
GROUP BY sh.id, sh.created_at, sh.prompt, sh.response, d.name, d.id, u.email
ORDER BY sh.created_at DESC; 