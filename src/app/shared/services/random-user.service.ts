import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class RandomUserService {
    private apiUrl = "https://randomuser.me/api/";
    private _http = inject(HttpClient);

    getUsers(usersQuantity: number): Observable<unknown> {
        const quantity = usersQuantity ? usersQuantity : 200;
        const url = `${this.apiUrl}?results=${quantity}`;
        return this._http.get(url);
    }
}
