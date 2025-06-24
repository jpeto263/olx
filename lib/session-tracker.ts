import { supabase } from "./supabase"

export interface UserSession {
  id: string
  session_id: string
  ip_address?: string
  user_agent?: string
  current_page?: string
  city?: string
  country?: string
  first_visit: string
  last_activity: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Função para verificar se a tabela user_sessions existe
async function checkSessionsTableExists(): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.from("user_sessions").select("id").limit(1)

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("relation")) {
        console.log("📋 Tabela 'user_sessions' não existe - será criada automaticamente")
        return false
      }
      console.warn("❌ Erro ao verificar tabela user_sessions:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.warn("❌ Erro ao verificar tabela user_sessions:", error)
    return false
  }
}

// Função para criar a tabela user_sessions
async function createSessionsTable(): Promise<boolean> {
  if (!supabase) return false

  try {
    console.log("🔧 Criando tabela 'user_sessions'...")

    // Criar a tabela usando uma consulta SQL simples
    const createTableSQL = `
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

      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
    `

    // Tentar executar usando rpc se disponível
    const { error: rpcError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (rpcError) {
      console.warn("RPC não disponível, tentando método alternativo:", rpcError.message)

      // Método alternativo: tentar inserir um registro para forçar a criação da tabela
      const { error: insertError } = await supabase.from("user_sessions").insert([
        {
          session_id: "test_session",
          ip_address: "127.0.0.1",
          user_agent: "test",
          current_page: "/test",
          city: "Test",
          country: "Test",
          is_active: false,
        },
      ])

      if (insertError && !insertError.message.includes("does not exist")) {
        console.warn("Erro ao criar tabela user_sessions via insert:", insertError.message)
        return false
      }

      // Se conseguiu inserir, deletar o registro de teste
      if (!insertError) {
        await supabase.from("user_sessions").delete().eq("session_id", "test_session")
      }
    }

    // Configurar RLS (Row Level Security)
    try {
      await supabase.rpc("exec_sql", {
        sql: `
          ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "public_read_sessions" ON public.user_sessions;
          DROP POLICY IF EXISTS "public_insert_sessions" ON public.user_sessions;
          DROP POLICY IF EXISTS "public_update_sessions" ON public.user_sessions;
          DROP POLICY IF EXISTS "public_delete_sessions" ON public.user_sessions;
          
          CREATE POLICY "public_read_sessions" ON public.user_sessions FOR SELECT USING (true);
          CREATE POLICY "public_insert_sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
          CREATE POLICY "public_update_sessions" ON public.user_sessions FOR UPDATE USING (true);
          CREATE POLICY "public_delete_sessions" ON public.user_sessions FOR DELETE USING (true);
        `,
      })
    } catch (rlsError) {
      console.warn("Aviso ao configurar RLS para user_sessions (pode ser ignorado):", rlsError)
    }

    console.log("✅ Tabela 'user_sessions' criada com sucesso")
    return true
  } catch (error) {
    console.warn("❌ Erro ao criar tabela user_sessions:", error)
    return false
  }
}

// Função para verificar se o Supabase está disponível e a tabela user_sessions existe
async function isSessionsTableReady(): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    // Primeiro verificar se a tabela existe
    const tableExists = await checkSessionsTableExists()

    if (!tableExists) {
      // Tentar criar a tabela
      const created = await createSessionsTable()
      if (!created) {
        console.warn("❌ Não foi possível criar a tabela user_sessions")
        return false
      }
    }

    // Verificar se agora consegue acessar a tabela
    const { error } = await supabase.from("user_sessions").select("id").limit(1)

    if (error) {
      console.warn("❌ Erro ao acessar tabela user_sessions após criação:", error.message)
      return false
    }

    console.log("✅ Tabela user_sessions está funcionando corretamente")
    return true
  } catch (error) {
    console.warn("❌ Erro na verificação da tabela user_sessions:", error)
    return false
  }
}

// Gerar ID de sessão único
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Obter IP do usuário
async function getUserIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    return data.ip || "unknown"
  } catch (error) {
    console.warn("Erro ao obter IP:", error)
    return "unknown"
  }
}

// Obter localização por IP
async function getLocationByIP(ip: string): Promise<{ city?: string; country?: string }> {
  try {
    if (ip === "unknown" || ip.startsWith("192.168") || ip.startsWith("10.") || ip === "127.0.0.1") {
      return { city: "Local", country: "Brasil" }
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`)
    const data = await response.json()

    if (data.status === "success") {
      return {
        city: data.city || "Desconhecida",
        country: data.country || "Desconhecido",
      }
    }
  } catch (error) {
    console.warn("Erro ao obter localização por IP:", error)
  }

  return { city: "Desconhecida", country: "Desconhecido" }
}

// Inicializar sessão do usuário
export async function initializeSession(): Promise<string> {
  try {
    // Verificar se já existe uma sessão ativa
    let sessionId = localStorage.getItem("olx_session_id")

    if (!sessionId) {
      sessionId = generateSessionId()
      localStorage.setItem("olx_session_id", sessionId)
    }

    // Obter dados do usuário
    const ip = await getUserIP()
    const location = await getLocationByIP(ip)
    const userAgent = navigator.userAgent
    const currentPage = window.location.pathname

    // Verificar se a tabela está pronta
    const isReady = await isSessionsTableReady()

    if (isReady) {
      const { data: existingSession } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .single()

      if (existingSession) {
        // Atualizar sessão existente
        await supabase
          .from("user_sessions")
          .update({
            current_page: currentPage,
            last_activity: new Date().toISOString(),
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)
      } else {
        // Criar nova sessão
        await supabase.from("user_sessions").insert({
          session_id: sessionId,
          ip_address: ip,
          user_agent: userAgent,
          current_page: currentPage,
          city: location.city,
          country: location.country,
          is_active: true,
        })
      }
    }

    return sessionId
  } catch (error) {
    console.error("Erro ao inicializar sessão:", error)
    const fallbackSessionId = generateSessionId()
    localStorage.setItem("olx_session_id", fallbackSessionId)
    return fallbackSessionId
  }
}

// Atualizar atividade da sessão
export async function updateSessionActivity(page?: string): Promise<void> {
  try {
    const sessionId = localStorage.getItem("olx_session_id")
    if (!sessionId) return

    const isReady = await isSessionsTableReady()
    if (!isReady) return

    const currentPage = page || window.location.pathname

    await supabase
      .from("user_sessions")
      .update({
        current_page: currentPage,
        last_activity: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
  } catch (error) {
    console.error("Erro ao atualizar atividade da sessão:", error)
  }
}

// Marcar sessão como inativa
export async function markSessionInactive(): Promise<void> {
  try {
    const sessionId = localStorage.getItem("olx_session_id")
    if (!sessionId || !supabase) return

    await supabase
      .from("user_sessions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
  } catch (error) {
    console.error("Erro ao marcar sessão como inativa:", error)
  }
}

// Obter todas as sessões ativas
export async function getActiveSessions(): Promise<UserSession[]> {
  try {
    const isReady = await isSessionsTableReady()
    if (!isReady) return []

    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .order("last_activity", { ascending: false })

    if (error) {
      console.error("Erro ao buscar sessões:", error)
      return []
    }

    return data as UserSession[]
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    return []
  }
}

// Obter estatísticas do dashboard
export async function getDashboardStats(): Promise<{
  onlineUsers: number
  totalAccesses: number
  totalRegistrations: number
  totalCards: number
  totalProducts: number
}> {
  try {
    const stats = {
      onlineUsers: 0,
      totalAccesses: 0,
      totalRegistrations: 0,
      totalCards: 0,
      totalProducts: 0,
    }

    const isReady = await isSessionsTableReady()

    if (!isReady) {
      // Fallback para localStorage
      const products = JSON.parse(localStorage.getItem("olx_products_temp") || "[]")
      const cards = JSON.parse(localStorage.getItem("creditCards") || "[]")
      const addresses = JSON.parse(localStorage.getItem("addresses") || "[]")

      return {
        ...stats,
        totalProducts: products.length,
        totalCards: cards.length,
        totalRegistrations: addresses.length,
      }
    }

    // Usuários online (últimos 3 minutos)
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const { data: onlineSessions } = await supabase
      .from("user_sessions")
      .select("id")
      .gte("last_activity", threeMinutesAgo)

    stats.onlineUsers = onlineSessions?.length || 0

    // Total de acessos
    const { data: allSessions } = await supabase.from("user_sessions").select("id")

    stats.totalAccesses = allSessions?.length || 0

    // Total de produtos
    const { data: products } = await supabase.from("products").select("id")

    stats.totalProducts = products?.length || 0

    // Dados do localStorage para cartões e cadastros
    const cards = JSON.parse(localStorage.getItem("creditCards") || "[]")
    const addresses = JSON.parse(localStorage.getItem("addresses") || "[]")

    stats.totalCards = cards.length
    stats.totalRegistrations = addresses.length

    return stats
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error)
    // Fallback completo
    const products = JSON.parse(localStorage.getItem("olx_products_temp") || "[]")
    const cards = JSON.parse(localStorage.getItem("creditCards") || "[]")
    const addresses = JSON.parse(localStorage.getItem("addresses") || "[]")

    return {
      onlineUsers: 0,
      totalAccesses: 0,
      totalRegistrations: addresses.length,
      totalCards: cards.length,
      totalProducts: products.length,
    }
  }
}

// Limpar sessões antigas (mais de 24 horas)
export async function cleanupOldSessions(): Promise<void> {
  try {
    if (!supabase) return

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    await supabase.from("user_sessions").delete().lt("last_activity", oneDayAgo)
  } catch (error) {
    console.error("Erro ao limpar sessões antigas:", error)
  }
}
