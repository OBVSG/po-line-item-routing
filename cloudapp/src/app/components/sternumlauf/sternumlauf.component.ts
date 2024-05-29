import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-sternumlauf",
  templateUrl: "./sternumlauf.component.html",
  styleUrls: ["./sternumlauf.component.scss"],
})
export class SternumlaufComponent implements OnInit {
  @Input() apiResult: any;

  constructor() {}

  ngOnInit(): void {}
}
