import { Component, Input, OnInit } from "@angular/core";
import {
  AlertService,
  CloudAppRestService,
  CloudAppSettingsService,
  HttpMethod,
} from "@exlibris/exl-cloudapp-angular-lib";
import { Umlauf, UserSettings } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import { FormControl } from "@angular/forms";
import { catchError, mergeMap, switchMap } from "rxjs/operators";
import { EMPTY, from, of, throwError } from "rxjs";

@Component({
  selector: "app-sternumlauf",
  templateUrl: "./sternumlauf.component.html",
  styleUrls: ["./sternumlauf.component.scss"],
})
export class SternumlaufComponent implements OnInit {
  @Input() apiResult: any;
  loading = false;
  userSettings: UserSettings;
  barcodeList: Umlauf[];
  selectedBarcode: Umlauf;

  requestsToDelete: any[] = [];

  constructor(
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    this.barcodeList = this.apiResult.location[0].copy
      .filter((item: Umlauf) => !!item.barcode)
      .sort(
        (a: Umlauf, b: Umlauf) =>
          new Date(b.receive_date).getTime() -
          new Date(a.receive_date).getTime()
      );

    if (this.barcodeList.length === 0) {
      this.alert.error("No barcode found");
    }
  }

  onSelectBarcode(event: MatRadioChange) {
    const selectedValue = event.value.item_policy.value;

    if (this.userSettings.itemPolicy.includes(selectedValue)) {
      this.selectedBarcode = event.value as Umlauf;
    } else {
      this.selectedBarcode = undefined;
      this.alert.error(
        `${selectedValue} doesn't exist in the item policy defined in the user settings`
      );
    }
  }

  clearExistingRequests() {
    this.loading = true;

    from(this.requestsToDelete)
      .pipe(
        mergeMap((user) => {
          // delete all these requests with the comment 'po-line-item-routing'
          return this.restService.call({
            url: `/almaws/v1/users/${user.user_primary_id}/requests/${user.request_id}`,
            method: HttpMethod.DELETE,
          });
        })
      )
      .subscribe({
        next: (result: any) => {
          /*
          TODO: 
          then check again by sending another requests
          total_record_count === 0 or no comment === 'po-line-item-routing'
          Fehlermeldung: Umlauf kann nicht gestartet werden, vorgemerkt.
          */
          this.alert.success("All requests are cleared");
          this.requestsToDelete = [];
        },
        error: (error) => {
          this.alert.error("Failed to clear requests, please try again");
          console.error(error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // check if the item policy matches the user specified pattern
  prepareSternumlauf() {
    this.loading = true;

    this.restService
      .call(`${this.selectedBarcode.link}/loans`)
      .pipe(
        switchMap((loanResult: any) => {
          console.log("loans", loanResult); // FIX: remove this

          if (loanResult.total_record_count === 0) {
            return this.restService.call(
              `${this.selectedBarcode.link}/requests`
            );
          } else {
            this.alert.error("Umlauf kann nicht gestartet werden, entlehnt.");

            //return error to skip the next checks
            return of({ error: "loan check is not passed" });
          }
        }),
        switchMap((requestResult: any) => {
          console.log("requests", requestResult); // FIX: remove this

          // check if the last api call for loans is not passed
          if (requestResult.error) {
            // Stop the process here
            return of(null);
          }

          if (requestResult.total_record_count === 0) {
            return of(null);
          } else {
            const userRequestsWithComment = requestResult.user_request.filter(
              (item) => item.comment === "po-line-item-routing"
            );

            if (userRequestsWithComment.length === 0) {
              return of(null);
            }

            return of(userRequestsWithComment);
          }
        })
      )
      .subscribe({
        next: (result: any) => {
          if (result !== null) {
            console.log("result with comments", result);
            this.requestsToDelete = result;
          }
        },
        error: (error) => {
          console.error(error);
          this.alert.error("unexpected error occurred");
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });

    /*
        TODO: check before the scan in stage
        after sending requests for all interested users 
        send a request to the /requests endpoint again
        interested_users === requests.total_record_count
        Fehlermeldung: Vormerkungen konnten nicht gebildet werden.
      */
  }
}
