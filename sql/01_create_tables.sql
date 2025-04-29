-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create domains table
CREATE TABLE domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users NOT NULL,
    is_public BOOLEAN DEFAULT false,
    CONSTRAINT unique_domain_name_per_user UNIQUE (name, user_id)
);

-- Create search_history table
CREATE TABLE search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users NOT NULL,
    query TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    historical_context TEXT,
    anecdote TEXT,
    exposition JSONB,  -- Pour stocker introduction, paragraphs, conclusion
    sources JSONB,     -- Pour stocker le tableau de sources
    images JSONB,      -- Pour stocker le tableau d'images
    keywords TEXT[],   -- Tableau de mots-clés
    model_info JSONB   -- Pour stocker les informations sur le modèle utilisé
);

-- Create domain_tags table
CREATE TABLE domain_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    user_id UUID REFERENCES auth.users NOT NULL,
    CONSTRAINT unique_tag_name_per_user UNIQUE (name, user_id)
);

-- Create domain_tag_relations table
CREATE TABLE domain_tag_relations (
    domain_id UUID REFERENCES domains ON DELETE CASCADE,
    tag_id UUID REFERENCES domain_tags ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (domain_id, tag_id)
);

-- Create daily_requests table
CREATE TABLE daily_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users NOT NULL,
    request_date DATE NOT NULL,
    request_count INTEGER DEFAULT 0,
    CONSTRAINT unique_user_date UNIQUE (user_id, request_date)
);

-- Create indexes
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);
CREATE INDEX idx_search_history_query ON search_history USING gin(to_tsvector('french', query));
CREATE INDEX idx_domain_tags_user_id ON domain_tags(user_id);
CREATE INDEX idx_domain_tag_relations_domain_id ON domain_tag_relations(domain_id);
CREATE INDEX idx_domain_tag_relations_tag_id ON domain_tag_relations(tag_id);
CREATE INDEX idx_daily_requests_user_date ON daily_requests(user_id, request_date);

-- Enable Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Domains policies
CREATE POLICY "Users can view their own domains"
    ON domains FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own domains"
    ON domains FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
    ON domains FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
    ON domains FOR DELETE
    USING (auth.uid() = user_id);

-- Search history policies
CREATE POLICY "Users can view their own search history"
    ON search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
    ON search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
    ON search_history FOR DELETE
    USING (auth.uid() = user_id);

-- Domain tags policies
CREATE POLICY "Users can view their own tags"
    ON domain_tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
    ON domain_tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON domain_tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON domain_tags FOR DELETE
    USING (auth.uid() = user_id);

-- Domain tag relations policies
CREATE POLICY "Users can view their own domain tag relations"
    ON domain_tag_relations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM domains
            WHERE domains.id = domain_tag_relations.domain_id
            AND domains.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own domain tag relations"
    ON domain_tag_relations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM domains
            WHERE domains.id = domain_tag_relations.domain_id
            AND domains.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own domain tag relations"
    ON domain_tag_relations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM domains
            WHERE domains.id = domain_tag_relations.domain_id
            AND domains.user_id = auth.uid()
        )
    );

-- Daily requests policies
CREATE POLICY "Users can view their own daily requests"
    ON daily_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily requests"
    ON daily_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily requests"
    ON daily_requests FOR UPDATE
    USING (auth.uid() = user_id); 