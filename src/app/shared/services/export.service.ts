import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

@Injectable({
    providedIn: "root",
})
export class ExportService {
    private _http = inject(HttpClient);

    // El tipo de retorno ahora es Observable<any[]>, el mismo que el del `http.get`
    exportDataToExcel<T>(
        endpoint: string,
        params?: T,
        fileName = "reporte.xlsx",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Observable<any[]> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params as object).forEach((key: string): void => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const value = (params as any)[key];
                if (value !== null && value !== undefined) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this._http.get<any[]>(endpoint, { params: httpParams }).pipe(
            // El `tap` se ejecuta con los datos que llegaron.
            // Después, el observable se completa automáticamente.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tap((data: any[]): void => {
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Hoja1");
                const excelBuffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                });
                const blob = new Blob([excelBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                this._downloadFile(blob, fileName);
            }),
        );
    }

    private _downloadFile(data: Blob, fileName: string): void {
        saveAs(data, fileName);
    }
}
