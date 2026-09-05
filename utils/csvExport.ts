import type { SaleRecord } from '../types';

export const handleDownloadCSV = (filteredSales: SaleRecord[], filters: { startDate: string; endDate: string }, showToast: (msg: string, type: 'success' | 'error') => void) => {
  if (filteredSales.length === 0) {
    showToast("No filtered records to export.", "error");
    return;
  }

  // Group filtered sales by shopName
  const salesByShop: { [shopName: string]: SaleRecord[] } = {};
  filteredSales.forEach((record) => {
    if (!salesByShop[record.shopName]) {
      salesByShop[record.shopName] = [];
    }
    salesByShop[record.shopName].push(record);
  });

  const csvLines: string[] = [];

  // Document Header Information
  csvLines.push(`"=== CEMENT SALES TRACKER REPORT ==="`);
  csvLines.push(
    `"Generated On:","${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB")}"`,
  );
  csvLines.push(
    `"Filtered Period:","${filters.startDate || "Beginning"} to ${filters.endDate || "Present"}"`,
  );
  csvLines.push(""); // Blank spacer row

  // Headers for the sales tables
  const headers = [
    "Date",
    "Stock Type",
    "Bags Sold",
    "Price Per Bag",
    "Expected Revenue (NGN)",
    "Total Transfer (NGN)",
    "Expenses (NGN)",
    "Discrepancy (NGN)",
    "Notes",
  ];

  // Loop over shops to structure the sections
  Object.keys(salesByShop)
    .sort()
    .forEach((shop) => {
      const shopSales = [...salesByShop[shop]].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        
        const aTimeMatch = a.id.match(/^(\d{13})_/);
        const bTimeMatch = b.id.match(/^(\d{13})_/);
        const aTime = aTimeMatch ? parseInt(aTimeMatch[1], 10) : 0;
        const bTime = bTimeMatch ? parseInt(bTimeMatch[1], 10) : 0;
        
        if (aTime !== bTime) {
          return bTime - aTime;
        }
        return b.id.localeCompare(a.id);
      }); // Date and chronological ID descending

      // Category Section Heading
      csvLines.push(`"=== SHOP CATEGORY: ${shop.toUpperCase()} ==="`);
      csvLines.push(headers.join(","));

      let shopBags = 0;
      let shopRevenue = 0;
      let shopTransfer = 0;
      let shopExpenses = 0;
      let shopDiscrepancy = 0;

      shopSales.forEach((record) => {
        shopBags += record.bagsSold;
        shopRevenue += record.expectedRevenue;
        shopTransfer += record.totalTransfer;
        shopExpenses += record.expenses;
        shopDiscrepancy += record.discrepancy;

        const row = [
          record.date,
          record.stockType,
          record.bagsSold,
          record.pricePerBag,
          record.expectedRevenue,
          record.totalTransfer,
          record.expenses,
          record.discrepancy,
          record.notes ? record.notes.replace(/[\r\n]+/g, " | ") : "",
        ];

        const escapedRow = row
          .map((val) => {
            const str = String(val);
            if (
              str.includes(",") ||
              str.includes('"') ||
              str.includes("\n") ||
              str.includes("\r")
            ) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",");

        csvLines.push(escapedRow);
      });

      // Category Totals summary row
      const totalRow = [
        `"TOTALS FOR ${shop.toUpperCase()}"`,
        "",
        shopBags,
        "",
        shopRevenue,
        shopTransfer,
        shopExpenses,
        shopDiscrepancy,
        "",
      ];
      csvLines.push(totalRow.join(","));
      csvLines.push(""); // Blank rows to visually isolate shops
      csvLines.push("");
    });

  // Add overall report summary totals
  let totalBags = 0;
  let totalRev = 0;
  let totalTrans = 0;
  let totalExp = 0;
  let totalDisc = 0;

  filteredSales.forEach((record) => {
    totalBags += record.bagsSold;
    totalRev += record.expectedRevenue;
    totalTrans += record.totalTransfer;
    totalExp += record.expenses;
    totalDisc += record.discrepancy;
  });

  csvLines.push(`"=== REPORT SUMMED TOTALS (ALL SHOPS) ==="`);
  csvLines.push(`"Total Bags Sold:","${totalBags}"`);
  csvLines.push(`"Total Expected Revenue:","${totalRev} NGN"`);
  csvLines.push(`"Total Transferred:","${totalTrans} NGN"`);
  csvLines.push(`"Total Expenses:","${totalExp} NGN"`);
  csvLines.push(`"Total Discrepancies:","${totalDisc} NGN"`);

  const csvContent = csvLines.join("\n");

  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `shop_categorized_sales_backup_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export downloaded successfully!", "success");
  } catch (error) {
    console.error("Failed to export CSV", error);
    showToast("Failed to generate CSV backup.", "error");
  }
};
