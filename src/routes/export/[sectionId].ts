import { APIEvent } from "@solidjs/start/server";
import Database from "~/services/Database";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

function docToBuffer(doc: PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));
    doc.end();
  });
}

export async function GET({ params, request }: APIEvent) {
  const { sectionId } = params;
  const section = await Database.findOne("sections", { identifier: sectionId });
  const groups = await Database.find("groups", { section_id: sectionId });
  const allStudents = await Database.findAllIn("students");

  const url = new URL(request.url);
  if (url.searchParams.get("type") === "excelunassigned") {
    const assignedIds = groups.flatMap((g: any) => g.students || []);
    const unassigned = allStudents.filter((s) => !assignedIds.includes(s.id));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Unassigned Students");
    sheet.columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Surname", key: "surname" },
    ];
    unassigned.forEach((student: Student) => {
      sheet.addRow(student);
    });

    const xlsData = await workbook.xlsx.writeBuffer();
    return new Response(xlsData, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="unassigned_${sectionId}.xlsx"`,
      },
    });
  }

  const doc = new PDFDocument({ autoFirstPage: true });
  doc.registerFont("TurkishFont", "public/fonts/DejaVuSans.ttf");
  doc.font("TurkishFont");
  doc.fontSize(18).text(`Section: ${section?.section_name || "Unknown"}`);
  groups.forEach((g: any) => {
    doc.moveDown().fontSize(14).text(`Group: ${g.group_name}`);
    doc.moveDown().fontSize(12).text("Öğrenci Numarası - İsim Soyisim");
    (g.students || []).forEach((sid: number) => {
      const student = allStudents.find((s: Student) => s.id === sid);
      if (student) {
        doc.text(`${student.id} - ${student.name} ${student.surname}`);
      }
    });
  });

  const pdfBuffer = await docToBuffer(doc);
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="section_${sectionId}.pdf"`,
    },
  });
}
