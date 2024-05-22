import { Component, Input, OnInit } from "@angular/core";
import { Ringumlauf } from "../../app.model";
import { MatRadioChange } from "@angular/material/radio";

@Component({
  selector: "app-ringumlauf",
  templateUrl: "./ringumlauf.component.html",
  styleUrls: ["./ringumlauf.component.scss"],
})
export class RingumlaufComponent implements OnInit {
  @Input() apiResult: any;

  barcodeList: Ringumlauf[];
  selectedBarcode: Ringumlauf;
  readDays: string;
  comment: string;

  constructor() {}

  ngOnInit(): void {
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

  getUsers() {
    // TODO
  }

  printRingumlauf() {
    // TODO
  }
}
