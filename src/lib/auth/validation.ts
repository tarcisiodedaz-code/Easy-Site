import { z } from "zod";

// Telefone: apenas dígitos, 10 ou 11 (DDD + número)
const phoneDigitsOnly = (s: string) => s.replace(/\D/g, "").length >= 10 && s.replace(/\D/g, "").length <= 11;
// CPF: 11 dígitos
const cpfDigitsOnly = (s: string) => s.replace(/\D/g, "").length === 11;

export const signUpSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone_number: z
    .string()
    .min(10, "Informe um número de contato válido")
    .refine(phoneDigitsOnly, "Número de contato inválido (use DDD + número)"),
  cpf: z
    .string()
    .min(11, "Informe o CPF com 11 dígitos")
    .refine(cpfDigitsOnly, "CPF inválido (use apenas números)"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
