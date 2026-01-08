
import { GoogleGenAI, Type } from "@google/genai";
import { AIRoadmapResponse, AILevelUpResponse, DailyBriefing, Roadmap, TaskIntelResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Sen; Notion sadeliğine ve iOS estetiğine sahip bir 'Girişimci Asistanı' uygulamasının çekirdek zekasısın.

Görevin: Kullanıcının hedeflerini analiz edip onları "Level" mantığıyla yönetilebilir parçalara bölmek.

Kurallar:
1. Başlangıç (Level 1) için sadece ve sadece 5 ile 7 arası 'Atomic Task' oluştur. Asla daha fazla oluşturma.
2. Bu görevler projenin ilk adımları olmalı.
3. Her göreve 1-5 arası XP ata.
4. Çıktı JSON formatında olmalı.
`;

export const generateRoadmapFromGoal = async (goalDescription: string): Promise<AIRoadmapResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: goalDescription,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project_meta: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                icon: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                estimated_days: { type: Type.INTEGER }
              },
              required: ["name", "icon", "description", "priority", "estimated_days"],
            },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  task_title: { type: Type.STRING },
                  xp_weight: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                },
                required: ["id", "task_title", "xp_weight", "description"],
              },
            },
          },
          required: ["project_meta", "roadmap"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIRoadmapResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateNextLevelTasks = async (projectTitle: string, currentLevel: number, completedTasks: string[]): Promise<AILevelUpResponse> => {
  const levelPrompt = `
    Proje: "${projectTitle}"
    Şu anki Seviye: ${currentLevel} (Tamamlandı)
    Tamamlanan Görevler: ${completedTasks.join(', ')}

    Görev: Bu proje için "Level ${currentLevel + 1}" görevlerini oluştur.
    Kurallar:
    1. Bir önceki seviyeden daha zorlu ve ileri düzey 5-7 adet yeni görev oluştur.
    2. Görevler teknik veya operasyonel olarak bir sonraki mantıklı adım olmalı.
    3. JSON formatında dön.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: levelPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level_summary: { type: Type.STRING, description: "Yeni seviyenin kısa motivasyon özeti" },
            new_tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  task_title: { type: Type.STRING },
                  xp_weight: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                },
                required: ["id", "task_title", "xp_weight", "description"],
              },
            },
          },
          required: ["new_tasks", "level_summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AILevelUpResponse;

  } catch (error) {
    console.error("Gemini Level Up Error:", error);
    throw error;
  }
};

export const generateDailyBriefing = async (userName: string, activeRoadmaps: Roadmap[]): Promise<DailyBriefing> => {
    // 1. Prepare context for AI
    const totalPending = activeRoadmaps.reduce((sum, map) => sum + map.tasks.filter(t => !t.isCompleted).length, 0);
    const topPriorityMap = activeRoadmaps.find(r => r.priority === 'High' && r.status !== 'Done') || activeRoadmaps[0];
    
    const context = `
        User: ${userName}
        Total Projects: ${activeRoadmaps.length}
        Total Pending Tasks: ${totalPending}
        Primary Focus Project: ${topPriorityMap ? topPriorityMap.title : 'None'}
    `;

    const prompt = `
        Sen elit bir 'Cyberpunk Handler' (Operatör) karakterisin. Kullanıcı (Ajan) için günlük bir brifing hazırla.
        
        Veriler:
        ${context}

        Kurallar:
        1. "headline": Kısa, etkileyici bir başlık. (Örn: "Neural Link Established", "Mission Update: Alpha")
        2. "content": Kullanıcıyı motive eden, stratejik bir paragraf (maksimum 30 kelime). Biraz gizemli ve profesyonel konuş.
        3. "focus_suggestion": Bugün odaklanması gereken tek bir şey öner (kısa).
        4. JSON formatında dön.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        content: { type: Type.STRING },
                        focus_suggestion: { type: Type.STRING },
                    },
                    required: ["headline", "content", "focus_suggestion"],
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No briefing generated");
        return JSON.parse(text) as DailyBriefing;

    } catch (error) {
        console.error("Briefing Error:", error);
        // Fallback briefing if AI fails (Offline mode support)
        return {
            headline: "System Offline",
            content: "Neural link unstable. Proceed with standard protocols. Trust your instincts, Agent.",
            focus_suggestion: "Manual Override"
        };
    }
};

export const generateTaskIntel = async (taskTitle: string, projectContext: string): Promise<TaskIntelResponse> => {
    const prompt = `
        Context: Project "${projectContext}"
        Task: "${taskTitle}"

        Goal: Provide a specific, actionable tactical tip (1-2 sentences) on exactly how to start/perform this task efficiently. Also estimate duration.
        Tone: Professional, concise, helpful.
        Output: JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tip: { type: Type.STRING, description: "A very specific 'how-to' start tip." },
                        minutes: { type: Type.INTEGER, description: "Estimated completion time in minutes." }
                    },
                    required: ["tip", "minutes"],
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No intel generated");
        return JSON.parse(text) as TaskIntelResponse;
    } catch (error) {
        console.error("Task Intel Error:", error);
        return {
            tip: "Review project documentation and proceed with standard protocols.",
            minutes: 15
        };
    }
};
