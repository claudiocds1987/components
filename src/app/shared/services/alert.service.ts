/* import { Injectable } from "@angular/core";
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
 */
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { Alert, AlertType } from "../models/alert.model";
import { Router, NavigationStart } from "@angular/router";
import { filter, takeUntil } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class AlertService implements OnDestroy {
    public alerts$: Observable<Alert[]>;
    // Subject interno para emitir los cambios en las alertas
    private alertsSubject = new Subject<Alert[]>();
    // Array que contiene todas las alertas
    private alertsList: Alert[] = [];
    // Subject para gestionar la desuscripción de los observables al destruir el servicio
    private destroy$ = new Subject<void>();
    private _router = Inject(Router);
    private _alertId = 0;

    constructor() {
        this.alerts$ = this.alertsSubject.asObservable();
        // Suscribirse a los eventos del router.
        // El 'filter(event => event instanceof NavigationStart)' asegura que la lógica se ejecuta
        // cuando una navegación se inicia, ANTES de que el nuevo componente cargue.
        // 'takeUntil(this.destroy$)' asegura que esta suscripción se cierre cuando el servicio se destruya.
        if (this._router && this._router.events) {
            this._router.events
                .pipe(
                    // Filtra para eventos de inicio de navegación
                    filter(
                        (event): event is NavigationStart =>
                            event instanceof NavigationStart,
                    ),
                    takeUntil(this.destroy$),
                )
                .subscribe((): void => {
                    this.clearAlerts(); // Limpia todas las alertas activas
                });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next(); // Emite un valor para que takeUntil desuscriba
        this.destroy$.complete(); // Completa el Subject
    }

    // Elimina un alert en particular
    removeAlert(id: string): void {
        this.alertsList = this.alertsList.filter(
            (alert: Alert): boolean => alert.id !== id,
        ); // Filtra la alerta a eliminar
        this.alertsSubject.next([...this.alertsList]); // Emite la lista actualizada
    }

    showInfo(message: string): string {
        return this._createAlert("info", message);
    }

    showWarning(message: string): string {
        return this._createAlert("warning", message);
    }

    showDanger(message: string): string {
        return this._createAlert("danger", message);
    }

    clearAlerts(): void {
        this.alertsList = []; // Vacía la lista de alertas
        this.alertsSubject.next([]); // Emite un array vacío para que se borren de la vista
    }

    private _createAlert(type: AlertType, message: string): string {
        const id = this.generateUniqueId();
        const newAlert: Alert = { id, type, message };
        this.alertsList.push(newAlert); // Añade la nueva alerta
        this.alertsSubject.next([...this.alertsList]); // Emite una copia del array para actualizar los suscriptores
        return id; // Devuelve el ID de la alerta para posibles gestiones individuales (aunque ya no se usa en este enfoque)
    }

    // Genera un ID único aleatorio para cada alerta
    private generateUniqueId(): string {
        return String(this._alertId++);
    }
}
