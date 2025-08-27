import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Breadcrumb {
    label: string;
    path: string;
}

@Injectable({
    providedIn: "root",
})
export class BreadcrumbService {
    public breadcrumbs$: Observable<Breadcrumb[]>;
    private _breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);

    constructor() {
        this.breadcrumbs$ = this._breadcrumbsSubject.asObservable();
    }

    setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
        this._breadcrumbsSubject.next(breadcrumbs);
    }

    clearBreadcrumbs(): void {
        this._breadcrumbsSubject.next([]);
    }
}
