import { Language } from "../types";

const API_BASE = "https://abhaymane.pythonanywhere.com";

/**
 * Describe Sign (Streaming)
 */
export const describeSignStream = async (
  text: string,
  language: Language,
  onChunk: (text: string) => void
) => {
  const response = await fetch(`${API_BASE}/api/describe-sign-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      languageName: language,
    }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const json = JSON.parse(line.replace("data: ", ""));
          if (json.text) onChunk(json.text);
        } catch (err) {
          console.error("Stream parse error:", err);
        }
      }
    }
  }
};

/**
 * Generate Sign Image
 */
export const generateSignImage = async (
  text: string,
  language: Language
) => {
  const res = await fetch(`${API_BASE}/api/generate-sign-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      languageName: language,
    }),
  });

  const data = await res.json();
  return data.success ? data.image_data : null;
};

/**
 * Generate Sign Video
 */
export const generateSignVideo = async (
  text: string,
  language: Language
) => {
  const res = await fetch(`${API_BASE}/api/generate-sign-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      languageName: language,
    }),
  });

  const data = await res.json();
  return data.success ? data.video_url : null;
};

/**
 * Recognize Gesture
 */
export const recognizeGesture = async (
  imageBase64: string,
  language: Language
) => {
  const res = await fetch(`${API_BASE}/api/recognize-gesture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBase64,
      languageName: language,
    }),
  });

  const data = await res.json();
  return data.success ? data.prediction : "Could not translate.";
};

/**
 * Backend Test
 */
export const testBackend = async () => {
  const res = await fetch(`${API_BASE}/api/test`);
  return res.json();
};
