const BASE_URL = 'http://localhost:5000';

export async function salvarRosto(processo: string, imageBase64: string) {
  const res = await fetch(`${BASE_URL}/salvar-rosto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processo, image: imageBase64 }),
  });
  return res.json();
}

export async function verificarRosto(processo: string, imageBase64: string) {
  const res = await fetch(`${BASE_URL}/verificar-rosto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processo, image: imageBase64 }),
  });
  return res.json();
}
