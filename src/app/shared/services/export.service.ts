/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from "@angular/core";

import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, switchMap, tap } from "rxjs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

@Injectable({
    providedIn: "root",
})
export class ExportService {
    private _http = inject(HttpClient);

    // Nuevo método para exportar los datos del frontend
    exportDataToExcel<T>(
        endpoint: string,
        params?: T,
        fileName = "reporte.xlsx",
    ): Observable<void> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params as object).forEach((key: string): void => {
                const value = (params as any)[key];
                if (value !== null && value !== undefined) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }

        // Hacemos la petición GET para obtener todos los datos con los filtros aplicados
        // `switchMap` para convertir la respuesta del GET en un `Observable<void>` que
        // genera y descarga el archivo.
        return this._http.get<any[]>(endpoint, { params: httpParams }).pipe(
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
            switchMap((): Observable<void> => new Observable<void>()),
        );
    }

    private _downloadFile(data: Blob, fileName: string): void {
        saveAs(data, fileName);
    }
}
