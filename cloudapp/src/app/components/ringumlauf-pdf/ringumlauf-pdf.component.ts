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
import { RingumlaufPdfData } from "../../app.model";

@Component({
  selector: "app-ringumlauf-pdf",
  templateUrl: "./ringumlauf-pdf.component.html",
  styleUrls: ["./ringumlauf-pdf.component.scss"],
})
export class RingumlaufPdfComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  interestedUsers: {
    name: string;
    address: string;
  }[];

  private resizeObserver: ResizeObserver;
  private observableElement: HTMLElement;
  hasSmallWidth = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RingumlaufPdfData,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.observableElement = this.elementRef.nativeElement.querySelector(
      "#ringumlauf-pdf-dialog-title"
    );

    this.interestedUsers = this.data.interestedUsersInfo.map((user) => ({
      name: user.full_name,
      address: user.contact_info.address[0].line1, // TODO
    }));
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
