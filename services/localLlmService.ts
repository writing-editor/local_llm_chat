import { Message, Role } from '../types';

// Ollama API structures
interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaStreamResponse {
    model: string;
    created_at: string;
    message: {
        role: 'assistant';
        content: string;
    };
    done: boolean;
}

class OllamaService {
    private static instance: OllamaService | null = null;
    private modelName: string = 'phi3:3.8b';
    private baseUrl: string = 'http://localhost:11434';

    public static getInstance(): OllamaService {
        if (!OllamaService.instance) {
            OllamaService.instance = new OllamaService();
        }
        return OllamaService.instance;
    }

    public setUrl(url: string) {
        this.baseUrl = url.replace(/\/+$/, ''); // Remove trailing slashes
    }

    public getUrl(): string {
        return this.baseUrl;
    }

    public setModel(model: string) {
        this.modelName = model;
    }

    public async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            // /api/tags is a lightweight endpoint to check if the server is an Ollama server and is running.
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorBody = await response.json();
                    if (errorBody && errorBody.error) {
                        errorMsg = errorBody.error;
                    }
                } catch (e) {
                    // Ignore if response is not json
                }
                return { success: false, error: errorMsg };
            }
            return { success: true };
        } catch (e: any) {
            return { success: false, error: "Failed to fetch. Check the URL, ensure the server is running, and that CORS is configured if necessary." };
        }
    }

    async generateResponseStream(
        messages: Message[],
        onUpdate: (text: string) => void,
        // 1. ADD a new parameter for the system prompt
        systemPrompt: string
    ) {
        // 2. REMOVE the hardcoded system instruction from here
        // const systemInstruction = 'You are a professional assistant...';

        const ollamaMessages: OllamaMessage[] = [];

        // 3. Only add the system message if the prompt is not empty
        if (systemPrompt && systemPrompt.trim() !== '') {
            ollamaMessages.push({ role: 'system', content: systemPrompt });
        }

        // Add the rest of the messages
        messages.forEach(msg => {
            const role: 'user' | 'assistant' = msg.role === Role.USER ? 'user' : 'assistant';
            ollamaMessages.push({
                role,
                content: msg.text
            });
        });


        // Remove the last message which is the empty placeholder for the assistant
        if (ollamaMessages[ollamaMessages.length - 1].role === 'assistant') {
            ollamaMessages.pop();
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: ollamaMessages,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });

                const jsonLines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of jsonLines) {
                    try {
                        const parsed: OllamaStreamResponse = JSON.parse(line);
                        if (parsed.message && parsed.message.content) {
                            fullText += parsed.message.content;
                            onUpdate(fullText);
                        }
                        if (parsed.done) {
                            return; // Stream finished
                        }
                    } catch (e) {
                        console.error("Failed to parse stream chunk:", line, e);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to generate response from Ollama", e);
            throw e; // Re-throw the error to be handled by the UI
        }
    }
}

export const localLlmService = OllamaService.getInstance();