const mongoose = require('mongoose')
const CompanySchema = new mongoose.Schema({
companyName: { type: String, required: true },
projectName: String ,
status: { type: String, enum: ['Active','Inactive'], default: 'Inactive' },
empId: { type: String, required: true },
createdAt: { type: Date, default: Date.now }
})
CompanySchema.index({ companyName: 1 }, { unique: true })
module.exports = mongoose.model('Company', CompanySchema)