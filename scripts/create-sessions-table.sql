-- Criar tabela para rastrear sessões de usuários
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  current_page TEXT,
  city TEXT,
  country TEXT,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- Configurar RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público
DROP POLICY IF EXISTS "public_read_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "public_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "public_update_sessions" ON public.user_sessions;

CREATE POLICY "public_read_sessions" ON public.user_sessions FOR SELECT USING (true);
CREATE POLICY "public_insert_sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON public.user_sessions FOR UPDATE USING (true);
