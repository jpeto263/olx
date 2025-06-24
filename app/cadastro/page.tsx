"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function Cadastro() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    preco: "",
    descricao: "",
    publicado_em: "",
    garantia_olx: "",
    imagens: [],
  })

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const data = new FormData()
    for (const key in formData) {
      if (key === "imagens") {
        formData.imagens.forEach((image: any) => {
          data.append("imagens", image)
        })
      } else {
        data.append(key, formData[key as keyof typeof formData])
      }
    }

    try {
      const response = await fetch("/api/anuncios", {
        method: "POST",
        body: data,
      })

      if (response.ok) {
        toast({
          title: "Anúncio criado com sucesso!",
        })
        router.push("/")
      } else {
        toast({
          title: "Erro ao criar anúncio.",
          description: "Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro:", error)
      toast({
        title: "Erro ao criar anúncio.",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-5">Cadastrar Anúncio</h1>
      <form onSubmit={handleSubmit}>
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
          <Input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
            className="w-full"
            required
          />
        </div>

        {/* Categoria */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
          <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eletronicos">Eletrônicos</SelectItem>
              <SelectItem value="moveis">Móveis</SelectItem>
              <SelectItem value="roupas">Roupas</SelectItem>
              <SelectItem value="livros">Livros</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preço */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
          <Input
            type="number"
            value={formData.preco}
            onChange={(e) => setFormData((prev) => ({ ...prev, preco: e.target.value }))}
            className="w-full"
            required
          />
        </div>

        {/* Descrição */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
          <Textarea
            value={formData.descricao}
            onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
            className="w-full"
            required
          />
        </div>

        {/* Data e hora da postagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data e hora da postagem *</label>
          <Input
            type="datetime-local"
            value={formData.publicado_em}
            onChange={(e) => setFormData((prev) => ({ ...prev, publicado_em: e.target.value }))}
            className="w-full"
            required
          />
        </div>

        {/* Garantia OLX */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Garantia OLX</label>
          <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, garantia_olx: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Imagens */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagens</label>
          <Input
            type="file"
            multiple
            onChange={(e: any) => {
              if (e.target.files) {
                setFormData((prev) => ({
                  ...prev,
                  imagens: Array.from(e.target.files),
                }))
              }
            }}
            className="w-full"
          />
        </div>

        {/* Botão de Envio */}
        <div className="mt-6">
          <Button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded">
            Cadastrar
          </Button>
        </div>
      </form>
    </div>
  )
}
