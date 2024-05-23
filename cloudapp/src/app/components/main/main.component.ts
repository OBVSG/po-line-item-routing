import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatRadioChange } from "@angular/material/radio";
import {
  Entity,
  CloudAppRestService,
  CloudAppEventsService,
  AlertService,
  HttpMethod,
  RestErrorResponse,
  Request,
} from "@exlibris/exl-cloudapp-angular-lib";

import { Observable } from "rxjs";
import { finalize, tap } from "rxjs/operators";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
})
export class MainComponent implements OnInit, OnDestroy {
  loading = false;
  selectedEntity: Entity;
  apiResult: any;

  entities$: Observable<Entity[]> = this.eventsService.entities$.pipe(
    tap(() => this.clear())
  );

  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  onEntitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService
      .call<any>(value.link)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (result) => {
          this.apiResult = result;
        },
        (error) =>
          this.alert.error("Failed to retrieve entity: " + error.message)
      );
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  saveUsersOrder() {
    this.loading = true;

    const request: Request = {
      url: this.selectedEntity.link,
      method: HttpMethod.PUT,
      requestBody: this.apiResult,
    };

    this.restService
      .call(request)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.apiResult = result;
          this.eventsService.refreshPage().subscribe(() => {
            this.alert.success("Success!");
          });
        },
        error: (e: RestErrorResponse) => {
          this.alert.error("Failed to update data: " + e.message);
          console.error(e);
        },
      });
  }
}
