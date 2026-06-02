import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CaseState,
  EscalationLevel,
  CompanyInfo,
  CorrespondenceEntry,
  EmailRefinementEntry,
} from "@/types";

function generateId(): string {
  return crypto.randomUUID();
}

function createEmptyCase(): CaseState {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    currentLevel: "intake",
    userNarrative: "",
    extractedData: {},
    company: null,
    correspondence: [],
    emailRefinementHistory: [],
  };
}

interface CaseStore extends CaseState {
  startNewCase: () => void;
  setLevel: (level: EscalationLevel) => void;
  setNarrative: (text: string) => void;
  updateExtractedData: (data: Partial<CaseState["extractedData"]>) => void;
  setCompany: (company: CompanyInfo) => void;
  addCorrespondence: (entry: CorrespondenceEntry) => void;
  addEmailRefinement: (entry: EmailRefinementEntry) => void;
  reset: () => void;
}

const initialState = createEmptyCase();

export const useCaseStore = create<CaseStore>()(
  persist(
    (set) => ({
      ...initialState,

      startNewCase: () => set(createEmptyCase()),

      setLevel: (currentLevel) =>
        set({ currentLevel, updatedAt: new Date().toISOString() }),

      setNarrative: (userNarrative) =>
        set({ userNarrative, updatedAt: new Date().toISOString() }),

      updateExtractedData: (data) =>
        set((s) => ({
          extractedData: { ...s.extractedData, ...data },
          updatedAt: new Date().toISOString(),
        })),

      setCompany: (company) =>
        set({ company, updatedAt: new Date().toISOString() }),

      addCorrespondence: (entry) =>
        set((s) => ({
          correspondence: [...s.correspondence, entry],
          updatedAt: new Date().toISOString(),
        })),

      addEmailRefinement: (entry) =>
        set((s) => ({
          emailRefinementHistory: [...s.emailRefinementHistory, entry],
          updatedAt: new Date().toISOString(),
        })),

      reset: () => set(createEmptyCase()),
    }),
    {
      name: "projectl-voice-case",
      version: 1,
      partialize: (state) => ({
        id: state.id,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        currentLevel: state.currentLevel,
        userNarrative: state.userNarrative,
        extractedData: state.extractedData,
        company: state.company,
        correspondence: state.correspondence,
        emailRefinementHistory: state.emailRefinementHistory,
      }),
    }
  )
);
