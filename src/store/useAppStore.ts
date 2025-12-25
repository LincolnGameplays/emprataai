import { create } from 'zustand';

export type UserPlan = 'FREE' | 'STARTER' | 'PRO';
export type FoodVibe = 'rustico' | 'gourmet' | 'dark' | 'domingo' | 'marble' | 'neon' | 'chefs-table' | 'editorial' | 'morning-brunch' | 'dark-kitchen' | 'golden-hour' | 'macro-detail';
export type Perspective = 'top' | 'front' | 'diagonal' | 'macro';

interface AppState {
  // User Data
  userId: string;
  plan: UserPlan;
  credits: number;
  
  // Editor State
  originalImage: string | null;
  originalFile: File | null;
  generatedImage: string | null;
  selectedVibe: FoodVibe;
  selectedPerspective: Perspective;
  lightIntensity: number;
  isGenerating: boolean;

  // Actions
  setUserId: (userId: string) => void;
  setPlan: (plan: UserPlan) => void;
  setCredits: (credits: number) => void;
  setOriginalImage: (image: string | null, file?: File | null) => void;
  setGeneratedImage: (image: string | null) => void;
  setVibe: (vibe: FoodVibe) => void;
  setPerspective: (perspective: Perspective) => void;
  setLightIntensity: (intensity: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  resetEditor: () => void;
  useCredit: () => boolean;
}

// Generate or retrieve persistent user ID
const getUserId = (): string => {
  const stored = localStorage.getItem('emprata_user_id');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('emprata_user_id', newId);
  return newId;
};

export const useAppStore = create<AppState>((set, get) => ({
  userId: getUserId(),
  plan: 'FREE',
  credits: 3,
  
  originalImage: null,
  originalFile: null,
  generatedImage: null,
  selectedVibe: 'rustico',
  selectedPerspective: 'diagonal',
  lightIntensity: 50,
  isGenerating: false,

  setUserId: (userId) => {
    localStorage.setItem('emprata_user_id', userId);
    set({ userId });
  },
  setPlan: (plan) => set({ plan }),
  setCredits: (credits) => set({ credits }),
  setOriginalImage: (originalImage, originalFile = null) => set({ originalImage, originalFile, generatedImage: null }),
  setGeneratedImage: (generatedImage) => set({ generatedImage }),
  setVibe: (selectedVibe) => set({ selectedVibe }),
  setPerspective: (selectedPerspective) => set({ selectedPerspective }),
  setLightIntensity: (lightIntensity) => set({ lightIntensity }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  resetEditor: () => set({
    originalImage: null,
    originalFile: null,
    generatedImage: null,
    selectedVibe: 'rustico',
    selectedPerspective: 'diagonal',
    lightIntensity: 50,
    isGenerating: false,
  }),

  useCredit: () => {
    const { credits, plan } = get();
    if (plan === 'PRO') return true;
    if (credits > 0) {
      set({ credits: credits - 1 });
      return true;
    }
    return false;
  },
}));
