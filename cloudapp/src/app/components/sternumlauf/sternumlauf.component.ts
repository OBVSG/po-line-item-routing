import { Component, Input, OnInit } from "@angular/core";
import {
  AlertService,
  CloudAppRestService,
  CloudAppSettingsService,
  HttpMethod,
} from "@exlibris/exl-cloudapp-angular-lib";
import { Umlauf, UserSettings } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import {
  catchError,
  concatMap,
  map,
  mergeMap,
  switchMap,
  toArray,
} from "rxjs/operators";
import { EMPTY, from, of, throwError } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { SternumlaufStartComponent } from "./sternumlauf-start/sternumlauf-start.component";

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
    private alert: AlertService,
    private dialog: MatDialog
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

  prepareSternumlauf() {
    this.loading = true;

    // first check if the item is loaned
    this.restService
      .call({
        url: `${this.selectedBarcode.link}/loans`,
        method: HttpMethod.GET,
      })
      .pipe(
        switchMap((loanResult: any) => {
          if (loanResult.total_record_count === 0) {
            // when the item is not loaned, proceed to check requests
            return this.restService.call({
              url: `${this.selectedBarcode.link}/requests`,
              method: HttpMethod.GET,
            });
          } else {
            this.alert.error("Umlauf kann nicht gestartet werden, entlehnt.");

            // Throw an error observable to stop further execution
            return throwError(() => new Error("APP ERROR: Item is loaned"));
          }
        }),
        switchMap((requestResult: any) => {
          if (requestResult.total_record_count === 0) {
            return EMPTY;
          } else {
            const userRequestsWithComment = requestResult.user_request.filter(
              (item) => item.comment === "po-line-item-routing"
            );

            if (userRequestsWithComment.length === 0) {
              return EMPTY;
            }

            return of(userRequestsWithComment);
          }
        }),
        switchMap((userRequestsWithComment: any) => {
          // Delete requests with comment "po-line-item-routing"
          return from(userRequestsWithComment).pipe(
            mergeMap((user: any) => {
              return this.restService
                .call({
                  url: `/almaws/v1/users/${user.user_primary_id}/requests/${user.request_id}`,
                  method: HttpMethod.DELETE,
                })
                .pipe(
                  catchError(() => {
                    this.alert.error(
                      `Failed to delete request ${user.request_id} for the user id: ${user.user_primary_id}`
                    );
                    return throwError(
                      () => new Error("APP ERROR: Failed to delete requests")
                    );
                  })
                );
            }),
            toArray(), // Wait for all delete requests to complete
            concatMap(() => {
              // Perform the final requests check
              return this.restService
                .call({
                  url: `${this.selectedBarcode.link}/requests`,
                  method: HttpMethod.GET,
                })
                .pipe(
                  map((lastCheckResult) => {
                    if (lastCheckResult.total_record_count !== 0) {
                      this.alert.error(
                        "Umlauf kann nicht gestartet werden, vorgemerkt."
                      );

                      // stop the observable chain
                      throw new Error("APP ERROR: Requests still exist");
                    }

                    // complete the observable in case of success
                    return EMPTY;
                  }),
                  catchError((_error) => {
                    // Handle any errors from the final check
                    this.alert.error(
                      "Failed to perform the final requests check"
                    );

                    return throwError(
                      () =>
                        new Error(
                          "APP ERROR: Failed to perform the final requests check, requests still exist"
                        )
                    );
                  })
                );
            })
          );
        })
      )
      .subscribe({
        next: () => {},
        error: (error) => {
          console.error(error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
          const dialogRef = this.dialog.open(SternumlaufStartComponent, {
            autoFocus: false,
            width: "80%",
            panelClass: "sternumlauf-dialog",
            data: {
              apiResult: this.apiResult,
              selectedBarcode: this.selectedBarcode,
            },
          });
        },
      });
  }
}
