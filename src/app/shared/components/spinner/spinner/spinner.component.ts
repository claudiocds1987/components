import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf } from "@angular/common";

import { Observable } from "rxjs";
import { SpinnerService } from "../../../services/spinner.service";

@Component({
    selector: "app-spinner",
    standalone: true,
    imports: [NgIf, AsyncPipe],
    templateUrl: "./spinner.component.html",
    styleUrl: "./spinner.component.scss",
})
export class SpinnerComponent {
    public isLoading$: Observable<boolean>;
    private _spinnerService = inject(SpinnerService);

    constructor() {
        this.isLoading$ = this._spinnerService.isLoading$;
    }
}
