export function downloadCSV(headers, filename) {
  const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link); 
  link.click();
  document.body.removeChild(link);
}
