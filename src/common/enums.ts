import { registerEnumType } from '@nestjs/graphql'

export enum PaymentNoteStatusCode {
  CREATING = 'CREATING',
  COMPLETED = 'COMPLETED',
}

registerEnumType(PaymentNoteStatusCode, {
  name: 'PaymentNoteStatusCode',
})

export enum TransactionStatusCode {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

registerEnumType(TransactionStatusCode, {
  name: 'TransactionStatusCode',
})
