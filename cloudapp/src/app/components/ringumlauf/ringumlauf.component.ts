import { Component, Input, OnInit } from "@angular/core";
import { InterestedUser, Ringumlauf, RingumlaufPdfData } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import {
  AlertService,
  CloudAppRestService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { from, throwError } from "rxjs";
import { catchError, mergeMap, toArray } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { RingumlaufPdfComponent } from "../ringumlauf-pdf/ringumlauf-pdf.component";

@Component({
  selector: "app-ringumlauf",
  templateUrl: "./ringumlauf.component.html",
  styleUrls: ["./ringumlauf.component.scss"],
})
export class RingumlaufComponent implements OnInit {
  @Input() apiResult: any;

  barcodeList: Ringumlauf[];
  selectedBarcode: Ringumlauf;
  readDays: string = "";
  comment: string = "";

  interestedUsersInfo: any[];
  loading = false;

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // TODO: Does this run on every apiResult changes????

    this.barcodeList = this.apiResult.location[0].copy
      .filter((item: Ringumlauf) => !!item.barcode)
      .sort(
        (a: Ringumlauf, b: Ringumlauf) =>
          new Date(b.receive_date).getTime() -
          new Date(a.receive_date).getTime()
      );
    this.selectedBarcode = this.barcodeList[0];
  }

  onSelectBarcode(event: MatRadioChange) {
    const value = event.value as Ringumlauf;
    this.selectedBarcode = value;
  }

  private loadUsers() {
    this.loading = true;

    from<InterestedUser[]>(this.apiResult.interested_user)
      .pipe(
        mergeMap((user) => {
          return this.restService.call(`/users/${user.primary_id}`).pipe(
            catchError(() => {
              this.alert.error(
                "Failed to retrieve user info for: " + user.primary_id
              );
              return throwError(
                () => new Error("Failed to retrieve users info")
              );
            })
          );
        }),
        toArray()
      )
      .subscribe({
        next: (result: any[]) => {
          result.forEach((user) => {
            this.interestedUsersInfo.push(user);
          });
        },
        error: (error) => {
          console.error(error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
          this.openDialog();
        },
      });
  }

  printRingumlauf() {
    this.interestedUsersInfo = [];
    this.loadUsers();
  }

  private openDialog() {
    const pdfData = this.preparePdfData();

    const dialogRef = this.dialog.open(RingumlaufPdfComponent, {
      autoFocus: false,
      data: pdfData,
      width: "90%",
      panelClass: "ringumlauf-dialog",
    });
  }

  private preparePdfData() {
    // TODO: sort the interestedUsersInfo result?

    return {
      senderInfo: {},
      receiveInfo: {},
      title: this.apiResult.resource_metadata.title,
      readDays: this.readDays,
      comment: this.comment,
      barcode: this.selectedBarcode.barcode,
      interestedUsersInfo: this.interestedUsersInfo,
    } as RingumlaufPdfData;
  }
}
