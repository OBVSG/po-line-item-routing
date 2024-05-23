import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface DialogData {
  // TODO
}

@Component({
  selector: "app-ringumlauf-pdf",
  templateUrl: "./ringumlauf-pdf.component.html",
  styleUrls: ["./ringumlauf-pdf.component.scss"],
})
export class RingumlaufPdfComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}
}
