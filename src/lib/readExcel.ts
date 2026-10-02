import * as XLSX from "xlsx";
import { parseWorkbook, ParseResult } from "./parse";

export function readExcel(data: Uint8Array): ParseResult {
  const wb = XLSX.read(data, { type: "array" });
  const sheets: Record<string, any[][]> = {};
  wb.SheetNames.forEach((n) => {
    sheets[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: null, raw: true }) as any[][];
  });
  return parseWorkbook(sheets);
}
