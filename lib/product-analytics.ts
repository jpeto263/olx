import { supabase } from "./supabase"

export interface ProductClick {
  id: string
  product_id: string
  clicked_at: string
  user_agent?: string
  ip_address?: string
  referrer?: string
}

export interface ProductAnalytics {
  product_id: string
  total_clicks: number
  clicks_today: number
  clicks_this_week: number
  clicks_this_month: number
  last_clicked: string | null
}

// Função para registrar um clique no produto
export async function trackProductClick(productId: string): Promise<void> {
  try {
    const clickData = {
      product_id: productId,
      clicked_at: new Date().toISOString(),
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null,
      ip_address: null, // Será preenchido pelo servidor se necessário
      referrer: typeof window !== "undefined" ? document.referrer : null,
    }

    // Tentar salvar no Supabase
    if (supabase) {
      const { error } = await supabase.from("product_clicks").insert([clickData])

      if (error) {
        console.warn("Erro ao salvar clique no Supabase:", error)
        // Fallback para localStorage
        saveClickToLocalStorage(clickData)
      } else {
        console.log("✅ Clique registrado no Supabase")
      }
    } else {
      // Salvar no localStorage se Supabase não estiver disponível
      saveClickToLocalStorage(clickData)
    }
  } catch (error) {
    console.error("Erro ao registrar clique:", error)
    // Fallback para localStorage
    saveClickToLocalStorage({
      product_id: productId,
      clicked_at: new Date().toISOString(),
    })
  }
}

// Função para salvar clique no localStorage
function saveClickToLocalStorage(clickData: any): void {
  try {
    const existingClicks = JSON.parse(localStorage.getItem("product_clicks") || "[]")
    existingClicks.push({
      ...clickData,
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })
    localStorage.setItem("product_clicks", JSON.stringify(existingClicks))
    console.log("💾 Clique salvo no localStorage")
  } catch (error) {
    console.error("Erro ao salvar clique no localStorage:", error)
  }
}

// Função para obter analytics de um produto
export async function getProductAnalytics(productId: string): Promise<ProductAnalytics> {
  try {
    if (supabase) {
      // Buscar do Supabase
      const { data, error } = await supabase
        .from("product_clicks")
        .select("*")
        .eq("product_id", productId)
        .order("clicked_at", { ascending: false })

      if (!error && data) {
        return calculateAnalytics(productId, data)
      }
    }

    // Fallback para localStorage
    const localClicks = JSON.parse(localStorage.getItem("product_clicks") || "[]")
    const productClicks = localClicks.filter((click: any) => click.product_id === productId)
    return calculateAnalytics(productId, productClicks)
  } catch (error) {
    console.error("Erro ao obter analytics:", error)
    return {
      product_id: productId,
      total_clicks: 0,
      clicks_today: 0,
      clicks_this_week: 0,
      clicks_this_month: 0,
      last_clicked: null,
    }
  }
}

// Função para calcular analytics
function calculateAnalytics(productId: string, clicks: any[]): ProductAnalytics {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const clicksToday = clicks.filter((click) => new Date(click.clicked_at) >= today).length
  const clicksThisWeek = clicks.filter((click) => new Date(click.clicked_at) >= weekAgo).length
  const clicksThisMonth = clicks.filter((click) => new Date(click.clicked_at) >= monthAgo).length

  return {
    product_id: productId,
    total_clicks: clicks.length,
    clicks_today: clicksToday,
    clicks_this_week: clicksThisWeek,
    clicks_this_month: clicksThisMonth,
    last_clicked: clicks.length > 0 ? clicks[0].clicked_at : null,
  }
}

// Função para obter analytics de todos os produtos
export async function getAllProductsAnalytics(): Promise<Record<string, ProductAnalytics>> {
  try {
    let allClicks: any[] = []

    if (supabase) {
      const { data, error } = await supabase
        .from("product_clicks")
        .select("*")
        .order("clicked_at", { ascending: false })

      if (!error && data) {
        allClicks = data
      }
    }

    // Adicionar cliques do localStorage
    const localClicks = JSON.parse(localStorage.getItem("product_clicks") || "[]")
    allClicks = [...allClicks, ...localClicks]

    // Agrupar por produto
    const productGroups: Record<string, any[]> = {}
    allClicks.forEach((click) => {
      if (!productGroups[click.product_id]) {
        productGroups[click.product_id] = []
      }
      productGroups[click.product_id].push(click)
    })

    // Calcular analytics para cada produto
    const analytics: Record<string, ProductAnalytics> = {}
    Object.keys(productGroups).forEach((productId) => {
      analytics[productId] = calculateAnalytics(productId, productGroups[productId])
    })

    return analytics
  } catch (error) {
    console.error("Erro ao obter analytics de todos os produtos:", error)
    return {}
  }
}
