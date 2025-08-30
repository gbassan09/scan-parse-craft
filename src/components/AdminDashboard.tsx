import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, User, Search, Download, Eye, Calendar, DollarSign, Building } from "lucide-react";
import { supabase, type OcrRecord } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [records, setRecords] = useState<OcrRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OcrRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<OcrRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm]);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('ocr_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setRecords(data || []);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    if (!searchTerm) {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter(record => 
      record.cnpj?.includes(searchTerm) ||
      record.extracted_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.data?.includes(searchTerm)
    );
    setFilteredRecords(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const downloadRecord = (record: OcrRecord) => {
    const data = {
      id: record.id,
      cnpj: record.cnpj,
      data: record.data,
      total: record.total,
      texto_completo: record.extracted_text,
      confianca: record.confidence,
      processado_em: record.created_at
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-${record.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download concluído",
      description: "Dados do OCR baixados com sucesso"
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const stats = {
    total: records.length,
    withCNPJ: records.filter(r => r.cnpj).length,
    totalValue: records.reduce((sum, r) => sum + (r.total || 0), 0),
    avgConfidence: records.length > 0 
      ? records.reduce((sum, r) => sum + (r.confidence || 0), 0) / records.length 
      : 0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary shadow-elevated">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Admin
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de OCRs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">registros processados</p>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com CNPJ</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withCNPJ}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.withCNPJ / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">soma de todas as notas</p>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgConfidence)}%</div>
              <p className="text-xs text-muted-foreground">precisão do OCR</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CNPJ, data ou texto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registros de OCR ({filteredRecords.length})</span>
              <Button
                variant="outline"
                onClick={loadRecords}
                disabled={isLoading}
              >
                Atualizar
              </Button>
            </CardTitle>
            <CardDescription>
              Histórico completo de todas as operações de OCR realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando registros...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum registro encontrado" : "Nenhum registro ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="border border-border hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-medium">CNPJ</span>
                          </div>
                          <p className="font-mono text-sm">{record.cnpj || "—"}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">Data</span>
                          </div>
                          <p className="font-mono text-sm">{record.data || "—"}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-medium">Total</span>
                          </div>
                          <p className="font-mono text-sm font-semibold text-primary">
                            {formatCurrency(record.total)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            <span className="font-medium">Confiança</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {Math.round(record.confidence || 0)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadRecord(record)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Processado em: {formatDate(record.created_at)} | ID: {record.id}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Record Modal */}
        {selectedRecord && (
          <Card className="shadow-elevated glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalhes do Registro</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Texto Extraído Completo:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedRecord.extracted_text}
                    </pre>
                  </div>
                </div>
                
                {selectedRecord.image_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Imagem Original:</h4>
                    <img 
                      src={selectedRecord.image_url} 
                      alt="Nota fiscal processada"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}