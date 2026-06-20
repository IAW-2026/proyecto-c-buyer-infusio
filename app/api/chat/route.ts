import { NextRequest, NextResponse } from "next/server";
import { chatWithAssistant, type ChatMessage } from "@/app/lib/groq";
import { getProducts } from "@/app/lib/services/externalApis";

export async function POST(req: NextRequest) {
  const { message, history } = (await req.json()) as {
    message: string;
    history: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const products = await getProducts().catch(() => []);
  const catalog = products.map((p) => ({
    name: p.name,
    price: p.price,
    categories: p.categories,
  }));

  try {
    const reply = await chatWithAssistant(message, history ?? [], catalog);

    // Find the first product whose name is mentioned in the reply
    const replyLower = reply.toLowerCase();
    const matched = products.find((p) => replyLower.includes(p.name.toLowerCase()));
    const product = matched
      ? { id: matched.id, name: matched.name, imageUrl: matched.imageUrl ?? null, price: matched.price, location: matched.location ?? null, categories: matched.categories }
      : null;

    return NextResponse.json({ reply, product });
  } catch (err) {
    console.error("[chat] Gemini error:", err);
    return NextResponse.json({ error: "No se pudo obtener respuesta." }, { status: 500 });
  }
}
