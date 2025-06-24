"use client"

import { Search, User, MapPin, MessageCircle, Bell, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProducts, type Product } from "@/lib/supabase"

const banners = [
  {
    image: "/images/banner-economia.webp",
    alt: "Sorte do dia - Economia em todas as categorias",
  },
  {
    image: "/images/banner-carrao.webp",
    alt: "Festival do Carrão - Cadastre-se nos anúncios e ganhe 5% de cashback",
  },
  {
    image: "/images/banner-seguranca.webp",
    alt: "Fique atento - Segurança contra golpes bancários",
  },
]

export default function OLXHomepage() {
  const [currentBanner, setCurrentBanner] = useState(0)
  const [activeMobileTab, setActiveMobileTab] = useState("inicio")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAutoRotationPaused, setIsAutoRotationPaused] = useState(false)
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<{
    city: string | null
    loading: boolean
    error: string | null
  }>({
    city: null,
    loading: true,
    error: null,
  })

  // Função para obter localização do usuário
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      setUserLocation({
        city: null,
        loading: false,
        error: "Geolocalização não suportada pelo navegador",
      })
      return
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 600000,
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          console.log("Coordenadas obtidas:", { latitude, longitude })

          let city = null

          // Try geocoding services
          try {
            const nominatimResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=pt-BR`,
              {
                headers: {
                  "User-Agent": "OLX-Clone/1.0 (contact@example.com)",
                },
              },
            )

            if (nominatimResponse.ok) {
              const data = await nominatimResponse.json()
              city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.municipality ||
                data.address?.county ||
                data.display_name?.split(",")[0]
            }
          } catch (error) {
            console.log("Geocoding failed:", error)
          }

          // Fallback locations
          if (!city) {
            if (latitude >= -23.7 && latitude <= -23.4 && longitude >= -46.8 && longitude <= -46.3) {
              city = "São Paulo"
            } else if (latitude >= -22.95 && latitude <= -22.8 && longitude >= -43.3 && longitude <= -43.1) {
              city = "Rio de Janeiro"
            } else if (latitude >= -15.9 && latitude <= -15.6 && longitude >= -48.0 && longitude <= -47.8) {
              city = "Brasília"
            } else {
              city = "Localização detectada"
            }
          }

          setUserLocation({
            city,
            loading: false,
            error: null,
          })

          // NÃO filtrar produtos por localização - apenas mostrar a cidade detectada
        } catch (error) {
          console.error("Erro ao obter cidade:", error)
          setUserLocation({
            city: "Localização não identificada",
            loading: false,
            error: null,
          })
        }
      },
      (error) => {
        console.log("Geolocation error:", error)
        setUserLocation({
          city: null,
          loading: false,
          error: null,
        })
      },
      options,
    )
  }

  const handleProductClick = (product: Product) => {
    // Armazenar o produto no localStorage para acessar na página de detalhes
    localStorage.setItem(
      "currentProduct",
      JSON.stringify({
        ...product,
        title: product.nome_item,
        price: product.valor,
        description: product.descricao,
        location: product.municipio,
        condition: product.condicao,
        category: product.categoria,
        image: product.imagem_principal,
        images: [product.imagem_principal, product.imagem_2, product.imagem_3, product.imagem_4].filter(Boolean),
        seller: {
          id: product.id,
          name: product.nome_vendedor,
          lastSeenMinutesAgo: Math.floor(Math.random() * 300) + 10,
          joinDate: "2024-09-01",
          location: product.municipio,
        },
      }),
    )
    router.push(`/produto/${product.id}`)
  }

  const handleChatClick = (product: Product) => {
    // Abrir WhatsApp com mensagem pré-definida
    const message = `Olá! Tenho interesse no produto: ${product.nome_item} - ${product.valor}`
    const whatsappNumber = product.whatsapp.replace(/\D/g, "")
    const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  useEffect(() => {
    if (isAutoRotationPaused) return

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
    }, 4000) // 4 segundos

    return () => clearInterval(interval)
  }, [banners.length, isAutoRotationPaused])

  useEffect(() => {
    // Carregar produtos do Supabase SEMPRE
    const loadProducts = async () => {
      try {
        setLoading(true)
        const data = await getProducts()
        setProducts(data) // SEMPRE definir os produtos
        setError(null)
      } catch (err) {
        console.error("Erro ao carregar produtos:", err)
        setError("Erro ao carregar produtos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    // Carregar produtos imediatamente
    loadProducts()

    // Atualizar produtos a cada 30 segundos
    const interval = setInterval(loadProducts, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Iniciar geolocalização separadamente - não interfere nos produtos
    getUserLocation()
  }, [])

  return (
    <div
      className="min-h-screen bg-gray-50 w-full overflow-x-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-white text-gray-900 border-b w-full">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp_Image_2025-06-18_at_03.04.27-removebg-preview%20%284%29-qF9rtB5ecEbXf2SpkKGvSzRZBvEhC5.png"
                alt="OLX"
                width={80}
                height={32}
                className="h-6 sm:h-8 w-auto"
              />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-2 sm:mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar em todas as categorias"
                  className="w-full pl-4 pr-12 py-2 sm:py-3 text-sm sm:text-base text-gray-900 bg-white border-0 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-700 rounded-md px-2 sm:px-4 border"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Header Actions - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 text-sm">
                <Briefcase className="h-4 w-4 mr-2" />
                Plano Profissional
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-1 w-4 h-4 mr-2">
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></div>
                </div>
                Meus Anúncios
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 text-sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 text-sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </Button>
              <Button
                variant="ghost"
                className="text-gray-700 hover:bg-gray-100 text-sm bg-gray-100 rounded-full px-6 py-2"
              >
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button
                className="bg-[#ff6e00] hover:bg-[#e55a00] text-white font-semibold px-6 rounded-full"
                onClick={() => router.push("/cadastro")}
              >
                Anunciar grátis
              </Button>
            </div>

            {/* Mobile notification icon */}
            <div className="lg:hidden flex-shrink-0">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 p-2">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Location Section */}
        <section className="bg-white border-b py-4 w-full">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-600" />

                  {userLocation.loading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      <span className="text-sm text-gray-600">Detectando localização...</span>
                    </div>
                  )}

                  {!userLocation.loading && userLocation.city && (
                    <span className="text-sm font-medium text-gray-900">{userLocation.city}</span>
                  )}

                  {!userLocation.loading && !userLocation.city && (
                    <span className="text-sm text-gray-500">Todos os produtos</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Horizontal Bar */}
        <section className="bg-white border-b py-2 w-full">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex overflow-x-auto scrollbar-hide">
              <div className="flex space-x-3 min-w-max px-2">
                {[
                  { name: "Cupons", emoji: "🏷️" },
                  { name: "Eletro", emoji: "📷" },
                  { name: "Moda", emoji: "🧺" },
                  { name: "Autos", emoji: "🚗" },
                  { name: "Autopeças", emoji: "🛞" },
                  { name: "Celulares", emoji: "📱" },
                  { name: "Imóveis", emoji: "🏠" },
                  { name: "Decoração", emoji: "🛋️" },
                  { name: "Móveis", emoji: "🛏️" },
                  { name: "Esportes", emoji: "⚽" },
                  { name: "Hobbies", emoji: "🎸" },
                  { name: "Agro", emoji: "🚜" },
                  { name: "Infantil", emoji: "🧸" },
                  { name: "Mais", emoji: "🧃" },
                ].map((category, index) => (
                  <button
                    key={index}
                    className="flex items-center space-x-2.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] transition-colors duration-200 rounded-lg px-3 py-2 min-w-max shadow-sm hover:shadow-md"
                  >
                    <span
                      className="text-lg flex-shrink-0"
                      style={{
                        filter: "sepia(1) saturate(5) hue-rotate(260deg) brightness(0.8)",
                        color: "#6e00ff",
                      }}
                    >
                      {category.emoji}
                    </span>
                    <span className="text-[#27272a] text-sm font-medium whitespace-nowrap">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Hero Carousel */}
        <section className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="relative w-full">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <Image
                      src={banner.image || "/placeholder.svg"}
                      alt={banner.alt}
                      width={1576}
                      height={400}
                      className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="container mx-auto px-4 py-8 pb-20 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Produtos Disponíveis</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {loading ? "Carregando produtos..." : `${products.length} produtos encontrados`}
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando produtos do banco de dados...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar produtos</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col w-full"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-2 sm:p-3 flex flex-col h-full">
                    <div className="relative mb-2 sm:mb-3">
                      <Image
                        src={product.imagem_principal || "/placeholder.svg"}
                        alt={product.nome_item}
                        width={200}
                        height={150}
                        className="w-full h-[120px] sm:h-[150px] object-cover rounded"
                      />
                      {product.condicao === "Novo" && (
                        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-[#5027b9] text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                          NOVO
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-grow">
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{product.valor}</p>
                      <h3 className="text-xs sm:text-sm text-gray-900 mb-1 sm:mb-2 line-clamp-2 flex-grow">
                        {product.nome_item}
                      </h3>
                      <div className="mb-1 sm:mb-2 flex flex-wrap gap-1">
                        <span className="text-[8px] sm:text-xs bg-purple-100 text-purple-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                          Entrega Fácil
                        </span>
                        <span className="text-[8px] sm:text-xs bg-purple-100 text-purple-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                          Pague Online
                        </span>
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                            <span className="truncate">{product.municipio}</span>
                          </div>
                          <button className="text-gray-400 hover:text-red-500">
                            <svg
                              className="h-3 w-3 sm:h-4 sm:w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{product.publicado_em}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-gray-500 mb-2">Seja o primeiro a cadastrar um produto!</p>
              <p className="text-xs text-gray-400 mb-4">
                💡 Para usar banco de dados real, execute o script SQL no painel de configurações
              </p>
              <Button onClick={() => router.push("/cadastro")} className="bg-[#ff6e00] hover:bg-[#e55a00] text-white">
                Cadastrar Produto
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 w-full">
        <div className="flex justify-around items-center py-2 px-4">
          {/* Início */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center py-2 px-3"
          >
            <div className="mb-1">
              <svg className="h-6 w-6 text-[#FF6600]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#FF6600]">Início</span>
          </button>

          {/* Buscar */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center py-2 px-3"
          >
            <div className="mb-1">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Buscar</span>
          </button>

          {/* Anunciar */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center py-2 px-3"
          >
            <div className="mb-1">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Anunciar</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center py-2 px-3"
          >
            <div className="mb-1">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Chat</span>
          </button>

          {/* Conta */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center py-2 px-3"
          >
            <div className="mb-1">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Conta</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
