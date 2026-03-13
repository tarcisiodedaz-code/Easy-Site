import { redirect } from "next/navigation";

/** Customização foi unificada: use Produtos > Categorias e Personalize sua Loja > Banners. */
export default function AdminCustomizacaoPage() {
  redirect("/admin");
}
