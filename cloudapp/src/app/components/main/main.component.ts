import { Component, OnInit } from "@angular/core";
import { MatRadioChange } from "@angular/material/radio";
import {
  Entity,
  CloudAppRestService,
  CloudAppEventsService,
  AlertService,
  HttpMethod,
  RestErrorResponse,
  Request,
  CloudAppSettingsService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { TranslateService } from "@ngx-translate/core";

import { Observable } from "rxjs";
import { finalize, tap } from "rxjs/operators";
import { UserSettings } from "../../app.model";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
})
export class MainComponent implements OnInit {
  loading = false;
  userSettings!: UserSettings;
  selectedEntity!: Entity | null;
  apiResult: any;
  isEntityCorrect: boolean = false;
  entities$!: Observable<Entity[]>;

  constructor(
    private settingsService: CloudAppSettingsService,
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Get user settings
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    this.entities$ = this.eventsService.entities$.pipe(
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
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
    this.alert.clear();
  }

  onEntitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.alert.clear();

    this.restService
      .call<any>(value.link)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.apiResult = result;
        },
        error: (error) => {
          console.log(error);
          this.alert.error(
            this.translate.instant(
              "Translate.components.main.componentFile.selectEntityFailure"
            )
          );
        },
      });
  }

  // save the order of the users to the Alma API
  saveUsersOrder() {
    this.loading = true;
    this.alert.clear();

    const request: Request = {
      url: this.selectedEntity!.link,
      method: HttpMethod.PUT,
      requestBody: this.apiResult,
    };

    this.restService
      .call(request)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.apiResult = result;
          this.eventsService.refreshPage().subscribe();
        },
        error: (error: RestErrorResponse) => {
          this.alert.error(
            this.translate.instant(
              "Translate.components.main.componentFile.saveUserOrderFailure"
            )
          );
          console.error(error);
        },
        complete: () => {
          this.alert.success(
            this.translate.instant(
              "Translate.components.main.componentFile.saveUserOrderSuccess"
            )
          );
        },
      });
  }
}
