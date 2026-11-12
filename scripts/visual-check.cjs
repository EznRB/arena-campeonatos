const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const dir = path.resolve(__dirname, "../docs/images");
  fs.mkdirSync(dir, { recursive: true });
  async function shot(name) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(dir, name + ".png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Overflow horizontal: ${name}`,
    );
  }
  try {
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Explorar demonstração", exact: true })
      .waitFor();
    await shot("v2-desktop-inicio");
    await page
      .getByRole("button", { name: "Explorar demonstração", exact: true })
      .click();
    await page.getByRole("button", { name: "Abrir chaveamento" }).waitFor();
    await shot("v2-desktop-central");
    await page.getByRole("button", { name: "Abrir chaveamento" }).click();
    await page.getByText("Final", { exact: true }).waitFor();
    await shot("v2-desktop-chaveamento");
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Abrir Copa Arena • Demo" })
      .waitFor();
    await page
      .getByText(
        "Os indicadores consideram apenas campeonatos reais. Demonstrações não entram nos totais.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page.getByText("00", { exact: true }).count(),
      3,
      "Demo não pode inflar indicadores reais",
    );
    await shot("v2-desktop-dashboard");
    await page
      .getByRole("button", { name: "Inscrições abertas", exact: true })
      .click();
    await page
      .getByText("Nenhum campeonato por aqui", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Todos", exact: true }).click();
    await page.getByLabel("Buscar campeonatos").fill("não existe");
    await page
      .getByText("Nenhum campeonato por aqui", { exact: true })
      .waitFor();
    await page.getByLabel("Buscar campeonatos").fill("");
    await page
      .getByRole("button", { name: "+ Criar campeonato", exact: true })
      .click();
    await page.getByLabel("Nome do campeonato").waitFor();
    await shot("v2-desktop-criar");
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Abrir Copa Arena • Demo" })
      .waitFor();
    await shot("v2-mobile-dashboard");
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        status: "passed",
        desktop: "1440x1000",
        mobile: "430x932",
        horizontalOverflow: false,
        runtimeErrors: errors.length,
        demo: true,
        searchAndFilters: true,
        screenshots: 6,
      }),
    );
  } catch (error) {
    await page.screenshot({
      path: path.resolve(__dirname, "../logs/visual-failure.png"),
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
