import { Suspense } from "react";
import JustificarClient from "./JustificarClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <JustificarClient />
    </Suspense>
  );
}
