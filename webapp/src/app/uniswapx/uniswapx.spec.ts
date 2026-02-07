import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Uniswapx } from './uniswapx';

describe('Uniswapx', () => {
  let component: Uniswapx;
  let fixture: ComponentFixture<Uniswapx>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Uniswapx]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Uniswapx);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
