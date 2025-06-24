-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_item TEXT NOT NULL,
  nome_vendedor TEXT NOT NULL,
  cpf_vendedor TEXT NOT NULL,
  valor TEXT NOT NULL,
  garantia_olx TEXT NOT NULL,
  valor_frete TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL,
  condicao TEXT NOT NULL,
  cep TEXT NOT NULL,
  municipio TEXT NOT NULL,
  publicado_em TEXT NOT NULL,
  imagem_principal TEXT NOT NULL,
  imagem_2 TEXT,
  imagem_3 TEXT,
  imagem_4 TEXT,
  chave_pix TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_municipio ON public.products(municipio);
CREATE INDEX IF NOT EXISTS idx_products_nome_item ON public.products USING gin(to_tsvector('portuguese', nome_item));

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (qualquer pessoa pode ver os produtos)
CREATE POLICY IF NOT EXISTS "Permitir leitura pública de produtos" ON public.products
  FOR SELECT USING (true);

-- Política para permitir inserção pública (qualquer pessoa pode cadastrar produtos)
CREATE POLICY IF NOT EXISTS "Permitir inserção pública de produtos" ON public.products
  FOR INSERT WITH CHECK (true);

-- Política para permitir atualização pública (qualquer pessoa pode editar produtos)
CREATE POLICY IF NOT EXISTS "Permitir atualização pública de produtos" ON public.products
  FOR UPDATE USING (true);

-- Política para permitir exclusão pública (qualquer pessoa pode deletar produtos)
CREATE POLICY IF NOT EXISTS "Permitir exclusão pública de produtos" ON public.products
  FOR DELETE USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
