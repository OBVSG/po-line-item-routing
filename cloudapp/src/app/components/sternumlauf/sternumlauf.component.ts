import { Component, Input, OnInit } from "@angular/core";
import {
  AlertService,
  CloudAppRestService,
  CloudAppSettingsService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { Umlauf, UserSettings } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import { FormControl } from "@angular/forms";
import { catchError, switchMap } from "rxjs/operators";
import { of, throwError } from "rxjs";

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

  // check if the item policy matches the user specified pattern
  prepareSternumlauf() {
    // TODO: the itemPolicy of the "main item" should be in the array of the user defined item policies, case sensitive
    /*
      TODO: /loans
      GET /almaws/v1/bibs/{mms_id}/holdings/{holding_id}/items/{item_id}/loans
      total_record_count === 0
      Fehlermeldung: Umlauf kann nicht gestartet werden, entlehnt.
    */
    /*
      TODO: /requests
      GET /almaws/v1/bibs/{mms_id}/holdings/{holding_id}/items/{item_id}/requests
      total_record_count === 0
      if not
      check comments in the response array: if comment === 'po-line-item-routing'
      delete all these requets with this comment

      then check again by sending another requests
      total_record_count === 0 or no comment === 'po-line-item-routing'
      Fehlermeldung: Umlauf kann nicht gestartet werden, vorgemerkt.
    */
    /*
        TODO: check before the scan in stage
        after sending requests for all interested users 
        send a request to the /requests endpoint again
        interested_users === requests.total_record_count
        Fehlermeldung: Vormerkungen konnten nicht gebildet werden.
      */

    this.loading = true;

    this.restService
      .call(`${this.selectedBarcode.link}/loans`)
      .pipe(
        switchMap((loanResult: any) => {
          console.log("loans", loanResult);

          if (loanResult.total_record_count === 0) {
            return this.restService.call(
              `${this.selectedBarcode.link}/requests`
            );
          } else {
            this.alert.error("Umlauf kann nicht gestartet werden, entlehnt.");
            return throwError(() => new Error("loan failed"));
          }
        }),
        switchMap((requestResult: any) => {
          console.log("requests", requestResult);

          // Additional condition for the requests result
          // TODO: if (/* your condition based on requestResult */) {
          if (true) {
            // If the condition is met, do something
            // For example, return another API call or process the result
            return of(requestResult); // Adjust this line as needed
          } else {
            // If the condition is not met, handle the error or return an observable
            this.alert.error("Condition for requests result not met.");
            return throwError(() => new Error("request condition failed"));
          }
        })
      )
      .subscribe({
        next: (finalResult: any) => {
          console.log("final result", finalResult);
          // Handle the final result
        },
        error: (error) => {
          console.error(error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
