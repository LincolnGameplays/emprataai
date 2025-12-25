import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, Check, Sparkles, Utensils, Moon, Sun } from 'lucide-react';
import { FoodVibe } from '../services/mockAIService';

interface StudioProps {
  onProcess: (image: File, vibe: FoodVibe) => void;
  onBack: () => void;
}

const VIBES: { id: FoodVibe; name: string; icon: any; color: string }[] = [
  { id: 'rustico', name: 'Rústico', icon: Utensils, color: 'bg-orange-100' },
  { id: 'gourmet', name: 'Gourmet', icon: Sparkles, color: 'bg-yellow-100' },
  { id: 'dark', name: 'Dark Mode', icon: Moon, color: 'bg-gray-800 text-white' },
  { id: 'domingo', name: 'Domingo', icon: Sun, color: 'bg-blue-100' },
];

export const Studio = ({ onProcess, onBack }: StudioProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<FoodVibe>('rustico');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleStart = () => {
    if (file) {
      onProcess(file, selectedVibe);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex flex-col min-h-screen p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-extrabold text-text">Estúdio Emprata</h2>
      </div>

      {/* Upload Area */}
      {!preview ? (
        <div 
          {...getRootProps()} 
          className={`flex-1 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl p-12 transition-all cursor-pointer bg-white ${
            isDragActive ? 'border-primary bg-orange-50/50 scale-[0.98]' : 'border-gray-200'
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6"
          >
            <Upload className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="text-xl font-bold text-text text-center">Solta a foto do rango aqui</p>
          <p className="text-sm text-text/50 font-medium mt-2">Toque para buscar na galeria</p>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-square bg-gray-100">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button 
            onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-primary"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Vibe Selector */}
      <div className="mt-8">
        <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
          Escolha a Vibe <Sparkles className="w-5 h-5 text-secondary" />
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
          {VIBES.map((vibe) => (
            <motion.button
              key={vibe.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedVibe(vibe.id)}
              className={`flex-shrink-0 w-32 h-32 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 border-4 transition-all ${
                selectedVibe === vibe.id 
                  ? 'border-primary bg-white shadow-orange shadow-lg' 
                  : 'border-transparent bg-gray-100/50 opacity-60'
              }`}
            >
              <div className={`p-3 rounded-2xl ${vibe.color}`}>
                <vibe.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold truncate w-full text-center">{vibe.name}</span>
              {selectedVibe === vibe.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-white">
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-auto pt-8 pb-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!file}
          onClick={handleStart}
          className={`w-full py-5 rounded-3xl font-extrabold text-xl flex items-center justify-center gap-3 transition-colors ${
            file ? 'bg-primary text-white shadow-orange shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-6 h-6" />
          Caprichar no Rango
        </motion.button>
      </div>
    </motion.div>
  );
};
