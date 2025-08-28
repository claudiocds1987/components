import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

import { Subscription } from "rxjs";
import { AlertService } from "../../services/alert.service";
import { Alert, AlertType } from "../../models/alert.model";

@Component({
    selector: "app-alert",
    standalone: true,
    imports: [CommonModule, MatIconModule, NgClass],
    templateUrl: "./alert.component.html",
    styleUrl: "./alert.component.scss",
})
export class AlertComponent implements OnInit, OnDestroy {
    public alerts: Alert[] = [];
    private alertService = inject(AlertService);
    private alertSubscription: Subscription | null = null;

    ngOnInit(): void {
        this.alertSubscription = this.alertService.alerts$.subscribe(
            (alerts: Alert[]): void => {
                this.alerts = alerts;
            },
        );
    }

    ngOnDestroy(): void {
        this.alertSubscription?.unsubscribe();
    }

    getAlertClass(type: AlertType): Record<string, boolean> {
        return {
            "alert-container": true,
            "alert-warning": type === "warning",
            "alert-info": type === "info",
            "alert-danger": type === "danger",
        };
    }

    closeAlert(id: string): void {
        this.alertService.removeAlert(id);
    }
}
