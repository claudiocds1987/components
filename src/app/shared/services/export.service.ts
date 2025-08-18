import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import * as XLSX from "xlsx";

@Injectable({
    providedIn: "root",
})
export class ExportService {
    private _http = inject(HttpClient);

    exportToExcel(data: any[], fileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const workbook: XLSX.WorkBook = {
            Sheets: { data: worksheet },
            SheetNames: ["data"],
        };
        const excelBuffer: any = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        this._saveAsExcelFile(excelBuffer, fileName);
    }

    private _saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(data);
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(a.href);
    }
}
