-- Inserir alguns produtos de exemplo
INSERT INTO products (
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
(
  'iPhone 14 Pro Max 256GB',
  'João Silva',
  '123.456.789-00',
  'R$ 4.200,00',
  'R$ 500,00',
  'R$ 25,00',
  'iPhone 14 Pro Max em excelente estado de conservação. Acompanha carregador original, caixa e todos os acessórios. Bateria com 95% de capacidade. Sem riscos ou marcas de uso.',
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
(
  'Samsung Galaxy S23 Ultra',
  'Maria Santos',
  '987.654.321-00',
  'R$ 3.800,00',
  'R$ 400,00',
  'R$ 30,00',
  'Samsung Galaxy S23 Ultra lacrado, na caixa. Cor preta, 256GB de armazenamento. Garantia de 1 ano. Aceito cartão e PIX.',
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
(
  'MacBook Air M2 2022',
  'Pedro Costa',
  '456.789.123-00',
  'R$ 7.500,00',
  'R$ 800,00',
  'R$ 50,00',
  'MacBook Air M2 2022, 8GB RAM, 256GB SSD. Usado apenas para trabalho, em perfeito estado. Acompanha carregador original e case de proteção.',
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
(
  'Geladeira Brastemp Frost Free 400L',
  'Ana Oliveira',
  '789.123.456-00',
  'R$ 1.800,00',
  'R$ 200,00',
  'R$ 80,00',
  'Geladeira Brastemp Frost Free 400L, cor inox. Funcionando perfeitamente, sem defeitos. Apenas 2 anos de uso. Ideal para famílias grandes.',
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
(
  'PlayStation 5 + 2 Controles',
  'Carlos Ferreira',
  '321.654.987-00',
  'R$ 3.200,00',
  'R$ 350,00',
  'R$ 40,00',
  'PlayStation 5 em ótimo estado com 2 controles DualSense. Acompanha todos os cabos originais e 5 jogos físicos. Funcionando perfeitamente.',
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
);
