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
  finalize,
  map,
  mergeMap,
  switchMap,
  toArray,
} from "rxjs/operators";
import { EMPTY, from, of, throwError } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { SternumlaufStartComponent } from "./sternumlauf-start/sternumlauf-start.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-sternumlauf",
  templateUrl: "./sternumlauf.component.html",
  styleUrls: ["./sternumlauf.component.scss"],
})
export class SternumlaufComponent implements OnInit {
  @Input() apiResult: any;
  loading = false;
  userSettings!: UserSettings;
  barcodeList!: Umlauf[];
  selectedBarcode!: Umlauf | undefined;

  constructor(
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService,
    private alert: AlertService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Get user settings
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    // Filter out the items with barcode
    this.barcodeList = this.apiResult.location[0].copy
      .filter((item: Umlauf) => !!item.barcode)
      .sort((a: Umlauf, b: Umlauf) => {
        if (a.receive_date && b.receive_date) {
          return (
            new Date(b.receive_date).getTime() -
            new Date(a.receive_date).getTime()
          );
        } else if (a.receive_date) {
          return -1;
        } else if (b.receive_date) {
          return 1;
        } else {
          return b.barcode.localeCompare(a.barcode);
        }
      });
  }

  onSelectBarcode(event: MatRadioChange) {
    const selectedValue = event.value.item_policy.value;

    // Check if the selected barcode is in the item policy
    if (this.userSettings.itemPolicy.includes(selectedValue)) {
      this.selectedBarcode = event.value as Umlauf;
    } else {
      this.selectedBarcode = undefined;

      this.alert.error(
        this.translate.instant(
          "Translate.components.sternumlauf.componentFile.wrongPolicy",
          { policy: selectedValue }
        )
      );
    }
  }

  prepareSternumlauf() {
    this.loading = true;
    this.alert.clear();

    // first check if the item is loaned
    this.restService
      .call({
        url: `${this.selectedBarcode!.link}/loans`,
        method: HttpMethod.GET,
      })
      .pipe(
        switchMap((loanResult: any) => {
          if (loanResult.total_record_count === 0) {
            // when the item is not loaned, proceed to check requests
            return this.restService.call({
              url: `${this.selectedBarcode!.link}/requests`,
              method: HttpMethod.GET,
            });
          } else {
            this.alert.error(
              this.translate.instant(
                "Translate.components.sternumlauf.componentFile.loaned"
              )
            );

            // Throw an error observable to stop further execution
            return throwError(() => new Error());
          }
        }),
        switchMap((requestResult: any) => {
          if (requestResult.total_record_count === 0) {
            return EMPTY;
          } else {
            const userRequestsWithComment = requestResult.user_request.filter(
              (item: any) => item.comment === "po-line-item-routing"
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
                      this.translate.instant(
                        "Translate.components.sternumlauf.componentFile.deleteRequestFailure",
                        {
                          requestId: request.request_id,
                          userId: request.user_primary_id,
                        }
                      )
                    );

                    // Throw an error observable to stop further execution
                    return throwError(
                      () =>
                        new Error("An error occurred", {
                          cause: error,
                        })
                    );
                  })
                );
            }),
            toArray(), // Wait for all delete requests to complete
            concatMap(() => {
              // Perform the final requests check
              return this.restService
                .call({
                  url: `${this.selectedBarcode!.link}/requests`,
                  method: HttpMethod.GET,
                })
                .pipe(
                  map((lastCheckResult) => {
                    if (lastCheckResult.total_record_count !== 0) {
                      let errorMessage = this.translate.instant(
                        "Translate.components.sternumlauf.componentFile.holdShelf.main"
                      );

                      if (lastCheckResult.total_record_count === 1) {
                        errorMessage += this.translate.instant(
                          "Translate.components.sternumlauf.componentFile.holdShelf.extra"
                        );
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
                      this.alert.error(
                        this.translate.instant(
                          "Translate.components.sternumlauf.componentFile.general"
                        )
                      );
                    }

                    return throwError(
                      () =>
                        new Error("An error occurred", {
                          cause: error,
                        })
                    );
                  })
                );
            })
          );
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: () => {},
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          this.dialog.open(SternumlaufStartComponent, {
            disableClose: true,
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
