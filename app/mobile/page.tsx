"use client"

import { Search, Bell, MapPin, ChevronDown, Home, Plus, MessageCircle, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useState } from "react"

export default function OLXMobile() {
  const [activeTab, setActiveTab] = useState("inicio")

  const categories = [
    { name: "Cupons", emoji: "🏷️" },
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
  ]

  return (
    <div
      className="w-screen min-h-screen bg-gray-50 box-border overflow-x-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Status Bar Simulation */}
      <div className="w-full bg-white px-4 py-1 text-xs text-gray-600 flex justify-between items-center box-border">
        <div className="flex items-center gap-1">
          <span>23:44</span>
          <span>📱</span>
          <span>💬</span>
          <span>🔗</span>
          <span>📧</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🔇</span>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Browser Bar */}
      <div className="w-full bg-gray-200 px-4 py-2 flex items-center gap-3 box-border">
        <Home className="h-5 w-5 text-gray-600 flex-shrink-0" />
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-600 min-w-0">olx.com.br</div>
        <Plus className="h-5 w-5 text-gray-600 flex-shrink-0" />
        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0">
          6
        </div>
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <header className="w-full bg-white px-3 py-3 border-b border-gray-200 box-border">
        {/* Top Row - Logo, Search, Bell */}
        <div className="flex items-center gap-3 mb-3 w-full">
          {/* OLX Logo */}
          <div className="flex items-center flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp_Image_2025-06-18_at_03.04.27-removebg-preview%20%284%29-qF9rtB5ecEbXf2SpkKGvSzRZBvEhC5.png"
              alt="OLX"
              width={60}
              height={24}
              className="h-6 w-auto"
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative min-w-0">
            <Input
              type="text"
              placeholder="Buscar 'Celular'"
              className="w-full pl-4 pr-12 py-2 text-sm bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-200 text-gray-600 p-1 rounded-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0">
            <Bell className="h-5 w-5" />
          </Button>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">Bahia</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </header>

      {/* Categories Menu */}
      <section className="w-full bg-white px-3 py-3 border-b border-gray-200 box-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-2 text-sm flex-shrink-0 snap-start"
            >
              <span className="text-purple-600">{category.emoji}</span>
              <span className="text-[#333] whitespace-nowrap">{category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full flex flex-col box-border pb-20">
        {/* Car Banner */}
        <section className="w-full px-3 mt-4">
          <div className="w-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="text-white mb-2">
                  <div className="text-xs opacity-80 mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>Ano 2024</span>
                  </div>
                  <div className="text-xs opacity-80 mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>8.700 km</span>
                  </div>
                  <div className="text-xs opacity-80 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>Motor 2.0</span>
                  </div>
                </div>
                <h2 className="text-white text-xl font-bold mb-1">Carros Sedã</h2>
                <h3 className="text-white text-xl font-bold mb-3">a partir de</h3>
                <div className="text-green-400 text-2xl font-bold mb-4">R$ 50 mil.</div>
                <button className="bg-green-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-green-600">
                  Comprar agora
                </button>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Image
                  src="/placeholder.svg?height=120&width=180&text=Toyota+Corolla"
                  alt="Toyota Corolla"
                  width={180}
                  height={120}
                  className="object-contain"
                />
                <div className="text-white text-sm font-medium mt-2 text-center">Corolla</div>
              </div>
            </div>
            {/* Banner Indicators */}
            <div className="flex justify-center gap-2 pb-4">
              {[0, 1, 2, 3, 4].map((_, index) => (
                <div key={index} className={`w-8 h-1 rounded-full ${index === 0 ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* Recommended Section */}
        <section className="w-full px-3 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
            Recomendados para você em Eletroportáteis Para Cozinha e Limpeza
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Product 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <Image
                src="/placeholder.svg?height=150&width=200&text=Purificador+Branco"
                alt="Purificador de água branco"
                width={200}
                height={150}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <div className="p-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-md">Entrega Fácil</span>
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-md">Garantia da OLX</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">R$ 280</p>
                <p className="text-sm text-gray-600 mb-1">Purificador de água</p>
                <p className="text-xs text-gray-500">Salvador, BA</p>
                <p className="text-xs text-gray-400">Hoje, 14:30</p>
              </div>
            </div>

            {/* Product 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <Image
                src="/placeholder.svg?height=150&width=200&text=Purificador+Cinza"
                alt="Purificador de água cinza"
                width={200}
                height={150}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <div className="p-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-md">Entrega Fácil</span>
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-md">Garantia da OLX</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">R$ 350</p>
                <p className="text-sm text-gray-600 mb-1">Purificador de água</p>
                <p className="text-xs text-gray-500">Salvador, BA</p>
                <p className="text-xs text-gray-400">Hoje, 15:20</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 flex justify-around items-center py-2 box-border">
        {/* Início */}
        <button
          onClick={() => setActiveTab("inicio")}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === "inicio" ? "text-orange-500" : "text-gray-700"
          }`}
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Início</span>
        </button>

        {/* Buscar */}
        <button
          onClick={() => setActiveTab("buscar")}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === "buscar" ? "text-orange-500" : "text-gray-700"
          }`}
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Buscar</span>
        </button>

        {/* Anunciar grátis */}
        <button
          onClick={() => setActiveTab("anunciar")}
          className="flex flex-col items-center py-1 px-2 bg-white border-2 border-purple-500 rounded-full text-purple-500 transition-colors"
        >
          <Plus className="h-5 w-5 mb-1" />
          <span className="text-xs">Anunciar grátis</span>
        </button>

        {/* Mensagem */}
        <button
          onClick={() => setActiveTab("mensagem")}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === "mensagem" ? "text-orange-500" : "text-gray-700"
          }`}
        >
          <MessageCircle className="h-5 w-5 mb-1" />
          <span className="text-xs">Mensagem</span>
        </button>

        {/* Menu */}
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === "menu" ? "text-orange-500" : "text-gray-700"
          }`}
        >
          <Menu className="h-5 w-5 mb-1" />
          <span className="text-xs">Menu</span>
        </button>
      </nav>

      {/* Bottom Phone Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black h-6 flex justify-center items-center gap-4 z-40">
        <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
      </div>
    </div>
  )
}
