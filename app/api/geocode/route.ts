import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ found: false }, { status: 400 });

  // Query format sent by CheckoutForm: "{street}, {city}, {province}, Argentina"
  const parts = query.split(",").map((s) => s.trim());
  const direccion = parts[0] ?? "";
  const localidad = parts[1] ?? "";
  const provincia = parts[2] ?? "";

  if (!direccion) return NextResponse.json({ found: false });

  try {
    const params = new URLSearchParams({ direccion, max: "1", campos: "basico" });
    if (localidad) params.set("localidad", localidad);
    if (provincia) params.set("provincia", provincia);

    const res = await fetch(
      `https://apis.datos.gob.ar/georef/api/direcciones?${params}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ found: true }); // API error → fail-open

    const data = await res.json();
    return NextResponse.json({ found: (data.total ?? 0) > 0 });
  } catch {
    return NextResponse.json({ found: true }); // network error → fail-open
  }
}
