import { Component, Input, OnInit } from "@angular/core";
import {
  CloudAppRestService,
  CloudAppSettingsService,
} from "@exlibris/exl-cloudapp-angular-lib";
import { Umlauf, UserSettings } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";
import { FormControl } from "@angular/forms";

@Component({
  selector: "app-sternumlauf",
  templateUrl: "./sternumlauf.component.html",
  styleUrls: ["./sternumlauf.component.scss"],
})
export class SternumlaufComponent implements OnInit {
  @Input() apiResult: any;

  itemPolicy = new FormControl();

  barcodeList: Umlauf[];
  selectedBarcode: Umlauf;
  userSettings: UserSettings;

  constructor(
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService
  ) {}

  ngOnInit(): void {
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

    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = { ...settings };
    });
  }

  onSelectBarcode(event: MatRadioChange) {
    const value = event.value as Umlauf;
    this.selectedBarcode = value;
  }

  checkCall(endpoint: "requests" | "loans") {
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
    return this.restService.call(`${this.selectedBarcode.link}/${endpoint}`);
  }

  // check if the item policy matches the user specified pattern
  checkSternumlaufProcess() {
    // TODO: the itemPolicy of the "main item" should be in the array of the user defined item policies, case sensitive
    // TODO: call api check
    /*
    .subscribe({
        next: (result: any) => {
          console.log(result);
        },
        error: (error) => {
          console.error(error);
          // this.loading = false;
        },
        complete: () => {
          // this.loading = false;
        },
      });
    
    */

    this.checkCall("requests"); // TODO: subscribe
  }
}
