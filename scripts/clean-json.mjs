import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import JSON5 from "json5";

function isEmptyString(value) {
  return typeof value === "string" && value.trim() === "";
}

function cleanValue(value) {
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => cleanValue(item))
      .filter((item) => item !== null);
    return cleanedArray;
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      // Drop empty-string fields
      if (isEmptyString(val)) continue;

      const cleaned = cleanValue(val);
      // Drop empty objects (cleaned -> null indicates empty)
      if (cleaned === null) continue;

      result[key] = cleaned;
    }

    // If object has no own keys after cleaning, drop it (return null sentinel)
    if (Object.keys(result).length === 0) return null;
    return result;
  }

  // Primitive non-object, non-array values: keep as-is (including numbers, booleans, non-empty strings)
  return value;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/clean-json.mjs <path-to-json>");
    process.exit(1);
  }

  const absolutePath = resolve(process.cwd(), inputPath);
  const original = readFileSync(absolutePath, "utf8");

  let json;
  try {
    // Try strict JSON first
    json = JSON.parse(original);
  } catch (strictErr) {
    try {
      // Fallback to JSON5 for lenient parsing (trailing commas, comments, etc.)
      json = JSON5.parse(original);
    } catch (json5Err) {
      console.error("Failed to parse JSON with both JSON and JSON5:");
      console.error("JSON error:", strictErr.message);
      console.error("JSON5 error:", json5Err.message);
      process.exit(1);
    }
  }

  const cleaned = cleanValue(json);

  // Backup original
  const backupPath = absolutePath + ".bak";
  try {
    copyFileSync(absolutePath, backupPath);
  } catch (err) {
    console.error("Failed to create backup:", err.message);
  }

  // Write cleaned JSON with 2-space indentation
  const output = JSON.stringify(cleaned, null, 2) + "\n";
  writeFileSync(absolutePath, output, "utf8");
  console.log("Cleaned file written:", absolutePath);
}

main();
