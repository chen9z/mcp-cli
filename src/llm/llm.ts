import OpenAI from "openai";

interface LLMConfig {
  model: string;
  prompt: string;
  apiKey: string;
  apiUrl: string;
}

export async function callOpenAI(config: LLMConfig) {
    const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.apiUrl,
    });

    const completion= await openai.chat.completions.create({
        model:config.model,
        messages:[
            {role:"user",content:config.prompt}
        ]
    });
    return completion.choices[0]?.message?.content;
}


export async function callOpenAIStream(config: LLMConfig) {
    const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.apiUrl,
    });

    const stream = await openai.chat.completions.create({
        model:config.model,
        messages:[
            {role:"user",content:config.prompt}
        ],
        stream:true
    });

    return stream;
}