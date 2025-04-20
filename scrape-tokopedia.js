const puppeteer = require("puppeteer");
const fs = require("fs");

const PAGE = 5;

async function scrapeTokopedia() {
  const browser = await puppeteer.launch({
    headless: true,
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

  const url = `https://www.tokopedia.com/search?navsource=home&page=${PAGE}&q=drone&search_id=20250420091821711196122719BC063RL0&srp_component_id=02.01.00.00&srp_page_id=&srp_page_title=&st=product`;
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

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
          // const priceElement = linkElement.querySelector(
          //   "div > div:nth-child(2) > div:nth-child(2) > div"
          // );
          // const shopNameElement = linkElement.querySelector(
          //   "div > div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > span:nth-child(1)"
          // );
          // const locationElement = linkElement.querySelector(
          //   "div > div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > span:nth-child(2)"
          // );

          const title = titleElement?.innerText.trim() || "";
          // const price = priceElement?.innerText.trim() || "";
          // const shopName = shopNameElement?.innerText.trim() || "";
          // const location = locationElement?.innerText.trim() || "";
          const link = linkElement.href || "";

          if (title && link) {
            items.push({ title, link });
          }
        } catch (err) {
          console.log("Error parsing a product:", err);
        }
      });
    });

    return items;
  });

  for (let product of products) {
    await page.goto(product.link, { waitUntil: "networkidle2" });

    const detail = await page.evaluate(() => {
      const description =
        document.querySelector('[data-testid="lblPDPDescriptionProduk"]')
          ?.innerText || "";
      const condition =
        document.querySelector('[data-testid="lblPDPInfoCondition"]')
          ?.innerText || "";
      const category =
        document.querySelector('[data-testid="linkBreadcrumb"]')?.innerText ||
        "";
      const productRating =
        document.querySelector(
          '[data-testid="lblPDPDetailProductRatingNumber"]'
        )?.innerText || "";
      const productRatingCounter =
        document.querySelector(
          '[data-testid="lblPDPDetailProductRatingCounter"]'
        )?.innerText || "";
      const shopName =
        document.querySelector('[data-testid="llbPDPFooterShopName"] > h2')
          ?.innerText || "";
      const originLocation =
        document.querySelector(
          '[id="pdp_comp-shipment_v4"] > div:nth-child(2) > div > div > h2 > b'
        )?.innerText || "";
      const price =
        document.querySelector('[data-testid="lblPDPDetailProductPrice"]')
          ?.innerText || "";

      return {
        description,
        productRating,
        productRatingCounter,
        shopName,
        originLocation,
        price,
      };
    });

    // Gabungkan dengan data awal
    product.shopName = detail.shopName;
    product.originLocation = detail.originLocation;
    product.price = detail.price;
    product.description = detail.description;
    product.productRating = detail.productRating;
    product.productRatingCounter = detail.productRatingCounter;

    console.log(`✔️ Fetched detail for ${product.title}`);
    fs.writeFileSync(
      `products-page-${PAGE}.json`,
      JSON.stringify(products, null, 2)
    );
  }

  console.log(`Scraped ${products.length} products:`);

  await browser.close();
}

scrapeTokopedia();
