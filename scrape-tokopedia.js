const puppeteer = require("puppeteer");

async function scrapeTokopedia() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const url = "https://www.tokopedia.com/search?st=product&q=drone";
  await page.goto(url, { waitUntil: "networkidle2" });

  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight - 1000) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
  }

  await autoScroll(page);

  const products = await page.evaluate(() => {
    const items = [];
    const container = document.querySelector(
      'div[data-testid="divSRPContentProducts"]'
    );
    if (!container) return items;

    const rows = container.querySelectorAll("div.css-jza1fo");

    rows.forEach((row) => {
      const links = row.querySelectorAll("div.css-5wh65g > a");

      links.forEach((linkElement) => {
        try {
          const titleElement = linkElement.querySelector(
            "div > div:nth-child(2) > div:nth-child(1) > span"
          );
          const priceElement = linkElement.querySelector(
            "div > div:nth-child(2) > div:nth-child(2) > div"
          );
          const shopNameElement = linkElement.querySelector(
            "div > div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > span:nth-child(1)"
          );
          const locationElement = linkElement.querySelector(
            "div > div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > span:nth-child(2)"
          );

          const title = titleElement?.innerText.trim() || "";
          const price = priceElement?.innerText.trim() || "";
          const shopName = shopNameElement?.innerText.trim() || "";
          const location = locationElement?.innerText.trim() || "";
          const link = linkElement.href || "";

          if (title && price && link) {
            items.push({ title, price, shopName, location, link });
          }
        } catch (err) {
          console.log(`Error parsing a product:`, err);
        }
      });
    });

    return items;
  });

  console.log(`Scraped ${products.length} products:`);
  console.log(products);

  await browser.close();
}

scrapeTokopedia();
