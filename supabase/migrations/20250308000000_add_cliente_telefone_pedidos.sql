-- Telefone/WhatsApp do cliente no pedido (para notificação e contato).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
