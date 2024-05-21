import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RingumlaufComponent } from "./ringumlauf.component";

describe("RingumlaufComponent", () => {
  let component: RingumlaufComponent;
  let fixture: ComponentFixture<RingumlaufComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RingumlaufComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RingumlaufComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
