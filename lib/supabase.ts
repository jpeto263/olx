import { createClient } from "@supabase/supabase-js"

// Verificação das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Criar cliente apenas se as variáveis estiverem disponíveis
let supabase: any = null
let isSupabaseConfigured = false

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://demo.supabase.co") {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    isSupabaseConfigured = true
    console.log("✅ Cliente Supabase configurado com sucesso")
  } else {
    console.warn("⚠️ Supabase não configurado - usando armazenamento local temporário")
  }
} catch (error) {
  console.warn("❌ Erro ao configurar Supabase:", error)
}

export interface Product {
  id: string
  nome_item: string
  nome_vendedor: string
  cpf_vendedor: string
  valor: string
  garantia_olx: string
  valor_frete: string
  descricao: string
  categoria: string
  tipo: string
  condicao: string
  cep: string
  municipio: string
  publicado_em: string
  imagem_principal: string
  imagem_2?: string
  imagem_3?: string
  imagem_4?: string
  chave_pix: string
  whatsapp: string
  checkout_url?: string
  created_at: string
  updated_at: string
}

// Chave para localStorage
const LOCAL_STORAGE_KEY = "olx_products_temp"

// Função para salvar no localStorage como backup
function saveToLocalStorage(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products))
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error)
  }
}

// Função para carregar do localStorage
function loadFromLocalStorage(): Product[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Erro ao carregar do localStorage:", error)
    return []
  }
}

// Função para verificar se a tabela existe
async function checkTableExists(): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.from("products").select("id").limit(1)

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("relation")) {
        console.log("📋 Tabela 'products' não existe - será criada automaticamente")
        return false
      }
      console.warn("❌ Erro ao verificar tabela:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.warn("❌ Erro ao verificar tabela:", error)
    return false
  }
}

// Função para criar a tabela
async function createTable(): Promise<boolean> {
  if (!supabase) return false

  try {
    console.log("🔧 Criando tabela 'products'...")

    // Criar a tabela usando uma consulta SQL simples
    const createTableSQL = `
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
        checkout_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Tentar executar usando rpc se disponível
    const { error: rpcError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (rpcError) {
      console.warn("RPC não disponível, tentando método alternativo:", rpcError.message)

      // Método alternativo: tentar inserir um registro para forçar a criação da tabela
      const { error: insertError } = await supabase.from("products").insert([
        {
          nome_item: "test",
          nome_vendedor: "test",
          cpf_vendedor: "000.000.000-00",
          valor: "R$ 0",
          garantia_olx: "nao",
          valor_frete: "R$ 0",
          descricao: "test",
          categoria: "test",
          tipo: "test",
          condicao: "test",
          cep: "00000-000",
          municipio: "test",
          publicado_em: "test",
          imagem_principal: "/placeholder.svg",
          chave_pix: "test",
          whatsapp: "test",
          checkout_url: "",
        },
      ])

      if (insertError && !insertError.message.includes("does not exist")) {
        console.warn("Erro ao criar tabela via insert:", insertError.message)
        return false
      }

      // Se conseguiu inserir, deletar o registro de teste
      if (!insertError) {
        await supabase.from("products").delete().eq("nome_item", "test")
      }
    }

    // Configurar RLS (Row Level Security)
    try {
      await supabase.rpc("exec_sql", {
        sql: `
          ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "public_read" ON public.products;
          DROP POLICY IF EXISTS "public_insert" ON public.products;
          DROP POLICY IF EXISTS "public_update" ON public.products;
          DROP POLICY IF EXISTS "public_delete" ON public.products;
          
          CREATE POLICY "public_read" ON public.products FOR SELECT USING (true);
          CREATE POLICY "public_insert" ON public.products FOR INSERT WITH CHECK (true);
          CREATE POLICY "public_update" ON public.products FOR UPDATE USING (true);
          CREATE POLICY "public_delete" ON public.products FOR DELETE USING (true);
        `,
      })
    } catch (rlsError) {
      console.warn("Aviso ao configurar RLS (pode ser ignorado):", rlsError)
    }

    console.log("✅ Tabela 'products' criada com sucesso")
    return true
  } catch (error) {
    console.warn("❌ Erro ao criar tabela:", error)
    return false
  }
}

// Função para verificar se o Supabase está disponível e funcional
async function isSupabaseReady(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false
  }

  try {
    // Primeiro verificar se a tabela existe
    const tableExists = await checkTableExists()

    if (!tableExists) {
      // Tentar criar a tabela
      const created = await createTable()
      if (!created) {
        console.warn("❌ Não foi possível criar a tabela")
        return false
      }
    }

    // Verificar se agora consegue acessar a tabela
    const { error } = await supabase.from("products").select("id").limit(1)

    if (error) {
      console.warn("❌ Erro ao acessar tabela após criação:", error.message)
      return false
    }

    console.log("✅ Supabase está funcionando corretamente")
    return true
  } catch (error) {
    console.warn("❌ Erro na verificação do Supabase:", error)
    return false
  }
}

// Função para buscar todos os produtos
export async function getProducts(): Promise<Product[]> {
  const isReady = await isSupabaseReady()

  if (isReady) {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar produtos do Supabase:", error)
        // Fallback para localStorage
        const localProducts = loadFromLocalStorage()
        console.log(`🔄 Carregando ${localProducts.length} produtos do armazenamento local`)
        return localProducts
      }

      console.log(`✅ ${data.length} produtos carregados do Supabase`)
      return data as Product[]
    } catch (error) {
      console.error("❌ Erro na conexão com Supabase:", error)
    }
  }

  // Usar localStorage como fallback
  const localProducts = loadFromLocalStorage()
  console.log(`🔄 Carregando ${localProducts.length} produtos do armazenamento local (Supabase não disponível)`)
  return localProducts
}

// Função para buscar um produto por ID
export async function getProductById(id: string): Promise<Product | null> {
  const isReady = await isSupabaseReady()

  if (isReady) {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

      if (error) {
        console.error("❌ Erro ao buscar produto do Supabase:", error)
        const localProducts = loadFromLocalStorage()
        return localProducts.find((p) => p.id === id) || null
      }

      return data as Product
    } catch (error) {
      console.error("❌ Erro na conexão com Supabase:", error)
    }
  }

  // Fallback para localStorage
  const localProducts = loadFromLocalStorage()
  return localProducts.find((p) => p.id === id) || null
}

// Função para criar um novo produto
export async function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
  console.log("🚀 Iniciando criação de produto:", product.nome_item)

  // Remover a geração manual do ID - deixar o Supabase gerar automaticamente
  const newProduct = {
    ...product,
    // Não incluir o ID aqui - será gerado automaticamente pelo banco
    // created_at e updated_at também serão gerados automaticamente
  }

  console.log("📦 Produto preparado:", newProduct)

  const isReady = await isSupabaseReady()
  console.log("🔍 Supabase ready:", isReady)

  if (isReady) {
    try {
      console.log("💾 Tentando salvar no Supabase...")
      const { data, error } = await supabase.from("products").insert([newProduct]).select().single()

      if (error) {
        console.error("❌ Erro detalhado do Supabase:", error)
        console.error("❌ Código do erro:", error.code)
        console.error("❌ Mensagem do erro:", error.message)

        // Salvar localmente como backup com ID customizado
        console.log("🔄 Salvando localmente como backup...")
        const localProduct: Product = {
          ...product,
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const localProducts = loadFromLocalStorage()
        localProducts.unshift(localProduct)
        saveToLocalStorage(localProducts)
        console.log("💾 Produto salvo localmente como backup:", localProduct.nome_item)

        throw new Error(`Erro do Supabase: ${error.message}`)
      }

      console.log("✅ Produto salvo no Supabase com sucesso:", data)
      return data as Product
    } catch (error: any) {
      console.error("❌ Erro na conexão com Supabase:", error)

      // Salvar localmente como fallback com ID customizado
      console.log("🔄 Salvando localmente como fallback...")
      const localProduct: Product = {
        ...product,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const localProducts = loadFromLocalStorage()
      localProducts.unshift(localProduct)
      saveToLocalStorage(localProducts)
      console.log("💾 Produto salvo localmente:", localProduct.nome_item)
      return localProduct
    }
  }

  // Salvar localmente se Supabase não estiver disponível
  console.log("🔄 Supabase não disponível, salvando localmente...")
  const localProduct: Product = {
    ...product,
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const localProducts = loadFromLocalStorage()
  localProducts.unshift(localProduct)
  saveToLocalStorage(localProducts)
  console.log("💾 Produto salvo localmente:", localProduct.nome_item)
  return localProduct
}

// Função para atualizar um produto
export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "updated_at">>,
): Promise<Product> {
  const isReady = await isSupabaseReady()

  if (isReady) {
    try {
      const { data, error } = await supabase
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Erro ao atualizar no Supabase:", error)
        throw error
      }

      console.log("✅ Produto atualizado no Supabase")
      return data as Product
    } catch (error) {
      console.error("❌ Erro na conexão com Supabase:", error)
    }
  }

  // Atualizar localmente
  const localProducts = loadFromLocalStorage()
  const productIndex = localProducts.findIndex((p) => p.id === id)
  if (productIndex !== -1) {
    localProducts[productIndex] = {
      ...localProducts[productIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveToLocalStorage(localProducts)
    console.log("💾 Produto atualizado localmente")
    return localProducts[productIndex]
  }

  throw new Error("Produto não encontrado")
}

// Função para deletar um produto
export async function deleteProduct(id: string): Promise<boolean> {
  const isReady = await isSupabaseReady()

  if (isReady) {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        console.error("❌ Erro ao deletar do Supabase:", error)
        throw error
      }

      console.log("✅ Produto deletado do Supabase")
      return true
    } catch (error) {
      console.error("❌ Erro na conexão com Supabase:", error)
    }
  }

  // Deletar localmente
  const localProducts = loadFromLocalStorage()
  const productIndex = localProducts.findIndex((p) => p.id === id)
  if (productIndex !== -1) {
    localProducts.splice(productIndex, 1)
    saveToLocalStorage(localProducts)
    console.log("💾 Produto deletado localmente")
    return true
  }

  return false
}

// Função para buscar produtos por categoria
export async function getProductsByCategory(categoria: string): Promise<Product[]> {
  const products = await getProducts()
  return products.filter((product) => product.categoria === categoria)
}

// Função para buscar produtos por termo de pesquisa
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const products = await getProducts()
  const term = searchTerm.toLowerCase()

  return products.filter(
    (product) =>
      product.nome_item.toLowerCase().includes(term) ||
      product.nome_vendedor.toLowerCase().includes(term) ||
      product.categoria.toLowerCase().includes(term) ||
      product.municipio.toLowerCase().includes(term),
  )
}

// Função para verificar o status da configuração
export function getConfigurationStatus(): {
  isSupabaseConfigured: boolean
  hasLocalData: boolean
  localProductsCount: number
} {
  const localProducts = loadFromLocalStorage()
  return {
    isSupabaseConfigured,
    hasLocalData: localProducts.length > 0,
    localProductsCount: localProducts.length,
  }
}

// Função para buscar produtos por município
export async function getProductsByMunicipality(municipio: string): Promise<Product[]> {
  const isReady = await isSupabaseReady()

  if (isReady) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("municipio", `%${municipio}%`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar produtos por município do Supabase:", error)
        // Fallback para localStorage
        const localProducts = loadFromLocalStorage()
        return localProducts.filter((product) => product.municipio.toLowerCase().includes(municipio.toLowerCase()))
      }

      console.log(`✅ ${data.length} produtos encontrados em ${municipio}`)
      return data as Product[]
    } catch (error) {
      console.error("❌ Erro na conexão com Supabase:", error)
    }
  }

  // Usar localStorage como fallback
  const localProducts = loadFromLocalStorage()
  const filtered = localProducts.filter((product) => product.municipio.toLowerCase().includes(municipio.toLowerCase()))
  console.log(`🔄 ${filtered.length} produtos encontrados em ${municipio} (armazenamento local)`)
  return filtered
}

export { supabase }
