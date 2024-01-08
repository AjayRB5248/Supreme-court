const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const CourtModel = require("../models/courtModel");
const cron = require("node-cron");

async function scrapeDataForDay(url, dayValue) {
  // Launch a new browser session
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Navigate to the page
  await page.goto(url);

  // Select the day from the dropdown
  await page.select('select[name="day"]', dayValue);

  // Click the search button
  await page.click('input[type="submit"]');

  // Wait for the page to load the results
  await page.waitForSelector("table", { visible: true, timeout: 5000 });

  // scrolling for infinite scroll
  let lastHeight = await page.evaluate("document.body.scrollHeight");
  while (true) {
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForTimeout(2000); // Wait for new data to load
    let newHeight = await page.evaluate("document.body.scrollHeight");
    if (newHeight === lastHeight) {
      break; // Break the loop when no new data is loaded
    }
    lastHeight = newHeight;
  }

  // Get the page content
  const html = await page.content();
  const $ = cheerio.load(html);

  // Array to hold the extracted data
  let tableData = [];

  // Extract table data
  $("table tr").each((index, element) => {
    if (index === 0) return; // Skip header row

    const row = $(element)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();
    tableData.push(row);
  });

  // Close the browser session
  await browser.close();

  return tableData;
}

async function scrapeDataEveryDay(url, dayValue) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the page and interact with it as needed
  await page.goto(url);
  await page.select('select[name="day"]', dayValue);
  await page.click('input[type="submit"]');
  await page.waitForSelector("table", { visible: true, timeout: 5000 });

  // Scrolling for infinite scroll
  let lastHeight = await page.evaluate("document.body.scrollHeight");
  while (true) {
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForTimeout(2000); // Wait for new data to load
    let newHeight = await page.evaluate("document.body.scrollHeight");
    if (newHeight === lastHeight) {
      break; // Break the loop when no new data is loaded
    }
    lastHeight = newHeight;
  }

  // Extract data from the page
  const html = await page.content();
  const $ = cheerio.load(html);

  let tableRows = $("table tr").toArray();
  let savedData = []; // Array to hold the saved data instances

  for (const element of tableRows) {
    if (tableRows.indexOf(element) === 0) continue; // Skip header row

    const row = $(element)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();

    const sides = row[5].split("।।").map((side) => side.trim());
    const side = sides[0] || "";
    const oppositeSide = sides[1] || "";

    const newData = new CourtModel({
      currentDate: new Date(),
      currentDay: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      courtDetails: {
        serialNumber: row[0],
        department: row[1],
        registrationDate: row[2],
        caseName: row[3],
        caseNumber: row[4],
        side: side,
        oppositeSide: oppositeSide,
        codeNumber: row[6],
        symbol: row[7],
        ineligibleJudges: row[8],
        remarks: row[9],
      },
    });

    await newData.save();
    savedData.push(newData); // Add the saved instance to the array
  }

  await browser.close();
  return savedData; // Return the array of saved data instances
}

const scrapeAndStoreCourtData = async (req, res) => {
  const dayValue = req.query.day;
  if (!dayValue) {
    return res.status(400).send("Day value is required");
  }

  try {
    const url =
      "https://supremecourt.gov.np/lic/sys.php?d=reports&f=weekly_public";
    const data = await scrapeDataForDay(url, dayValue);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Scraping failed:", error);
    res.status(500).json({ errorMessage: "Error occurred during scraping" });
  }
};

const searchByCaseNumber = async (req, res) => {
  const { caseNumber } = req.query;
  if (!caseNumber) {
    return res.status(400).json({ errorMessage: "caseNumber is required" });
  }

  try {
    const results = await CourtModel.find({
      "courtDetails.caseNumber": caseNumber,
    });

    if (!results.length) {
      return res.json({
        message: `No Data found for case Number ${caseNumber}`,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ errorMessage: "Error occurred during search" });
  }
};

// Function to get today's day of the week as a number (0-6, where 0 is Sunday, 1 is Monday, etc.)
const getCurrentDayValue = () => {
  const today = new Date();
  return today.getDay();
};

cron.schedule(
  "15 11 * * *",
  async () => {
    const url =
      "https://supremecourt.gov.np/lic/sys.php?d=reports&f=weekly_public";
    const dayValue = getCurrentDayValue();

    try {
      console.log("Running scheduled task to scrape data");
      const data = await scrapeDataEveryDay(url, dayValue);
      console.log("Scraping completed");
    } catch (error) {
      console.error("Error during scheduled scraping:", error);
    }
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

module.exports = { scrapeAndStoreCourtData, searchByCaseNumber };
