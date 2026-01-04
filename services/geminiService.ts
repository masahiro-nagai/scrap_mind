import { GoogleGenAI, Type } from "@google/genai";
import { Scrap, IdeaSynthesis } from "../types";

const initAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const synthesizeScraps = async (scraps: Scrap[]): Promise<IdeaSynthesis | null> => {
  const ai = initAI();
  if (!ai) return null;

  if (scraps.length === 0) return null;

  // Structure data as JSON to prevent prompt injection issues where user content leaks into instructions
  const scrapsData = scraps.map(s => ({
    date: new Date(s.createdAt).toISOString(),
    tags: s.tags || [],
    content: s.content,
    source: s.url || null
  }));

  const prompt = `
    あなたは、ユーザーの雑多な「スクラップブック」のメモを統合し、新しいアイデアを生み出すのを手助けするインテリジェントなアシスタントです。
    
    以下はユーザーのメモ（スクラップ）のJSONデータです。
    時系列やタグの関連性も考慮して分析を行ってください。
    
    ユーザーデータ(JSON):
    ${JSON.stringify(scrapsData, null, 2)}

    これらのスクラップを分析し、隠れたつながりや、それらを結びつける新しいプロジェクト/アイデアの可能性を見つけてください。
    もし内容がランダムであれば、哲学的なテーマを見出してください。
    
    結果はJSON形式で返してください。言語は日本語でお願いします。
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
            title: { type: Type.STRING, description: "統合されたアイデアの創造的なタイトル" },
            summary: { type: Type.STRING, description: "スクラップ間の点と点を結ぶ要約文" },
            connections: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "これらのメモの組み合わせから得られる3〜5個の具体的な洞察やアクションアイテム"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IdeaSynthesis;
    }
    return null;

  } catch (error) {
    console.error("Error synthesizing scraps:", error);
    return null;
  }
};