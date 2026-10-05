export function exportToCSV(data: any[], header: string, fileName: string) {
  if (!data || data.length === 0) return;

  // Extract keys from the first data object
  const headers = Object.keys(data[0]);

  // Build CSV rows
  const rows = data.map((item) =>
    headers
      .map((key) => {
        const value = item[key];
        if (Array.isArray(value)) return `"${value.join("; ")}"`; // handle arrays
        if (value === null || value === undefined) return "";
        return `"${String(value).replace(/"/g, '""')}"`; // escape quotes
      })
      .join(",")
  );

  // Add headers to the beginning
  const csvContent =
    "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // clean up
}

export function exportUserDataToCSV(users: any[], fileName: string) {
  if (!users || users.length === 0) return;

  // Extract keys from the first user object
  const headers = Object.keys(users[0]);

  // Build CSV rows
  const rows = users.map((user) =>
    headers
      .map((key) => {
        const value = user[key];
        if (Array.isArray(value)) return `"${value.join("; ")}"`; // handle roles, etc.
        if (value === null || value === undefined) return "";
        return `"${String(value).replace(/"/g, '""')}"`; // escape quotes
      })
      .join(",")
  );

  // Add headers to the beginning
  const csvContent =
    "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // clean up
}
