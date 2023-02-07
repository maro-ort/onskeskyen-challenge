import { Inject } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Transaction } from 'src/transaction/transaction.entity'

import { CreatePaymentNoteInput, CreatePaymentResponse } from './payment_note.dto'
import { PaymentNote } from './payment_note.entity'
import { PaymentNoteService } from './payment_note.service'

@Resolver()
export class PaymentNoteResolver {
  constructor(@Inject(PaymentNoteService) private paymentNoteService) {}

  @Query(returns => [Transaction])
  getPaymentNoteTransactions(@Args('id') id: string) {
    return this.paymentNoteService.getPaymentNoteTransactions(id)
  }

  @Query(returns => [PaymentNote])
  getPaymentNotes(): Promise<PaymentNote[]> {
    return this.paymentNoteService.getAll()
  }

  @Mutation(returns => CreatePaymentResponse)
  createPayment(@Args('input') input: CreatePaymentNoteInput): Promise<CreatePaymentResponse> {
    return this.paymentNoteService
      .create(input)
      .then(() => ({ success: true }))
      .catch(e => ({ success: false, error: e }))
  }
}
