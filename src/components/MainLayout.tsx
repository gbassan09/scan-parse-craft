import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FileText, User, ChevronRight, Monitor } from "lucide-react";
import OCRDetector from "./OCRDetector";
import screenshot1 from "@/assets/screenshot-1.jpg";
import screenshot2 from "@/assets/screenshot-2.jpg";
import screenshot3 from "@/assets/screenshot-3.jpg";
import screenshot4 from "@/assets/screenshot-4.jpg";
import screenshot5 from "@/assets/screenshot-5.jpg";
import screenshot6 from "@/assets/screenshot-6.jpg";

interface MainLayoutProps {
  user: any;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState<"home" | "ocr">("home");

  const screenshots = [
    {
      image: screenshot1,
      title: "Interface Principal de OCR",
      description: "Tela de processamento com documento escaneado e resultados extraídos"
    },
    {
      image: screenshot2,
      title: "Captura via Webcam",
      description: "Interface de câmera para digitalização em tempo real"
    },
    {
      image: screenshot3,
      title: "Dados Extraídos",
      description: "Visualização organizada dos campos CNPJ, data e valores"
    },
    {
      image: screenshot4,
      title: "Tela de Login",
      description: "Interface de autenticação do sistema"
    },
    {
      image: screenshot5,
      title: "Upload de Arquivos",
      description: "Interface para envio e pré-processamento de documentos"
    },
    {
      image: screenshot6,
      title: "Progresso do OCR",
      description: "Acompanhamento em tempo real do processamento"
    }
  ];

  if (currentView === "ocr") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="gradient-primary shadow-elevated">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Scan Parse Craft</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("home")}
                  className="text-white hover:bg-white/20"
                >
                  Voltar ao Início
                </Button>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* OCR Content */}
        <main className="container mx-auto px-4 py-8">
          <OCRDetector user={user} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary shadow-elevated">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Scan Parse Craft</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Sistema de OCR para Notas Fiscais
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in">
            Digitalize e extraia dados de notas fiscais automaticamente
          </p>
          <Button
            onClick={() => setCurrentView("ocr")}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-elevated text-lg px-8 py-3"
          >
            <FileText className="h-5 w-5 mr-2" />
            Iniciar OCR
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4 gradient-text">
            Capturas de Tela do Sistema
          </h3>
          <p className="text-lg text-muted-foreground">
            Veja como funciona nossa interface de OCR para notas fiscais
          </p>
        </div>

        {/* Screenshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {screenshots.map((screenshot, index) => (
            <Card 
              key={index}
              className="shadow-elevated hover:shadow-glow transition-all duration-300 animate-fade-in glass-card overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={screenshot.image} 
                  alt={screenshot.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <Monitor className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <CardTitle className="text-lg font-semibold mb-2">
                      {screenshot.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {screenshot.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto shadow-elevated glass-card">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">
                Pronto para começar?
              </CardTitle>
              <CardDescription className="text-lg">
                Experimente agora nosso sistema de OCR para notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setCurrentView("ocr")}
                size="lg"
                className="gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <FileText className="h-5 w-5 mr-2" />
                Acessar Sistema OCR
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="gradient-primary text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">Scan Parse Craft</span>
          </div>
          <p className="text-white/90">
            © 2024 Sistema de OCR para Notas Fiscais. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}