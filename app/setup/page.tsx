"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Database, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function SetupPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- ============================================
-- SCRIPT DE CONFIGURAÇÃO PARA PRODUÇÃO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELA DE PRODUTOS
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

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_municipio ON public.products(municipio);
CREATE INDEX IF NOT EXISTS idx_products_nome_item ON public.products USING gin(to_tsvector('portuguese', nome_item));

-- 3. HABILITAR RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir inserção pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir atualização pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir exclusão pública de produtos" ON public.products;

CREATE POLICY "Permitir leitura pública de produtos" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de produtos" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de produtos" ON public.products
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública de produtos" ON public.products
  FOR DELETE USING (true);

-- 5. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CRIAR TRIGGER PARA updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. INSERIR PRODUTOS DE EXEMPLO
INSERT INTO public.products (
  nome_item,
  nome_vendedor,
  cpf_vendedor,
  valor,
  garantia_olx,
  valor_frete,
  descricao,
  categoria,
  tipo,
  condicao,
  cep,
  municipio,
  publicado_em,
  imagem_principal,
  imagem_2,
  chave_pix,
  whatsapp
) VALUES 
-- iPhone 14 Pro Max
(
  'iPhone 14 Pro Max 256GB Roxo Profundo',
  'João Silva',
  '123.456.789-00',
  'R$ 4.200,00',
  'R$ 500,00',
  'R$ 25,00',
  'iPhone 14 Pro Max em excelente estado de conservação. Acompanha carregador original, caixa e todos os acessórios. Bateria com 95% de capacidade. Sem riscos ou marcas de uso. Aceito cartão e PIX.',
  'Eletrônicos e Celulares',
  'Smartphone',
  'Usado',
  '01310-100',
  'São Paulo - SP',
  '18/06/2025 às 14:30',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  '123.456.789-00',
  '(11) 99999-1234'
),

-- Samsung Galaxy S23 Ultra
(
  'Samsung Galaxy S23 Ultra 256GB Preto',
  'Maria Santos',
  '987.654.321-00',
  'R$ 3.800,00',
  'R$ 400,00',
  'R$ 30,00',
  'Samsung Galaxy S23 Ultra lacrado, na caixa. Cor preta, 256GB de armazenamento. Garantia de 1 ano. Aceito cartão e PIX. Entrego em toda região metropolitana.',
  'Eletrônicos e Celulares',
  'Smartphone',
  'Novo',
  '20040-020',
  'Rio de Janeiro - RJ',
  '18/06/2025 às 15:45',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop',
  'maria.santos@email.com',
  '(21) 98888-5678'
),

-- MacBook Air M2
(
  'MacBook Air M2 2022 8GB 256GB Cinza Espacial',
  'Pedro Costa',
  '456.789.123-00',
  'R$ 7.500,00',
  'R$ 800,00',
  'R$ 50,00',
  'MacBook Air M2 2022, 8GB RAM, 256GB SSD. Usado apenas para trabalho, em perfeito estado. Acompanha carregador original e case de proteção. Sem riscos na tela.',
  'Eletrônicos e Celulares',
  'Notebook',
  'Usado',
  '30112-000',
  'Belo Horizonte - MG',
  '18/06/2025 às 16:20',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
  '(31) 97777-9999',
  '(31) 97777-9999'
),

-- Geladeira Brastemp
(
  'Geladeira Brastemp Frost Free 400L Inox',
  'Ana Oliveira',
  '789.123.456-00',
  'R$ 1.800,00',
  'R$ 200,00',
  'R$ 80,00',
  'Geladeira Brastemp Frost Free 400L, cor inox. Funcionando perfeitamente, sem defeitos. Apenas 2 anos de uso. Ideal para famílias grandes. Entrego na região.',
  'Eletrodomésticos',
  'Geladeira',
  'Usado',
  '70040-010',
  'Brasília - DF',
  '18/06/2025 às 17:10',
  'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop',
  null,
  'ana.oliveira@email.com',
  '(61) 96666-7777'
),

-- PlayStation 5
(
  'PlayStation 5 + 2 Controles + 5 Jogos',
  'Carlos Ferreira',
  '321.654.987-00',
  'R$ 3.200,00',
  'R$ 350,00',
  'R$ 40,00',
  'PlayStation 5 em ótimo estado com 2 controles DualSense. Acompanha todos os cabos originais e 5 jogos físicos: Spider-Man, God of War, Horizon, FIFA 24 e Call of Duty. Funcionando perfeitamente.',
  'Eletrônicos e Celulares',
  'Console',
  'Usado',
  '80010-130',
  'Curitiba - PR',
  '18/06/2025 às 18:00',
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=300&fit=crop',
  '321.654.987-00',
  '(41) 95555-8888'
),

-- Smart TV Samsung
(
  'Smart TV Samsung 55" 4K Crystal UHD',
  'Fernanda Lima',
  '654.321.987-00',
  'R$ 2.100,00',
  'R$ 250,00',
  'R$ 60,00',
  'Smart TV Samsung 55 polegadas, 4K Crystal UHD. Apenas 1 ano de uso, em perfeito estado. Acompanha controle original e manual. Aceito propostas.',
  'Eletrônicos e Celulares',
  'TV',
  'Usado',
  '40070-110',
  'Salvador - BA',
  '18/06/2025 às 19:15',
  'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
  null,
  'fernanda.lima@email.com',
  '(71) 94444-3333'
),

-- Notebook Gamer
(
  'Notebook Gamer Acer Nitro 5 RTX 3060',
  'Rafael Santos',
  '147.258.369-00',
  'R$ 4.800,00',
  'R$ 500,00',
  'R$ 45,00',
  'Notebook Gamer Acer Nitro 5 com RTX 3060, Intel i7, 16GB RAM, SSD 512GB. Perfeito para jogos e trabalho. Usado por 8 meses, em excelente estado.',
  'Eletrônicos e Celulares',
  'Notebook',
  'Usado',
  '90010-000',
  'Porto Alegre - RS',
  '18/06/2025 às 20:30',
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
  null,
  '147.258.369-00',
  '(51) 93333-2222'
),

-- Fogão Brastemp
(
  'Fogão Brastemp 5 Bocas Inox com Forno',
  'Luciana Rocha',
  '963.852.741-00',
  'R$ 850,00',
  'R$ 100,00',
  'R$ 70,00',
  'Fogão Brastemp 5 bocas, cor inox, com forno. Funcionando perfeitamente, bem conservado. Ideal para cozinhas grandes. Aceito cartão em até 3x.',
  'Eletrodomésticos',
  'Fogão',
  'Usado',
  '60000-000',
  'Fortaleza - CE',
  '18/06/2025 às 21:45',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  null,
  'luciana.rocha@email.com',
  '(85) 92222-1111'
),

-- Bicicleta Caloi
(
  'Bicicleta Caloi Elite Carbon Aro 29',
  'Marcos Pereira',
  '852.741.963-00',
  'R$ 1.200,00',
  'R$ 150,00',
  'R$ 35,00',
  'Bicicleta Caloi Elite Carbon, aro 29, 21 marchas. Muito bem conservada, usada apenas nos finais de semana. Acompanha capacete e kit de ferramentas.',
  'Esportes e Lazer',
  'Bicicleta',
  'Usado',
  '13000-000',
  'Campinas - SP',
  '19/06/2025 às 08:15',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  null,
  '852.741.963-00',
  '(19) 91111-0000'
),

-- Sofá 3 Lugares
(
  'Sofá 3 Lugares Tecido Cinza Moderno',
  'Patricia Alves',
  '741.852.963-00',
  'R$ 980,00',
  'R$ 120,00',
  'R$ 90,00',
  'Sofá 3 lugares em tecido cinza, design moderno. Muito confortável e em ótimo estado. Apenas 6 meses de uso. Ideal para sala de estar.',
  'Casa e Jardim',
  'Móveis',
  'Usado',
  '50000-000',
  'Recife - PE',
  '19/06/2025 às 09:30',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  null,
  'patricia.alves@email.com',
  '(81) 90000-9999'
);

-- 8. CRIAR TABELA DE SESSÕES DE USUÁRIO
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

-- 9. CRIAR ÍNDICES PARA SESSÕES
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- 10. HABILITAR RLS PARA SESSÕES
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 11. CRIAR POLÍTICAS PARA SESSÕES
DROP POLICY IF EXISTS "public_read_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "public_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "public_update_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "public_delete_sessions" ON public.user_sessions;

CREATE POLICY "public_read_sessions" ON public.user_sessions FOR SELECT USING (true);
CREATE POLICY "public_insert_sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON public.user_sessions FOR UPDATE USING (true);
CREATE POLICY "public_delete_sessions" ON public.user_sessions FOR DELETE USING (true);

-- 12. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
  'products' as tabela,
  COUNT(*) as total_registros
FROM public.products
UNION ALL
SELECT 
  'user_sessions' as tabela,
  COUNT(*) as total_registros
FROM public.user_sessions;`

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript)
      setCopied(true)
      toast({
        title: "Script copiado!",
        description: "O script SQL foi copiado para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o script.",
      })
    }
  }

  const steps = [
    {
      number: 1,
      title: "Acesse o Supabase Dashboard",
      description: "Faça login no seu projeto Supabase",
      action: "Abrir Supabase",
      link: "https://supabase.com/dashboard",
    },
    {
      number: 2,
      title: "Vá para o SQL Editor",
      description: "No menu lateral, clique em 'SQL Editor'",
      action: null,
    },
    {
      number: 3,
      title: "Cole e Execute o Script",
      description: "Cole o script SQL completo e clique em 'Run'",
      action: "Copiar Script",
      onClick: handleCopyScript,
    },
    {
      number: 4,
      title: "Verifique os Resultados",
      description: "Confirme que as tabelas foram criadas e os produtos inseridos",
      action: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Configuração do Banco de Dados</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Intro Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Configurar Banco de Dados para Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Importante</h3>
                  <p className="text-blue-800 text-sm">
                    Este script criará as tabelas necessárias e inserirá 10 produtos de exemplo no seu banco de dados
                    Supabase. Execute apenas uma vez para evitar dados duplicados.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ O que será criado:</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Tabela `products` com 10 produtos</li>
                  <li>• Tabela `user_sessions` para tracking</li>
                  <li>• Índices para performance</li>
                  <li>• Políticas de segurança (RLS)</li>
                  <li>• Triggers automáticos</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">⚠️ Produtos incluídos:</h4>
                <ul className="text-orange-800 text-sm space-y-1">
                  <li>• iPhone 14 Pro Max</li>
                  <li>• Samsung Galaxy S23 Ultra</li>
                  <li>• MacBook Air M2</li>
                  <li>• PlayStation 5</li>
                  <li>• Smart TV Samsung 55"</li>
                  <li>• E mais 5 produtos...</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={step.number}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    {step.action && (
                      <div className="flex gap-3">
                        {step.link ? (
                          <Button
                            onClick={() => window.open(step.link, "_blank")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {step.action}
                          </Button>
                        ) : (
                          <Button
                            onClick={step.onClick}
                            className={`${
                              copied ? "bg-green-600 hover:bg-green-700" : "bg-gray-900 hover:bg-gray-800"
                            } text-white`}
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                {step.action}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Script Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Preview do Script SQL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{sqlScript.substring(0, 800)}...</code>
              </pre>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">Script completo com {sqlScript.split("\n").length} linhas</p>
              <Button onClick={handleCopyScript} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Após executar o script:</h3>
                <ul className="text-green-800 space-y-1">
                  <li>✅ Volte para a página inicial e veja os produtos carregando do banco</li>
                  <li>✅ Acesse o Admin Dashboard para gerenciar os dados</li>
                  <li>✅ Teste o cadastro de novos produtos</li>
                  <li>✅ Verifique o tracking de usuários em tempo real</li>
                </ul>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => router.push("/")} className="bg-green-600 hover:bg-green-700 text-white">
                    Ir para Homepage
                  </Button>
                  <Button
                    onClick={() => router.push("/admin")}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Admin Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
