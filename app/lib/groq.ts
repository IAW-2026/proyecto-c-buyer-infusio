import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[],
  catalog: { name: string; price: number; categories: string[] }[]
): Promise<string> {
  const catalogList = catalog
    .map((p) => `- ${p.name} (${p.categories.join(", ")}) — $${p.price.toLocaleString("es-AR")} ARS`)
    .join("\n");

  const systemContent = `Sos el asistente virtual de Infusio, una tienda artesanal argentina de cafés de especialidad, tés, yerba mate, tereré e infusiones. Solo respondés preguntas relacionadas con Infusio: sus productos, cómo prepararlos, qué elegir según gustos, política de devoluciones, envíos y contacto. Si te preguntan algo fuera de estos temas, decís amablemente que solo podés ayudar con consultas sobre la tienda.

Este es el catálogo actual con precios (los precios pueden cambiar, siempre aclaralo cuando los menciones):
${catalogList || "Catálogo no disponible en este momento."}

Respondés en español rioplatense, de forma cálida, breve y concreta. Sin markdown ni listas con guiones salvo que sea imprescindible. Máximo 3 oraciones por respuesta salvo que el usuario pida más detalle.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: m.parts[0]?.text ?? "",
    })),
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 400,
  });

  return completion.choices[0]?.message?.content ?? "Ocurrió un error. Intentá de nuevo.";
}
