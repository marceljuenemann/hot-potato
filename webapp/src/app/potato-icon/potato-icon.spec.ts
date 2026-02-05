import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PotatoIcon } from './potato-icon';

describe('PotatoIcon', () => {
  let component: PotatoIcon;
  let fixture: ComponentFixture<PotatoIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PotatoIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PotatoIcon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
