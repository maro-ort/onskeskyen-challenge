import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PaymentNote } from './payment_note.entity'
import { PaymentNoteResolver } from './payment_note.resolver'
import { PaymentNoteService } from './payment_note.service'

import { Transaction } from 'src/transaction/transaction.entity'
import { TransactionService } from 'src/transaction/transaction.service'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentNote, Transaction])],
  providers: [PaymentNoteService, TransactionService, PaymentNoteResolver],
})
export class PaymentNoteModule {}
