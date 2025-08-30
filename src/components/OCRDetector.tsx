import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, AlertCircle, FileText, Copy, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Tesseract from "tesseract.js";

interface OCRResult {
  cnpj: string | null;
  data: string | null;
  total: number | null;
}

export default function OCRDetector() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [mode, setMode] = useState<"upload" | "webcam">("upload");
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string>("");
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrResult, setOcrResult] = useState<string>("");
  const [extractedFields, setExtractedFields] = useState<OCRResult>({ cnpj: null, data: null, total: null });
  const [showJson, setShowJson] = useState(false);
  const [preprocessImage, setPreprocessImage] = useState(false);
  
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopWebcam();
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const setPreview = useCallback((file: File | Blob) => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setCurrentBlob(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setOcrResult("");
    setExtractedFields({ cnpj: null, data: null, total: null });
  }, [imageUrl]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a text file
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setOcrResult(text);
          parseFields(text);
          toast({ 
            title: "Arquivo TXT carregado", 
            description: "Texto extraído com sucesso do arquivo" 
          });
        }
      };
      reader.readAsText(file);
      return;
    }
    
    // Handle image files
    if (file.type.startsWith('image/')) {
      setPreview(file);
      setMode("upload");
      stopWebcam();
    } else {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione uma imagem (PNG, JPG, etc.) ou arquivo TXT.",
        variant: "destructive"
      });
    }
  }, [setPreview]);


  const startWebcam = useCallback(async () => {
    try {
      setWebcamError("");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "environment"
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setWebcamActive(true);
          setOcrResult("");
          setExtractedFields({ cnpj: null, data: null, total: null });
          toast({ title: "Webcam ativa", description: "Câmera inicializada com sucesso" });
        };
        videoRef.current.onerror = () => {
          throw new Error("Erro ao carregar o vídeo da câmera");
        };
      }
    } catch (err: any) {
      console.error("Erro na webcam:", err);
      setWebcamError(err.message);
      toast({
        title: "Erro na webcam",
        description: err.message || "Não foi possível acessar a câmera.",
        variant: "destructive"
      });
      stopWebcam();
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setWebcamActive(false);
  }, []);

  const downloadImage = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Imagem salva!", description: "Captura baixada com sucesso." });
  }, [toast]);

  const preprocessIfNeeded = useCallback((): Promise<Blob | null> => {
    if (!preprocessImage || !currentBlob) return Promise.resolve(currentBlob);
    
    return new Promise((resolve) => {
      const url = URL.createObjectURL(currentBlob);
      const image = new Image();
      image.onload = () => {
        const maxW = 1600;
        const ratio = Math.min(1, maxW / image.width);
        const w = Math.round(image.width * ratio);
        const h = Math.round(image.height * ratio);
        const canvas = canvasRef.current!;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        
        // Draw image with enhanced contrast and sharpness
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(image, 0, 0, w, h);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) {
          const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          sum += y;
        }
        const mean = sum / (d.length / 4);
        
        // Apply adaptive thresholding
        for (let i = 0; i < d.length; i += 4) {
          const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const v = y > mean * 0.9 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }
        
        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((b) => {
          if (b) setCurrentBlob(b);
          resolve(b);
          URL.revokeObjectURL(url);
        }, 'image/png', 1);
      };
      image.src = url;
    });
  }, [preprocessImage, currentBlob]);

  const runOCR = useCallback(async () => {
    if (!currentBlob && mode !== 'webcam') {
      toast({ title: "Erro", description: "Nenhuma imagem selecionada.", variant: "destructive" });
      return;
    }
    
    let blobToProcess = currentBlob;
    
    // If using webcam, capture current frame
    if (mode === 'webcam' && videoRef.current) {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      blobToProcess = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1);
      });
      setCurrentBlob(blobToProcess);
    }
    
    if (!blobToProcess) {
      toast({ title: "Erro", description: "Não foi possível capturar a imagem.", variant: "destructive" });
      return;
    }

    // Auto-capture image before OCR processing
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (mode === 'upload' && imgRef.current) {
          canvas.width = imgRef.current.naturalWidth;
          canvas.height = imgRef.current.naturalHeight;
          ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
        } else if (mode === 'webcam' && videoRef.current) {
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL("image/png");
        downloadImage(dataUrl, "captura-ocr-auto.png");
      }
    }

    setOcrStatus('Iniciando OCR...');
    setOcrProgress(0);
    setIsProcessing(true);
    
    try {
      const blob = await preprocessIfNeeded();
      
      const worker = await Tesseract.createWorker('por+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && m.progress != null) {
            setOcrProgress(m.progress);
          }
          setOcrStatus(`${m.status} ${Math.round((m.progress || 0) * 100)}%`);
        },
      });
      
      // Configure Tesseract for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüý/-.,: \n\r\t',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      });
      
      const { data } = await worker.recognize(blob!);
      await worker.terminate();
      
      const recognizedText = (data.text || '').trim();
      setOcrResult(recognizedText);
      parseFields(recognizedText);
      
      toast({ 
        title: "OCR concluído", 
        description: `Texto extraído com ${Math.round(data.confidence || 0)}% de confiança. Imagem capturada automaticamente.` 
      });
    } catch (err: any) {
      console.error('Erro no OCR:', err);
      setOcrStatus('Erro no OCR: ' + (err.message || err));
      toast({
        title: "Erro no OCR",
        description: err.message || "Falha ao processar a imagem",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [currentBlob, mode, preprocessIfNeeded, toast, downloadImage]);

  const parseFields = useCallback((text: string) => {
    if (!text) {
      setExtractedFields({ cnpj: null, data: null, total: null });
      return;
    }
    
    const txt = text.replace(/[\t\r]+/g, ' ').replace(/\s{2,}/g, ' ').toUpperCase();
    
    // Enhanced regex patterns for better recognition
    const mCNPJ = txt.match(/\b(\d{2}[\.\/-]?\d{3}[\.\/-]?\d{3}[\.\/-]?\d{4}[\.\/-]?\d{2})\b/) ||
                 txt.match(/CNPJ[:\s]*(\d{2}[\.\/-]?\d{3}[\.\/-]?\d{3}[\.\/-]?\d{4}[\.\/-]?\d{2})/);
    
    const mData = txt.match(/\b(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})\b/) ||
                 txt.match(/DATA[:\s]*(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/);
    
    const mTotal = txt.match(/(TOTAL|VALOR\s*TOTAL|VALOR\s*A\s*PAGAR|TOTAL\s*A\s*PAGAR|VALOR\s*LIQUIDO)[^\d]*(\d{1,3}(?:[\.\,]\d{3})*[\.\,]\d{2})/);

    let cnpj = null;
    let data = null;
    let total = null;

    if (mCNPJ) {
      cnpj = mCNPJ[1] || mCNPJ[2] || mCNPJ[0];
      // Clean CNPJ formatting
      cnpj = cnpj.replace(/[\.\/-]/g, '');
      if (cnpj.length === 14) {
        cnpj = `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12,14)}`;
      }
    }

    if (mData) {
      data = mData[1] || mData[2] || mData[0];
    }

    if (mTotal) {
      const totalStr = mTotal[2];
      if (totalStr) {
        // Handle different decimal separators
        let cleanTotal = totalStr.replace(/\./g, '').replace(',', '.');
        const parsedTotal = parseFloat(cleanTotal);
        if (!isNaN(parsedTotal)) {
          total = parsedTotal;
        }
      }
    }

    setExtractedFields({ cnpj, data, total });
  }, []);

  const downloadTxt = useCallback(() => {
    if (!ocrResult) {
      toast({ title: "Nenhum texto", description: "Não há texto para baixar.", variant: "destructive" });
      return;
    }
    
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocr-nota-fiscal.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Texto salvo!", description: "O texto da nota fiscal foi baixado." });
  }, [ocrResult, toast]);
  
  const copyTxt = useCallback(async () => {
    if (!ocrResult) {
      toast({ title: "Nenhum texto", description: "Não há texto para copiar.", variant: "destructive" });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(ocrResult);
      toast({ title: "Texto copiado!", description: "Copiado para a área de transferência." });
    } catch (err) {
      toast({ title: "Erro ao copiar", description: "Falha ao copiar o texto.", variant: "destructive" });
    }
  }, [ocrResult, toast]);

  const getJson = useCallback(() => {
    return JSON.stringify(extractedFields, null, 2);
  }, [extractedFields]);

  const handleSample = useCallback(async () => {
    try {
      const SAMPLE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXAAAAB0CAYAAADb8s7pAAAACXBIWXMAAAsSAAALEgHS3X78AAABtElEQVR4nO3RAQ0CMQwEwS3//9kQk3K3y4V2w5sKQy4m0j8mJ3k0S1y2w1yH2w3lJqfGk7l8b2r1cQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw9mZb0m2f0W+v7a8j3k7f8w9Y8t6gLwJ8h2ZJvM3y6n3Hc1h8l3Lr3k9p2cZgX2m0b8Qf1q0f8Q/z7z7g1yA6bJ9kSRc9mTzqjv4x8Gg2n2t0qf3R3+vE6v1wYp3w+XQnq9C2H3J8Q7Yq3w7bJ3w5sS7cOZr2v7qY8j6mS8f1nZb0m2f0W+v7a8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAD4wQ2r7l1s2wAAAABJRU5ErkJggg==';
      const response = await fetch(SAMPLE);
      const blob = await response.blob();
      const f = new File([blob], 'exemplo.png', { type: 'image/png' });
      setPreview(f);
      setMode("upload");
      stopWebcam();
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao carregar exemplo.", variant: "destructive" });
    }
  }, [setPreview, stopWebcam, toast]);

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-elevated animate-fade-in glass-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2 gradient-text">
          <FileText className="h-6 w-6" />
          OCR de Notas Fiscais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={mode === "upload" ? "default" : "outline"}
            onClick={() => { setMode("upload"); stopWebcam(); }}
            className="flex-1 flex items-center gap-2 min-w-[120px]"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button
            variant={mode === "webcam" ? "default" : "outline"}
            onClick={() => {
              setMode("webcam");
              setImageUrl("");
              setOcrResult("");
              setExtractedFields({ cnpj: null, data: null, total: null });
              setWebcamError("");
            }}
            className="flex-1 flex items-center gap-2 min-w-[120px]"
          >
            <Camera className="h-4 w-4" />
            Webcam
          </Button>
          <Button
            variant="secondary"
            onClick={handleSample}
            className="flex items-center gap-2"
          >
            Exemplo
          </Button>
        </div>

        {webcamError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{webcamError}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label htmlFor="file" className="text-lg font-semibold">Imagem/Arquivo da Nota Fiscal</Label>
              <div className="flex items-center gap-2">
                <input 
                  id="chk-pre" 
                  type="checkbox" 
                  checked={preprocessImage}
                  onChange={(e) => setPreprocessImage(e.target.checked)}
                  className="h-4 w-4" 
                />
                <Label htmlFor="chk-pre" className="text-sm">Pré-processar</Label>
              </div>
            </div>

            <Input 
              ref={fileInputRef} 
              id="file" 
              type="file" 
              accept="image/*,.txt" 
              onChange={onFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />

            <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border bg-card">
              {mode === "upload" && imageUrl ? (
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Pré-visualização"
                  className="w-full h-full object-contain"
                />
              ) : mode === "webcam" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4" />
                  <p>Carregue uma imagem, arquivo TXT ou inicie a webcam</p>
                </div>
              )}
              
              {!webcamActive && mode === "webcam" && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Button onClick={startWebcam} size="lg" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Iniciar Webcam
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={runOCR}
                disabled={(!currentBlob && mode !== 'webcam') || isProcessing}
                className="w-full flex items-center justify-center gap-2 gradient-primary hover:shadow-glow transition-all duration-300"
                size="lg"
              >
                <FileText className="h-4 w-4" />
                {isProcessing ? "Processando..." : "Capturar e Ler Texto (OCR)"}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Progresso do OCR</Label>
                  <span className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                    {Math.round(ocrProgress * 100)}%
                  </span>
                </div>
                <Progress value={ocrProgress * 100} className="h-3" />
                {ocrStatus && (
                  <p className="text-sm text-muted-foreground animate-pulse">{ocrStatus}</p>
                )}
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Resultado do OCR</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyTxt} disabled={!ocrResult}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTxt} disabled={!ocrResult}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar TXT
                </Button>
              </div>
            </div>
            
            <textarea
              value={ocrResult}
              onChange={(e) => setOcrResult(e.target.value)}
              placeholder="O texto reconhecido aparecerá aqui..."
              spellCheck="false"
              className="w-full min-h-[200px] resize-y p-3 border rounded-lg bg-background text-foreground font-mono text-sm"
            />
            
            <div className="space-y-3 animate-slide-up">
              <h3 className="text-lg font-semibold">Campos Extraídos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CNPJ</Label>
                  <p className="font-mono text-sm mt-1 font-medium">{extractedFields.cnpj || "—"}</p>
                </Card>
                <Card className="p-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-accent">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</Label>
                  <p className="font-mono text-sm mt-1 font-medium">{extractedFields.data || "—"}</p>
                </Card>
                <Card className="p-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total (R$)</Label>
                  <p className="font-mono text-sm mt-1 font-medium text-primary">
                    {extractedFields.total ? extractedFields.total.toFixed(2) : "—"}
                  </p>
                </Card>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => parseFields(ocrResult)}
                disabled={!ocrResult}
              >
                Re-extrair Campos
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowJson(!showJson)}
                disabled={!extractedFields.cnpj && !extractedFields.data && !extractedFields.total}
              >
                {showJson ? "Ocultar" : "Ver"} JSON
              </Button>
            </div>
            
            {showJson && (
              <Card className="p-3">
                <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {getJson()}
                </pre>
              </Card>
            )}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}