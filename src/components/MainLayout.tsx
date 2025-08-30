import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FileText, User, Quote, ChevronRight } from "lucide-react";
import OCRDetector from "./OCRDetector";

interface MainLayoutProps {
  onLogout: () => void;
}

export default function MainLayout({ onLogout }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState<"home" | "ocr">("home");

  const testimonials = [
    {
      quote: "Sistema muito eficiente para digitalizar notas fiscais.",
      title: "Gerente Financeiro",
      subtitle: "Empresa ABC"
    },
    {
      quote: "Reconhecimento de texto preciso e rápido.",
      title: "Contador",
      subtitle: "Escritório XYZ"
    },
    {
      quote: "Interface intuitiva e fácil de usar.",
      title: "Analista Fiscal",
      subtitle: "Consultoria 123"
    },
    {
      quote: "Economia de tempo significativa no processamento.",
      title: "Diretor Administrativo",
      subtitle: "Indústria DEF"
    },
    {
      quote: "Resultados consistentes e confiáveis.",
      title: "Assistente Contábil",
      subtitle: "Holding GHI"
    },
    {
      quote: "Ferramenta indispensável para automação fiscal.",
      title: "Coordenador Fiscal",
      subtitle: "Grupo JKL"
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
          <OCRDetector />
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
                <span>Usuário Logado</span>
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
            O que nossos usuários dizem
          </h3>
          <p className="text-lg text-muted-foreground">
            Depoimentos de profissionais que utilizam nossa solução
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="shadow-elevated hover:shadow-glow transition-all duration-300 animate-fade-in glass-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Quote className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <CardDescription className="text-base italic mb-3">
                      "{testimonial.quote}"
                    </CardDescription>
                    <CardTitle className="text-lg font-semibold">
                      {testimonial.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.subtitle}
                    </p>
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