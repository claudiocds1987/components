import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { DateTime } from "luxon"; // Importamos Luxon

@Injectable({
    providedIn: "root",
})
export class ExportService {
    private _http = inject(HttpClient);

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tap((data: any[]): void => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedData = data.map((item: any): any => {
                    if (item.birthDate) {
                        const luxonDate = DateTime.fromISO(item.birthDate);
                        return {
                            ...item,
                            birthDate: luxonDate.isValid
                                ? luxonDate.toFormat("dd/MM/yyyy")
                                : item.birthDate,
                        };
                    }
                    return item;
                });

                const worksheet = XLSX.utils.json_to_sheet(formattedData); // Usamos los datos formateados
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
