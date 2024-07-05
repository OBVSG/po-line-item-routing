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
import {
  AlertService,
  CloudAppSettingsService,
} from "@exlibris/exl-cloudapp-angular-lib";

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
    private alert: AlertService,
    private settingsService: CloudAppSettingsService
  ) {}

  ngOnInit(): void {
    // Get the user settings
    this.settingsService.get().subscribe((settings: UserSettings) => {
      this.userSettings = settings;
    });

    // Get the element to observe for resizing
    this.observableElement = this.elementRef.nativeElement.querySelector(
      "#ringumlauf-pdf-dialog-title"
    );

    // Extract the user information
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

  async generatePdf() {
    const pdfElement =
      this.elementRef.nativeElement.querySelector("#ringumlauf-pdf");

    try {
      const canvas = await html2canvas(pdfElement, {
        backgroundColor: "#FFFFFF",
        scale: 4,
      });

      canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // Calculate the aspect ratio to maintain the content's original aspect ratio
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Variables to control the position on the image and PDF page
      const pageCount = Math.ceil(imgHeight / pageHeight);

      for (let page = 0; page < pageCount; page++) {
        const srcY = (page * canvas.height) / pageCount;
        const srcHeight = Math.min(
          canvas.height / pageCount,
          canvas.height - srcY
        );

        const canvasPage = document.createElement("canvas");
        canvasPage.width = canvas.width;
        canvasPage.height = srcHeight;

        const ctx = canvasPage.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          srcHeight,
          0,
          0,
          canvas.width,
          srcHeight
        );

        const imgPageData = canvasPage.toDataURL("image/png");

        if (page > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgPageData,
          "PNG",
          0,
          0,
          imgWidth,
          (srcHeight * imgWidth) / canvas.width
        );
      }

      const pdfFileName = `${
        new Date().toISOString().split("T")[0]
      }-ringumlauf.pdf`;

      pdf.save(pdfFileName);
    } catch (error) {
      this.alert.error("Failed to generate PDF");
      console.error(error);
    }
  }
}
