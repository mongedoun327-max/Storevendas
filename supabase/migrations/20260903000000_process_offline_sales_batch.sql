-- Tabela de auditoria de conflitos de estoque (se não existir)
CREATE TABLE IF NOT EXISTS stock_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  requested_quantity integer NOT NULL,
  available_quantity integer NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Função RPC para processamento em lote de vendas offline
CREATE OR REPLACE FUNCTION process_offline_sales_batch(sales_payload jsonb)
RETURNS TABLE (
  processed_id uuid,
  had_conflict boolean
) AS $$
DECLARE
  sale_record jsonb;
  item_record jsonb;
  v_current_stock integer;
  v_requested_qty integer;
  v_sale_has_conflict boolean;
BEGIN
  FOR sale_record IN SELECT * FROM jsonb_array_elements(sales_payload)
  LOOP
    v_sale_has_conflict := false;

    -- 1. Insere a venda (Idempotência garantida pelo ON CONFLICT)
    INSERT INTO sales (id, total_amount, payment_method, created_at)
    VALUES (
      (sale_record->>'id')::uuid,
      (sale_record->>'total_amount')::numeric,
      sale_record->>'payment_method',
      (sale_record->>'created_at')::timestamptz
    )
    ON CONFLICT (id) DO NOTHING;

    IF FOUND THEN
      -- 2. Processa os itens da venda
      FOR item_record IN SELECT * FROM jsonb_array_elements(sale_record->'items')
      LOOP
        v_requested_qty := (item_record->>'quantity')::integer;

        -- Bloqueia o registo do produto para leitura/escrita atómica
        SELECT stock INTO v_current_stock 
        FROM products 
        WHERE id = (item_record->>'product_id')::uuid
        FOR UPDATE;

        -- Insere os itens da venda
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
        VALUES (
          (sale_record->>'id')::uuid,
          (item_record->>'product_id')::uuid,
          v_requested_qty,
          (item_record->>'unit_price')::numeric
        );

        -- 3. Verifica se há rutura de stock
        IF v_current_stock < v_requested_qty THEN
          v_sale_has_conflict := true;

          -- Regista o conflito na auditoria
          INSERT INTO stock_conflicts (
            sale_id,
            product_id,
            requested_quantity,
            available_quantity
          ) VALUES (
            (sale_record->>'id')::uuid,
            (item_record->>'product_id')::uuid,
            v_requested_qty,
            COALESCE(v_current_stock, 0)
          );
        END IF;

        -- Decrementa o stock independentemente (permite valor negativo para evidenciar a falha física)
        UPDATE products 
        SET stock = stock - v_requested_qty
        WHERE id = (item_record->>'product_id')::uuid;

      END LOOP;

      processed_id := (sale_record->>'id')::uuid;
      had_conflict := v_sale_has_conflict;
      RETURN NEXT;
    ELSE
      -- Venda já existia previamente (idempotente): confirma o processamento
      processed_id := (sale_record->>'id')::uuid;
      had_conflict := false;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
