-- Criar tabela para rastrear cliques nos produtos
CREATE TABLE IF NOT EXISTS public.product_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON public.product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_clicked_at ON public.product_clicks(clicked_at);

-- Habilitar RLS
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
DROP POLICY IF EXISTS "public_read_clicks" ON public.product_clicks;
DROP POLICY IF EXISTS "public_insert_clicks" ON public.product_clicks;

CREATE POLICY "public_read_clicks" ON public.product_clicks FOR SELECT USING (true);
CREATE POLICY "public_insert_clicks" ON public.product_clicks FOR INSERT WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.product_clicks IS 'Tabela para rastrear cliques nos produtos';
COMMENT ON COLUMN public.product_clicks.product_id IS 'ID do produto clicado';
COMMENT ON COLUMN public.product_clicks.clicked_at IS 'Data e hora do clique';
COMMENT ON COLUMN public.product_clicks.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN public.product_clicks.ip_address IS 'Endereço IP do usuário';
COMMENT ON COLUMN public.product_clicks.referrer IS 'Página de origem do clique';
