import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { TransactionStatusCode } from 'src/common/enums'

import { Transaction } from './transaction.entity'

@Injectable()
export class TransactionService {
  constructor(@InjectRepository(Transaction) private transactionRepo: Repository<Transaction>) {}

  setPaidTransactions(
    paymentNoteUuid: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{ affected: number; transactionValues: number }> {
    return this.transactionRepo
      .createQueryBuilder()
      .where('transaction_status_code = :statusCode', { statusCode: TransactionStatusCode.PENDING })
      .andWhere('transaction_datetime BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .getManyAndCount()
      .then(([transactions, affected]) => {
        const transactionValues = transactions.reduce((acc, t) => acc + t.transactionValue, 0)

        return this.transactionRepo
          .createQueryBuilder()
          .update(Transaction)
          .set({ transactionPaymentNoteUuid: paymentNoteUuid, transactionStatusCode: TransactionStatusCode.PAID })
          .whereInIds(transactions.map(t => t.transactionUuid))
          .execute()
          .then(() => ({
            affected,
            transactionValues,
          }))
      })
  }
}
