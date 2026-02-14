import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { IIncident, IUser } from "../types";

export const exportToCSV = (incidents: IIncident[]): string => {
  const fields = [
    { label: "ID", value: "_id" },
    { label: "Title", value: "title" },
    { label: "Category", value: "category" },
    { label: "Status", value: "status" },
    { label: "Priority", value: "priority" },
    { label: "Severity", value: "severity" },
    { label: "Reported By", value: "reportedBy.username" },
    { label: "Assigned To", value: "assignedTo.username" },
    { label: "Created At", value: "createdAt" },
    { label: "Resolved At", value: "resolvedAt" },
    { label: "Resolution Time (min)", value: "resolutionTime" },
  ];

  const parser = new Parser({ fields });
  return parser.parse(incidents);
};

export const exportToPDF = async (incidents: IIncident[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `incidents-export-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, "../../exports", filename);

    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text("Incident Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    // Summary
    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(10).text(`Total Incidents: ${incidents.length}`);
    doc.text(`Open: ${incidents.filter((i) => i.status === "open").length}`);
    doc.text(
      `Resolved: ${incidents.filter((i) => i.status === "resolved").length}`,
    );
    doc.moveDown();

    // Incident Details
    doc.fontSize(14).text("Incident Details", { underline: true });
    doc.moveDown();

    incidents.forEach((incident, index) => {
      if (index > 0) doc.moveDown();

      doc.fontSize(12).text(`${index + 1}. ${incident.title}`);
      doc
        .fontSize(10)
        .text(`ID: ${incident._id}`)
        .text(`Category: ${incident.category}`)
        .text(`Status: ${incident.status}`)
        .text(`Priority: ${incident.priority}`)
        .text(`Created: ${new Date(incident.createdAt).toLocaleDateString()}`)
        .text(
          `Reported By: ${(incident.reportedBy as IUser)?.username || "N/A"}`,
        );

      if (incident.assignedTo) {
        doc.text(
          `Assigned To: ${(incident.assignedTo as IUser)?.username || "N/A"}`,
        );
      }

      if (incident.resolvedAt) {
        doc.text(
          `Resolved: ${new Date(incident.resolvedAt).toLocaleDateString()}`,
        );
        doc.text(`Resolution Time: ${incident.resolutionTime} minutes`);
      }

      if (incident.description) {
        doc.text(`Description: ${incident.description.substring(0, 200)}...`);
      }

      // Add page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });

    doc.end();

    stream.on("finish", () => {
      resolve(filepath);
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};
