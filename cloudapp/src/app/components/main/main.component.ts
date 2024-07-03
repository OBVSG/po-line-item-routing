import { Component } from "@angular/core";
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
export class MainComponent {
  loading = false;
  selectedEntity: Entity;
  apiResult: any;
  isEntityCorrect: boolean = false;

  entities$: Observable<Entity[]> = this.eventsService.entities$.pipe(
    tap((entities) => {
      this.clear();

      // check if in the list of entities there is a PO line item to select
      this.isEntityCorrect = entities.some((entity) =>
        entity.link.startsWith("/acq/po-lines")
      )
        ? true
        : false;
    })
  );

  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService
  ) {}

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
    this.isEntityCorrect = false;
  }

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
        (error) => {
          console.log(error);
          this.alert.error("Failed to retrieve entity data from Alma API");
        }
      );
  }

  // save the order of the users to the Alma API
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
        error: (error: RestErrorResponse) => {
          this.alert.error("Failed to update the user list");
          console.error(error);
        },
      });
  }
}
