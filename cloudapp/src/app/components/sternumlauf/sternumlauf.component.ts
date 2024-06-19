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

      // TODO: change this
      // TODO: here?
      // this.checkItemPolicy(this.userSettings.itemPolicy);
    });
  }

  // check if the item policy matches the user specified pattern
  checkItemPolicy(userItemPolicy: string) {
    // TODO: it it correct here? only for the ones with barcode?
    // TODO: since the item policy has multiple values, this check is not correct
  }

  onSelectBarcode(event: MatRadioChange) {
    const value = event.value as Umlauf;
    this.selectedBarcode = value;
  }

  checkUserRequests() {
    this.restService.call(`${this.selectedBarcode.link}/requests`).subscribe({
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
  }
}
