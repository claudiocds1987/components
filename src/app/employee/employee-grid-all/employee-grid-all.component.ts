import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EmployeeService } from "../../shared/services/employee.service";
import { AlertService } from "../../shared/services/alert.service";
import { BreadcrumbService } from "../../shared/services/breadcrumb.service";
import { Employee } from "../../shared/models/employee.model";
import { HttpClientModule, HttpErrorResponse } from "@angular/common/http";
import {
    createDefaultGridConfiguration,
    ElipsisAction,
    GridConfiguration,
    GridData,
} from "../../shared/models/grid-configuration.model";
import { DateTime } from "luxon";
import { CommonModule } from "@angular/common";
import { GridComponent } from "../../shared/components/grid/grid.component";
import { MatDialogModule } from "@angular/material/dialog";
import { BreadcrumbComponent } from "../../shared/components/breadcrumb/breadcrumb.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";

@Component({
    selector: "app-employee-grid-all",
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        GridComponent,
        MatDialogModule,
        BreadcrumbComponent,
        AlertComponent,
    ],
    templateUrl: "./employee-grid-all.component.html",
    styleUrl: "./employee-grid-all.component.scss",
})
export class EmployeeGridAllComponent implements OnInit, OnDestroy {
    gridConfig: GridConfiguration;
    gridData: GridData[] = [];
    isLoadingGridData = true;
    employees: Employee[] = [];

    private _employeeService = inject(EmployeeService);
    private _alertService = inject(AlertService);
    private _breadcrumbService = inject(BreadcrumbService);

    constructor() {
        this._alertService.clearAlerts();
        this._setBreadcrumb();
        this.gridConfig = this._setGridConfiguration(); // seteando la grilla para grid.component
    }

    ngOnInit(): void {
        this._loadData();
    }

    ngOnDestroy(): void {
        this._breadcrumbService.clearBreadcrumbs();
    }

    onCreateEmployee(): void {
        // hacer redireccion a url de employee-form
    }

    onExportToExcel(): void {
        // lógica para exportar a excel
    }

    private _loadData(): void {
        this._employeeService.getEmployeesAll().subscribe({
            next: (employees: Employee[]): void => {
                this.gridData = this._mapEmployeeListToGridData(employees);
                this.isLoadingGridData = false;
            },
            error: (error: HttpErrorResponse): void => {
                this.isLoadingGridData = false;
                this._alertService.showDanger(
                    `Error al obtener empleados. ${error.statusText}`,
                );
            },
        });
    }

    private _mapEmployeeListToGridData(employeeList: Employee[]): GridData[] {
        const transformedItems: GridData[] = employeeList.map(
            (employee: Employee): GridData => {
                const gridData: GridData = {
                    imgUrl: employee.imgUrl,
                    id: employee.id,
                    elipsisActions: this._setElipsisActions(employee),
                    name: employee.name,
                    surname: employee.surname,
                    active: employee.active,
                    position: employee.positionId,
                    gender: employee.genderId,
                    country: employee.countryId,
                };

                if (typeof employee.birthDate === "string") {
                    const luxonDate = DateTime.fromISO(
                        employee["birthDate"] as string,
                    );
                    gridData["birthDate"] = luxonDate.isValid
                        ? luxonDate.toFormat("dd/MM/yyyy")
                        : employee.birthDate;
                } else {
                    gridData["birthDate"] = employee.birthDate;
                }

                return gridData;
            },
        );
        return transformedItems;
    }

    private _setGridConfiguration(): GridConfiguration {
        const config = createDefaultGridConfiguration({
            columns: [
                {
                    name: "imgUrl",
                    type: "img",
                    width: "20px",
                    isSortable: false,
                    hasHeader: false,
                },
                { name: "id", width: "20px" },
                { name: "name" },
                { name: "surname" },
                { name: "birthDate" },
                { name: "gender", isSortable: false },
                { name: "position" },
                { name: "country" },
                {
                    name: "active",
                    style: "status-circle",
                    align: "center",
                    width: "20px",
                },
                {
                    name: "elipsisActions", // Este es el nombre de la propiedad en GridData
                    align: "center",
                    isSortable: false,
                    type: "elipsis", // Indica que es la columna de elipsis
                    hasHeader: false,
                },
            ],
            filterByColumn: "",
            hasInputSearch: true,
            hasChips: false,
            hasExcelDownload: true,
            hasCreateButton: true,
            hasPaginator: {
                pageSizeOptions: [25, 50],
                pageSize: 25,
                pageIndex: 0,
                totalCount: 0,
                isServerSide: false,
            },
            hasSorting: {
                isServerSide: false,
            },
        });
        return config;
    }

    private _setElipsisActions(employee: Employee): ElipsisAction[] {
        return [
            {
                id: "edit",
                label: "Editar",
                icon: "edit",
                action: (id: number): void => this._editEmployee(id),
            },
            {
                id: "delete",
                label: "Eliminar",
                icon: "delete_forever",
                action: (id: number): void => this._deleteEmployee(id),
                // Condición de ejemplo: solo eliminable si el usuario esta activo
                condition: (): boolean => employee.active === true,
            },
        ];
    }

    private _editEmployee(id: number): void {
        console.log(`Parent Log: Editando empleado con ID: ${id}`);
        // Aquí iría tu lógica para navegar a la página de edición o abrir un modal
        // Por ejemplo: this._router.navigate(['/employees', id, 'edit']);
    }

    private _deleteEmployee(id: number): void {
        // QUE PONGA EL EMPLEADO COMO INACTIVO NO LO BORRE
        console.log(`Parent Log: Intentando eliminar empleado con ID: ${id}`);
    }

    private _setBreadcrumb(): void {
        this._breadcrumbService.setBreadcrumbs([
            { label: "Inicio", path: "/" },
            { label: "Grilla no paginada", path: "/employees" },
            // { label: employeeName, path: `/employees/${this.employeeId}` }
        ]);
    }
}
