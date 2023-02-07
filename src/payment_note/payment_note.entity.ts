import { Field, ID, ObjectType } from '@nestjs/graphql'
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm'

import { PaymentNoteStatusCode } from 'src/common/enums'

import { Transaction } from 'src/transaction/transaction.entity'

@ObjectType()
@Entity()
export class PaymentNote {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'payment_note_uuid' })
  paymentNoteUuid: string

  @Field()
  @Column({ name: 'payment_note_period_from_datetime' })
  paymentNotePeriodFromDateTime: Date

  @Field()
  @Column({ name: 'payment_note_period_to_datetime' })
  paymentNotePeriodToDateTime: Date

  @Field()
  @CreateDateColumn({ name: 'payment_note_created_datetime' })
  paymentNoteCreatedDateTime: Date

  @Field()
  @Column({ default: 0, name: 'payment_note_transactions_count' })
  paymentNoteTransactionsCount: number

  @Field()
  @Column({ default: 0, name: 'payment_note_value', type: 'numeric', precision: 2 })
  paymentNoteValue: number

  @Field(type => PaymentNoteStatusCode)
  @Column({
    type: 'enum',
    enum: PaymentNoteStatusCode,
    name: 'payment_note_status_code',
  })
  paymentNoteStatusCode: PaymentNoteStatusCode

  @OneToMany(() => Transaction, transaction => transaction.transactionPaymentNoteUuid)
  transactions: Transaction[]
}
