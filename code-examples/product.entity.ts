import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'

import { ProductType } from 'src/constants/product-type'
import { Variant } from '../variants/entities/variant.entity'
import { ProductTagType } from 'src/constants/product-tag-type'
import { ProductInBox, ProductL10n, ProductMedia } from './product-polymorphic.entity'
import { ProductOption } from '../dto/products.dto'

@ObjectType()
@Entity()
@Unique('unique_product_slug', ['slug'])
export class Product {
  @Field(type => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field()
  @Index({ unique: true })
  @Column()
  slug: string

  @Field(type => ProductType)
  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.ACCESSORIES,
  })
  productType: string

  @Field()
  @Column({ default: false })
  isPublished: boolean

  @Field(type => [ProductTagType], { nullable: true, defaultValue: [] })
  @Column({ type: 'json', nullable: true })
  tags: ProductTagType[]

  @Field(type => Int)
  @Column({ type: 'int', default: -1 })
  order: number

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail: string

  @Field(type => [ProductL10n])
  @OneToMany(() => ProductL10n, l10n => l10n.product, { cascade: true, orphanedRowAction: 'delete' })
  l10n: ProductL10n[]

  @Field(type => [ProductMedia])
  @OneToMany(() => ProductMedia, media => media.product, { cascade: true, orphanedRowAction: 'delete' })
  media: ProductMedia[]

  @Field(type => [ProductInBox], { nullable: true })
  @OneToMany(type => ProductInBox, inbox => inbox.product, { cascade: true, orphanedRowAction: 'delete' })
  inBox: ProductInBox[]

  @Field(type => [ProductOption], { defaultValue: [] })
  @Column({ type: 'json' })
  options: ProductOption[]

  @Field(type => [Product])
  @ManyToMany(type => Product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'product_parent_cameras',
    joinColumn: {
      name: 'productId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parentId',
      referencedColumnName: 'id',
    },
  })
  parentCameras: Product[]

  @Field(type => [Product])
  @ManyToMany(type => Product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'product_recommended',
    joinColumn: {
      name: 'productId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parentId',
      referencedColumnName: 'id',
    },
  })
  recommended: Product[]

  @Field(type => [Variant], { nullable: true })
  @OneToMany(type => Variant, variant => variant.product, {
    onDelete: 'CASCADE',
  })
  variants: Variant[]

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
