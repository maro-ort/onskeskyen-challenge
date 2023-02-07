import { Field, Float, ID, ObjectType } from '@nestjs/graphql'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

import { TransactionStatusCode } from 'src/common/enums'

@ObjectType()
@Entity({ name: 'transaction' })
export class Transaction {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_uuid' })
  transactionUuid: string

  @Field(type => TransactionStatusCode)
  @Column({ type: 'enum', enum: TransactionStatusCode, name: 'transaction_status_code' })
  transactionStatusCode: TransactionStatusCode

  @Field(type => Float)
  @Column({ name: 'transaction_value', type: 'numeric', precision: 2 })
  transactionValue: number

  @Field()
  @Column({ name: 'transaction_datetime' })
  transactionDateTime: Date

  @Field()
  @Column({ name: 'transaction_payment_note_uuid' })
  transactionPaymentNoteUuid: string
}
