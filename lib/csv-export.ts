/**
 * CSV Export Utility
 * Converts arrays of objects to CSV format and triggers browser download
 */

/**
 * Convert an array of objects to CSV string
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return "";
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create header row
  const headerRow = headers.join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return "";
        }

        // Convert to string
        let cellValue = String(value);

        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (cellValue.includes(",") || cellValue.includes("\n") || cellValue.includes('"')) {
          cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }

        return cellValue;
      })
      .join(",");
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 support
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;

  // Create blob
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV (combines convert + download)
 * @param data - Array of objects to export
 * @param filename - Name of the file (should end with .csv)
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Ensure filename ends with .csv
  const csvFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, csvFilename);
}

/**
 * Generate filename with current date
 * @param prefix - Prefix for the filename (e.g., "flipops-contracts")
 * @returns Filename with date (e.g., "flipops-contracts-2025-11-30.csv")
 */
export function generateFilename(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}-${dateStr}.csv`;
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US");
}

/**
 * Format boolean for CSV export
 */
export function formatBooleanForCSV(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value ? "Yes" : "No";
}
