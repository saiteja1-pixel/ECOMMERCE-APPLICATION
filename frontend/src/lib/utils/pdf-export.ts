export interface PDFColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

export async function exportToPDF<T>(
  title: string,
  subtitle: string,
  columns: PDFColumn<T>[],
  data: T[],
  filename: string,
  summaryNotes?: string
): Promise<void> {
  // Lazy load heavy PDF libraries to optimize bundle size
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const timestamp = new Date().toLocaleString();

  // Limit to 1000 rows per requirements
  const isTruncated = data.length > 1000;
  const processData = isTruncated ? data.slice(0, 1000) : data;

  // Header Branded Area
  doc.setFillColor(30, 27, 75); // Dark Purple / Navy (#1e1b4b)
  doc.rect(0, 0, 210, 32, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CommerceHub Dashboard Reports", 14, 14);

  // Subtitle / Scope
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text(`Scope: Platform Administration System`, 14, 20);
  doc.text(`Generated At: ${timestamp}`, 14, 25);

  // Report Specific Header Card
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 47);

  // Truncation warning if applicable
  let startY = 52;
  if (isTruncated) {
    doc.setFillColor(254, 243, 199); // Warning yellow
    doc.rect(14, startY, 182, 7, "F");
    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("NOTE: This report contains more than 1000 rows. The PDF has been truncated to show only the first 1000 rows.", 16, startY + 4.5);
    startY += 10;
  }

  // Summary Row Notes if applicable
  if (summaryNotes) {
    doc.setFillColor(243, 244, 246); // Light slate
    doc.rect(14, startY, 182, 10, "F");
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(summaryNotes, 18, startY + 6.5);
    startY += 14;
  }

  // Prepare table columns and rows
  const tableHeaders = columns.map((col) => col.header);
  const tableRows = processData.map((row) => {
    return columns.map((col) => {
      if (typeof col.accessorKey === "function") {
        const val = col.accessorKey(row);
        return val !== null && val !== undefined ? String(val) : "";
      }
      const val = row[col.accessorKey];
      return val !== null && val !== undefined ? String(val) : "";
    });
  });

  // Render Table
  autoTable(doc, {
    startY: startY,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [79, 70, 229], // Indigo (#4f46e5)
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Page Number Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const str = `Page ${data.pageNumber}`;
      doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      doc.text("CommerceHub platform audit records are confidential.", 14, doc.internal.pageSize.height - 10);
    },
  });

  // Save the PDF file
  doc.save(filename);
}
