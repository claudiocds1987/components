import { Component, inject, OnInit } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";

import { SpinnerComponent } from "./shared/components/spinner/spinner.component";
import { AuthService, UserProfile } from "./shared/services/auth.service";
import { Observable } from "rxjs";
import { AsyncPipe, CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterOutlet,
        MatButtonModule,
        SpinnerComponent,
        AsyncPipe,
        CommonModule,
        MatIconModule,
        MatMenuModule,
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
    title = "components";
    userProfile$: Observable<UserProfile | null> | undefined;

    private _authService = inject(AuthService);
    private _router = inject(Router);

    ngOnInit(): void {
        this.userProfile$ = this.getUserProfile();
    }

    getUserProfile(): Observable<UserProfile | null> {
        return this._authService.userProfileData$;
    }

    onLogout(): void {
        this._authService.logout();
        this._router.navigate(["/login-form"]);
    }
}
