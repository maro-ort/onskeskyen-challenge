import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql'

import { Region } from 'src/constants/region'

import { Product } from '../../entities/product.entity'
import { Offer } from './offer.entity'
import { ProductInBox, ProductL10n, ProductMedia } from 'src/products/entities/product-polymorphic.entity'
import { VariantOption } from 'src/products/dto/products.dto'

@ObjectType()
@Entity()
export class Variant {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field(type => Region)
  @Column({
    type: 'enum',
    enum: Region,
  })
  region: Region

  @Field(type => Int, { defaultValue: -1 })
  @Column({ type: 'int', default: -1 })
  order: number

  @ManyToOne(() => Product, product => product.variants)
  @JoinColumn({
    name: 'productSlug',
    referencedColumnName: 'slug',
  })
  product: Product

  @Field()
  @Column()
  variantName: string

  @Field()
  @Column()
  sku: string

  @Field(type => Float)
  @Column({ type: 'float' })
  price: number

  @Field()
  @Column({ default: false })
  outOfStock: boolean

  @Field()
  @Column({ comment: 'shopifyId' })
  variantId: string

  @Field(type => [ProductL10n])
  @OneToMany(() => ProductL10n, l10n => l10n.variant, { cascade: true, orphanedRowAction: 'delete' })
  l10n: ProductL10n[]

  @Field(type => [ProductMedia])
  @OneToMany(() => ProductMedia, media => media.variant, { cascade: true, orphanedRowAction: 'delete' })
  media: ProductMedia[]

  @Field(type => [ProductInBox], { nullable: true })
  @OneToMany(type => ProductInBox, inbox => inbox.variant, { cascade: true, orphanedRowAction: 'delete' })
  inBox: ProductInBox[]

  @Field(type => [Offer], { nullable: true })
  @OneToMany(type => Offer, offer => offer.variant, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  offers: Offer[]

  @Field(type => [VariantOption], { defaultValue: [] })
  @Column({ type: 'json' })
  options: VariantOption[]

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
