import { Component, OnInit, OnDestroy } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Observable } from "rxjs";
import { finalize, tap } from "rxjs/operators";
import {
  CloudAppRestService,
  CloudAppEventsService,
  Request,
  HttpMethod,
  Entity,
  RestErrorResponse,
  AlertService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { MatRadioChange } from "@angular/material/radio";

import { InterestedUser } from "./interested-users.model";

@Component({
  selector: "app-interested-users",
  templateUrl: "./interested-users.component.html",
  styleUrls: ["./interested-users.component.scss"],
})
export class InterestedUsersComponent implements OnInit {
  loading = false;
  selectedEntity: Entity;
  apiResult: any;
  users: InterestedUser[] = [];

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

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.users, event.previousIndex, event.currentIndex);
  }

  entitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService
      .call<any>(value.link)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (result) => {
          this.apiResult = result;
          this.users = result.interested_user as InterestedUser[];
        },
        (error) =>
          this.alert.error("Failed to retrieve entity: " + error.message)
      );
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  update() {
    this.apiResult.interested_user = this.users;

    this.loading = true;
    let request: Request = {
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
          this.eventsService
            .refreshPage()
            .subscribe(() => this.alert.success("Success!"));
        },
        error: (e: RestErrorResponse) => {
          this.alert.error("Failed to update data: " + e.message);
          console.error(e);
        },
      });
  }
}
