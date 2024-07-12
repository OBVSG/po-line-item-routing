import { Component, Input, OnInit } from "@angular/core";
import {
  AlertService,
  CloudAppRestService,
  CloudAppSettingsService,
  HttpMethod,
} from "@exlibris/exl-cloudapp-angular-lib";
import { InternalAppError, Umlauf, UserSettings } from "../../app.model";
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
    // Get user settings
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    // Filter out the items with barcode
    this.barcodeList = this.apiResult.location[0].copy
      .filter((item: Umlauf) => !!item.barcode)
      .sort(
        (a: Umlauf, b: Umlauf) =>
          new Date(b.receive_date).getTime() -
          new Date(a.receive_date).getTime()
      );
  }

  onSelectBarcode(event: MatRadioChange) {
    const selectedValue = event.value.item_policy.value;

    // Check if the selected barcode is in the item policy
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
            return throwError(() => new Error());
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
            mergeMap((request: any) => {
              return this.restService
                .call({
                  url: `/almaws/v1/users/${request.user_primary_id}/requests/${request.request_id}`,
                  method: HttpMethod.DELETE,
                })
                .pipe(
                  // this catch error will never be called because the delete request will always return 204 status code even if the request failed
                  catchError((error) => {
                    this.alert.error(
                      `Failed to delete request ${request.request_id} for the user id: ${request.user_primary_id}`
                    );

                    console.log(error);

                    // Throw an error observable to stop further execution
                    return throwError(() => new Error());
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
                      let errorMessage =
                        "Umlauf kann nicht gestartet werden, vorgemerkt.";

                      if (lastCheckResult.total_record_count === 1) {
                        errorMessage +=
                          " one of the requests is probably on HOLD SHELF status and cannot be canceled, but all other existing requests are removed.";
                      }

                      this.alert.error(errorMessage);

                      // stop the observable chain
                      throw new InternalAppError();
                    }

                    // complete the observable in case of success
                    return EMPTY;
                  }),
                  catchError((error) => {
                    // handle errors that is not thrown by the map operator
                    if (!error.internalError) {
                      console.error(error);

                      this.alert.error(
                        "Failed to perform the final requests check"
                      );
                    }

                    return throwError(() => new Error());
                  })
                );
            })
          );
        })
      )
      .subscribe({
        next: () => {},
        error: (_error) => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;

          this.dialog.open(SternumlaufStartComponent, {
            autoFocus: false,
            width: "80%",
            data: {
              apiResult: this.apiResult,
              selectedBarcode: this.selectedBarcode,
            },
          });
        },
      });
  }
}
