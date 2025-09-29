import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { SelectItem } from "../models/select-item.model";

@Injectable({
    providedIn: "root",
})
export class PositionService {
    //private apiUrl = "http://localhost:3000/positions";
    private apiUrl = "https://json-server-data-fpl9.onrender.com/positions";
    private _httpClient = inject(HttpClient);

    getPositions(): Observable<SelectItem[]> {
        return this._httpClient.get<SelectItem[]>(this.apiUrl);
    }
}
