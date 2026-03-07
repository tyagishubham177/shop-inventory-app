function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export const serverEnv = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL,
  sessionSecret: process.env.SESSION_SECRET,
};

export function assertServerEnv() {
  return {
    supabaseUrl: readRequiredEnv("SUPABASE_URL"),
    supabaseAnonKey: readRequiredEnv("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    openAiApiKey: readRequiredEnv("OPENAI_API_KEY"),
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    sessionSecret: readRequiredEnv("SESSION_SECRET"),
  };
}

