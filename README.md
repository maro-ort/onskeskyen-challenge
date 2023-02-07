# Maro Ortega - Ønskeskyen Challenge

## How to run

### Database

The database is deployable with `docker-compose up` (add `-d` flag to detach), that will create a new container with `mariadb` and configured to use the hardcoded env values in `app.module.ts`. Usually I would use `.env` files to manage the values but for this exercise it should be enough.

To import the database the following command should do the trick:
`$ mysql -h localhost -P 3306 --protocol=tcp -u maro -p maro-challenge < transaction.sql`

### Run

Use NPM or Yarn to install libraries and run the app.

* `$ yarn` To install dependencies.
* `$ yarn start` To run the application.
* `$yarn start:dev` Will also run it but will modify schemas on the fly if any changes are done to the code.

The app runs on port `3000` by default, a **GraphQL** playground is available at `http://localhost:3000/graphql`.

| ❗ | If you find any problems running the app or need more detailed explanations please let the author know. He will be happy to help! |
|----|---------------------------------------------------------------------------------------------------------|

## Questions


**1. What do you see as potential issues, if the volume of transactions per payment note is ever increasing?**


The more `transactions` in the DB the slower the app will be to find and update them when a new payment is done, with an insane amount of rows that could potentially crash the system running.

If this is an application where `transactions` are created rapidly and in big quantities but barelly read accessed a possibility is to move the `PAID` transactions to another table so the table to look into stays as small as possible. If that is not the case then I would recommend to at least use `transaction_status_code` as an `enum` to speed up searching as it is more efficent than testing `string`. Also there's the option to instead of filtering by status code (as requested in the exercice) it could check for the parent `payment_note` in `transaction.transaction_payment_note_uuid` if it is `NULL` (instead of empty string, requires changing it to `NULLABLE`).

Also if the expected situation is to have a huge amount of `transactions` per `payment_note` then pagination is a must. Of course `getPaymentNotes` in [payment_note.resolver.ts](src/payment_note/payment_note.resolver.ts) should implement pagination always, but this is an exercice.

**2. If you had the option to choose any tech-stack & service(s) to help scale up the handling of an ever increasing volume of transactions, which would you choose & how would each chosen option help?**

The current stack (NestJS/GraphQL) is pretty good at handling requests and responses. Probably the best option is to have a DB cluster to separate the readonly and write actions but of course that requires some though on the real usage of the app to find the bottlenecks to architect it properly. (Balance n x 100 small server instances and 1 DB VS. 1 big server and n x 100 DB instances).

**2.1 Would the chosen options change the architecture of the code written for this task? If so, explain briefly what would change.**

For the option of 1 DB an many servers I'm confident the code as is would work, any decent DBMS should be able to lock and prevent concurrent writes. For the oposite option I'm not really sure as I never faced the situation, maybe 2 DB instances could be required (hot and cold storage) if the cluster does not take care of it by itself.

## Bonus

Please feel free to check the [code-examples](./code-examples/) folder where I added some of the NestJS code I was developing in my previous company. I think it's related to this exercice and gives a broader view of my capabilities.