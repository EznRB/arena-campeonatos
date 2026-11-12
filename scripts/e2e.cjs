const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const executablePath =
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (dialog) => dialog.accept());
  const shots = path.resolve(__dirname, "../docs/images");
  fs.mkdirSync(shots, { recursive: true });
  const shot = (name) =>
    page.screenshot({ path: path.join(shots, name + ".png"), fullPage: true });
  try {
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "+ Criar campeonato", exact: true })
      .click();
    await page.getByLabel("Nome do campeonato").fill("Copa do Campus");
    await page.getByLabel("Modalidade ou jogo").fill("EA FC");
    await page.getByLabel("Local (opcional)").fill("Sala de jogos");
    await page.getByLabel("Data · DD/MM/AAAA").fill("07/12/2027");
    await page.getByLabel("Horário local · HH:MM").fill("18:30");
    await page
      .getByRole("button", { name: "Criar campeonato", exact: true })
      .click();
    await page.getByRole("button", { name: "Gerenciar participantes" }).click();
    for (const name of ["Luna", "Rafa", "Davi", "Bia", "Caio"]) {
      await page.getByLabel("Nome do jogador ou equipe").fill(name);
      await page
        .getByRole("button", { name: "Adicionar participante" })
        .click();
      await page.getByLabel("Nome do jogador ou equipe").waitFor();
      await page.waitForFunction(() =>
        [...document.querySelectorAll("input")].some(
          (input) =>
            input.getAttribute("aria-label") === "Nome do jogador ou equipe" &&
            input.value === "",
        ),
      );
    }
    await page
      .getByRole("button", { name: "Editar nome", exact: true })
      .first()
      .click();
    await page.getByLabel("Novo nome do participante").fill("Luna Silva");
    await page
      .getByRole("button", { name: "Salvar nome", exact: true })
      .click();
    await page.getByText("Luna Silva", { exact: true }).waitFor();
    for (let i = 0; i < 5; i++)
      await page
        .getByRole("button", { name: "Confirmar presença", exact: true })
        .first()
        .click();
    await shot("02-participantes");
    await page.getByRole("button", { name: "Abrir cartão QR" }).first().click();
    await page.getByText("ARENA · INSCRIÇÃO", { exact: true }).waitFor();
    await page.locator("svg:visible").last().waitFor();
    await shot("03-cartao-qr");
    await page.goBack();
    await page.goBack();
    await page
      .getByRole("button", { name: "Sortear confrontos e iniciar" })
      .click();
    await page.getByRole("tab", { name: "Semifinal", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Semifinal", exact: true }).click();
    await shot("04-chaveamento");
    let played = 0;
    for (const round of ["Quartas de final", "Semifinal", "Final"]) {
      await page.getByRole("tab", { name: round, exact: true }).click();
      while (
        await page.getByRole("button", { name: /^Registrar resultado/ }).count()
      ) {
        await page
          .getByRole("button", { name: /^Registrar resultado/ })
          .first()
          .click();
        await page.getByRole("textbox").nth(0).fill("2");
        await page.getByRole("textbox").nth(1).fill("1");
        if (!played) await shot("05-resultado");
        await page
          .getByRole("button", { name: "Confirmar resultado", exact: true })
          .click();
        played++;
        await page.getByRole("tab", { name: round, exact: true }).waitFor();
      }
    }
    assert.equal(played, 4, "Cinco participantes exigem quatro partidas reais");
    await page.goBack();
    await page.getByText("ARENA · CAMPEÃO", { exact: true }).waitFor();
    await shot("06-campeao");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("ARENA · CAMPEÃO", { exact: true }).waitFor();
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "+ Criar campeonato", exact: true })
      .waitFor();
    await shot("01-inicio");
    await page.getByRole("tab", { name: /Histórico/ }).click();
    await page.getByRole("button", { name: "Abrir Copa do Campus" }).waitFor();
    await shot("07-historico");
    const saved = await page.evaluate(() =>
      localStorage.getItem("@arena/tournaments/v1"),
    );
    await page.evaluate(() =>
      localStorage.setItem("@arena/tournaments/v1", "{broken"),
    );
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByText("Seus dados estão preservados", { exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("@arena/tournaments/v1")),
      "{broken",
    );
    await page.evaluate(
      (value) => localStorage.setItem("@arena/tournaments/v1", value),
      saved,
    );
    await page
      .getByRole("button", { name: "Tentar carregar novamente" })
      .click();
    await page.getByRole("tab", { name: /Histórico/ }).click();
    await page.getByRole("button", { name: "Abrir Copa do Campus" }).waitFor();
    assert.deepEqual(errors, [], "Não deve haver erros JavaScript no fluxo");
    console.log(
      JSON.stringify({
        status: "passed",
        participants: 5,
        matches: played,
        persistedAfterReload: true,
        corruptionPreservedAndRecovered: true,
        runtimeErrors: errors.length,
        screenshots: 7,
      }),
    );
  } catch (error) {
    await page.screenshot({
      path: path.resolve(__dirname, "../logs/e2e-failure.png"),
      fullPage: true,
    });
    console.error("Runtime errors:", errors);
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
