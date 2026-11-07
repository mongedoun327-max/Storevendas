import { test, expect } from "@playwright/test";

test.describe("Jornada Crítica do PDV - Worscoi POS", () => {
  test.beforeEach(async ({ page }) => {
    // Autenticação e entrada no terminal
    await page.goto("/login");
    await page.fill('input[name="email"]', "operador@worscoi.co.ao");
    await page.fill('input[name="password"]', "SenhaSegura123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/pdv");
  });

  test("Fluxo Completo: Abertura -> Leitura Barcode -> Pagamento Multicaixa -> Fecho", async ({ page }) => {
    // 1. Abertura de Caixa / Turno
    const openingModal = page.locator('[data-testid="modal-abertura-caixa"]');
    if (await openingModal.isVisible()) {
      await page.fill('input[name="fundoManeio"]', "50000"); // 50.000 Kz inicial
      await page.click('button[data-testid="btn-abrir-caixa"]');
      await expect(openingModal).toBeHidden();
    }

    // 2. Leitura de Código de Barras (Simulação de Scanner USB)
    const barcodeInput = page.locator('input[data-testid="input-barcode-scanner"]');
    await barcodeInput.focus();
    await barcodeInput.fill("5601234567890");
    await barcodeInput.press("Enter");

    // Verificar se o item entrou no carrinho
    const cartList = page.locator('[data-testid="cart-items-list"]');
    await expect(cartList).toContainText("5601234567890");
    await expect(page.locator('[data-testid="cart-total-value"]')).not.toHaveText("0,00 Kz");

    // 3. Processamento de Pagamento (Multicaixa TPA)
    await page.click('button[data-testid="btn-finalizar-venda"]');
    await page.click('button[data-testid="payment-method-multicaixa"]');

    // Confirmar recebimento do valor
    await page.click('button[data-testid="btn-confirmar-pagamento"]');

    // 4. Validação da Emissão de Fatura/Recibo
    const receiptModal = page.locator('[data-testid="modal-recibo-sucesso"]');
    await expect(receiptModal).toBeVisible({ timeout: 5000 });
    await expect(receiptModal).toContainText("FR FT2026/");
    await expect(receiptModal).toContainText("Processado por computador");

    // Fechar modal de confirmação do recibo
    await page.click('button[data-testid="btn-novo-atendimento"]');

    // 5. Sangria e Fecho de Turno
    await page.click('button[data-testid="btn-menu-caixa"]');
    await page.click('button[data-testid="btn-fechar-caixa"]');

    // Conferência Cega de Valores
    await page.fill('input[name="declaradoMulticaixa"]', "12500");
    await page.fill('input[name="declaradoDinheiro"]', "50000");
    await page.click('button[data-testid="btn-confirmar-fecho"]');

    // Validação do Relatório de Fecho
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText(
      "Turno encerrado com sucesso"
    );
  });

  test("Fallback Offline: Registar venda sem ligação à rede", async ({ page, context }) => {
    // Simular corte de ligação física de rede
    await context.setOffline(true);

    // Adicionar produto manualmente
    await page.fill('input[data-testid="input-barcode-scanner"]', "7709998881112");
    await page.keyboard.press("Enter");

    // Finalizar em Dinheiro
    await page.click('button[data-testid="btn-finalizar-venda"]');
    await page.click('button[data-testid="payment-method-dinheiro"]');
    await page.click('button[data-testid="btn-confirmar-pagamento"]');

    // Verificar indicador de armazenamento local (IndexedDB)
    const offlineBadge = page.locator('[data-testid="badge-venda-offline"]');
    await expect(offlineBadge).toBeVisible();

    // Restabelecer rede e validar sincronização
    await context.setOffline(false);
    await page.waitForTimeout(2000); // Aguardar ciclo do SyncManager
    await expect(offlineBadge).toBeHidden();
  });
});
