import { Component, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatEther, TransactionLike } from 'ethers';
import { AlchemyProvider } from 'ethers';

@Component({
  selector: 'transaction-form',
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm implements OnInit {
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
  }

  ngOnInit() {
    const tx = {
      ...this.request(),
      chainId: this.request().chainId?.toString().replace(/^eip155:/, ''),
    }
    this.form.patchValue({
      ...tx as any,
      value: formatEther(this.request().value || 0)
    }, { emitEvent: false });

    // Automatically fill missing fields.
    // Use a simple provider without any fance quorum.
    const provider = new AlchemyProvider(parseInt(tx.chainId!));
    if (!tx.nonce) {
      provider.getTransactionCount(tx.from!).then(nonce => {
        this.form.patchValue({ nonce: String(nonce) }, { emitEvent: false });
      });
    }
    if (!tx.gasLimit) {
      provider.estimateGas(tx)
        .catch(err => String(err))
        .then(gasLimit => {
          this.form.patchValue({ gasLimit: String(gasLimit) }, { emitEvent: false });
        })
    }
    if (!tx.maxFeePerGas || !tx.maxPriorityFeePerGas) {
      provider.getFeeData().then(feeData => {
        console.log("Fee data:", feeData);
        this.form.patchValue({ maxFeePerGas: String(feeData.maxFeePerGas) }, { emitEvent: false });
        this.form.patchValue({ maxPriorityFeePerGas: String(feeData.maxPriorityFeePerGas) }, { emitEvent: false });
      })
    }
  }
}
