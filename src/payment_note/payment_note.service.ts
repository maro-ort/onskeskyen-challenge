import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PaymentNoteStatusCode } from 'src/common/enums'
import { patch } from 'src/common/patch'

import { TransactionService } from 'src/transaction/transaction.service'

import { CreatePaymentNoteInput } from './payment_note.dto'
import { PaymentNote } from './payment_note.entity'
import { Transaction } from 'src/transaction/transaction.entity'

@Injectable()
export class PaymentNoteService {
  constructor(
    @InjectRepository(PaymentNote) private paymentNoteRepo: Repository<PaymentNote>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  getAll(): Promise<PaymentNote[]> {
    return this.paymentNoteRepo.find({
      order: {
        paymentNoteCreatedDateTime: 'ASC',
      },
    })
  }

  getPaymentNoteTransactions(id: string) {
    return this.transactionRepo.find({
      where: {
        transactionPaymentNoteUuid: id,
      },
    })
  }

  create(input: CreatePaymentNoteInput): Promise<PaymentNote> {
    const newPaymentNote = patch(new PaymentNote(), {
      ...input,
      paymentNoteStatusCode: PaymentNoteStatusCode.CREATING,
    })

    return this.paymentNoteRepo.save(newPaymentNote).then(paymentNote => {
      this.transactionService
        .setPaidTransactions(
          paymentNote.paymentNoteUuid,
          paymentNote.paymentNotePeriodFromDateTime,
          paymentNote.paymentNotePeriodToDateTime
        )
        .then(({ affected, transactionValues }) => {
          this.paymentNoteRepo.update(paymentNote.paymentNoteUuid, {
            paymentNoteStatusCode: PaymentNoteStatusCode.COMPLETED,
            paymentNoteValue: transactionValues,
            paymentNoteTransactionsCount: affected,
          })
        })
      return paymentNote
    })
  }
}
