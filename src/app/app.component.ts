import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { createDefaultGridConfiguration } from "./shared/models/gridConfiguration";
import { GridComponent } from "./shared/components/grid/grid.component";
import { EmployeeGridComponent } from "./employee/employee-grid/employee-grid.component";
import { SpinnerComponent } from "./shared/components/spinner/spinner/spinner.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterOutlet,
        MatButtonModule,
        GridComponent,
        EmployeeGridComponent,
        SpinnerComponent,
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {
    title = "components";
}
