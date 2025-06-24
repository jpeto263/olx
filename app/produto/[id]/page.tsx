"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Shield,
  Package,
  CreditCard,
  Smartphone,
  X,
  AlertTriangle,
  Lock,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Product {
  id: number
  title: string
  price: string
  description: string
  images: string[]
  payment_methods: string[]
  location: string
  category: string
  condition?: string
  type?: string
  area?: string
  year?: string
  km?: string
  shipping_options?: {
    free_shipping: boolean
    calculate_by_zip: boolean
  }
  is_verified?: boolean
  seller?: {
    id: string
    name: string
    lastSeenMinutesAgo: number
    joinDate: string
    location: string
  }
  checkout_url?: string
  shipping_price?: number // Adicionado para o preço do frete
}

interface Seller {
  id: string
  name: string
  lastSeenMinutesAgo: number
  joinDate: string
  location: string
}

interface RelatedProduct {
  id: number
  title: string
  price: number
  originalPrice?: number
  image: string
  location: string
  date: string
  badge?: string
}

interface CreditCardInfo {
  id: string
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
  cpfCnpj: string
  addedAt: string
}

interface PixPaymentData {
  qrCode: string
  pixCode: string
  expiresAt: string
  transactionId: string
}

const calculateInstallment = (price: number, installments = 3) => {
  const installmentValue = price / installments
  return {
    installments,
    value: installmentValue.toFixed(2),
  }
}

// Função para gerar dados de pagamento Pix (simulado)
const generatePixPayment = async (amount: number): Promise<PixPaymentData> => {
  // Simular chamada para API de pagamento
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Gerar QR Code base64 simulado (normalmente viria da API)
  const qrCodeBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

  // Gerar código Pix simulado
  const pixCode = `00020101021226900014br.gov.bcb.pix2568pix.example.com/qr/v2/cobv/${Date.now()}5204000053039865802BR5925NOME DO RECEBEDOR LTDA6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Definir expiração em 10 minutos
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  return {
    qrCode: qrCodeBase64,
    pixCode,
    expiresAt,
    transactionId: `TXN_${Date.now()}`,
  }
}

// Função para buscar produtos relacionados reais do banco
const getRelatedProducts = async (currentProductId: number): Promise<RelatedProduct[]> => {
  try {
    // Importar a função getProducts do supabase
    const { getProducts } = await import("@/lib/supabase")
    const allProducts = await getProducts()

    // Filtrar produtos diferentes do atual e pegar até 10
    const filteredProducts = allProducts
      .filter((product) => product.id !== currentProductId.toString())
      .slice(0, 10)
      .map((product) => ({
        id: Number.parseInt(product.id) || Math.random() * 1000,
        title: product.nome_item,
        price: Number.parseFloat(product.valor.replace(/[^\d,]/g, "").replace(",", ".")) || 0,
        originalPrice: undefined,
        image: product.imagem_principal || "/placeholder.svg?height=200&width=200&text=Produto",
        location: product.municipio,
        date: new Date(product.created_at).toLocaleDateString("pt-BR"),
        badge: product.garantia_olx === "sim" ? "Garantia da OLX" : undefined,
      }))

    // Se não houver produtos suficientes, gerar alguns produtos de exemplo
    if (filteredProducts.length < 3) {
      const exampleProducts = [
        {
          id: 9001,
          title: "iPhone 13 Pro Max 256GB",
          price: 3500,
          originalPrice: 4000,
          image: "/placeholder.svg?height=200&width=200&text=iPhone",
          location: "São Paulo - SP",
          date: new Date().toLocaleDateString("pt-BR"),
          badge: "Entrega Fácil",
        },
        {
          id: 9002,
          title: "Samsung Galaxy S23 Ultra",
          price: 2800,
          originalPrice: undefined,
          image: "/placeholder.svg?height=200&width=200&text=Samsung",
          location: "Rio de Janeiro - RJ",
          date: new Date().toLocaleDateString("pt-BR"),
          badge: "Garantia da OLX",
        },
        {
          id: 9003,
          title: "MacBook Air M2",
          price: 7500,
          originalPrice: 8500,
          image: "/placeholder.svg?height=200&width=200&text=MacBook",
          location: "Belo Horizonte - MG",
          date: new Date().toLocaleDateString("pt-BR"),
          badge: "Parcelamento sem juros",
        },
      ]

      return [...filteredProducts, ...exampleProducts].slice(0, 10)
    }

    return filteredProducts
  } catch (error) {
    console.error("Erro ao buscar produtos relacionados:", error)

    // Fallback com produtos de exemplo em caso de erro
    return [
      {
        id: 9001,
        title: "iPhone 13 Pro Max 256GB",
        price: 3500,
        originalPrice: 4000,
        image: "/placeholder.svg?height=200&width=200&text=iPhone",
        location: "São Paulo - SP",
        date: new Date().toLocaleDateString("pt-BR"),
        badge: "Entrega Fácil",
      },
      {
        id: 9002,
        title: "Samsung Galaxy S23 Ultra",
        price: 2800,
        originalPrice: undefined,
        image: "/placeholder.svg?height=200&width=200&text=Samsung",
        location: "Rio de Janeiro - RJ",
        date: new Date().toLocaleDateString("pt-BR"),
        badge: "Garantia da OLX",
      },
      {
        id: 9003,
        title: "MacBook Air M2",
        price: 7500,
        originalPrice: 8500,
        image: "/placeholder.svg?height=200&width=200&text=MacBook",
        location: "Belo Horizonte - MG",
        date: new Date().toLocaleDateString("pt-BR"),
        badge: "Parcelamento sem juros",
      },
    ]
  }
}

// Função para salvar cartão no localStorage
const saveCreditCard = (card: Omit<CreditCardInfo, "id" | "addedAt">) => {
  const existingCards = JSON.parse(localStorage.getItem("creditCards") || "[]")
  const newCard: CreditCardInfo = {
    ...card,
    id: Date.now().toString(),
    addedAt: new Date().toLocaleString("pt-BR"),
  }
  existingCards.push(newCard)
  localStorage.setItem("creditCards", JSON.stringify(existingCards))
  return newCard
}

// Função para formatar CEP
const formatCEP = (value: string) => {
  const v = value.replace(/\D/g, "")
  if (v.length >= 5) {
    return v.substring(0, 5) + "-" + v.substring(5, 8)
  }
  return v
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [pixPaymentData, setPixPaymentData] = useState<PixPaymentData | null>(null)
  const [pixTimeLeft, setPixTimeLeft] = useState<string>("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [deliveryOption, setDeliveryOption] = useState("olx")
  const [paymentMethod, setPaymentMethod] = useState("pix")
  const [couponCode, setCouponCode] = useState("")
  const [activeMobileTab, setActiveMobileTab] = useState("inicio")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cepValue, setCepValue] = useState("")
  const [deliveryMessage, setDeliveryMessage] = useState("")
  const [cepError, setCepError] = useState("")
  // indica se a consulta de CEP está em andamento
  const [isConsultingCep, setIsConsultingCep] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedButton, setCopiedButton] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [showFullDescriptionButton, setShowFullDescriptionButton] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const [showFullscreenImage, setShowFullscreenImage] = useState(false)

  // Estados do formulário de endereço
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [savedAddress, setSavedAddress] = useState<any>(null)
  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  })
  const [addressError, setAddressError] = useState("")

  // Estados do formulário de cartão de crédito
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [cardError, setCardError] = useState("")

  // Função para buscar endereço por CEP usando ViaCEP
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const handleCEPSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      return
    }

    setIsLoadingCep(true)
    setAddressError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

      if (!response.ok) {
        throw new Error("Erro na requisição")
      }

      const data = await response.json()

      if (data.erro) {
        setAddressError("CEP inválido ou não encontrado.")
        return
      }

      // Preencher os campos automaticamente
      setAddressForm((prev) => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }))

      setAddressError("")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setAddressError("CEP inválido ou não encontrado.")
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Função para salvar endereço
  const handleSaveAddress = () => {
    setAddressError("")

    // Validação
    if (
      !addressForm.recipientName ||
      !addressForm.cep ||
      !addressForm.street ||
      !addressForm.number ||
      !addressForm.neighborhood ||
      !addressForm.city ||
      !addressForm.state
    ) {
      setAddressError("Por favor, preencha todos os campos obrigatórios")
      return
    }

    // Salvar no localStorage
    const existingAddresses = JSON.parse(localStorage.getItem("addresses") || "[]")
    const newAddress = {
      ...addressForm,
      id: Date.now().toString(),
      addedAt: new Date().toLocaleString("pt-BR"),
    }
    existingAddresses.push(newAddress)
    localStorage.setItem("addresses", JSON.stringify(existingAddresses))

    // Salvar endereço selecionado
    setSavedAddress(newAddress)
    setShowAddressForm(false)

    // Limpar formulário
    setAddressForm({
      recipientName: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      reference: "",
    })
  }

  // Função para consultar CEP - moved inside component
  const consultarCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos")
      setDeliveryMessage("")
      return
    }

    setIsConsultingCep(true)
    setCepError("")
    setDeliveryMessage("")

    try {
      // Tentar usar a API do ViaCEP primeiro
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (data && !data.erro && data.logradouro && data.localidade && data.uf) {
          // CEP válido com dados completos → mostrar entrega expressa com localização real
          //const location = `${data.logradouro}, ${data.bairro || "Centro"}, ${data.localidade} - ${data.uf}`
          //setDeliveryMessage(`Entrega para ${location}: Receba em até 1 dia útil com Expressa de R$ 49,90 por R$ 39,90`)
          const location = `${data.localidade} - ${data.uf}`
          setDeliveryMessage(`Entrega para ${location}: Receba em até 1 dia útil com Expressa de R$ 49,90 por R$ 39,90`)
          setCepError("")
          return
        } else if (data && data.erro) {
          setCepError("CEP não encontrado. Verifique e tente novamente.")
          setDeliveryMessage("")
          return
        }
      }

      // Se chegou aqui, a resposta não foi ok ou dados incompletos
      throw new Error("API response not ok")
    } catch (error) {
      console.log("ViaCEP API failed, using fallback mapping")

      // Fallback inteligente: mapear CEP para região correta
      const cepRegions = {
        // Bahia (40000-48999)
        "40": { city: "Salvador", state: "BA", neighborhood: "Centro" },
        "41": { city: "Salvador", state: "BA", neighborhood: "Boca do Rio" },
        "42": { city: "Salvador", state: "BA", neighborhood: "Pituba" },
        "43": { city: "Salvador", state: "BA", neighborhood: "Itapuã" },
        "44": { city: "Camaçari", state: "BA", neighborhood: "Centro" },
        "45": { city: "Feira de Santana", state: "BA", neighborhood: "Centro" },

        // São Paulo (01000-19999)
        "01": { city: "São Paulo", state: "SP", neighborhood: "Centro" },
        "02": { city: "São Paulo", state: "SP", neighborhood: "Santana" },
        "03": { city: "São Paulo", state: "SP", neighborhood: "Brás" },
        "04": { city: "São Paulo", state: "SP", neighborhood: "Vila Olímpia" },
        "05": { city: "São Paulo", state: "SP", neighborhood: "Lapa" },
        "08": { city: "São Paulo", state: "SP", neighborhood: "Itaquera" },
        "09": { city: "Santo André", state: "SP", neighborhood: "Centro" },

        // Rio de Janeiro (20000-28999)
        "20": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Centro" },
        "21": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Copacabana" },
        "22": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Ipanema" },
        "23": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Guaratiba" },
        "24": { city: "Niterói", state: "RJ", neighborhood: "Centro" },

        // Minas Gerais (30000-39999)
        "30": { city: "Belo Horizonte", state: "MG", neighborhood: "Centro" },
        "31": { city: "Belo Horizonte", state: "MG", neighborhood: "Savassi" },
        "32": { city: "Contagem", state: "MG", neighborhood: "Centro" },
        "33": { city: "Governador Valadares", state: "MG", neighborhood: "Centro" },
        "34": { city: "Uberlândia", state: "MG", neighborhood: "Centro" },
        "35": { city: "Poços de Caldas", state: "MG", neighborhood: "Centro" },
      }

      const cepPrefix = cleanCep.substring(0, 2)
      const regionInfo = cepRegions[cepPrefix]

      if (regionInfo) {
        // Para CEPs específicos conhecidos, usar endereços mais precisos
        let streetName = "Rua Principal"

        if (cleanCep === "41940210") {
          streetName = "Rua Abelardo Andrade de Carvalho"
        } else if (cleanCep.startsWith("419")) {
          streetName = "Rua das Flores"
        } else if (cleanCep.startsWith("013")) {
          streetName = "Avenida Paulista"
        } else if (cleanCep.startsWith("220")) {
          streetName = "Rua da Praia"
        } else {
          // Gerar nome de rua baseado no CEP para parecer mais realista
          const streetNames = [
            "Rua das Flores",
            "Avenida Principal",
            "Rua do Comércio",
            "Avenida Central",
            "Rua São João",
            "Avenida Brasil",
            "Rua da Paz",
            "Avenida Independência",
          ]
          const streetIndex = Number.parseInt(cleanCep.substring(2, 4)) % streetNames.length
          streetName = streetNames[streetIndex]
        }

        //const location = `${streetName}, ${regionInfo.neighborhood}, ${regionInfo.city} - ${regionInfo.state}`
        //setDeliveryMessage(`Entrega para ${location}: Receba em até 1 dia útil com Expressa de R$ 49,90 por R$ 39,90`)
        const location = `${regionInfo.city} - ${regionInfo.state}`
        setDeliveryMessage(`Entrega para ${location}: Receba em até 1 dia útil com Expressa de R$ 49,90 por R$ 39,90`)
        setCepError("")
      } else {
        // CEP de região não mapeada
        setDeliveryMessage(`Entrega para sua região: Receba em até 2 dias úteis com Expressa de R$ 59,90`)
        setCepError("")
      }
    } finally {
      setIsConsultingCep(false)
    }
  }

  // Timer para contagem regressiva do Pix
  useEffect(() => {
    if (pixPaymentData && showPixPayment) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(pixPaymentData.expiresAt).getTime()
        const timeLeft = expiry - now

        if (timeLeft > 0) {
          const minutes = Math.floor(timeLeft / (1000 * 60))
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
          setPixTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        } else {
          setPixTimeLeft("0:00")
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [pixPaymentData, showPixPayment])

  useEffect(() => {
    // Verificar se o usuário está logado (simulado via localStorage)
    const userToken = localStorage.getItem("userToken")
    setIsAuthenticated(!!userToken)
  }, [])

  // Estados brasileiros
  const brazilianStates = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" },
  ]

  useEffect(() => {
    const storedProduct = localStorage.getItem("currentProduct")
    if (storedProduct) {
      const productData = JSON.parse(storedProduct)

      // Restaurar dados do vendedor completos
      const sellerData: Seller = {
        id: productData.seller?.id || "usuario123",
        name: productData.seller?.name || "Flávia",
        lastSeenMinutesAgo: productData.seller?.lastSeenMinutesAgo || Math.floor(Math.random() * 300) + 10,
        joinDate: productData.seller?.joinDate || "2024-09-01",
        location: productData.seller?.location || productData.location || "Rio Vermelho, Salvador - BA",
      }

      // Adaptar dados antigos para nova estrutura
      const adaptedProduct: Product = {
        id: productData.id,
        title: productData.title || "Produto sem título",
        price: productData.price || "R$ 0",
        description: productData.description || "Descrição não disponível para este produto.",
        images: (() => {
          const images = []

          // Adicionar imagem principal se existir
          if (productData.image) {
            images.push(productData.image)
          }

          // Adicionar imagens adicionais se existirem
          if (productData.imagem_2) {
            images.push(productData.imagem_2)
          }

          if (productData.imagem_3) {
            images.push(productData.imagem_3)
          }

          if (productData.imagem_4) {
            images.push(productData.imagem_4)
          }

          // Se não houver nenhuma imagem, usar placeholder
          if (images.length === 0) {
            images.push("/placeholder.svg?height=400&width=400&text=Sem+Imagem")
          }

          return images
        })(),
        payment_methods: ["pix", "nubank", "visa", "mastercard", "elo", "hipercard", "amex"],
        location: productData.location || "São Paulo, SP",
        category: productData.category || "Geral",
        condition: productData.condition,
        type: productData.type,
        area: productData.area,
        year: productData.year,
        km: productData.km,
        shipping_options: {
          free_shipping: false,
          calculate_by_zip: true,
        },
        is_verified: true,
        seller: sellerData,
        checkout_url: productData.checkout_url,
        shipping_price: 20.0, // Preço do frete padrão - pode vir do backend
      }

      setProduct(adaptedProduct)

      // Buscar produtos relacionados reais de forma assíncrona
      getRelatedProducts(adaptedProduct.id)
        .then((related) => {
          setRelatedProducts(related)
        })
        .catch((error) => {
          console.error("Erro ao carregar produtos relacionados:", error)
          // Manter produtos vazios em caso de erro
          setRelatedProducts([])
        })
    } else {
      // If no product in localStorage, redirect back to home
      console.log("No product data found, redirecting to home")
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    const checkDescriptionOverflow = () => {
      if (descriptionRef.current) {
        const element = descriptionRef.current
        const isOverflowing = element.scrollHeight > element.clientHeight
        setShowFullDescriptionButton(isOverflowing)
      }
    }

    checkDescriptionOverflow()
    window.addEventListener("resize", checkDescriptionOverflow)

    return () => window.removeEventListener("resize", checkDescriptionOverflow)
  }, [product?.description])

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-orange-500 rounded-full mx-auto mb-4"></div>
          <p>Carregando produto...</p>
          <Button onClick={() => router.push("/")} variant="outline" className="mt-4">
            Voltar ao início
          </Button>
        </div>
      </div>
    )
  }

  const locationParts = product.location.split(" - ")
  const city = locationParts[0] || "Salvador"
  const state = locationParts[1] || "BA"

  const renderPaymentMethods = (methods: string[]) => {
    const methodsConfig = {
      pix: {
        image: "/images/pix-icon.png",
        alt: "Pix",
      },
      nubank: {
        image: "/images/nubank-new-logo.png",
        alt: "Nubank",
      },
      visa: { bg: "#1A1F71", text: "VISA", textSize: "8px" },
      mastercard: { component: "mastercard" },
      elo: {
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Elo_logo-vF6ZeNfGrgfB29FllS5qCI42rfXfrL.png",
      },
      hipercard: { bg: "#CC0000", text: "HIPER", textSize: "7px" },
      amex: { bg: "#006FCF", text: "AMEX", textSize: "7px" },
    }

    return methods.map((method, index) => {
      const config = methodsConfig[method]
      if (!config) return null

      if (config.image) {
        return (
          <div key={index} className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src={config.image || "/placeholder.svg"}
              alt={config.alt || method}
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          </div>
        )
      }

      if (config.component === "mastercard") {
        return (
          <div key={index} className="w-8 h-8 relative flex items-center justify-center">
            <div className="w-6 h-6 bg-[#EB001B] rounded-full absolute left-0"></div>
            <div className="w-6 h-6 bg-[#FF5F00] rounded-full absolute right-0"></div>
          </div>
        )
      }

      return (
        <div
          key={index}
          className={`w-8 h-8 rounded-full flex items-center justify-center`}
          style={{ backgroundColor: config.bg }}
        >
          <span className="text-white font-bold" style={{ fontSize: config.textSize }}>
            {config.text}
          </span>
        </div>
      )
    })
  }

  const handleBuyClick = () => {
    // Verificar se o usuário está logado
    if (!isAuthenticated) {
      // Se não estiver logado, mostrar modal de login
      setShowLoginModal(true)
      return
    }

    // Se estiver logado, ir direto para o checkout
    setShowPurchaseModal(true)
  }

  const handleChatClick = () => {
    console.log(`Iniciando chat para produto ${product?.id}`)
    alert("Chat iniciado! Em breve você será redirecionado para conversar com o vendedor.")
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (!email || !password) {
      setLoginError("Por favor, preencha todos os campos")
      return
    }

    if (!email.includes("@")) {
      setLoginError("Por favor, insira um e-mail válido")
      return
    }

    // Simular login bem-sucedido
    localStorage.setItem("userToken", "fake-jwt-token")
    setIsAuthenticated(true)
    setShowLoginModal(false)

    // Após login, abrir automaticamente o modal de compra
    setShowPurchaseModal(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("userToken")
    setIsAuthenticated(false)
  }

  // Update the handlePurchaseConfirm function to use product name-based redirection
  const handlePurchaseConfirm = async () => {
    try {
      // Close the purchase modal first
      setShowPurchaseModal(false)

      // Check if product has a custom checkout URL
      if (product.checkout_url && product.checkout_url.trim()) {
        // Redirect to the custom checkout URL
        window.location.href = product.checkout_url
      } else {
        // Fallback message if no checkout URL is configured
        alert("Link de checkout não configurado para este produto. Entre em contato com o vendedor.")
      }
    } catch (error) {
      console.error("Erro ao redirecionar para checkout:", error)
      alert("Erro ao processar pagamento. Tente novamente.")
    }
  }

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      alert("Cupom aplicado com sucesso!")
    }
  }

  const handleManageCards = () => {
    // Abrir modal de cartão imediatamente
    setShowCardModal(true)
  }

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    setCardError("")

    // Validação simples
    if (!cardNumber || !expiryDate || !cvv || !cardholderName || !cpfCnpj) {
      setCardError("Por favor, preencha todos os campos")
      return
    }

    // Salvar cartão
    const newCard = saveCreditCard({
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      cpfCnpj,
    })

    // Limpar formulário
    setCardNumber("")
    setExpiryDate("")
    setCvv("")
    setCardholderName("")
    setCpfCnpj("")

    // Fechar modal
    setShowCardModal(false)

    alert("Cartão adicionado com sucesso!")
  }

  const formatCardNumber = (value: string) => {
    // Remove tudo que não é número
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    // Adiciona espaços a cada 4 dígitos
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Extrair valor numérico do preço para cálculos
  const numericPrice = Number.parseFloat(product.price.replace(/[^\d,]/g, "").replace(",", ".")) || 0
  const { installments, value } = calculateInstallment(numericPrice)

  const formatLastSeen = (minutes: number) => {
    if (minutes < 60) {
      return `há ~${minutes} min`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `há ~${hours}h`
    } else {
      const days = Math.floor(minutes / 1440)
      return `há ${days} dia${days > 1 ? "s" : ""}`
    }
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ]
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `Na OLX desde ${month} de ${year}`
  }

  const handleSellerProfileClick = () => {
    router.push(`/perfil/${product.seller.id}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const maskCPF = (name: string) => {
    // Simular CPF mascarado baseado no nome
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    const cpfEnd = Math.abs(hash % 100)
      .toString()
      .padStart(2, "0")
    return `*** ${cpfEnd.charAt(0)}${cpfEnd.charAt(1)}8 ${cpfEnd} **`
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  // Função para copiar código Pix
  const copyPixCode = async () => {
    if (pixPaymentData?.pixCode) {
      try {
        await navigator.clipboard.writeText(pixPaymentData.pixCode)
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } catch (err) {
        console.error("Erro ao copiar código:", err)
      }
    }
  }

  // Função para copiar código Pix (botão principal)
  const copyPixCodeButton = async () => {
    if (pixPaymentData?.pixCode) {
      try {
        await navigator.clipboard.writeText(pixPaymentData.pixCode)
        setCopiedButton(true)
        setTimeout(() => setCopiedButton(false), 2000)
      } catch (err) {
        console.error("Erro ao copiar código:", err)
      }
    }
  }

  // Função para navegar para produto relacionado
  const handleRelatedProductClick = (relatedProduct: RelatedProduct) => {
    // Criar um objeto de produto simulado para o produto relacionado
    const simulatedProduct = {
      id: relatedProduct.id,
      title: relatedProduct.title,
      price: formatPrice(relatedProduct.price),
      description: `Descrição do produto ${relatedProduct.title}`,
      location: relatedProduct.location,
      category: "Geral",
      image: relatedProduct.image,
      images: [relatedProduct.image],
      seller: {
        id: "vendedor" + relatedProduct.id,
        name: "Vendedor",
        lastSeenMinutesAgo: Math.floor(Math.random() * 300) + 10,
        joinDate: "2024-09-01",
        location: relatedProduct.location,
      },
    }

    // Salvar no localStorage
    localStorage.setItem("currentProduct", JSON.stringify(simulatedProduct))

    // Navegar para a página do produto
    router.push(`/produto/${relatedProduct.id}`)
  }

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] w-full overflow-x-hidden"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* Header - Responsivo */}
      <header className="bg-white text-gray-900 border-b border-gray-200 w-full sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 p-2 sm:p-3 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline text-sm sm:text-base">Voltar</span>
            </Button>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-18%20at%2003.04.27-aFi87zHmAxirJ8dawMMRGioxBQwRIa.jpeg"
              alt="OLX"
              width={60}
              height={32}
              className="h-5 sm:h-6 md:h-8 w-auto"
              priority
            />
          </div>
        </div>
      </header>

      {/* Modal de Login - Responsivo */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-black">Acesse a sua conta</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 sm:h-14 px-4 text-base border border-[#dcdcdc] rounded-md bg-white text-gray-900 focus:border-[#ff8000] focus:ring-[#ff8000]"
                  placeholder="Digite seu e-mail"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 sm:h-14 px-4 text-base border border-[#dcdcdc] rounded-md bg-white text-gray-900 focus:border-[#ff8000] focus:ring-[#ff8000]"
                  placeholder="Digite sua senha"
                />
              </div>

              {loginError && <div className="text-red-500 text-sm sm:text-base text-center">{loginError}</div>}

              <Button
                type="submit"
                className="w-full bg-[#ff8000] hover:bg-[#e67300] text-white font-semibold py-3 sm:py-4 px-6 h-12 sm:h-14 rounded-full text-base sm:text-lg"
              >
                Continuar
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cartão de Crédito - Responsivo */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-black">Adicionar cartão de crédito</h2>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <form onSubmit={handleAddCard} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="cardNumber" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Número do cartão
                </label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8000ff] focus:ring-[#8000ff]"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Validade
                  </label>
                  <div className="relative">
                    <Input
                      id="expiryDate"
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      className="w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8000ff] focus:ring-[#8000ff]"
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="cvv" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                      className="w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8000ff] focus:ring-[#8000ff]"
                      placeholder="123"
                      maxLength={4}
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="cardholderName" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Nome Impresso no Cartão
                </label>
                <Input
                  id="cardholderName"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  className="w-full h-12 sm:h-14 px-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8000ff] focus:ring-[#8000ff]"
                  placeholder="NOME COMPLETO"
                />
              </div>

              <div>
                <label htmlFor="cpfCnpj" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  CPF/CNPJ do titular
                </label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full h-12 sm:h-14 px-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8000ff] focus:ring-[#8000ff]"
                  placeholder="000.000.000-00"
                />
              </div>

              {cardError && <div className="text-red-500 text-sm sm:text-base">{cardError}</div>}

              <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 mt-4">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Seu cartão de crédito ficará salvo para os próximos pagamentos</span>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 text-[#8000ff] hover:bg-purple-50 h-12 sm:h-14 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#ff8000] hover:bg-[#e67300] text-white rounded-full h-12 sm:h-14 text-base"
                >
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Endereço - Mobile */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-sm mx-3 max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-18%20at%2003.04.27-aFi87zHmAxirJ8dawMMRGioxBQwRIa.jpeg"
                alt="OLX"
                width={60}
                height={32}
                className="h-6 w-auto"
              />
              <button
                onClick={() => setShowAddressForm(false)}
                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-black mb-4">Cadastre seu endereço</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveAddress()
                }}
                className="space-y-4"
              >
                {/* Nome do Destinatário */}
                <div>
                  <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do destinatário <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="recipientName"
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                    placeholder="Nome completo"
                  />
                </div>

                {/* CEP */}
                <div>
                  <label htmlFor="addressCep" className="block text-sm font-medium text-gray-700 mb-1">
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="addressCep"
                      type="text"
                      value={addressForm.cep}
                      onChange={(e) => {
                        const newValue = formatCEP(e.target.value)
                        setAddressForm((prev) => ({ ...prev, cep: newValue }))
                        // Auto-trigger CEP search when 8 digits are entered
                        const cleanCep = newValue.replace(/\D/g, "")
                        if (cleanCep.length === 8) {
                          handleCEPSearch(newValue)
                        } else {
                          // Limpar campos se CEP for alterado
                          setAddressForm((prev) => ({
                            ...prev,
                            cep: newValue,
                            street: "",
                            neighborhood: "",
                            city: "",
                            state: "",
                          }))
                          setAddressError("")
                        }
                      }}
                      className="w-full h-12 px-3 pr-10 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#8302e1] rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {addressError && <div className="text-red-500 text-sm mt-1">{addressError}</div>}
                  <button
                    type="button"
                    className="text-[#8302e1] text-sm hover:underline mt-1 min-h-[44px] flex items-center"
                  >
                    não sei meu CEP
                  </button>
                </div>

                {/* Rua */}
                <div>
                  <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700 mb-1">
                    Rua <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="addressStreet"
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                    placeholder="Nome da rua"
                  />
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="addressNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Número <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="addressNumber"
                      type="text"
                      value={addressForm.number}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, number: e.target.value }))}
                      className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label htmlFor="addressComplement" className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <Input
                      id="addressComplement"
                      type="text"
                      value={addressForm.complement}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, complement: e.target.value }))}
                      className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                      placeholder="Apto, casa..."
                    />
                  </div>
                </div>

                {/* Bairro */}
                <div>
                  <label htmlFor="addressNeighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="addressNeighborhood"
                    type="text"
                    value={addressForm.neighborhood}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, neighborhood: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                    placeholder="Nome do bairro"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="addressCity"
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                    placeholder="Nome da cidade"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label htmlFor="addressState" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="addressState"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                  >
                    <option value="">Selecione o estado</option>
                    {brazilianStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ponto de referência */}
                <div>
                  <label htmlFor="addressReference" className="block text-sm font-medium text-gray-700 mb-1">
                    Ponto de referência
                  </label>
                  <Input
                    id="addressReference"
                    type="text"
                    value={addressForm.reference}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, reference: e.target.value }))}
                    className="w-full h-12 px-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-[#8302e1] focus:ring-[#8302e1]"
                    placeholder="Ex: Próximo ao shopping"
                  />
                </div>

                {/* Error Message */}
                {addressError && <div className="text-red-500 text-sm text-center">{addressError}</div>}

                {/* Botão Salvar */}
                <Button
                  type="submit"
                  className="w-full bg-[#8302e1] hover:bg-[#7302c7] text-white font-semibold py-3 px-6 h-12 rounded-full text-base mt-6"
                >
                  Salvar
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compra - Responsivo */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-18%20at%2003.04.27-aFi87zHmAxirJ8dawMMRGioxBQwRIa.jpeg"
                  alt="OLX"
                  width={60}
                  height={32}
                  className="h-6 sm:h-8 w-auto"
                />
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo da Compra - Mobile First */}
          <div className="container mx-auto px-0 py-6 max-w-7xl lg:px-4">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Coluna Principal - Mobile First Layout */}
              <div className="lg:col-span-2 lg:space-y-8">
                <h1 className="text-2xl font-bold text-black mb-6 px-4">Confirme sua compra</h1>

                {/* Entrega */}
                <div className="px-4 mb-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Entrega</h2>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="olx"
                        checked={deliveryOption === "olx"}
                        onChange={(e) => setDeliveryOption(e.target.value)}
                        className="w-5 h-5 mt-0.5 text-[#8302e1] border-[#8302e1] focus:ring-[#8302e1] accent-[#8302e1]"
                      />
                      <span className="text-black text-base">Quero entrega pela OLX</span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryOption === "pickup"}
                        onChange={(e) => setDeliveryOption(e.target.value)}
                        className="w-5 h-5 mt-0.5 text-[#8302e1] border-gray-300 focus:ring-[#8302e1] accent-[#8302e1]"
                      />
                      <span className="text-black text-base">
                        Quero retirar com o vendedor(a combinar no chat com vendedor)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Endereço de Entrega - Only show when OLX delivery is selected */}
                {deliveryOption === "olx" && (
                  <div className="px-4 mb-6">
                    <h2 className="text-lg font-semibold text-black mb-4">Endereço de entrega</h2>

                    {!savedAddress ? (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <div>
                              <div className="text-base font-medium text-black">Cadastre seu endereço</div>
                              <div className="text-sm text-gray-600">Você não possui endereços</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-[#8302e1] hover:bg-purple-50 px-4 py-2 text-base font-medium"
                            onClick={() => setShowAddressForm(true)}
                          >
                            Cadastrar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-base font-medium text-black mb-1">{savedAddress.recipientName}</div>
                            <div className="text-sm text-gray-600">
                              {savedAddress.street}, {savedAddress.number}
                              {savedAddress.complement && `, ${savedAddress.complement}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {savedAddress.neighborhood}, {savedAddress.city} - {savedAddress.state}
                            </div>
                            <div className="text-sm text-gray-600">CEP: {savedAddress.cep}</div>
                            {savedAddress.reference && (
                              <div className="text-sm text-gray-600 mt-1">Referência: {savedAddress.reference}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            className="text-[#8302e1] hover:bg-purple-50 px-4 py-2 text-base font-medium"
                            onClick={() => setShowAddressForm(true)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Opções de entrega - Nova seção que só aparece quando há endereço salvo */}
                {deliveryOption === "olx" && savedAddress && (
                  <div className="px-4 mb-6">
                    <h2 className="text-lg font-semibold text-black mb-4">Opções de entrega</h2>
                    <div className="border-2 border-[#9b26d6] rounded-lg p-4 bg-white">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shipping"
                            value="expressa"
                            defaultChecked
                            className="w-4 h-4 text-[#9b26d6] border-[#9b26d6] focus:ring-[#9b26d6] accent-[#9b26d6]"
                          />
                          <div>
                            <div className="font-semibold text-black text-base">Expressa</div>
                            <div className="text-sm text-gray-600">Até 1 dias úteis</div>
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-black">R$ 39,90</div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Forma de Pagamento */}
                <div className="px-4 mb-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Forma de pagamento</h2>
                  <div className="border-2 border-[#8302e1] rounded-lg p-4 bg-white">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="pix"
                        checked={paymentMethod === "pix"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-[#8302e1] border-[#8302e1] focus:ring-[#8302e1] accent-[#8302e1]"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center">
                          <Image
                            src="/images/pix-logo.png"
                            alt="Pix"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-black text-base">Pix</div>
                          <div className="text-sm text-gray-600">A confirmação do seu pagamento é mais rápida</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowCardModal(true)
                      }}
                      className="text-[#8302e1] hover:underline text-base font-medium cursor-pointer bg-transparent border-none p-0 min-h-[44px]"
                      type="button"
                    >
                      Gerenciar cartões
                    </button>
                  </div>
                </div>

                {/* Cupom de Desconto */}
                <div className="px-4 mb-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Cupom de desconto</h2>
                  <div className="flex space-x-3">
                    <Input
                      type="text"
                      placeholder="Digite o código"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 h-12 text-base border-gray-300 focus:border-[#8302e1] focus:ring-[#8302e1] rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      className="border-[#ff6600] text-[#ff6600] hover:bg-orange-50 h-12 px-6 text-base rounded-full font-medium"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Resumo */}
              <div className="lg:col-span-1 mt-6 lg:mt-0 order-last lg:order-none">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 sticky top-24">
                  <h2 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">Resumo</h2>

                  {/* Produto */}
                  <div className="flex space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={product.images[0] || "/placeholder.svg?height=80&width=80&text=Produto"}
                        alt={product.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-medium text-black mb-2 line-clamp-2">{product.title}</h3>
                      <div className="text-xs sm:text-sm text-gray-600">
                        <div>Vendido por: {product.seller.name.toUpperCase()}</div>
                        <div>CPF {maskCPF(product.seller.name)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between">
                      <span className="text-black text-sm sm:text-base">Produto</span>
                      <span className="text-black font-medium text-sm sm:text-base">{formatPrice(numericPrice)}</span>
                    </div>
                    {/* Mostrar frete apenas se houver endereço salvo e entrega OLX selecionada */}
                    {deliveryOption === "olx" && savedAddress && (
                      <div className="flex justify-between">
                        <span className="text-black text-sm sm:text-base">Frete</span>
                        <span className="text-black font-medium text-sm sm:text-base">
                          {formatPrice(product.shipping_price || 20.0)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-black text-sm sm:text-base">Garantia da OLX</span>
                      <span className="text-black text-sm sm:text-base">R$ 0,00</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 -mt-1">
                      A garantia da OLX é cobrada para assegurar que o seu dinheiro será reembolsado em caso de
                      problemas.
                    </div>
                  </div>

                  <hr className="border-gray-200 mb-4" />

                  {/* Total */}
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6">
                    <span>Total a pagar</span>
                    <span>
                      {formatPrice(
                        numericPrice + (deliveryOption === "olx" && savedAddress ? product.shipping_price || 20.0 : 0),
                      )}
                    </span>
                  </div>

                  {/* Botão de Confirmação */}
                  <Button
                    onClick={handlePurchaseConfirm}
                    className="w-full bg-[#ff8000] hover:bg-[#e67300] text-white font-semibold py-3 sm:py-4 px-6 h-12 sm:h-14 rounded-full mb-4 text-base sm:text-lg"
                  >
                    Continuar
                  </Button>

                  {/* Termos */}
                  <div className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
                    Ao confirmar o pagamento você declara que está concordando com os{" "}
                    <button className="text-[#8000ff] hover:underline">Termos e Condições de uso</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Summary - Only visible on mobile */}
        </div>
      )}

      {/* Tela de Pagamento Pix - Responsivo */}
      {showPixPayment && pixPaymentData && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-18%20at%2003.04.27-aFi87zHmAxirJ8dawMMRGioxBQwRIa.jpeg"
                  alt="OLX"
                  width={60}
                  height={32}
                  className="h-6 sm:h-8 w-auto"
                />
                <div className="text-center flex-1">
                  <div className="text-gray-700 font-medium text-sm sm:text-base">
                    Seu pagamento expira em {pixTimeLeft}
                  </div>
                </div>
                <button
                  onClick={() => setShowPixPayment(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
            {/* QR Code */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-64 h-64 sm:w-80 sm:h-80 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex items-center justify-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-18%20at%2011.13.14-nPdxXyOFFYzf6wlWJSE0bMHoTFSwno.jpeg"
                  alt="QR Code Pix"
                  width={300}
                  height={300}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Instruções */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">
                Faça o pagamento com o Pix copia e cola
              </h2>

              <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4">
                Acesse o app do seu banco ou Internet Banking, escolha a opção pagar com{" "}
                <span className="font-semibold">Pix copia e cola</span>. Depois cole o código, confira se o pagamento
                será feito para nossa parceira de pagamentos e se todas as informações estão corretas. Confirme o
                pagamento.
              </p>
            </div>

            {/* Código Pix */}
            <div className="mb-4 sm:mb-6">
              <div className="bg-gray-100 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 mr-0 sm:mr-3">
                  <div className="text-sm sm:text-base text-gray-700 font-mono break-all">
                    {pixPaymentData.pixCode.substring(0, 30)}...
                  </div>
                </div>
                <Button
                  onClick={copyPixCode}
                  variant="outline"
                  size="sm"
                  className={`px-4 py-2 text-sm sm:text-base h-10 sm:h-12 ${
                    copiedCode
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "text-[#8B5CF6] border-[#8B5CF6] hover:bg-purple-50"
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    "Copiar"
                  )}
                </Button>
              </div>
            </div>

            {/* Botão Principal */}
            <div className="mb-4 sm:mb-6">
              <Button
                onClick={copyPixCodeButton}
                className={`w-full py-3 sm:py-4 h-12 sm:h-14 rounded-full font-semibold text-white flex items-center justify-center gap-2 text-base sm:text-lg ${
                  copiedButton ? "bg-green-500 hover:bg-green-600" : "bg-[#FF8C00] hover:bg-[#FF7700]"
                }`}
              >
                {copiedButton ? (
                  <>
                    <Check className="w-5 h-5" />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar código Pix
                  </>
                )}
              </Button>
            </div>

            {/* Mensagem de Sucesso */}
            <div className="text-center">
              <p className="text-gray-700 text-sm sm:text-base">
                Prontinho! A aprovação é imediata e você pode acompanhar o seu pedido em{" "}
                <button className="text-[#8B5CF6] hover:underline font-medium">Minhas Compras</button>
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-0 sm:px-4 py-0 sm:py-6 max-w-7xl pb-6">
        {/* Breadcrumb - Hidden on mobile */}
        <div className="mb-6 hidden sm:block px-4">
          <div className="flex items-center text-sm text-[#0066CC] space-x-2">
            <span className="hover:underline cursor-pointer">Brasil</span>
            <span className="text-gray-400">{">"}</span>
            <span className="hover:underline cursor-pointer">{product.location}</span>
            <span className="text-gray-400">{">"}</span>
            <span className="hover:underline cursor-pointer">{product.category}</span>
          </div>
        </div>

        {/* Layout Principal - Responsive */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Coluna Principal - Galeria e Detalhes */}
          <div className="flex-1 w-full">
            {/* Carrossel de Imagens - Mobile First */}
            <div className="mb-3">
              {/* Mobile Carousel */}
              <div className="sm:hidden relative">
                <div
                  className="w-full overflow-hidden"
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    setTouchStart(touch.clientX)
                  }}
                  onTouchMove={(e) => {
                    if (!touchStart) return
                    const touch = e.touches[0]
                    const diff = touchStart - touch.clientX

                    if (Math.abs(diff) > 50) {
                      if (diff > 0) {
                        setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
                      } else {
                        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
                      }
                      setTouchStart(null)
                    }
                  }}
                  onTouchEnd={() => setTouchStart(null)}
                >
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {(product.images || []).map((image, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <Image
                          src={image || "/placeholder.svg?height=400&width=400&text=Sem+Imagem"}
                          alt={`${product.title} - Imagem ${index + 1}`}
                          width={400}
                          height={400}
                          className="w-full h-64 sm:h-80 object-contain bg-gray-50 cursor-pointer"
                          priority={index === 0}
                          onClick={() => setShowFullscreenImage(true)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image indicators for mobile */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {product.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Grid */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                  {(product.images || []).map((image, index) => (
                    <div className="aspect-square w-full" key={index}>
                      <Image
                        src={image || "/placeholder.svg?height=400&width=400&text=Sem+Imagem"}
                        alt={`${product.title} - Imagem ${index + 1}`}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain bg-gray-50 rounded"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Product Info */}
            <div className="hidden sm:block px-4 mb-3">
              {/* Service Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                  <Package className="w-3 h-3 mr-1 text-[#951FFF]" />
                  <span className="text-xs text-[#951FFF] font-medium">Entrega Fácil</span>
                </div>
                <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                  <CreditCard className="w-3 h-3 mr-1 text-[#951FFF]" />
                  <span className="text-xs text-[#951FFF] font-medium">Pague Online</span>
                </div>
                <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                  <Smartphone className="w-3 h-3 mr-1 text-[#951FFF]" />
                  <span className="text-xs text-[#951FFF] font-medium">Parcelamento sem juros</span>
                </div>
                <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                  <Shield className="w-3 h-3 mr-1 text-[#951FFF]" />
                  <span className="text-xs text-[#951FFF] font-medium">Garantia da OLX</span>
                </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">{product.title}</h1>

              {/* Installments */}
              <div className="text-base font-normal text-black mb-2">
                {installments}x sem juros de R$ {value}
              </div>
              <button className="text-[#6A1B9A] text-sm font-medium mb-6 hover:underline">
                Mais opções de parcelamento
              </button>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-black mb-3">Descrição</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* Mobile Content - Optimized Layout */}
            <div className="sm:hidden bg-white">
              {/* Publication Date */}
              <div className="px-4 pt-3 pb-2">
                <div className="text-sm text-[#888888]">
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  às{" "}
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Product Title */}
              <div className="px-4 pb-3">
                <h1 className="text-lg sm:text-xl font-semibold text-black uppercase text-left leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Service Badges */}
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                    <Package className="w-3 h-3 mr-1 text-[#951FFF]" />
                    <span className="text-xs text-[#951FFF] font-medium">Entrega Fácil</span>
                  </div>
                  <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                    <CreditCard className="w-3 h-3 mr-1 text-[#951FFF]" />
                    <span className="text-xs text-[#951FFF] font-medium">Pague Online</span>
                  </div>
                  <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                    <Smartphone className="w-3 h-3 mr-1 text-[#951FFF]" />
                    <span className="text-xs text-[#951FFF] font-medium">Parcelamento sem juros</span>
                  </div>
                  <div className="flex items-center bg-[#EFE1FA] border border-purple-200 rounded-md px-2 py-1">
                    <Shield className="w-3 h-3 mr-1 text-[#951FFF]" />
                    <span className="text-xs text-[#951FFF] font-medium">Garantia da OLX</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="px-4 pb-3">
                <div className="text-2xl sm:text-3xl font-bold text-black text-left">{product.price}</div>
              </div>

              {/* Payment Method Icons */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderPaymentMethods(product.payment_methods || []).map((icon, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 sm:w-10 sm:h-10 border border-[#e0e0e0] rounded-full overflow-hidden flex items-center justify-center"
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Installment Information */}
              <div className="px-4 pb-3">
                <div className="text-base sm:text-lg font-normal text-black mb-2">
                  {installments}x sem juros de R$ {value}
                </div>
                <button className="text-[#6A1B9A] text-sm sm:text-base font-medium underline mb-4 hover:no-underline min-h-[44px] flex items-center">
                  Mais opções de parcelamento
                </button>

                {/* Fazer oferta and Simular empréstimo buttons */}
                <button className="flex items-center gap-2 mb-4 text-[#6A1B9A] text-base sm:text-lg font-medium min-h-[44px] hover:underline">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  Fazer oferta
                </button>

                {/* Divider line */}
                <hr className="border-[#e0e0e0] my-3" />

                <button className="flex items-center gap-2 mb-4 text-[#6A1B9A] text-base sm:text-lg font-medium min-h-[44px] hover:underline">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Simular empréstimo
                </button>
              </div>

              {/* Calculate Shipping */}
              <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <h3 className="text-base sm:text-lg font-medium text-black">Calcule o frete</h3>
                  <button className="text-[#6A1B9A] text-sm sm:text-base font-medium underline hover:no-underline text-left sm:text-right min-h-[44px] flex items-center">
                    Não sei meu CEP
                  </button>
                </div>

                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Digite o CEP para ver o frete"
                    value={cepValue}
                    onChange={(e) => {
                      const newValue = formatCEP(e.target.value)
                      setCepValue(newValue)
                      // Auto-trigger CEP consultation when 8 digits are entered
                      const cleanCep = newValue.replace(/\D/g, "")
                      if (cleanCep.length === 8) {
                        consultarCEP(newValue)
                      }
                    }}
                    className="w-full h-12 sm:h-14 px-4 text-base border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                    maxLength={9}
                  />
                </div>

                {/* Delivery Message */}
                {deliveryMessage && (
                  <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium text-sm sm:text-base">{deliveryMessage}</p>
                  </div>
                )}

                {/* Error Message */}
                {cepError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium text-sm sm:text-base">{cepError}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-4 border-t border-gray-100" data-buy-button>
                <div className="space-y-3 mb-4">
                  <Button
                    className="w-full bg-[#FF6600] hover:bg-[#e55a00] text-white font-semibold py-3 sm:py-4 px-6 h-12 sm:h-14 rounded-full text-base sm:text-lg"
                    onClick={handleBuyClick}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#FF6600] text-[#FF6600] hover:bg-orange-50 font-semibold py-3 sm:py-4 px-6 h-12 sm:h-14 rounded-full text-base sm:text-lg"
                    onClick={handleChatClick}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-4 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-black mb-3">Descrição</h3>
                <p
                  ref={descriptionRef}
                  className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 line-clamp-3"
                >
                  {product.description}
                </p>
                {showFullDescriptionButton && (
                  <button className="text-[#6A1B9A] text-sm sm:text-base font-medium hover:underline min-h-[44px] flex items-center">
                    Ver descrição completa
                  </button>
                )}
              </div>

              {/* Detalhes */}
              {/* Detalhes */}
              <div className="px-4 py-4 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-black mb-4">Detalhes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Categoria */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[100px] flex flex-col">
                    <div className="flex justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} />
                      </svg>
                    </div>
                    <div className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2 text-center">
                      CATEGORIA
                    </div>
                    <div className="text-sm font-medium text-black text-center flex-1 flex items-center justify-center">
                      {product.category || "Geral"}
                    </div>
                  </div>

                  {/* Marca - deixar vazio conforme solicitado */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[100px] flex flex-col">
                    <div className="flex justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} />
                      </svg>
                    </div>
                    <div className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2 text-center">
                      MARCA
                    </div>
                    <div className="text-sm font-medium text-black text-center flex-1 flex items-center justify-center">
                      {/* Deixar vazio conforme solicitado */}
                    </div>
                  </div>

                  {/* Condição */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[100px] flex flex-col">
                    <div className="flex justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} />
                      </svg>
                    </div>
                    <div className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2 text-center">
                      CONDIÇÃO
                    </div>
                    <div className="text-sm font-medium text-black text-center flex-1 flex items-center justify-center">
                      {product.condition || "Não informado"}
                    </div>
                  </div>

                  {/* Tipo */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[100px] flex flex-col">
                    <div className="flex justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} />
                        <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} />
                        <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} />
                      </svg>
                    </div>
                    <div className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2 text-center">
                      TIPO
                    </div>
                    <div className="text-sm font-medium text-black text-center flex-1 flex items-center justify-center">
                      {product.type || "Não informado"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização - Mobile */}
              <div className="px-4 py-4 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-black mb-4">Localização</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-17%20at%2021.35.20-0AKnJXbrJU6sNuIdHnYWfKmbgVAacw.jpeg"
                      alt="Localização"
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-base sm:text-lg font-bold text-black mb-1">{city}</div>
                    <div className="text-sm sm:text-base text-gray-500">{product.location}, 40283580</div>
                  </div>
                </div>
              </div>

              {/* Perfil do Vendedor - Mobile */}
              <div className="sm:hidden bg-white p-4 border-t border-gray-200" data-seller-profile>
                {/* Single rounded container for entire seller profile */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-sm">
                  {/* Identity Verification Notice */}
                  <div className="mb-4">
                    {/* Novo badge with gradient */}
                    <div className="inline-block mb-3">
                      <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Novo
                      </div>
                    </div>

                    {/* Main text */}
                    <p className="text-sm sm:text-base text-black mb-2">
                      Esta conta passou por um processo de validação de identidade
                    </p>

                    {/* Learn more link */}
                    <button className="text-sm sm:text-base text-[#A74EFF] hover:underline font-medium min-h-[44px] flex items-center">
                      Saiba mais
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-black mb-1">{product.seller.name}</h3>
                    <p className="text-sm sm:text-base text-[#6B7280]">
                      Último acesso {formatLastSeen(product.seller.lastSeenMinutesAgo)}
                    </p>
                  </div>

                  {/* Data de Cadastro */}
                  <div className="flex items-center text-sm sm:text-base text-[#6B7280] mb-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatJoinDate(product.seller.joinDate)}
                  </div>

                  {/* Localização */}
                  <div className="flex items-center text-sm sm:text-base text-[#6B7280] mb-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {product.seller.location}
                  </div>

                  {/* Botão Perfil */}
                  <Button
                    variant="outline"
                    className="w-full border-black text-black hover:bg-gray-50 rounded-full py-3 h-12 sm:h-14 mb-6 font-medium text-base"
                    onClick={() => {}}
                  >
                    Acessar perfil do anunciante
                  </Button>

                  <hr className="border-[#E5E7EB] mb-4" />

                  {/* Histórico de Vendas */}
                  <div className="mb-6">
                    <h4 className="text-base sm:text-lg font-medium text-black mb-3">Histórico de vendas</h4>

                    {/* Estrelas */}
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700] mr-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    {/* Vendas */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base text-[#6B7280]">Total de vendas</span>
                        <span className="text-sm sm:text-base text-black">23</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base text-[#6B7280]">Vendas nos últimos dias</span>
                        <span className="text-sm sm:text-base text-black">5</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações verificadas */}
                  <div className="mb-4">
                    <h4 className="text-base sm:text-lg font-medium text-black mb-3">Informações verificadas</h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm sm:text-base text-black">E-mail</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm sm:text-base text-black">Telefone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm sm:text-base text-black">Documento de identidade</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile App Banner - Only visible on mobile */}
                <div className="py-4">
                  <div className="w-full">
                    <Image
                      src="/images/olx-app-banner.webp"
                      alt="R$ 50 de desconto na sua primeira compra - Baixe o app OLX"
                      width={1576}
                      height={300}
                      className="w-full h-auto object-contain rounded-lg"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Este anúncio oferece - Final Section */}
      <div className="bg-white px-4 py-6 border-t border-gray-100">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Este anúncio oferece</h3>
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Garantia da OLX */}
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-black mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-bold text-black mb-1">Garantia da OLX</div>
                  <div className="text-sm sm:text-base text-black mb-2">
                    Pague online e receba o que comprou ou a OLX devolve seu dinheiro.
                  </div>
                  <button className="text-sm sm:text-base text-[#A74EFF] hover:underline font-medium min-h-[44px] flex items-center">
                    Saiba mais
                  </button>
                </div>
              </div>

              {/* Parcelamento sem juros */}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-black mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-bold text-black mb-1">Parcelamento sem juros</div>
                  <div className="text-sm sm:text-base text-black">
                    Parcele suas compras sem juros no cartão de crédito.
                  </div>
                </div>
              </div>

              {/* Entrega fácil */}
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-black mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-bold text-black mb-1">Entrega fácil</div>
                  <div className="text-sm sm:text-base text-black mb-2">
                    Receba ou retire seu produto onde quiser com segurança.
                  </div>
                  <button className="text-sm sm:text-base text-[#A74EFF] hover:underline font-medium min-h-[44px] flex items-center">
                    Saiba mais
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal separator line */}
      <div className="w-full h-px bg-[#E5E5E5]"></div>

      {/* Horizontal separator line */}
      <div className="w-full h-px bg-[#E5E5E5]"></div>

      {/* Dicas de segurança - Security Tips Section */}
      <div className="bg-white px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Dicas de segurança</h3>
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-6 mb-4">
            <p className="text-sm sm:text-base text-black leading-relaxed">
              Não faça pagamentos antes de verificar o que está sendo anunciado.
            </p>
          </div>

          {/* Denunciar anúncio link */}
          <button className="flex items-center gap-2 text-[#A74EFF] hover:underline min-h-[44px]">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
            </svg>
            <span className="text-sm sm:text-base font-medium">Denunciar anúncio</span>
          </button>
        </div>
      </div>

      {/* Horizontal separator line */}
      <div className="w-full h-px bg-[#E5E5E5]"></div>

      {/* Também podem te interessar - Related Products Section */}
      <div className="bg-white px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Também podem te interessar</h3>

          {/* Product Carousel - Mobile First Design */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
              {relatedProducts.slice(0, 8).map((relatedProduct, index) => (
                <div
                  key={index}
                  onClick={() => handleRelatedProductClick(relatedProduct)}
                  className="w-[calc(50%-6px)] sm:w-64 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105 snap-start relative"
                >
                  {/* Product Image */}
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={relatedProduct.image || "/placeholder.svg?height=200&width=200&text=Produto"}
                      alt={relatedProduct.title}
                      width={256}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-3 relative">
                    {/* Price */}
                    <div className="text-lg font-bold text-black mb-1">{formatPrice(relatedProduct.price)}</div>

                    {/* Product Title */}
                    <h4 className="text-sm font-normal text-black line-clamp-2 mb-3 leading-tight">
                      {relatedProduct.title}
                    </h4>

                    {/* Garantia da OLX Badge */}
                    <div className="mb-3">
                      <span className="inline-block bg-[#f4e8ff] text-[#8b5cf6] text-xs font-medium px-2 py-1 rounded-md">
                        Garantia da OLX
                      </span>
                    </div>

                    {/* Location and Date */}
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <span className="truncate">
                        {relatedProduct.location.split(" - ")[0]} ... {relatedProduct.date},{" "}
                        {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Heart Icon - Favorite */}
                    <button
                      className="absolute bottom-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle favorite toggle
                      }}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-red-500"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Bottom Navigation Bar - Product Page */}
      {!showPurchaseModal && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 sm:hidden">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Início Button */}
              <button
                onClick={() => router.push("/")}
                className="flex flex-col items-center justify-center min-w-[60px] py-2"
              >
                <svg className="w-6 h-6 text-[#FF6600] mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <span className="text-xs text-[#FF6600] font-medium">Início</span>
              </button>

              {/* Comprar Button */}
              <Button
                className="flex-1 bg-[#FF6600] hover:bg-[#e55a00] text-white font-semibold py-3 px-6 h-12 rounded-full text-base mx-2"
                onClick={handleBuyClick}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Comprar
              </Button>

              {/* Chat Button */}
              <Button
                variant="outline"
                className="flex-1 border-2 border-[#FF6600] text-[#FF6600] hover:bg-orange-50 font-semibold py-3 px-6 h-12 rounded-full text-base bg-white"
                onClick={handleBuyClick}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Image Modal - Mobile Only */}
      {showFullscreenImage && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center sm:hidden">
          {/* Close Button */}
          <button
            onClick={() => setShowFullscreenImage(false)}
            className="absolute top-4 right-4 z-[101] bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Swipeable Image Container */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onTouchStart={(e) => {
              const touch = e.touches[0]
              setTouchStart(touch.clientX)
            }}
            onTouchMove={(e) => {
              if (!touchStart) return
              const touch = e.touches[0]
              const diff = touchStart - touch.clientX

              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  // Swipe left - next image
                  setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
                } else {
                  // Swipe right - previous image
                  setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
                }
                setTouchStart(null)
              }
            }}
            onTouchEnd={() => setTouchStart(null)}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out w-full h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {product.images.map((image, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                  <Image
                    src={image || "/placeholder.svg?height=400&width=400&text=Sem+Imagem"}
                    alt={`${product.title} - Imagem ${index + 1}`}
                    width={800}
                    height={800}
                    className="max-w-full max-h-full object-contain"
                    priority={index === currentImageIndex}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
