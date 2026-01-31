import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Potato } from './potato';

describe('Potato', () => {
  let component: Potato;
  let fixture: ComponentFixture<Potato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Potato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Potato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
