import { VitrineConfigClient } from "./VitrineConfigClient";

export default async function AdminVitrinePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Gerenciar Vitrine
        </h1>
        <p className="mt-2 text-zinc-400">
          Escolha quais seções aparecem na página inicial. Os blocos desativados não são exibidos e não deixam espaço vazio.
        </p>
      </header>

      <VitrineConfigClient />
    </div>
  );
}
