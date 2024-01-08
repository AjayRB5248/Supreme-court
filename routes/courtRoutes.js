const express = require("express");
const router = express.Router();
const courtController = require("../controllers/courtController");

router.get("/scrape", courtController.scrapeAndStoreCourtData);

router.get("/searchCase", courtController.searchByCaseNumber);

module.exports = router;
