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
    return this.restService.call(`${this.selectedBarcode.link}/${endpoint}`);
  }

  // check if the item policy matches the user specified pattern
  checkSternumlaufProcess() {
    // TODO: check policy (only for the ones with barcode?)
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
