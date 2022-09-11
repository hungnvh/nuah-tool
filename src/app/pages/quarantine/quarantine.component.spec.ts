import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuarantineComponent } from './quarantine.component';

describe('QuarantineComponent', () => {
  let component: QuarantineComponent;
  let fixture: ComponentFixture<QuarantineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuarantineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuarantineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
