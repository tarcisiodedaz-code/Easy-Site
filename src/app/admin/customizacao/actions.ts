"use server";

import { setLojaConfig } from "@/lib/loja-config";
import type { LojaConfigMap } from "@/types/loja-config";

export async function saveBannerCarousel(slides: LojaConfigMap["carousel"]) {
  return setLojaConfig("carousel", slides);
}

export async function saveBannerPreSale(config: LojaConfigMap["pre_sale"]) {
  return setLojaConfig("pre_sale", config);
}
