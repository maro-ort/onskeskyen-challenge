import { Field, InputType, ObjectType } from '@nestjs/graphql'

@InputType()
export class CreatePaymentNoteInput {
  @Field()
  paymentNotePeriodFromDateTime: Date

  @Field()
  paymentNotePeriodToDateTime: Date
}

@ObjectType()
export class CreatePaymentResponse {
  @Field()
  success: boolean

  @Field()
  error?: string
}
