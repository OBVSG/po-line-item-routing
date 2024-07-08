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
import autoTable from "jspdf-autotable";

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

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      // Calculate the aspect ratio to maintain the content's original aspect ratio
      const pageWidth = 210; // A4 width in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // autoTable(pdf, { html: "#ringumlauf-pdf-table" });
      autoTable(pdf, {
        theme: "plain",
        startY: imgHeight,
        margin: { right: 20, left: 20 },
        headStyles: {
          fontSize: 10,
          fillColor: [235, 235, 235],
        },
        bodyStyles: {
          fontSize: 9,
        },
        head: [["Vorname", "Nachname", "Adresse"]],
        body: this.usersList.map((user) => [
          user.firstName,
          user.lastName,
          user.address1,
        ]),
      });

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
