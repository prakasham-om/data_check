const mongoose = require('mongoose')
const SheetIndex = new mongoose.Schema({
spreadsheetId: { type: String, required: true },
sheetName: { type: String, required: true },
rowsUsed: { type: Number, default: 0 },
colsUsed: { type: Number, default: 4 },
createdAt: { type: Date, default: Date.now }
})
module.exports = mongoose.model('SheetIndex', SheetIndex)