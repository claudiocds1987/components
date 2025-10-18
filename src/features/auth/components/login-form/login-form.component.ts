import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
    AuthService,
    UserCredentials,
} from "../../../../app/shared/services/auth.service";
import { catchError, EMPTY, finalize, Observable } from "rxjs";
import { Router } from "@angular/router";
import { AlertComponent } from "../../../../app/shared/components/alert/alert.component";
import { SpinnerService } from "../../../../app/shared/services/spinner.service";

@Component({
    selector: "app-login-form",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        AlertComponent,
    ],
    templateUrl: "./login-form.component.html",
    styleUrl: "./login-form.component.scss",
})
export class LoginFormComponent {
    loginForm: FormGroup;
    isLoading = false;

    private _authService = inject(AuthService);
    private _router = inject(Router);
    private _spinnerService = inject(SpinnerService);

    constructor() {
        this.loginForm = this._createForm();
    }

    onLogin(): void {
        // 1. Verificar si el formulario es válido
        if (this.loginForm.invalid) {
            return;
        }

        this._spinnerService.show();
        // Obtenemos las credenciales tipadas
        const credentials: UserCredentials = this.loginForm
            .value as UserCredentials;
        // 2. Llamar al servicio de autenticación y suscribirse
        this._authService
            .login(credentials)
            .pipe(
                // El operador catchError intercepta los errores del Observable (ej. credenciales inválidas)
                catchError((error: unknown): Observable<never> => {
                    console.error("Login fallido:", error);

                    return EMPTY; // Detiene la cadena de observable en caso de error
                }),
                // El operador finalize se ejecuta cuando el Observable se completa (éxito) o hay un error (por catchError)
                finalize((): void => {
                    this._spinnerService.hide();
                }),
            )
            .subscribe({
                // Se ejecuta si el login es exitoso
                next: (userProfile): void => {
                    console.log(
                        "Login exitoso. Usuario:",
                        userProfile.username,
                    );
                    // 3. Navegar a la página principal tras el éxito (asume que existe la ruta /dashboard)
                    this._router.navigate(["/home"]);
                },
                // El error ya se maneja en catchError, pero se deja para completar el patrón
                error: (): void => {
                    console.log("ERROR DE LOGIN");
                },
            });
    }

    private _createForm(): FormGroup {
        return new FormGroup({
            username: new FormControl("adminUser"),
            password: new FormControl("hashed_password"),
        });
    }
}
