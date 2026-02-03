import { Component, effect, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatEther, TransactionLike } from 'ethers';

@Component({
  selector: 'transaction-form',
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm {
  request = input.required<TransactionLike<string>>();
  form;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      from: [{ value: '', disabled: true }, [Validators.required]],
      to: [{ value: '', disabled: true }, [Validators.required]],
      value: [{ value: '', disabled: true }],
      data: [{ value: '0x', disabled: true }],
      nonce: [''],
      gasLimit: [''],
      maxFeePerGas: [''],
      maxPriorityFeePerGas: [''],
      chainId: [{ value: '', disabled: true }, [Validators.required]],
    });

    effect(() => {
      const tx = {
        ...this.request(),
        value: formatEther(this.request().value || 0)
      }
      this.form.patchValue(tx as any, { emitEvent: false });
    });
  }
}
