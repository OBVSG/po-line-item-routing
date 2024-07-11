import { Component, Input, OnInit } from "@angular/core";
import { InterestedUser, Umlauf, RingumlaufPdfData } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import {
  AlertService,
  CloudAppRestService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { from, throwError } from "rxjs";
import { catchError, concatMap, toArray } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { RingumlaufPdfComponent } from "../ringumlauf/ringumlauf-pdf/ringumlauf-pdf.component";

@Component({
  selector: "app-ringumlauf",
  templateUrl: "./ringumlauf.component.html",
  styleUrls: ["./ringumlauf.component.scss"],
})
export class RingumlaufComponent implements OnInit {
  @Input() apiResult: any;

  loading = false;
  barcodeList: Umlauf[];
  selectedBarcode: Umlauf;
  readDays: string = "";
  comment: string = "";

  interestedUsersInfo: any[];

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // filter out the items without barcode
    this.barcodeList = this.apiResult.location[0].copy
      .filter((item: Umlauf) => !!item.barcode)
      .sort(
        (a: Umlauf, b: Umlauf) =>
          new Date(b.receive_date).getTime() -
          new Date(a.receive_date).getTime()
      );

    if (this.barcodeList.length > 0) {
      this.selectedBarcode = this.barcodeList[0];
    }
  }

  onSelectBarcode(event: MatRadioChange) {
    const value = event.value as Umlauf;
    this.selectedBarcode = value;
  }

  private loadUsers() {
    this.loading = true;

    from<InterestedUser[]>(this.apiResult.interested_user)
      .pipe(
        concatMap((user) => {
          return this.restService
            .call(`/almaws/v1/users/${user.primary_id}`)
            .pipe(
              catchError((error) => {
                this.alert.error(
                  "Failed to retrieve user info for: " + user.primary_id
                );

                console.error(error);

                // Throw an error to stop the observable chain
                return throwError(() => new Error());
              })
            );
        }),
        toArray() // wait for all requests to complete
      )
      .subscribe({
        next: (result: any[]) => {
          this.interestedUsersInfo = [...result];
        },
        error: (_error) => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
          this.openDialog();
        },
      });
  }

  private openDialog() {
    const pdfData = {
      title: this.apiResult.resource_metadata.title,
      readDays: this.readDays,
      comment: this.comment,
      barcode: this.selectedBarcode.barcode,
      interestedUsersInfo: this.interestedUsersInfo,
    } as RingumlaufPdfData;

    // check if the interestedUsersInfo list order is the same as the interestedUsersList order
    try {
      for (let i = 0; i < this.apiResult.interested_user.length; i++) {
        if (
          this.apiResult.interested_user[i].primary_id !==
          this.interestedUsersInfo[i].primary_id
        ) {
          throw new Error("Not matched");
        }
      }

      this.dialog.open(RingumlaufPdfComponent, {
        autoFocus: false,
        data: pdfData,
        width: "90%",
      });
    } catch (error) {
      this.alert.error("The interested users list is not matched");
    }
  }

  printRingumlauf() {
    this.interestedUsersInfo = [];
    this.loadUsers();
  }
}
