// This classes were used for the polymorphic relationships shared between Variants and Products.
// Variants were children of Products but at the same time had to share a lot of their information such as Product Detail Translations and Gallery

import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  ObjectID,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Language } from 'src/constants/language'
import { L10nType } from 'src/constants/l10n-type'
import { MediaType } from 'src/constants/media-type'

import { Product } from './product.entity'
import { Variant } from 'src/products/variants/entities/variant.entity'
import { SmallTranslation } from 'src/dto/small-translation.dto'

// Fake polymorphic relationships for product data entities
abstract class ProductPolyEntity {
  @ManyToOne(() => Product, product => product.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  product: Product

  @ManyToOne(() => Variant, variant => variant.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  variant: Variant

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
}

@ObjectType()
@Entity()
export class ProductL10n extends ProductPolyEntity {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field(type => Language)
  @Column({
    type: 'enum',
    enum: Language,
  })
  iso: Language

  @Field(type => L10nType)
  @Column({
    type: 'enum',
    enum: L10nType,
  })
  section: L10nType

  @Field(type => [String])
  @Column({
    type: 'text',
    array: true,
  })
  value: string[]

  @ManyToOne(() => Product, product => product.l10n)
  product: Product
}

@ObjectType()
@Entity()
export class ProductMedia extends ProductPolyEntity {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid')
  id: ObjectID

  @Field(type => MediaType)
  @Column({
    type: 'enum',
    enum: MediaType,
  })
  mediaType: string

  @Field()
  @Column()
  source: string

  @Field(type => Int)
  @Column({ type: 'int', default: -1 })
  order: number

  @ManyToOne(() => Product, product => product.slug, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productSlug', referencedColumnName: 'slug' })
  product: Product
}

@ObjectType()
@Entity()
export class ProductInBox extends ProductPolyEntity {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid')
  id: ObjectID

  @Field(type => Int, { defaultValue: -1 })
  @Column({ default: -1 })
  order: number

  @Field(type => Int)
  @Column({ default: 1 })
  quantity: number

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail: string

  @Field(type => SmallTranslation)
  @Column({ type: 'json' })
  l10n: SmallTranslation
}
