import { Component, Input, OnInit } from "@angular/core";
import { InterestedUser, Umlauf, RingumlaufPdfData } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import {
  AlertService,
  CloudAppRestService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { from, throwError } from "rxjs";
import { catchError, concatMap, finalize, toArray } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { RingumlaufPdfComponent } from "../ringumlauf/ringumlauf-pdf/ringumlauf-pdf.component";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-ringumlauf",
  templateUrl: "./ringumlauf.component.html",
  styleUrls: ["./ringumlauf.component.scss"],
})
export class RingumlaufComponent implements OnInit {
  @Input() apiResult: any;

  loading = false;
  barcodeList!: Umlauf[];
  selectedBarcode!: Umlauf;
  readDays: string = "";
  comment: string = "";

  interestedUsersInfo!: any[];

  constructor(
    private restService: CloudAppRestService,
    private alert: AlertService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // filter out the items without barcode
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
    this.alert.clear();

    from<InterestedUser[]>(this.apiResult.interested_user)
      .pipe(
        concatMap((user) => {
          return this.restService
            .call(`/almaws/v1/users/${user.primary_id}`)
            .pipe(
              catchError((error) => {
                this.alert.error(
                  this.translate.instant(
                    "Translate.components.ringumlauf.componentFile.userInfoFailure",
                    { userId: user.primary_id }
                  )
                );

                // Throw the error again to stop the observable chain
                return throwError(
                  () =>
                    new Error("An error occurred", {
                      cause: error,
                    })
                );
              })
            );
        }),
        toArray(), // wait for all requests to complete
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (result: any[]) => {
          this.interestedUsersInfo = [...result];
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
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
        maxWidth: "100%",
      });
    } catch (error) {
      this.alert.error(
        this.translate.instant(
          "Translate.components.ringumlauf.componentFile.wrongUserOrder"
        )
      );
    }
  }

  printRingumlauf() {
    this.interestedUsersInfo = [];
    this.loadUsers();
  }
}
