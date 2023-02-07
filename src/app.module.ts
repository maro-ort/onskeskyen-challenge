import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TransactionModule } from './transaction/transaction.module'
import { PaymentNoteModule } from './payment_note/payment_note.module'
import { GraphQLModule } from '@nestjs/graphql'
import * as path from 'path'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'maro',
      password: 'NotSafeForProd',
      database: 'maro-challenge',
      // synchronize: true,
      entities: [path.join(__dirname, '**/**.entity.{ts,js}')],
      // logging: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      debug: true,
      autoSchemaFile: path.join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    TransactionModule,
    PaymentNoteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
