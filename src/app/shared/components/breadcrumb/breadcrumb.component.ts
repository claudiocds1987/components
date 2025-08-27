import { AsyncPipe, NgForOf, NgIf } from "@angular/common";

import { Subscription } from "rxjs";
import { RouterLink } from "@angular/router";
import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import {
    BreadcrumbService,
    Breadcrumb,
} from "../../services/breadcrumb.service";
import { MatIcon } from "@angular/material/icon";

@Component({
    selector: "app-breadcrumb",
    standalone: true,
    imports: [NgForOf, AsyncPipe, NgIf, RouterLink, MatIcon],
    templateUrl: "./breadcrumb.component.html",
    styleUrl: "./breadcrumb.component.scss",
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
    public breadcrumbs: Breadcrumb[] = [];
    private breadcrumbService = inject(BreadcrumbService);
    private subscription: Subscription | null = null;

    ngOnInit(): void {
        this.subscription = this.breadcrumbService.breadcrumbs$.subscribe(
            (breadcrumbs: Breadcrumb[]): void => {
                this.breadcrumbs = breadcrumbs;
            },
        );
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
