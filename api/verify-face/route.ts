import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { image, processo } = await request.json();

    // Simulação: verificação sempre retorna sucesso
    const sucesso = true;

    return NextResponse.json({ success: sucesso });
}
