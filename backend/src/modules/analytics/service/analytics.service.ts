import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { AnalyticsFilters, AnalyticsSummary, AreaComplianceRow, PausaRepository, TimelinePoint } from "../../pausas/repository/pausa.repository";
import { TimeGranularity } from "../validation/analytics.validation";

export interface AnalyticsReportData {
    summary: AnalyticsSummary;
    areas: AreaComplianceRow[];
    timeline: TimelinePoint[];
}

function complianceRate(summary: AnalyticsSummary): number {
    if (summary.total <= 0) return 0;
    return Math.round((100 * summary.completadas) / summary.total * 10) / 10;
}

const STATUS_COLORS = {
    programadas: "#182987",
    completadas: "#16a34a",
    aplazadas: "#f59e0b",
    canceladas: "#ed1736",
};

function formatPeriod(period: string): string {
    if (period.length === 7) {
        const [year, month] = period.split("-");
        const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        return `${months[Number(month) - 1]} ${year}`;
    }
    return period;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

export class AnalyticsService {
    constructor(private readonly pausaRepo: PausaRepository) {}

    async summary(filters: AnalyticsFilters): Promise<AnalyticsSummary & { complianceRate: number }> {
        const summary = await this.pausaRepo.analyticsSummary(filters);
        return { ...summary, complianceRate: complianceRate(summary) };
    }

    async timeline(filters: AnalyticsFilters, granularity: TimeGranularity): Promise<TimelinePoint[]> {
        return this.pausaRepo.analyticsTimeline(filters, granularity);
    }

    async areas(filters: AnalyticsFilters): Promise<AreaComplianceRow[]> {
        const rows = await this.pausaRepo.analyticsByArea(filters);
        const workers = await this.pausaRepo.countActiveWorkersByArea();
        const workerMap = new Map<number | null, number>(workers.map((w) => [w.idArea, w.count]));

        return rows.map((r) => ({ ...r, workers: workerMap.get(r.idArea) ?? 0 }));
    }

    private async loadReportData(filters: AnalyticsFilters): Promise<AnalyticsReportData> {
        const [summary, areas, timeline] = await Promise.all([
            this.pausaRepo.analyticsSummary(filters),
            this.areas(filters),
            this.pausaRepo.analyticsTimeline(filters, "month"),
        ]);
        return { summary, areas, timeline };
    }

    private rangeLabel(filters: AnalyticsFilters): string {
        if (filters.start && filters.end) {
            return `${formatDate(new Date(filters.start))} a ${formatDate(new Date(filters.end))}`;
        }
        if (filters.start) {
            return `Desde ${formatDate(new Date(filters.start))}`;
        }
        if (filters.end) {
            return `Hasta ${formatDate(new Date(filters.end))}`;
        }
        return "Histórico completo";
    }

    async exportPdf(filters: AnalyticsFilters, anonymous = false): Promise<Buffer> {
        const data = await this.loadReportData(filters);
        const rate = complianceRate(data.summary);

        const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        const ended = new Promise<void>((resolve) => doc.on("end", () => resolve()));

        doc.rect(0, 0, doc.page.width, 92).fill("#182987");
        doc.fill("#ffffff").font("Helvetica-Bold").fontSize(18).text("Pausas Activas · Informe de Cumplimiento", 40, 24);
        doc.font("Helvetica").fontSize(10).text(`Período: ${this.rangeLabel(filters)}`, 40, 54).text(`Generado el ${formatDate(new Date())}`, 40, 70);
        if (anonymous) {
            doc.fontSize(8).fill("#c7d2fe").text("Datos agregados y anonimizados · Ley 1581 de 2012", 40, 82);
        }

        const startY = 118;
        doc.fill("#182987").font("Helvetica-Bold").fontSize(13).text("Resumen global", 40, startY);

        const metrics = [
            { label: "Cumplimiento global", value: `${rate}%` },
            { label: "Pausas programadas", value: String(data.summary.total) },
            { label: "Pausas completadas", value: String(data.summary.completadas) },
            { label: "Pausas aplazadas", value: String(data.summary.aplazadas) },
            { label: "Pausas canceladas", value: String(data.summary.canceladas) },
            { label: "Colaboradores activos", value: String(data.summary.activeWorkers) },
        ];

        const boxW = 155;
        const boxGap = 16;
        const boxH = 62;
        let y = startY + 22;
        doc.font("Helvetica");
        metrics.forEach((metric, index) => {
            const col = index % 3;
            const rowIndex = Math.floor(index / 3);
            const x = 40 + col * (boxW + boxGap);
            const yy = y + rowIndex * (boxH + 12);

            if (yy > doc.page.height - 60) {
                doc.addPage();
            }

            doc.roundedRect(x, yy, boxW, boxH, 6).fill("#f0f4ff");
            doc.fill("#182987").font("Helvetica-Bold").fontSize(16).text(metric.value, x + 12, yy + 10, { width: boxW - 24 });
            doc.fill("#334155").font("Helvetica").fontSize(9).text(metric.label.toUpperCase(), x + 12, yy + 36, { width: boxW - 24 });
        });

        let tableY = y + 2 * (boxH + 12) + 24;
        doc.fill("#182987").font("Helvetica-Bold").fontSize(13).text("Cumplimiento por área", 40, tableY);
        tableY += 20;

        const columns = [
            { label: "Área", x: 40 },
            { label: "Colaboradores", x: 200 },
            { label: "Completadas", x: 300 },
            { label: "Total", x: 400 },
            { label: "Cumplimiento", x: 470 },
        ] as const;
        const [colArea, colWorkers, colCompletadas, colTotal, colCumplimiento] = columns;

        doc.roundedRect(40, tableY, doc.page.width - 80, 20, 3).fill("#182987");
        doc.fill("#ffffff").font("Helvetica-Bold").fontSize(9);
        columns.forEach((col) => doc.text(col.label.toUpperCase(), col.x, tableY + 6, { width: 130 }));
        tableY += 20;

        doc.font("Helvetica").fontSize(9);
        data.areas.forEach((row, index) => {
            if (tableY > doc.page.height - 40) {
                doc.addPage();
                tableY = 40;
            }
            if (index % 2 === 0) {
                doc.rect(40, tableY, doc.page.width - 80, 18).fill("#f8faff");
            }
            doc.fill("#1e293b");
            doc.text(row.areaName, colArea.x, tableY + 5, { width: 150, ellipsis: true });
            doc.text(String(row.workers ?? 0), colWorkers.x, tableY + 5, { width: 90 });
            doc.text(String(row.completadas), colCompletadas.x, tableY + 5, { width: 90 });
            doc.text(String(row.total), colTotal.x, tableY + 5, { width: 60 });
            doc.text(`${row.complianceRate}%`, colCumplimiento.x, tableY + 5, { width: 90 });
            tableY += 18;
        });

        if (data.areas.length === 0) {
            doc.fill("#64748b").text("Sin pausas registradas en el período seleccionado", 40, tableY + 5);
        }

        doc.fill("#182987").font("Helvetica-Bold").fontSize(13).text("Evolución mensual", 40, tableY + 28);
        let lineY = tableY + 48;
        doc.font("Helvetica").fontSize(9);
        data.timeline.slice(-12).forEach((point) => {
            if (lineY > doc.page.height - 40) {
                doc.addPage();
                lineY = 40;
            }
            const colors = STATUS_COLORS;
            doc.fill("#1e293b").text(formatPeriod(point.period), 40, lineY, { width: 120 });
            doc.fill(colors.programadas).text(`${point.programadas} programadas`, 170, lineY, { width: 140 });
            doc.fill(colors.completadas).text(`${point.completadas} completadas`, 310, lineY, { width: 140 });
            doc.fill(colors.aplazadas).text(`${point.aplazadas} aplazadas`, 430, lineY, { width: 120 });
            lineY += 16;
        });

        doc.end();
        await ended;
        return Buffer.concat(chunks);
    }

    async exportExcel(filters: AnalyticsFilters, anonymous = false): Promise<Buffer> {
        const data = await this.loadReportData(filters);
        const rate = complianceRate(data.summary);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Pausas Activas";
        workbook.created = new Date();

        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF182987" } },
            alignment: { vertical: "middle", horizontal: "left" },
        };

        const resumenSheet = workbook.addWorksheet("Resumen");
        resumenSheet.columns = [
            { header: "Métrica", key: "metric", width: 26 },
            { header: "Valor", key: "value", width: 16 },
        ];
        resumenSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle as ExcelJS.Style));
        resumenSheet.mergeCells("A1:B1");
        resumenSheet.getCell("A1").value = `Período: ${this.rangeLabel(filters)}`;

        const summaryRows: [string, string | number][] = [
            ["Cumplimiento global", `${rate}%`],
            ["Pausas programadas", data.summary.total],
            ["Pausas completadas", data.summary.completadas],
            ["Pausas aplazadas", data.summary.aplazadas],
            ["Pausas canceladas", data.summary.canceladas],
            ["Colaboradores con actividad", data.summary.colaboradores],
            ["Colaboradores activos", data.summary.activeWorkers],
            ["Áreas activas", data.summary.activeAreas],
            ["Modo", anonymous ? "Anonimizado (Ley 1581 de 2012)" : "Interno"],
            ["Generado el", formatDate(new Date())],
        ];
        summaryRows.forEach(([metric, value], index) => {
            const row = resumenSheet.getRow(index + 2);
            row.getCell(1).value = metric;
            row.getCell(2).value = value;
            if (index % 2 === 1) {
                row.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
                });
            }
        });

        const areasSheet = workbook.addWorksheet("Cumplimiento por Área");
        areasSheet.columns = [
            { header: "Área", key: "area", width: 26 },
            { header: "Trabajadores", key: "workers", width: 14 },
            { header: "Completadas", key: "completadas", width: 14 },
            { header: "Total", key: "total", width: 12 },
            { header: "Cumplimiento (%)", key: "cumplimiento", width: 18 },
        ];
        areasSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle as ExcelJS.Style));
        areasSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        data.areas.forEach((row) => {
            areasSheet.addRow({
                area: row.areaName,
                workers: row.workers,
                completadas: row.completadas,
                total: row.total,
                cumplimiento: row.complianceRate,
            });
        });

        const timelineSheet = workbook.addWorksheet("Evolución");
        timelineSheet.columns = [
            { header: "Período", key: "period", width: 16 },
            { header: "Programadas", key: "programadas", width: 14 },
            { header: "Completadas", key: "completadas", width: 14 },
            { header: "Aplazadas", key: "aplazadas", width: 14 },
            { header: "Canceladas", key: "canceladas", width: 14 },
            { header: "Total", key: "total", width: 12 },
        ];
        timelineSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle as ExcelJS.Style));
        data.timeline.forEach((point) => {
            timelineSheet.addRow({
                period: point.period,
                programadas: point.programadas,
                completadas: point.completadas,
                aplazadas: point.aplazadas,
                canceladas: point.canceladas,
                total: point.total,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer as ArrayBuffer);
    }
}