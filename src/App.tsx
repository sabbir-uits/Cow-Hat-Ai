import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, Trash2, Info, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { estimateCattle } from './lib/gemini';

interface AnalysisResult {
  markdown: string;
  timestamp: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('ফাইলের সাইজ ১০ এমবির বেশি হওয়া যাবে না।');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const response = await estimateCattle(base64Data, mimeType);
      
      setResult({
        markdown: response || "কোনো ফলাফল পাওয়া যায়নি।",
        timestamp: new Date().toLocaleString('bn-BD'),
      });
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1b4332', '#d4a373', '#ffcc00']
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অপ্রত্যাশিত সমস্যা হয়েছে।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-earth-bg selection:bg-accent/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-4 py-3 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg ring-4 ring-primary/10">
            <Camera size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight bengali leading-none">গুরুর হাট এআই</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mt-1">Gorur Haat AI v1.0</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors bengali">বাজার দর</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors bengali">সহায়তা</a>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-all flex items-center gap-2">
            <CheckCircle2 size={16} />
            নিবন্ধিত হোন
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Upload Section */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight bengali">
                পশুর স্বাস্থ্য ও মূল্য <br />
                <span className="text-accent underline decoration-accent/30 underline-offset-8">জানুন নিমেষেই</span>
              </h2>
              <p className="text-lg text-primary/70 bengali max-w-md">
                আপনার গরু বা ছাগলের একটি পরিষ্কার ছবি আপলোড করুন এবং এআই এর মাধ্যমে ওজন ও দরের সঠিক অনুমান পান।
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              {!image ? (
                <div
                  {...getRootProps()}
                  className={`border-4 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 group h-[400px]
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40 hover:bg-primary/[0.02]'}`}
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Upload className="text-primary" size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold bengali text-primary">ছবি এখানে রাখুন</p>
                    <p className="text-sm text-primary/50 bengali">অথবা এখানে ক্লিক করে ফাইল নির্বাচন করুন</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-white border border-primary/10 rounded-full text-[10px] font-bold text-primary/60 uppercase tracking-wider">JPG & PNG</span>
                    <span className="px-3 py-1 bg-white border border-primary/10 rounded-full text-[10px] font-bold text-primary/60 uppercase tracking-wider">MAX 10MB</span>
                  </div>
                </div>
              ) : (
                <div className="relative group rounded-3xl overflow-hidden glass-card shadow-2xl border-primary/10 h-[400px]">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={clearImage}
                        className="bg-red-500/90 text-white p-3 rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 size={20} />
                      </button>
                      
                      {!result && !isAnalyzing && (
                        <button 
                          onClick={handleAnalyze}
                          className="bg-accent text-white px-8 py-3 rounded-xl font-bold bengali text-lg hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 ring-4 ring-accent/20"
                        >
                          অনুমান দেখুন
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle size={20} />
                  <p className="text-sm bengali font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Results Section */}
          <div className="lg:sticky lg:top-28 space-y-6">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={64} strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Camera className="text-primary/30" size={24} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-primary bengali">এআই পরীক্ষা করছে...</h3>
                    <p className="text-primary/60 bengali">কিছুক্ষণ অপেক্ষা করুন, আপনার পশুর তথ্য যাচাই করা হচ্ছে।</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-3xl p-8 space-y-6 relative border-accent/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-4 py-1 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider">
                      Analysis Complete
                    </div>
                    <span className="text-[10px] text-primary/40 font-mono">{result.timestamp}</span>
                  </div>

                  <div className="prose prose-slate max-w-none 
                    prose-headings:text-primary prose-headings:font-bold prose-headings:bengali 
                    prose-p:text-primary/80 prose-p:leading-relaxed prose-p:bengali
                    prose-strong:text-primary prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-4 prose-li:text-primary/70
                  ">
                    <Markdown>{result.markdown}</Markdown>
                  </div>

                  <div className="pt-6 border-t border-primary/5 flex items-center gap-3 text-primary/40">
                    <Info size={16} />
                    <p className="text-[11px] leading-snug italic tracking-tight font-medium">
                      Market estimates are based on general historical trends and may vary by region.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-primary/10 rounded-3xl p-12 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px] bg-white/30"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary/20">
                    <Info size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary/40 bengali">এখানে ফলাফল দেখাবে</p>
                    <p className="text-sm text-primary/30 bengali">ছবি আপলোড করে "অনুমান দেখুন" বাটনে ক্লিক করুন</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info / Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'সঠিক অনুমান', value: '৯৮%', icon: CheckCircle2 },
            { label: 'ব্যবহারকারী', value: '১০,০০০+', icon: Camera },
            { label: 'বাজার আপডেট', value: 'প্রতিদিন', icon: Loader2 },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-2xl flex items-center gap-4 border-transparent hover:border-primary/5 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs font-semibold text-primary/40 uppercase tracking-wide bengali">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="mt-20 border-t border-primary/5 bg-white/50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-sm font-medium text-primary/50 bengali">
            © ২০২৬ গুরুর হাট এআই - একটি অত্যাধুনিক এআই প্ল্যাটফর্ম
          </p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-xs font-bold text-primary/30 uppercase tracking-widest hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold text-primary/30 uppercase tracking-widest hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-xs font-bold text-primary/30 uppercase tracking-widest hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
