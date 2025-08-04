import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class SpinnerService {
    public isLoading$: Observable<boolean>;
    private _isLoading$$ = new BehaviorSubject<boolean>(false);

    constructor() {
        this.isLoading$ = this._isLoading$$.asObservable();
    }

    public show(): void {
        this._isLoading$$.next(true);
    }

    public hide(): void {
        this._isLoading$$.next(false);
    }
}
