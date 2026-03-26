import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/** Resposta pública: só o necessário para precificação/quantidade — sem email, IDs de conta ou dados de cliente. */
export type EstoqueAgrupado = {
  jogo_id: string;
  game_name: string;
  custo_medio: number;
  custo_medio_ps4: number;
  custo_medio_ps5: number;
  qtd_ps4: number;
  qtd_ps5: number;
  qtd_total: number;
  slots: {
    slot_id: string;
    console: string | null;
    tipo: string | null;
    custo_vaga: number | null;
  }[];
};

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("estoque")
      .select("slot_id, jogo_id, console, tipo, custo_vaga, game_name");
    
    if (error) {
      console.error("Erro ao buscar estoque:", error);
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ estoque: [] });
    }

    const agrupado = new Map<string, EstoqueAgrupado>();

    for (const slot of data) {
      const jogoId = slot.jogo_id;
      const gameName = slot.game_name || "Sem nome";
      const console = (slot.console || "").toUpperCase();
      const custoVaga = Number(slot.custo_vaga) || 0;

      if (!agrupado.has(jogoId)) {
        agrupado.set(jogoId, {
          jogo_id: jogoId,
          game_name: gameName,
          custo_medio: 0,
          custo_medio_ps4: 0,
          custo_medio_ps5: 0,
          qtd_ps4: 0,
          qtd_ps5: 0,
          qtd_total: 0,
          slots: [],
        });
      }

      const grupo = agrupado.get(jogoId)!;
      grupo.slots.push({
        slot_id: slot.slot_id,
        console: slot.console,
        tipo: slot.tipo,
        custo_vaga: slot.custo_vaga,
      });

      if (console.includes("PS4") || console === "4") {
        grupo.qtd_ps4++;
      } else if (console.includes("PS5") || console === "5") {
        grupo.qtd_ps5++;
      }
      grupo.qtd_total++;
    }

    for (const grupo of agrupado.values()) {
      const custosPs4 = grupo.slots
        .filter((s) => {
          const c = (s.console || "").toUpperCase();
          return c.includes("PS4") || c === "4";
        })
        .map((s) => Number(s.custo_vaga) || 0)
        .filter((c) => c > 0);
      const custosPs5 = grupo.slots
        .filter((s) => {
          const c = (s.console || "").toUpperCase();
          return c.includes("PS5") || c === "5";
        })
        .map((s) => Number(s.custo_vaga) || 0)
        .filter((c) => c > 0);

      grupo.custo_medio_ps4 = custosPs4.length > 0 ? Math.min(...custosPs4) : 0;
      grupo.custo_medio_ps5 = custosPs5.length > 0 ? Math.min(...custosPs5) : 0;

      if (grupo.qtd_ps4 > 0 && grupo.qtd_ps5 > 0) {
        grupo.custo_medio = Math.min(grupo.custo_medio_ps4 || 0, grupo.custo_medio_ps5 || 0);
      } else if (grupo.qtd_ps4 > 0) {
        grupo.custo_medio = grupo.custo_medio_ps4;
      } else {
        grupo.custo_medio = grupo.custo_medio_ps5;
      }
    }

    const resultado = Array.from(agrupado.values()).sort((a, b) =>
      a.game_name.localeCompare(b.game_name, "pt-BR")
    );

    return NextResponse.json({ estoque: resultado });
  } catch (e) {
    console.error("Erro interno:", e);
    return NextResponse.json({ erro: "Erro interno ao buscar estoque" }, { status: 500 });
  }
}
