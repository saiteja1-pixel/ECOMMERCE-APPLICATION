export interface CSVColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

export function exportToCSV<T>(
  columns: CSVColumn<T>[],
  data: T[],
  filename: string
): void {
  // Helper to escape values per RFC 4180
  const escapeValue = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // If it contains double quotes, commas, or newlines, wrap in quotes and double quotes
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Compile Header Row
  const headers = columns.map((col) => escapeValue(col.header)).join(",");

  // Compile Data Rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        if (typeof col.accessorKey === "function") {
          return escapeValue(col.accessorKey(row));
        }
        return escapeValue(row[col.accessorKey]);
      })
      .join(",");
  });

  // Combine
  const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n"); // UTF-8 BOM

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
