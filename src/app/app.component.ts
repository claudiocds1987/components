import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";

import { SpinnerComponent } from "./shared/components/spinner/spinner/spinner.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, MatButtonModule, SpinnerComponent],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {
    title = "components";
}
