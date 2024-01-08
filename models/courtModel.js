const mongoose = require("mongoose");

const CourtDetailsSchema = new mongoose.Schema({
  serialNumber: String, // "क्र.सं." - Serial No.
  department: String, // "फाँट" - Department/Division
  registrationDate: String, // "दर्ता मिति" - Registration Date
  caseName: String, // "मुद्दा" - Case
  caseNumber: String, // "मुद्दा नं." - Case No.
  side: String, // "पक्ष" - Side
  oppositeSide: String, // "बिपक्ष" - Opposite Side
  codeNumber: String, // "कोड नं." - Code No.
  symbol: String, // "संकेत" - Symbol/Sign
  ineligibleJudges: String, // "हेर्न नमिल्ने मा.न्या." - Judges not eligible to see
  remarks: String, // "कैफियत" - Remarks
});

const courtSchema = new mongoose.Schema({
  currentDate: { type: Date, default: Date.now }, // Current Date
  currentDay: {
    // Current Day
    type: String,
    default: () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
  },
  courtDetails: CourtDetailsSchema, // Court Details
});

const courtModel = mongoose.model("Data", courtSchema);
module.exports = courtModel;
