export type AlertType = "success" | "info" | "warning" | "danger";

export interface Alert {
    id: string;
    type: AlertType;
    message: string;
}
