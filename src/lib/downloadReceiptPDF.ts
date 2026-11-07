import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function downloadReceiptPDF(
  receiptElement: HTMLElement,
  receiptId: string
): Promise<void> {
  try {
    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 80;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Recibo_${receiptId}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF do recibo:", error);
  }
}
