import { HttpException, HttpStatus, Inject } from '@nestjs/common'
import { Resolver, Args, Mutation, ID } from '@nestjs/graphql'
import { ObjectID } from 'typeorm'

import { VariantsService } from './variants.service'
import { Variant } from './entities/variant.entity'
import { UpdateVariantInput, UpdateVariantOfferInput } from './variants.dto'
import { Offer } from './entities/offer.entity'
import { ProductInBox, ProductL10n, ProductMedia } from 'src/products/entities/product-polymorphic.entity'
import { UpdateProductInBoxInput, UpdateProductL10nInput, UpdateProductMediaInput } from '../dto/products.dto'

@Resolver()
export class VariantsResolver {
  constructor(@Inject(VariantsService) private variantsService) {}

  @Mutation(returns => Variant)
  updateVariant(
    @Args('variantId', { type: () => ID }) variantId: ObjectID,
    @Args('input') input: UpdateVariantInput
  ): Promise<Variant> {
    return this.variantsService.updateVariant(variantId, input).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [Variant])
  sortVariants(@Args('input', { type: () => [ID] }) input: ObjectID[]): Promise<Variant[]> {
    return this.variantsService.sortVariants(input).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => Variant)
  setVariantOutOfStock(@Args('id', { type: () => ID }) id: ObjectID, @Args('outOfStock') outOfStock: boolean) {
    return this.variantsService.setVariantOutOfStock(id, outOfStock).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  // L10n mutations
  @Mutation(returns => [ProductL10n])
  updateVariantL10n(
    @Args('variantId', { type: () => ID }) variantId: ObjectID,
    @Args('l10n', { type: () => [UpdateProductL10nInput] }) l10n: [UpdateProductL10nInput]
  ) {
    return this.variantsService.updateVariantL10n(variantId, l10n).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [ProductMedia])
  updateVariantMedia(
    @Args('variantId', { type: () => ID }) variantId: ObjectID,
    @Args('media', { type: () => [UpdateProductMediaInput] }) media: UpdateProductMediaInput[]
  ) {
    return this.variantsService.updateVariantMedia(variantId, media).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [ProductInBox])
  updateVariantInBox(
    @Args('variantId', { type: () => ID }) variantId: ObjectID,
    @Args('inBox', { type: () => [UpdateProductInBoxInput] }) inBox: UpdateProductInBoxInput[]
  ) {
    return this.variantsService.updateVariantInbox(variantId, inBox).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [Offer])
  updateVariantOffers(
    @Args('variantId', { type: () => ID }) variantId: ObjectID,
    @Args('offers', { type: () => [UpdateVariantOfferInput] }) offers: [UpdateVariantOfferInput]
  ) {
    return this.variantsService.updateVariantOffer(variantId, offers).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }
}
