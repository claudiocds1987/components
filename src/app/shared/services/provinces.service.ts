import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { SelectItem } from "../models/select-item.model";
import { Province } from "../models/province.model";

@Injectable({
    providedIn: "root",
})
export class ProvincesService {
    private apiUrl = "https://json-server-data-fpl9.onrender.com/provinces";
    private _httpClient = inject(HttpClient);

    getProvinces(): Observable<SelectItem[]> {
        return this._httpClient.get<SelectItem[]>(this.apiUrl);
    }

    getProvincesById(provinceId: number): Observable<Province[]> {
        return this._httpClient.get<Province[]>(`${this.apiUrl}/${provinceId}`);
    }

    getProvincesByCountry(countryId: number): Observable<Province[]> {
        // Construye la URL de consulta: ".../provinces?countryId=X"
        const url = `${this.apiUrl}?countryId=${countryId}`;

        console.log(`[ProvincesService] Llamando a la URL: ${url}`); // Para depuración

        // JSON Server devolverá automáticamente un array de provincias que coincidan.
        return this._httpClient.get<Province[]>(url);
    }
}
