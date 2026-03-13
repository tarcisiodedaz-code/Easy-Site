export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
};
