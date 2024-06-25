import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  CloudAppRestService,
  CloudAppSettingsService,
  HttpMethod,
} from "@exlibris/exl-cloudapp-angular-lib";
import {
  InterestedUser,
  SternumlaufStartData,
  UserSettings,
} from "../../../app.model";
import { from, of, throwError } from "rxjs";
import { catchError, concatMap, map, mergeMap, toArray } from "rxjs/operators";

@Component({
  selector: "app-sternumlauf-start",
  templateUrl: "./sternumlauf-start.component.html",
  styleUrls: ["./sternumlauf-start.component.scss"],
})
export class SternumlaufStartComponent implements OnInit {
  loading = false;
  isUmlaufStarted = false;
  userSettings: UserSettings;
  finalResult: {
    type: "info" | "error" | "success";
    message: string;
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SternumlaufStartData,
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });
  }

  startSternumlauf() {
    this.loading = true;
    this.isUmlaufStarted = true;

    // create request for each interested user
    from<InterestedUser[]>(this.data.apiResult.interested_user)
      .pipe(
        mergeMap((user) => {
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
                pickup_location_type:
                  this.userSettings.sternumlauf.locationType,
                pickup_location_library:
                  this.userSettings.sternumlauf.locationLibrary,
                pickup_location_circulation_desk:
                  this.userSettings.sternumlauf.locationCirculationDesk,
              },
            })
            .pipe(
              catchError(() => {
                this.finalResult = {
                  type: "error",
                  message:
                    "Failed to register request for user: " + user.primary_id,
                };

                return throwError(
                  () => new Error("Failed to register requests")
                );
              })
            );
        }),
        toArray(), // wait for all requests to complete
        concatMap(() => {
          // check existing requests after sending requests for all interested users
          return this.restService
            .call({
              url: `${this.data.selectedBarcode.link}/requests`,
              method: HttpMethod.GET,
            })
            .pipe(
              map((result: any) => {
                if (
                  this.data.apiResult.interested_user.length !==
                  result.total_record_count
                ) {
                  this.finalResult = {
                    type: "error",
                    message: "interested_user !== total_record_count",
                  };

                  this.finalResult = {
                    type: "error",
                    message: "Vormerkungen konnten nicht gebildet werden.",
                  };

                  // stop the observable chain
                  throw new Error("APP ERROR: Requests count mismatch.");
                }

                return of(null);
              }),
              catchError((_error) => {
                // Handle any errors from the final check
                this.finalResult = {
                  type: "error",
                  message: "Failed to perform the final requests check.",
                };

                return throwError(
                  () =>
                    new Error(
                      "APP ERROR: Failed to perform the final requests check."
                    )
                );
              })
            );
        }),
        concatMap((_result: any) => {
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
              catchError(() => {
                // Handle any errors from the scan in operation
                this.finalResult = {
                  type: "error",
                  message: "Failed to perform the scan in operation.",
                };

                return throwError(
                  () => new Error("Failed to perform the scan in operation")
                );
              })
            );
        }),
        concatMap((_result: any) => {
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
              catchError(() => {
                // Handle any errors from the create user loan operation
                this.finalResult = {
                  type: "error",
                  message: "Failed to perform the scan in operation.",
                };

                return throwError(
                  () => new Error("Failed to perform the scan in operation.")
                );
              })
            );
        })
      )
      .subscribe({
        next: (_result: any) => {
          this.finalResult = {
            type: "success",
            message: "Sternumlauf finished successfully.",
          };
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
