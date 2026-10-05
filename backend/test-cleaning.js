import fs from "fs";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";

const raw = fs.readFileSync("../major_project/gehu_data/dataset.json", "utf-8");
const dataset = JSON.parse(raw);

const firstRecord = dataset[0];
console.log("--- BEFORE CLEANING ---");
console.log(firstRecord.content.slice(0, 300));

const cleaned = cleanText(firstRecord.content);
const validated = validateExtractedText(cleaned);

console.log("\n--- AFTER CLEANING ---");
console.log(validated.slice(0, 300));