import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { Alert, AlertType } from "../models/alert.model";

@Injectable({
    providedIn: "root",
})
export class AlertService {
    public alerts$: Observable<Alert[]>;
    private alertsSubject = new Subject<Alert[]>();
    // El Observable ahora emite un array de alertas

    private activeAlerts: Alert[] = []; // Almacena las alertas activas

    constructor() {
        this.alerts$ = this.alertsSubject.asObservable();
    }

    showAlert(type: AlertType, message: string): void {
        const id = this._generateUniqueId(); // Genera un ID único para la alerta
        const newAlert: Alert = { id, type, message }; // Se eliminó 'timeout' de aquí
        this.activeAlerts.push(newAlert); // Añade la nueva alerta al array
        this.alertsSubject.next([...this.activeAlerts]); // Emite una copia del array
    }

    removeAlert(id: string): void {
        this.activeAlerts = this.activeAlerts.filter(
            (alert: Alert): unknown => alert.id !== id,
        );
        this.alertsSubject.next([...this.activeAlerts]);
    }

    showInfo(message: string): void {
        this.showAlert("info", message);
    }

    showWarning(message: string): void {
        this.showAlert("warning", message);
    }

    showDanger(message: string): void {
        this.showAlert("danger", message);
    }

    clearAlerts(): void {
        this.activeAlerts = [];
        this.alertsSubject.next([]);
    }

    private _generateUniqueId(): string {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }
}
