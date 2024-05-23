import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RingumlaufPdfComponent } from './ringumlauf-pdf.component';

describe('RingumlaufPdfComponent', () => {
  let component: RingumlaufPdfComponent;
  let fixture: ComponentFixture<RingumlaufPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RingumlaufPdfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RingumlaufPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
