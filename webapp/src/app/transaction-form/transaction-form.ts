import { Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatEther, TransactionLike } from 'ethers';
import { AlchemyProvider } from 'ethers';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'transaction-form',
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm implements OnInit {
  request = input.required<TransactionLike<string>>();
  transaction = output<TransactionLike<string> | null>();
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

    this.form.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.form.valid) {
          this.transaction.emit(null);
        } else {
          this.transaction.emit(this.form.value as TransactionLike<string>);
        }
      });
  }

  ngOnInit() {
    const tx = {
      ...this.request(),
      chainId: this.request().chainId?.toString().replace(/^eip155:/, ''),
    }
    this.form.patchValue({
      ...tx as any,
      value: formatEther(this.request().value || 0)
    });

    // Automatically fill missing fields.
    // Use a simple provider without any fance quorum.
    const provider = new AlchemyProvider(parseInt(tx.chainId!));
    if (!tx.nonce) {
      provider.getTransactionCount(tx.from!).then(nonce => {
        this.form.patchValue({ nonce: String(nonce) });
      });
    }
    if (!tx.gasLimit) {
      provider.estimateGas(tx)
        .catch(err => String(err))
        .then(gasLimit => {
          this.form.patchValue({ gasLimit: String(gasLimit) });
        })
    }
    if (!tx.maxFeePerGas || !tx.maxPriorityFeePerGas) {
      provider.getFeeData().then(feeData => {
        console.log("Fee data:", feeData);
        this.form.patchValue({ maxFeePerGas: String(feeData.maxFeePerGas) });
        this.form.patchValue({ maxPriorityFeePerGas: String(feeData.maxPriorityFeePerGas) });
      })
    }
  }
}
