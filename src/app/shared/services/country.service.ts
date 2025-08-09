import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { SelectItem } from "../models/select-item.model";

@Injectable({
    providedIn: "root",
})
export class CountryService {
    private apiUrl = "http://localhost:3000/countries";
    private _httpClient = inject(HttpClient);

    getCountries(): Observable<SelectItem[]> {
        return this._httpClient.get<SelectItem[]>(this.apiUrl);
    }
}
