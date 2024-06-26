import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import ResizeObserver from "resize-observer-polyfill";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { RingumlaufPdfData, UserSettings } from "../../../app.model";
import { CloudAppSettingsService } from "@exlibris/exl-cloudapp-angular-lib";

@Component({
  selector: "app-ringumlauf-pdf",
  templateUrl: "./ringumlauf-pdf.component.html",
  styleUrls: ["./ringumlauf-pdf.component.scss"],
})
export class RingumlaufPdfComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  userSettings: UserSettings;
  usersList: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
  }[];

  private resizeObserver: ResizeObserver;
  private observableElement: HTMLElement;
  hasSmallWidth = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RingumlaufPdfData,
    private elementRef: ElementRef,
    private settingsService: CloudAppSettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings: UserSettings) => {
      console.log("Settings: ", settings);
      this.userSettings = settings;
    });

    this.observableElement = this.elementRef.nativeElement.querySelector(
      "#ringumlauf-pdf-dialog-title"
    );

    this.usersList = this.data.interestedUsersInfo.map((user) => {
      const userInfo = {
        firstName: user.first_name,
        lastName: user.last_name,
        address1: "",
        address2: "",
      };

      if (user.contact_info.address.length > 0) {
        const preferredAddress = user.contact_info.address.find(
          (address) => address.preferred
        );

        if (preferredAddress) {
          userInfo.address1 = preferredAddress.line1 || "";
          userInfo.address2 = preferredAddress.line2 || "";
        }
      }

      return userInfo;
    });
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        this.hasSmallWidth = width < 1000;
      }
    });

    this.resizeObserver.observe(this.observableElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
    this.resizeObserver.disconnect();
  }

  generatePdf(): void {
    const pdfElement =
      this.elementRef.nativeElement.querySelector("#ringumlauf-pdf");

    html2canvas(pdfElement, {
      backgroundColor: "#FFFFFF",
      scale: 2,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        // Calculate the aspect ratio to maintain the content's original aspect ratio
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save("Ringumlauf.pdf");
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
