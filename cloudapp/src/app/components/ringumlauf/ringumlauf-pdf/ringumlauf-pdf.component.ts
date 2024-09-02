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
import { jsPDF } from "jspdf";
import { RingumlaufPdfData, UserSettings } from "../../../app.model";
import {
  AlertService,
  CloudAppSettingsService,
} from "@exlibris/exl-cloudapp-angular-lib";
import autoTable from "jspdf-autotable";
import { TranslateService } from "@ngx-translate/core";

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
    private settingsService: CloudAppSettingsService,
    private translate: TranslateService
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
        this.hasSmallWidth = width < 400;
      }
    });

    this.resizeObserver.observe(this.observableElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
    this.resizeObserver.disconnect();
  }

  async generatePdf() {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Add the header
      autoTable(doc, {
        theme: "plain",
        tableWidth: 180,
        showHead: "never",
        bodyStyles: {
          fontSize: 18,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "center" },
        },
        head: [[""]],
        body: [
          [this.translate.instant("Translate.components.ringumlaufPdf.title")],
        ],
      });

      // Add the address
      autoTable(doc, {
        theme: "plain",
        tableWidth: 180,
        showHead: "never",
        bodyStyles: {
          fontSize: 10,
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right" },
        },
        head: [["", ""]],
        body: [
          [
            `${this.usersList[0].firstName} ${this.usersList[0].lastName}`,
            this.userSettings.information.title,
          ],
          [this.usersList[0].address1, this.userSettings.information.subtitle],
          [this.usersList[0].address2, this.userSettings.information.address],
          ["", this.userSettings.information.phone],
          ["", this.userSettings.information.email],
          ["", this.userSettings.information.website],
          this.userSettings.information.dvr
            ? ["", `DVR: ${this.userSettings.information.dvr}`]
            : [],
        ],
      });

      // Add the title
      autoTable(doc, {
        theme: "plain",
        tableWidth: 180,
        showHead: "never",
        bodyStyles: {
          fontSize: 12,
          fontStyle: "bold",
        },
        head: [[""]],
        body: [[this.data.title]],
      });

      // Add the information
      autoTable(doc, {
        theme: "plain",
        tableWidth: 180,
        showHead: "never",
        bodyStyles: {
          fontSize: 11,
        },
        head: [[""]],
        body: [
          [`Barcode: ${this.data.barcode}`],
          [
            `${this.translate.instant(
              "Translate.components.ringumlaufPdf.information.readDays"
            )} ${this.data.readDays}`,
          ],
          [
            `${this.translate.instant(
              "Translate.components.ringumlaufPdf.information.notice"
            )} ${this.data.comment}`,
          ],
        ],
      });

      // Add the users list table
      autoTable(doc, {
        theme: "plain",
        tableWidth: 180,
        headStyles: {
          fontSize: 10,
          fillColor: [235, 235, 235],
        },
        bodyStyles: {
          fontSize: 10,
        },
        head: [
          [
            this.translate.instant(
              "Translate.components.ringumlaufPdf.table.firstName"
            ),
            this.translate.instant(
              "Translate.components.ringumlaufPdf.table.lastName"
            ),
            this.translate.instant(
              "Translate.components.ringumlaufPdf.table.address"
            ),
          ],
        ],
        body: this.usersList.map((user) => [
          user.firstName,
          user.lastName,
          user.address1,
        ]),
      });

      const pdfFileName = `${
        new Date().toISOString().split("T")[0]
      }-ringumlauf.pdf`;

      doc.save(pdfFileName);
      this.alert.success(
        this.translate.instant(
          "Translate.components.ringumlaufPdf.componentFile.pdfSuccess"
        )
      );
    } catch (error) {
      console.error(error);
      this.alert.error(
        this.translate.instant(
          "Translate.components.ringumlaufPdf.componentFile.pdfFailure"
        )
      );
    }
  }
}
