import { BigQuery } from "@google-cloud/bigquery";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Initialize carefully. We don't want to crash on missing credentials 
// if running locally in demo mode.
const isDemoMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

let bqClient: BigQuery | null = null;
let ttsClient: TextToSpeechClient | null = null;

try {
  bqClient = new BigQuery();
  ttsClient = new TextToSpeechClient();
} catch {
  // Graceful degradation for demo mode
}

export async function logAnalyticsEvent(eventName: string, metadata: Record<string, string | number>) {
  if (isDemoMode || !bqClient) {
    console.log(`[Google Services AI Simulation] BigQuery Logging event: ${eventName}`, metadata);
    return;
  }
  
  try {
    const dataset = bqClient.dataset("stadiumiq_analytics");
    const table = dataset.table("events");
    await table.insert([{ event: eventName, metadata, timestamp: BigQuery.timestamp(new Date()) }]);
  } catch (err) {
    console.error("BigQuery flush failed", err);
  }
}

export async function generateGreetingAudio(text: string): Promise<Buffer | null> {
  if (isDemoMode || !ttsClient) {
    console.log(`[Google Services AI Simulation] Text-To-Speech generation request for: ${text}`);
    return null; // Mock return
  }

  try {
    const request = {
      input: { text },
      voice: { languageCode: "en-US", name: "en-US-Journey-O" },
      audioConfig: { audioEncoding: "MP3" as const },
    };
    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent ? Buffer.from(response.audioContent) : null;
  } catch (err) {
    console.error("TTS generation failed", err);
    return null;
  }
}
