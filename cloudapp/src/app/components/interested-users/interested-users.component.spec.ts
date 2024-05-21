import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InterestedUsersComponent } from "./interested-users.component";

describe("InterestedUsersComponent", () => {
  let component: InterestedUsersComponent;
  let fixture: ComponentFixture<InterestedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterestedUsersComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterestedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
