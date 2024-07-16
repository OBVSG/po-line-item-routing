import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  AlertService,
  CloudAppRestService,
  CloudAppSettingsService,
  HttpMethod,
} from "@exlibris/exl-cloudapp-angular-lib";
import {
  InterestedUser,
  InternalAppError,
  SternumlaufStartData,
  UserSettings,
} from "../../../app.model";
import { forkJoin, from, of, throwError } from "rxjs";
import { catchError, concatMap, delay, finalize, tap } from "rxjs/operators";

@Component({
  selector: "app-sternumlauf-start",
  templateUrl: "./sternumlauf-start.component.html",
  styleUrls: ["./sternumlauf-start.component.scss"],
})
export class SternumlaufStartComponent implements OnInit {
  loading = false;
  totalProgress: number;
  processed: number = 0;
  isUmlaufStarted = false;
  runCheckRequests: "block" | "check" | "loading" = "block";
  runScanIn: "block" | "check" | "loading" = "block";
  runLoan: "block" | "check" | "loading" = "block";
  userSettings: UserSettings;
  finalResult: {
    type: "error" | "success";
    message: string;
  };

  get percentComplete() {
    return Math.round((this.processed / this.totalProgress) * 100);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SternumlaufStartData,
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    // Get user settings
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    // set the total progress based on the number of interested users
    this.totalProgress = this.data.apiResult.interested_user.length;
  }

  startSternumlauf() {
    this.loading = true;
    this.alert.clear();

    this.processed = 0;
    this.isUmlaufStarted = true;

    // create request for each interested user
    const requestsObservables = from<InterestedUser[]>(
      this.data.apiResult.interested_user
    ).pipe(
      concatMap((user) => {
        return this.restService
          .call({
            url: `/almaws/v1/users/${user.primary_id}/requests`,
            method: HttpMethod.POST,
            queryParams: {
              user_id_type: "all_unique",
              allow_same_request: false,
              item_pid: this.data.selectedBarcode.pid,
            },
            requestBody: {
              request_type: "HOLD",
              comment: "po-line-item-routing",
              pickup_location_type: this.userSettings.sternumlauf.locationType,
              pickup_location_library:
                this.userSettings.sternumlauf.locationLibrary,
              pickup_location_circulation_desk:
                this.userSettings.sternumlauf.locationCirculationDesk,
            },
          })
          .pipe(
            tap(() => {
              this.processed++;
            }),
            catchError((error) => {
              // TODO-STERN: change text
              this.finalResult = {
                type: "error",
                message:
                  "Failed to register request for user: " + user.primary_id,
              };

              // Throw an error observable to stop further execution
              return throwError(error);
            })
          );
      })
    );

    // forkJoin makes sure that all requests are sent before proceeding to the next steps
    forkJoin([requestsObservables])
      .pipe(
        concatMap(() => {
          this.runCheckRequests = "loading";

          // check existing requests after sending requests for all interested users
          return this.restService
            .call({
              url: `${this.data.selectedBarcode.link}/requests`,
              method: HttpMethod.GET,
            })
            .pipe(
              tap((result: any) => {
                if (
                  this.data.apiResult.interested_user.length !==
                  result.total_record_count
                ) {
                  // TODO-STERN: change text
                  this.finalResult = {
                    type: "error",
                    message: "Vormerkungen konnten nicht gebildet werden.",
                  };

                  // stop the observable chain
                  throw new InternalAppError();
                }
              }),
              tap((result: any) => {
                // check the requests order agin, if doesn't match the interested users order, then show an error message and DO NOT let to scan in and loan the item
                for (
                  let i = 0;
                  i < this.data.apiResult.interested_user.length;
                  i++
                ) {
                  if (
                    this.data.apiResult.interested_user[i].primary_id !==
                    result.user_request[i].user_primary_id
                  ) {
                    // TODO-STERN: change text
                    this.finalResult = {
                      type: "error",
                      message: "Requests order mismatch. Cannot loan the item.",
                    };

                    throw new InternalAppError();
                  }
                }
              }),
              tap(() => {
                this.runCheckRequests = "check";
              }),
              catchError((error) => {
                // handle errors that is not thrown by the tap operator
                if (!error.internalError) {
                  // TODO-STERN: change text
                  this.finalResult = {
                    type: "error",
                    message: "Failed to perform the final requests check.",
                  };
                }

                // Throw an error observable to stop further execution
                return throwError(error);
              })
            );
        }),
        concatMap((_result: any) => {
          this.runScanIn = "loading";

          // perform the scan in operation
          return this.restService
            .call({
              url: this.data.selectedBarcode.link,
              method: HttpMethod.POST,
              queryParams: {
                external_id: false,
                auto_print_slip: true,
                register_in_house_use: false,
                op: "scan",
                library: this.userSettings.sternumlauf.locationLibrary,
                circ_desk:
                  this.userSettings.sternumlauf.locationCirculationDesk,
              },
            })
            .pipe(
              tap(() => {
                this.runScanIn = "check";
              }),
              catchError((error) => {
                // TODO-STERN: change text
                // Handle any errors from the scan in operation
                this.finalResult = {
                  type: "error",
                  message: "Failed to perform the scan in operation.",
                };

                return throwError(error);
              })
            );
        }),
        concatMap((_result: any) => {
          this.runLoan = "loading";

          // perform the create user loan operation
          return this.restService
            .call({
              url: `/almaws/v1/users/${this.data.apiResult.interested_user[0].primary_id}/loans`,
              method: HttpMethod.POST,
              queryParams: {
                user_id_type: "all_unique",
                generate_linked_user: false,
                item_pid: this.data.selectedBarcode.pid,
              },
              requestBody: {
                circ_desk: {
                  value: this.userSettings.sternumlauf.locationCirculationDesk,
                },
                library: {
                  value: this.userSettings.sternumlauf.locationLibrary,
                },
              },
            })
            .pipe(
              tap(() => {
                this.runLoan = "check";
              }),
              delay(1000),
              catchError((error) => {
                // TODO-STERN: change text
                // Handle any errors from the create user loan operation
                this.finalResult = {
                  type: "error",
                  message: "Failed to perform the loan operation.",
                };

                return throwError(error);
              })
            );
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (_result: any) => {
          // TODO-STERN: change text
          this.finalResult = {
            type: "success",
            message: "Sternumlauf finished successfully.",
          };
        },
        error: (error) => {
          console.log(error);
        },
        complete: () => {},
      });
  }
}
